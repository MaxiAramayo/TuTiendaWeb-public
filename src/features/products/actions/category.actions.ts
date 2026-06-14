'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/server-session';
import type { ActionResponse } from '@/features/auth/auth.types';
import {
    createCategorySchema,
    updateCategorySchema,
    reorderCategoriesSchema,
} from '../schemas/category.schema';
import type { Category } from '@/shared/types/firebase.types';
import {
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    type CategoryUsage,
} from '../services/category.service';

function revalidateCategoryPaths() {
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/categories');
}

/**
 * Crea una categoría principal o subcategoría (si llega `parentId`).
 */
export async function createCategoryAction(input: unknown): Promise<ActionResponse<Category>> {
    const session = await getServerSession();
    if (!session?.storeId) {
        return { success: false, errors: { _form: ['No autenticado'] } };
    }

    const validation = createCategorySchema.safeParse(input);
    if (!validation.success) {
        return {
            success: false,
            errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    try {
        const category = await createCategory(session.storeId, validation.data);
        revalidateCategoryPaths();
        return { success: true, data: category };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al crear la categoría';
        return { success: false, errors: { _form: [message] } };
    }
}

/**
 * Actualiza una categoría: renombrar, mover de padre o activar/desactivar.
 */
export async function updateCategoryAction(input: unknown): Promise<ActionResponse<Category>> {
    const session = await getServerSession();
    if (!session?.storeId) {
        return { success: false, errors: { _form: ['No autenticado'] } };
    }

    const validation = updateCategorySchema.safeParse(input);
    if (!validation.success) {
        return {
            success: false,
            errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    try {
        const category = await updateCategory(session.storeId, validation.data);
        revalidateCategoryPaths();
        return { success: true, data: category };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al actualizar la categoría';
        return { success: false, errors: { _form: [message] } };
    }
}

/**
 * Reordena categorías de un mismo nivel (principales o subcategorías de un padre).
 * Recibe la lista de pares { id, order } con el nuevo orden manual.
 */
export async function reorderCategoriesAction(
    input: unknown
): Promise<ActionResponse<{ count: number }>> {
    const session = await getServerSession();
    if (!session?.storeId) {
        return { success: false, errors: { _form: ['No autenticado'] } };
    }

    const validation = reorderCategoriesSchema.safeParse(input);
    if (!validation.success) {
        return {
            success: false,
            errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    try {
        await reorderCategories(session.storeId, validation.data);
        revalidateCategoryPaths();
        return { success: true, data: { count: validation.data.length } };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al reordenar las categorías';
        return { success: false, errors: { _form: [message] } };
    }
}

/**
 * Borra una categoría solo si está vacía. Si tiene productos o subcategorías,
 * devuelve un mensaje explicando qué hay que vaciar primero.
 */
export async function deleteCategoryAction(
    categoryId: unknown
): Promise<ActionResponse<{ id: string }>> {
    const session = await getServerSession();
    if (!session?.storeId) {
        return { success: false, errors: { _form: ['No autenticado'] } };
    }

    if (typeof categoryId !== 'string' || !categoryId) {
        return { success: false, errors: { _form: ['ID de categoría inválido'] } };
    }

    try {
        await deleteCategory(session.storeId, categoryId);
        revalidateCategoryPaths();
        return { success: true, data: { id: categoryId } };
    } catch (error) {
        if (error instanceof Error && error.message === 'CATEGORY_NOT_EMPTY') {
            const usage = (error as Error & { usage?: CategoryUsage }).usage;
            const parts: string[] = [];
            if (usage?.productCount) {
                parts.push(`${usage.productCount} producto(s)`);
            }
            if (usage?.subcategoryCount) {
                parts.push(`${usage.subcategoryCount} subcategoría(s)`);
            }
            return {
                success: false,
                errors: {
                    _form: [
                        `No se puede eliminar: la categoría tiene ${parts.join(' y ')}. ` +
                            'Eliminá o reasigná esos elementos antes de borrarla.',
                    ],
                },
            };
        }
        const message = error instanceof Error ? error.message : 'Error al eliminar la categoría';
        return { success: false, errors: { _form: [message] } };
    }
}
