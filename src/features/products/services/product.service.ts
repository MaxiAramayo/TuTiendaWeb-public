import { serializeFirestoreData } from '@/shared/utils/firestore-serializer';
import { adminDb } from '@/lib/firebase/admin';
import type { Product } from '@/shared/types/firebase.types';
import * as admin from 'firebase-admin';

const COLLECTION = 'products';

export async function getProducts(storeId: string): Promise<Product[]> {
    if (!storeId) return [];

    const snapshot = await adminDb
        .collection('stores')
        .doc(storeId)
        .collection(COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();

    const products = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            variants: (data.variants || []).map((v: any) => ({
                ...v,
                price: v.price ?? v.additionalPrice ?? 0,
                isAvailable: v.isAvailable ?? v.available ?? true
            }))
        };
    });

    return serializeFirestoreData(products);
}

export async function getProductById(
    id: string,
    storeId: string
): Promise<Product | null> {
    if (!storeId) return null;

    const doc = await adminDb
        .collection('stores')
        .doc(storeId)
        .collection(COLLECTION)
        .doc(id)
        .get();

    if (!doc.exists) return null;

    const data = doc.data();

    // No es necesario verificar storeId porque ya estamos en la subcolección correcta
    // if (data?.storeId !== storeId) return null;

    // Map legacy fields for variants
    if (data?.variants) {
        data.variants = data.variants.map((v: any) => ({
            ...v,
            price: v.price ?? v.additionalPrice ?? 0,
            isAvailable: v.isAvailable ?? v.available ?? true
        }));
    }

    return serializeFirestoreData({ id: doc.id, ...data });
}

export async function createProduct(
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'storeId'>,
    storeId: string
): Promise<Product> {
    if (!storeId) throw new Error('Store ID is required');

    const docRef = await adminDb
        .collection('stores')
        .doc(storeId)
        .collection(COLLECTION)
        .add({
            ...data,
            storeId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

    const doc = await docRef.get();
    return serializeFirestoreData({ id: docRef.id, ...doc.data() });
}

export async function updateProduct(
    id: string,
    data: Partial<Product>,
    storeId: string
): Promise<Product> {
    if (!storeId) throw new Error('Store ID is required');

    const docRef = adminDb
        .collection('stores')
        .doc(storeId)
        .collection(COLLECTION)
        .doc(id);

    // Verificar que existe
    const existing = await docRef.get();
    if (!existing.exists) {
        throw new Error('Producto no encontrado');
    }

    await docRef.update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updated = await docRef.get();
    return serializeFirestoreData({ id, ...updated.data() });
}

export async function deleteProduct(
    id: string,
    storeId: string
): Promise<void> {
    if (!storeId) throw new Error('Store ID is required');

    const docRef = adminDb
        .collection('stores')
        .doc(storeId)
        .collection(COLLECTION)
        .doc(id);

    const existing = await docRef.get();
    if (!existing.exists) {
        throw new Error('Producto no encontrado');
    }

    // Hard delete - permanently remove the document
    await docRef.delete();
}
