'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/server-session';
import { adminDb } from '@/lib/firebase/admin';
import {
    productImportRowSchema,
    MAX_IMPORT_PRODUCTS,
    type ProductImportRowRaw,
} from '../schemas/product-import.schema';
import { bulkCreateProducts, type BulkCreateResult } from '../services/product-import.service';
import type { ActionResponse } from '@/features/auth/auth.types';

export type ImportProductsResult = BulkCreateResult & { warnings: string[] };

export async function importProductsAction(
    rawRows: ProductImportRowRaw[]
): Promise<ActionResponse<ImportProductsResult>> {
    // 1. AUTH
    const session = await getServerSession();
    if (!session) {
        return { success: false, errors: { _form: ['No autenticado'] } };
    }
    if (!session.storeId) {
        return { success: false, errors: { _form: ['No se encontró el ID de la tienda en la sesión'] } };
    }

    // 2. VALIDATE — tope por archivo (re-validación de seguridad en servidor)
    if (!Array.isArray(rawRows) || rawRows.length === 0) {
        return { success: false, errors: { _form: ['El archivo no contiene filas válidas'] } };
    }

    if (rawRows.length > MAX_IMPORT_PRODUCTS) {
        return {
            success: false,
            errors: {
                _form: [
                    `El archivo tiene ${rawRows.length} filas. El máximo permitido es ${MAX_IMPORT_PRODUCTS}.`,
                ],
            },
        };
    }

    // Validar schema fila por fila; conservar solo las válidas
    const validRows: ReturnType<typeof productImportRowSchema.parse>[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
        const result = productImportRowSchema.safeParse(rawRows[i]);
        if (!result.success) {
            const messages = Object.values(result.error.flatten().fieldErrors).flat().join(', ');
            warnings.push(`Fila ${i + 2}: ${messages}`);
        } else {
            validRows.push(result.data);
        }
    }

    if (validRows.length === 0) {
        return { success: false, errors: { _form: ['Ninguna fila es válida para importar'] } };
    }

    // Tope total de tienda (re-validación de seguridad en servidor)
    const existingCount = await adminDb
        .collection('stores')
        .doc(session.storeId)
        .collection('products')
        .count()
        .get()
        .then((s) => s.data().count);

    if (existingCount + validRows.length > MAX_IMPORT_PRODUCTS) {
        const available = MAX_IMPORT_PRODUCTS - existingCount;
        return {
            success: false,
            errors: {
                _form: [
                    available <= 0
                        ? `Tu tienda ya tiene ${existingCount} productos y alcanzó el límite de ${MAX_IMPORT_PRODUCTS}.`
                        : `Solo podés importar ${available} producto${available !== 1 ? 's' : ''} más (límite ${MAX_IMPORT_PRODUCTS}, tienes ${existingCount}).`,
                ],
            },
        };
    }

    // 3. MUTATE
    try {
        const result = await bulkCreateProducts(session.storeId, validRows);

        // 4. REVALIDATE
        revalidatePath('/dashboard/products');

        return { success: true, data: { ...result, warnings } };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al importar productos';
        return { success: false, errors: { _form: [message] } };
    }
}
