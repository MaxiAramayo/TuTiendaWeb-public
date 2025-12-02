/**
 * Store Service - Firebase Admin SDK
 * 
 * Gestiona tiendas en Firestore
 * 
 * Collection: 'stores'
 * Document ID: Auto-generado por Firestore
 * 
 * Soft Delete Pattern:
 * - No elimina documentos físicamente
 * - Setea active: false
 * - Queries filtran por active: true
 * 
 * @module features/store/services/store.service
 * @see https://firebase.google.com/docs/firestore/manage-data/delete-data
 */

import { adminDb } from '@/lib/firebase/admin';
import { cleanForFirestore } from '@/lib/utils/firestore';
import * as admin from 'firebase-admin';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORES_COLLECTION = 'stores';

// ============================================================================
// TYPES
// ============================================================================

export type StoreType = 'restaurant' | 'retail' | 'services' | 'other';

export interface CreateStoreData {
    storeName: string;
    storeType: StoreType;
    address?: string;
    phone?: string;
    ownerId: string;
}

export interface UpdateStoreData {
    storeName?: string;
    storeType?: StoreType;
    address?: string;
    phone?: string;
    active?: boolean;
}

export interface Store {
    id: string;
    storeName: string;
    storeType: StoreType;
    address?: string;
    phone?: string;
    ownerId: string;
    active: boolean;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Crear tienda
 * 
 * @param data - Datos de la tienda
 * @returns Store creada con ID generado
 * 
 * @throws {Error} Si falla la creación
 * 
 * @example
 * ```typescript
 * const store = await createStore({
 *   storeName: 'Mi Tienda',
 *   storeType: 'retail',
 *   address: 'Calle Falsa 123',
 *   ownerId: 'user123'
 * });
 * 
 * console.log(store.id);         // 'store_abc123'
 * console.log(store.storeName);  // 'Mi Tienda'
 * console.log(store.active);     // true
 * ```
 */
export async function createStore(
    data: CreateStoreData
): Promise<Store> {
    try {
        const cleanData = cleanForFirestore({
            storeName: data.storeName,
            storeType: data.storeType,
            address: data.address,
            phone: data.phone,
            ownerId: data.ownerId,
            active: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const docRef = await adminDb
            .collection(STORES_COLLECTION)
            .add(cleanData);

        const doc = await docRef.get();

        console.log(`[StoreService] Created store: ${docRef.id}`);

        return {
            id: docRef.id,
            ...doc.data()
        } as Store;
    } catch (error) {
        console.error('[StoreService] Error creating store:', error);
        throw error;
    }
}

// ============================================================================
// READ
// ============================================================================

/**
 * Obtener tienda por ID
 * 
 * @param storeId - ID de la tienda
 * @returns Store o null si no existe o está inactiva
 * 
 * @example
 * ```typescript
 * const store = await getStoreById('store123');
 * if (store) {
 *   console.log(store.storeName);
 * }
 * ```
 */
export async function getStoreById(storeId: string): Promise<Store | null> {
    try {
        const doc = await adminDb
            .collection(STORES_COLLECTION)
            .doc(storeId)
            .get();

        if (!doc.exists) {
            console.log(`[StoreService] Store not found: ${storeId}`);
            return null;
        }

        const store = {
            id: doc.id,
            ...doc.data()
        } as Store;

        // No retornar stores inactivas
        if (!store.active) {
            console.log(`[StoreService] Store is inactive: ${storeId}`);
            return null;
        }

        return store;
    } catch (error) {
        console.error(`[StoreService] Error getting store ${storeId}:`, error);
        throw error;
    }
}

/**
 * Obtener tiendas de un usuario (owner)
 * 
 * Solo retorna tiendas activas, ordenadas por fecha de creación
 * 
 * @param ownerId - ID del propietario
 * @returns Array de stores (puede ser vacío)
 * 
 * @example
 * ```typescript
 * const stores = await getStoresByOwner('user123');
 * 
 * stores.forEach(store => {
 *   console.log(store.storeName);
 * });
 * 
 * if (stores.length === 0) {
 *   console.log('Usuario no tiene tiendas');
 * }
 * ```
 */
export async function getStoresByOwner(ownerId: string): Promise<Store[]> {
    try {
        const snapshot = await adminDb
            .collection(STORES_COLLECTION)
            .where('ownerId', '==', ownerId)
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Store[];
    } catch (error) {
        console.error(`[StoreService] Error getting stores for owner ${ownerId}:`, error);
        throw error;
    }
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Actualizar tienda
 * 
 * Update parcial: solo campos proporcionados
 * 
 * @param storeId - ID de la tienda
 * @param data - Datos a actualizar (parcial)
 * 
 * @throws {Error} Si la tienda no existe o falla la actualización
 * 
 * @example
 * ```typescript
 * await updateStore('store123', {
 *   storeName: 'Nuevo Nombre',
 *   address: 'Nueva Dirección'
 * });
 * // Solo actualiza nombre y dirección
 * ```
 */
export async function updateStore(
    storeId: string,
    data: UpdateStoreData
): Promise<void> {
    try {
        const cleanData = cleanForFirestore({
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await adminDb
            .collection(STORES_COLLECTION)
            .doc(storeId)
            .update(cleanData);

        console.log(`[StoreService] Updated store: ${storeId}`);
    } catch (error) {
        console.error(`[StoreService] Error updating store ${storeId}:`, error);
        throw error;
    }
}

// ============================================================================
// DELETE (Soft)
// ============================================================================

/**
 * Desactivar tienda (soft delete)
 * 
 * No elimina el documento, solo setea active: false
 * 
 * Ventajas soft delete:
 * - Datos históricos preservados
 * - Posibilidad de reactivar
 * - Auditoría completa
 * 
 * @param storeId - ID de la tienda
 * 
 * @example
 * ```typescript
 * await deactivateStore('store123');
 * // Tienda ya no aparece en getStoresByOwner()
 * // Pero el documento aún existe en Firestore
 * ```
 */
export async function deactivateStore(storeId: string): Promise<void> {
    try {
        await updateStore(storeId, { active: false });
        console.log(`[StoreService] Deactivated store: ${storeId}`);
    } catch (error) {
        console.error(`[StoreService] Error deactivating store ${storeId}:`, error);
        throw error;
    }
}

/**
 * Reactivar tienda (undo soft delete)
 * 
 * @param storeId - ID de la tienda
 */
export async function reactivateStore(storeId: string): Promise<void> {
    try {
        await updateStore(storeId, { active: true });
        console.log(`[StoreService] Reactivated store: ${storeId}`);
    } catch (error) {
        console.error(`[StoreService] Error reactivating store ${storeId}:`, error);
        throw error;
    }
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Verificar si un usuario es owner de una tienda
 * 
 * Útil en Server Actions para verificar permisos antes de mutaciones
 * 
 * @param storeId - ID de la tienda
 * @param userId - ID del usuario
 * @returns true si es owner, false si no
 * 
 * @example
 * ```typescript
 * // En Server Action:
 * export async function deleteProductAction(productId: string) {
 *   const session = await getServerSession();
 *   
 *   const product = await getProduct(productId);
 *   const isOwner = await isStoreOwner(product.storeId, session.userId);
 *   
 *   if (!isOwner) {
 *     return { success: false, errors: { _form: ['No autorizado'] } };
 *   }
 *   
 *   await deleteProduct(productId);
 *   return { success: true };
 * }
 * ```
 */
export async function isStoreOwner(
    storeId: string,
    userId: string
): Promise<boolean> {
    try {
        const store = await getStoreById(storeId);
        return store?.ownerId === userId;
    } catch (error) {
        console.error('[StoreService] Error checking store ownership:', error);
        return false;
    }
}
