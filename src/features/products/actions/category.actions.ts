'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/server-session';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export async function createCategoryAction(data: { name: string; description?: string }) {
    const session = await getServerSession();
    if (!session) {
        throw new Error('No autenticado');
    }

    if (!session.storeId) {
        throw new Error('No se encontró el ID de la tienda en la sesión');
    }

    const validation = categorySchema.safeParse(data);
    if (!validation.success) {
        throw new Error('Datos inválidos');
    }

    // Use stores/{storeId}/categories subcollection instead of root categories collection
    const docRef = await adminDb
        .collection('stores')
        .doc(session.storeId)
        .collection('categories')
        .add({
            ...validation.data,
            storeId: session.storeId,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            isActive: true,
            slug: validation.data.name.toLowerCase().replace(/\s+/g, '-'),
        });

    revalidatePath('/dashboard/products');

    return { id: docRef.id, ...validation.data };
}
