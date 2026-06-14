import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { getCategories, slugify, MAX_PARENT_CATEGORIES, MAX_SUBCATEGORIES_PER_PARENT } from './category.service';
import type { ProductImportRow } from '../schemas/product-import.schema';

// Firestore hard limit is 500 writes per batch; we stay safely below it.
const BATCH_SIZE = 450;

export interface BulkCreateResult {
    created: number;
    categoriesCreated: number;
    tagsCreated: number;
}

export async function bulkCreateProducts(
    storeId: string,
    rows: ProductImportRow[]
): Promise<BulkCreateResult> {
    const storeRef = adminDb.collection('stores').doc(storeId);
    const categoriesRef = storeRef.collection('categories');
    const tagsRef = storeRef.collection('tags');
    const productsRef = storeRef.collection('products');

    const now = admin.firestore.FieldValue.serverTimestamp();

    // 1. Cargar categorías y tags existentes (una sola lectura)
    const [allCategories, tagsSnap] = await Promise.all([
        getCategories(storeId),
        tagsRef.get(),
    ]);

    // Mapas nombre (lowercase) → id
    const categoryMap = new Map<string, string>();
    const subcategoryMap = new Map<string, string>(); // `${parentId}:${nombre}` → id

    // Pre-computar cantidad de subcategorías por padre para evitar O(rows × cats) en el loop
    const existingSubcountByParent = new Map<string, number>();

    for (const cat of allCategories) {
        const key = cat.name.toLowerCase();
        if (!cat.parentId) {
            categoryMap.set(key, cat.id);
        } else {
            subcategoryMap.set(`${cat.parentId}:${key}`, cat.id);
            existingSubcountByParent.set(cat.parentId, (existingSubcountByParent.get(cat.parentId) ?? 0) + 1);
        }
    }

    const tagMap = new Map<string, string>();
    for (const doc of tagsSnap.docs) {
        tagMap.set(doc.data().name.toLowerCase(), doc.id);
    }

    let categoriesCreated = 0;
    let tagsCreated = 0;

    // 2. Resolver / crear categorías y tags; acumular ops para escribir en batch
    type BatchOp = {
        ref: FirebaseFirestore.DocumentReference;
        data: Record<string, unknown>;
    };

    const ops: BatchOp[] = [];

    const currentParentCount = allCategories.filter((c) => !c.parentId).length;
    let newParentCount = 0;
    const newSubcountByParent = new Map<string, number>();

    const resolvedRows: Array<ProductImportRow & {
        resolvedCategoryId: string;
        resolvedSubcategoryId?: string;
        resolvedTagIds: string[];
    }> = [];

    for (const row of rows) {
        const catKey = row.categoria.toLowerCase();
        let categoryId = categoryMap.get(catKey);

        if (!categoryId) {
            if (currentParentCount + newParentCount >= MAX_PARENT_CATEGORIES) {
                throw new Error(`Límite de ${MAX_PARENT_CATEGORIES} categorías principales alcanzado`);
            }
            const newRef = categoriesRef.doc();
            categoryId = newRef.id;
            categoryMap.set(catKey, categoryId);
            newParentCount++;
            ops.push({
                ref: newRef,
                data: {
                    name: row.categoria.trim(),
                    slug: slugify(row.categoria),
                    parentId: null,
                    isActive: true,
                    storeId,
                    createdAt: now,
                    updatedAt: now,
                },
            });
            categoriesCreated++;
        }

        let subcategoryId: string | undefined;
        if (row.subcategoria) {
            const subKey = `${categoryId}:${row.subcategoria.toLowerCase()}`;
            subcategoryId = subcategoryMap.get(subKey);

            if (!subcategoryId) {
                // Usar Map pre-computado (O(1)) en vez de filter en cada iteración
                const existingSubCount = existingSubcountByParent.get(categoryId) ?? 0;
                const newSubCount = newSubcountByParent.get(categoryId) ?? 0;
                if (existingSubCount + newSubCount >= MAX_SUBCATEGORIES_PER_PARENT) {
                    throw new Error(
                        `Límite de ${MAX_SUBCATEGORIES_PER_PARENT} subcategorías alcanzado en "${row.categoria}"`
                    );
                }
                const newRef = categoriesRef.doc();
                subcategoryId = newRef.id;
                subcategoryMap.set(subKey, subcategoryId);
                newSubcountByParent.set(categoryId, newSubCount + 1);
                ops.push({
                    ref: newRef,
                    data: {
                        name: row.subcategoria.trim(),
                        slug: slugify(row.subcategoria),
                        parentId: categoryId,
                        isActive: true,
                        storeId,
                        createdAt: now,
                        updatedAt: now,
                    },
                });
                categoriesCreated++;
            }
        }

        // Resolver / crear tags
        const resolvedTagIds: string[] = [];
        for (const tagName of row.tags) {
            const tagKey = tagName.toLowerCase();
            let tagId = tagMap.get(tagKey);
            if (!tagId) {
                const newRef = tagsRef.doc();
                tagId = newRef.id;
                tagMap.set(tagKey, tagId);
                ops.push({
                    ref: newRef,
                    data: {
                        name: tagName.trim(),
                        slug: slugify(tagName),
                        storeId,
                        createdAt: now,
                        updatedAt: now,
                    },
                });
                tagsCreated++;
            }
            resolvedTagIds.push(tagId);
        }

        resolvedRows.push({
            ...row,
            resolvedCategoryId: categoryId,
            resolvedSubcategoryId: subcategoryId,
            resolvedTagIds,
        });
    }

    // 3. Agregar ops de productos
    for (const row of resolvedRows) {
        const newRef = productsRef.doc();
        ops.push({
            ref: newRef,
            data: {
                name: row.nombre.trim(),
                slug: slugify(row.nombre),
                description: row.descripcion?.trim() || '',
                price: row.precio,
                costPrice: row.costo,
                categoryId: row.resolvedCategoryId,
                ...(row.resolvedSubcategoryId ? { subcategoryId: row.resolvedSubcategoryId } : {}),
                tags: row.resolvedTagIds,
                variants: row.extras.map((e, i) => ({
                    id: `${newRef.id}-${i}`,
                    name: e.name,
                    price: e.price,
                    isAvailable: true,
                })),
                status: row.activo ? 'active' : 'inactive',
                imageUrls: [],
                currency: 'ARS',
                hasPromotion: false,
                storeId,
                createdAt: now,
                updatedAt: now,
            },
        });
    }

    // 4. Escribir en batches de BATCH_SIZE.
    // Nota: cada batch es atómico, pero no hay transacción global entre batches.
    // Si un batch falla después del primero, las escrituras anteriores persisten.
    // En la práctica, con MAX_IMPORT_PRODUCTS=300 y límites de categorías/tags,
    // la mayoría de las importaciones caben en un solo batch.
    for (let i = 0; i < ops.length; i += BATCH_SIZE) {
        const chunk = ops.slice(i, i + BATCH_SIZE);
        const batch = adminDb.batch();
        for (const op of chunk) {
            batch.set(op.ref, op.data as FirebaseFirestore.DocumentData);
        }
        await batch.commit();
    }

    return { created: resolvedRows.length, categoriesCreated, tagsCreated };
}
