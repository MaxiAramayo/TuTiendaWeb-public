import { serializeFirestoreData } from '@/shared/utils/firestore-serializer';
import { adminDb } from '@/lib/firebase/admin';
import type { Category } from '@/shared/types/firebase.types';
import { FieldValue } from 'firebase-admin/firestore';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';

const COLLECTION = 'categories';
const PRODUCTS_COLLECTION = 'products';

/** Topes para evitar abuso / listas inmanejables. */
export const MAX_PARENT_CATEGORIES = 50;
export const MAX_SUBCATEGORIES_PER_PARENT = 30;

/** Categoría principal con sus subcategorías embebidas (para UI). */
export type CategoryTree = Category & { children: Category[] };

/** Resultado de un intento de borrado bloqueado por uso. */
export interface CategoryUsage {
    productCount: number;
    subcategoryCount: number;
}

function slugify(name: string): string {
    const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // quita acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    // Fallback si el nombre no produce slug (ej. caracteres no latinos)
    return slug || `categoria-${Date.now()}`;
}

/** Normaliza un nombre para comparar duplicados (sin mayúsculas ni espacios extra). */
function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

/** Dos categorías están en el mismo nivel si comparten parentId (null == principal). */
function sameScope(a: string | null | undefined, b: string | null | undefined): boolean {
    return (a ?? null) === (b ?? null);
}

/**
 * Verifica, sobre una lista ya cargada, que no exista otra categoría con el mismo
 * nombre en el mismo nivel (case-insensitive). `excludeId` ignora la propia al editar.
 */
function assertNameAvailable(
    all: Category[],
    name: string,
    parentId: string | null,
    excludeId?: string
): void {
    const target = normalizeName(name);
    const clash = all.some(
        (c) =>
            c.id !== excludeId &&
            sameScope(c.parentId, parentId) &&
            normalizeName(c.name) === target
    );
    if (clash) {
        throw new Error(
            parentId
                ? 'Ya existe una subcategoría con ese nombre en esta categoría'
                : 'Ya existe una categoría con ese nombre'
        );
    }
}

/**
 * Verifica, sobre una lista ya cargada, que no se supere el tope del nivel.
 */
function assertWithinLimit(all: Category[], parentId: string | null): void {
    if (parentId === null) {
        const count = all.filter((c) => !c.parentId).length;
        if (count >= MAX_PARENT_CATEGORIES) {
            throw new Error(`Alcanzaste el máximo de ${MAX_PARENT_CATEGORIES} categorías principales`);
        }
    } else {
        const count = all.filter((c) => c.parentId === parentId).length;
        if (count >= MAX_SUBCATEGORIES_PER_PARENT) {
            throw new Error(
                `Alcanzaste el máximo de ${MAX_SUBCATEGORIES_PER_PARENT} subcategorías en esta categoría`
            );
        }
    }
}

/**
 * Indica si `subcategoryId` es realmente una subcategoría de `categoryId`.
 * Usado por las acciones de producto para validar la integridad de la asignación.
 */
export async function isValidSubcategory(
    storeId: string,
    categoryId: string,
    subcategoryId: string
): Promise<boolean> {
    if (!storeId || !categoryId || !subcategoryId) return false;
    const snap = await categoriesRef(storeId).doc(subcategoryId).get();
    if (!snap.exists) return false;
    return (snap.data()?.parentId ?? null) === categoryId;
}

function categoriesRef(storeId: string) {
    return adminDb.collection('stores').doc(storeId).collection(COLLECTION);
}

/**
 * Lista plana de categorías de una tienda (principales + subcategorías).
 */
export async function getCategories(storeId: string): Promise<Category[]> {
    if (!storeId) return [];

    const snapshot = await categoriesRef(storeId).get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return serializeFirestoreData<Category[]>(categories);
}

/**
 * Devuelve las categorías principales con sus subcategorías anidadas.
 */
export async function getCategoryTree(storeId: string): Promise<CategoryTree[]> {
    const all = await getCategories(storeId);

    const principals = all.filter(c => !c.parentId);
    const childrenByParent = new Map<string, Category[]>();

    for (const cat of all) {
        if (cat.parentId) {
            const list = childrenByParent.get(cat.parentId) ?? [];
            list.push(cat);
            childrenByParent.set(cat.parentId, list);
        }
    }

    return principals.map(p => ({
        ...p,
        children: (childrenByParent.get(p.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

/**
 * Crea una categoría principal o subcategoría.
 * Si `parentId` viene, valida que el padre exista y sea principal (profundidad máx. 2).
 */
export async function createCategory(storeId: string, data: CreateCategoryInput): Promise<Category> {
    const parentId = data.parentId ?? null;

    // Una sola lectura de la colección para todas las validaciones.
    const all = await getCategories(storeId);

    if (parentId) {
        const parent = all.find((c) => c.id === parentId);
        if (!parent) {
            throw new Error('La categoría padre no existe');
        }
        if (parent.parentId) {
            throw new Error('No se permiten más de 2 niveles de categorías');
        }
    }

    // Validaciones de negocio: límite de cantidad y nombre único en el nivel.
    assertWithinLimit(all, parentId);
    assertNameAvailable(all, data.name, parentId);

    const payload = {
        name: data.name,
        slug: slugify(data.name),
        ...(data.description ? { description: data.description } : {}),
        parentId,
        isActive: true,
        storeId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await categoriesRef(storeId).add(payload);
    const created = await docRef.get();

    return serializeFirestoreData<Category>({ id: docRef.id, ...created.data() });
}

/**
 * Actualiza una categoría: renombrar, mover de padre, activar/desactivar.
 * Re-valida la profundidad y evita ciclos.
 */
export async function updateCategory(storeId: string, data: UpdateCategoryInput): Promise<Category> {
    // Una sola lectura para existencia, padre, hijos, límite y duplicados.
    const all = await getCategories(storeId);
    const current = all.find((c) => c.id === data.id);
    if (!current) {
        throw new Error('La categoría no existe');
    }

    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

    if (data.name !== undefined) {
        update.name = data.name;
        update.slug = slugify(data.name);
    }
    if (data.description !== undefined) {
        update.description = data.description;
    }
    if (data.isActive !== undefined) {
        update.isActive = data.isActive;
    }

    if (data.parentId !== undefined) {
        if (data.parentId === data.id) {
            throw new Error('Una categoría no puede ser su propia padre');
        }

        if (data.parentId) {
            // Pasa a ser subcategoría: el padre debe existir y ser principal.
            const parent = all.find((c) => c.id === data.parentId);
            if (!parent) {
                throw new Error('La categoría padre no existe');
            }
            if (parent.parentId) {
                throw new Error('No se permiten más de 2 niveles de categorías');
            }
            // Si la categoría ya tiene subcategorías, no puede volverse subcategoría.
            const hasChildren = all.some((c) => c.parentId === data.id);
            if (hasChildren) {
                throw new Error('No se puede mover una categoría que tiene subcategorías');
            }
        }

        update.parentId = data.parentId; // string | null
    }

    // Validaciones de negocio sobre el estado final (nombre/padre resultante).
    const currentParentId = current.parentId ?? null;
    const finalParentId =
        data.parentId !== undefined ? data.parentId ?? null : currentParentId;
    const finalName = data.name !== undefined ? data.name : current.name;

    const nameChanged =
        data.name !== undefined && normalizeName(data.name) !== normalizeName(current.name);
    const scopeChanged = !sameScope(finalParentId, currentParentId);

    if (nameChanged || scopeChanged) {
        assertNameAvailable(all, finalName, finalParentId, data.id);
    }
    if (scopeChanged) {
        assertWithinLimit(all, finalParentId);
    }

    const ref = categoriesRef(storeId).doc(data.id);
    await ref.update(update);
    const updated = await ref.get();

    return serializeFirestoreData<Category>({ id: ref.id, ...updated.data() });
}

/**
 * Cuenta productos y subcategorías asociadas a una categoría.
 */
export async function countCategoryUsage(storeId: string, categoryId: string): Promise<CategoryUsage> {
    const products = categoriesRef(storeId).parent!.collection(PRODUCTS_COLLECTION);

    const [byCategory, bySubcategory, subcategories] = await Promise.all([
        products.where('categoryId', '==', categoryId).count().get(),
        products.where('subcategoryId', '==', categoryId).count().get(),
        categoriesRef(storeId).where('parentId', '==', categoryId).count().get(),
    ]);

    return {
        productCount: byCategory.data().count + bySubcategory.data().count,
        subcategoryCount: subcategories.data().count,
    };
}

/**
 * Borra una categoría SOLO si está vacía (sin productos ni subcategorías).
 * Si tiene uso, lanza error con el detalle para que la UI lo explique.
 */
export async function deleteCategory(storeId: string, categoryId: string): Promise<CategoryUsage> {
    const usage = await countCategoryUsage(storeId, categoryId);

    if (usage.productCount > 0 || usage.subcategoryCount > 0) {
        // Bloqueado: el caller devuelve el detalle al usuario.
        const error = new Error('CATEGORY_NOT_EMPTY') as Error & { usage: CategoryUsage };
        error.usage = usage;
        throw error;
    }

    await categoriesRef(storeId).doc(categoryId).delete();
    return usage;
}
