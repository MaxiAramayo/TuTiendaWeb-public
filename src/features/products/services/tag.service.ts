import { serializeFirestoreData } from '@/shared/utils/firestore-serializer';
import { adminDb } from '@/lib/firebase/admin';
import type { Tag } from '@/shared/types/firebase.types';
import * as admin from 'firebase-admin';

const COLLECTION = 'tags';

export async function getTags(storeId: string): Promise<Tag[]> {
    if (!storeId) return [];

    const snapshot = await adminDb
        .collection('stores')
        .doc(storeId)
        .collection(COLLECTION)
        .get();

    const tags = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));

    return serializeFirestoreData(tags);
}

// Add other methods as needed
