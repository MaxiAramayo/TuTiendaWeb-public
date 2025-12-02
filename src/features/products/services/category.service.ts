import { serializeFirestoreData } from '@/shared/utils/firestore-serializer';
import { adminDb } from '@/lib/firebase/admin';
import type { Category } from '@/shared/types/firebase.types';
import * as admin from 'firebase-admin';

const COLLECTION = 'categories';

export async function getCategories(storeId: string): Promise<Category[]> {
    if (!storeId) return [];

    const snapshot = await adminDb
        .collection('stores')
        .doc(storeId)
        .collection(COLLECTION)
        .get();


    const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));

    return serializeFirestoreData<Category[]>(categories);
}

// Add other methods as needed (create, update, delete)
