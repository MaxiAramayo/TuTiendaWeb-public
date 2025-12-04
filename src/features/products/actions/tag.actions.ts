'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/server-session';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const tagSchema = z.object({
    name: z.string().min(1),
});

export async function createTagAction(data: { name: string }) {
    const session = await getServerSession();
    if (!session) {
        throw new Error('No autenticado');
    }

    if (!session.storeId) {
        throw new Error('No se encontró el ID de la tienda en la sesión');
    }

    const validation = tagSchema.safeParse(data);
    if (!validation.success) {
        throw new Error('Datos inválidos');
    }

    // Use stores/{storeId}/tags subcollection instead of root tags collection
    const docRef = await adminDb
        .collection('stores')
        .doc(session.storeId)
        .collection('tags')
        .add({
            ...validation.data,
            storeId: session.storeId,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            slug: validation.data.name.toLowerCase().replace(/\s+/g, '-'),
        });

    revalidatePath('/dashboard/products');

    return { id: docRef.id, ...validation.data };
}
