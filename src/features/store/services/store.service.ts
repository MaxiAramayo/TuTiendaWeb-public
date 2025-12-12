/**
 * Store Service - Firebase Admin SDK
 * 
 * Gestiona tiendas en Firestore con la NUEVA estructura
 * 
 * Collection: 'stores'
 * Document ID: Auto-generado por Firestore
 * 
 * Estructura del documento:
 * - basicInfo: { name, slug, description, type }
 * - contactInfo: { whatsapp, email, phone }
 * - address: { street, city, state, zipCode }
 * - theme: { primaryColor, secondaryColor, logoUrl, bannerUrl }
 * - settings: { paymentMethods, deliveryMethods, currency }
 * - subscription: { active, plan }
 * - metadata: { ownerId, active, createdAt, updatedAt }
 * 
 * Soft Delete Pattern:
 * - No elimina documentos físicamente
 * - Setea metadata.active: false
 * - Queries filtran por metadata.active: true
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
// THEME DEFAULTS
// ============================================================================

/**
 * Colores predeterminados del tema (morado como primario)
 */
const DEFAULT_THEME = {
  primaryColor: '#7C3AED',      // Morado (purple-600)
  secondaryColor: '#F3F4F6',    // Gris claro (gray-100)
  accentColor: '#8B5CF6',       // Morado más claro (purple-500)
  backgroundColor: '#FFFFFF',   // Blanco
  textColor: '#1F2937',         // Gris oscuro (gray-800)
};

/**
 * Métodos de pago predeterminados
 */
const DEFAULT_PAYMENT_METHODS = [
  { id: 'cash', name: 'Efectivo', enabled: true },
  { id: 'transfer', name: 'Transferencia', enabled: true },
  { id: 'mercadopago', name: 'Mercado Pago', enabled: false },
];

/**
 * Métodos de entrega predeterminados
 */
const DEFAULT_DELIVERY_METHODS = [
  { id: 'pickup', name: 'Retiro en local', enabled: true, price: 0 },
  { id: 'delivery', name: 'Delivery', enabled: false, price: 0 },
];

// ============================================================================
// TYPES
// ============================================================================

export type StoreType = 
  | 'retail' 
  | 'restaurant' 
  | 'service' 
  | 'services'  // Legacy alias for 'service'
  | 'digital' 
  | 'fashion'
  | 'beauty' 
  | 'health' 
  | 'sports' 
  | 'electronics' 
  | 'home'
  | 'clothing'
  | 'books'
  | 'automotive' 
  | 'other';

/**
 * Datos para crear una tienda (input del registro)
 */
export interface CreateStoreData {
  storeName: string;
  storeType: StoreType;
  slug: string;
  phone?: string;
  address?: string;
  ownerId: string;
}

/**
 * Datos para actualizar una tienda (parcial)
 */
export interface UpdateStoreData {
  basicInfo?: {
    name?: string;
    slug?: string;
    description?: string;
    type?: StoreType;
  };
  contactInfo?: {
    whatsapp?: string;
    email?: string;
    phone?: string;
  };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    bannerUrl?: string;
  };
  active?: boolean;
}

/**
 * Tienda completa (estructura nueva)
 */
export interface Store {
  id: string;
  basicInfo: {
    name: string;
    slug: string;
    description?: string;
    type: StoreType;
  };
  contactInfo: {
    whatsapp?: string;
    email?: string;
    phone?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor?: string;
    logoUrl?: string;
    bannerUrl?: string;
  };
  settings: {
    paymentMethods: Array<{ id: string; name: string; enabled: boolean; instructions?: string }>;
    deliveryMethods: Array<{ id: string; name: string; enabled: boolean; price?: number }>;
    currency: string;
  };
  subscription: {
    active: boolean;
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
  };
  metadata: {
    ownerId: string;
    active: boolean;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
  };
}

// ============================================================================
// HELPER: Generate slug from store name
// ============================================================================

/**
 * Genera un slug a partir del nombre de la tienda
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '')    // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-')            // Espacios a guiones
    .replace(/-+/g, '-')             // Múltiples guiones a uno
    .trim();
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Crear tienda con la NUEVA estructura
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
 *   slug: 'mi-tienda',
 *   phone: '+54911234567',
 *   ownerId: 'user123'
 * });
 * 
 * console.log(store.id);                    // 'abc123xyz'
 * console.log(store.basicInfo.name);        // 'Mi Tienda'
 * console.log(store.theme.primaryColor);    // '#7C3AED'
 * console.log(store.metadata.active);       // true
 * ```
 */
export async function createStore(
  data: CreateStoreData
): Promise<Store> {
  try {
    // Generar slug si no se proporciona
    const slug = data.slug || generateSlug(data.storeName);

    // Crear documento con la nueva estructura
    const storeData = cleanForFirestore({
      // Información básica
      basicInfo: {
        name: data.storeName,
        slug: slug,
        description: '',
        type: data.storeType,
      },
      
      // Información de contacto
      contactInfo: {
        whatsapp: data.phone || '',
        email: '',
        phone: data.phone || '',
      },
      
      // Dirección (vacía inicialmente)
      address: {
        street: data.address || '',
        city: '',
        state: '',
        zipCode: '',
      },
      
      // Tema con colores predeterminados (morado/gris)
      theme: {
        ...DEFAULT_THEME,
        logoUrl: '',
        bannerUrl: '',
      },
      
      // Configuraciones predeterminadas
      settings: {
        paymentMethods: DEFAULT_PAYMENT_METHODS,
        deliveryMethods: DEFAULT_DELIVERY_METHODS,
        currency: 'ARS',
      },
      
      // Suscripción (plan free por defecto)
      subscription: {
        active: true,
        plan: 'free',
      },
      
      // Metadata
      metadata: {
        ownerId: data.ownerId,
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    const docRef = await adminDb
      .collection(STORES_COLLECTION)
      .add(storeData);

    const doc = await docRef.get();

    console.log(`[StoreService] Created store with new structure: ${docRef.id}`);

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
 *   console.log(store.basicInfo.name);
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

    const data = doc.data();
    const store = {
      id: doc.id,
      ...data
    } as Store;

    // Verificar si está activa (soporta ambas estructuras)
    const isActive = data?.metadata?.active ?? data?.active ?? true;
    
    if (!isActive) {
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
 * Soporta tanto la estructura nueva como la legacy
 * 
 * @param ownerId - ID del propietario
 * @returns Array de stores (puede ser vacío)
 * 
 * @example
 * ```typescript
 * const stores = await getStoresByOwner('user123');
 * 
 * stores.forEach(store => {
 *   console.log(store.basicInfo?.name || store.storeName);
 * });
 * 
 * if (stores.length === 0) {
 *   console.log('Usuario no tiene tiendas');
 * }
 * ```
 */
export async function getStoresByOwner(ownerId: string): Promise<Store[]> {
  try {
    // Buscar en la nueva estructura (metadata.ownerId)
    const newStructureSnapshot = await adminDb
      .collection(STORES_COLLECTION)
      .where('metadata.ownerId', '==', ownerId)
      .where('metadata.active', '==', true)
      .get();

    // Buscar también en la estructura legacy (ownerId directo)
    const legacySnapshot = await adminDb
      .collection(STORES_COLLECTION)
      .where('ownerId', '==', ownerId)
      .where('active', '==', true)
      .get();

    // Combinar resultados evitando duplicados
    const storeMap = new Map<string, Store>();

    newStructureSnapshot.docs.forEach(doc => {
      storeMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      } as Store);
    });

    legacySnapshot.docs.forEach(doc => {
      if (!storeMap.has(doc.id)) {
        storeMap.set(doc.id, {
          id: doc.id,
          ...doc.data(),
        } as Store);
      }
    });

    return Array.from(storeMap.values());
  } catch (error) {
    console.error(`[StoreService] Error getting stores for owner ${ownerId}:`, error);
    throw error;
  }
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Actualizar tienda (parcial)
 * 
 * Update parcial: solo campos proporcionados
 * Soporta actualización anidada con dot notation
 * 
 * @param storeId - ID de la tienda
 * @param data - Datos a actualizar (parcial)
 * 
 * @throws {Error} Si la tienda no existe o falla la actualización
 * 
 * @example
 * ```typescript
 * await updateStore('store123', {
 *   basicInfo: { name: 'Nuevo Nombre' },
 *   theme: { primaryColor: '#FF0000' }
 * });
 * ```
 */
export async function updateStore(
  storeId: string,
  data: UpdateStoreData
): Promise<void> {
  try {
    // Construir objeto de actualización con dot notation para campos anidados
    const updateData: Record<string, any> = {
      'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
    };

    // BasicInfo
    if (data.basicInfo) {
      if (data.basicInfo.name !== undefined) updateData['basicInfo.name'] = data.basicInfo.name;
      if (data.basicInfo.slug !== undefined) updateData['basicInfo.slug'] = data.basicInfo.slug;
      if (data.basicInfo.description !== undefined) updateData['basicInfo.description'] = data.basicInfo.description;
      if (data.basicInfo.type !== undefined) updateData['basicInfo.type'] = data.basicInfo.type;
    }

    // ContactInfo
    if (data.contactInfo) {
      if (data.contactInfo.whatsapp !== undefined) updateData['contactInfo.whatsapp'] = data.contactInfo.whatsapp;
      if (data.contactInfo.email !== undefined) updateData['contactInfo.email'] = data.contactInfo.email;
      if (data.contactInfo.phone !== undefined) updateData['contactInfo.phone'] = data.contactInfo.phone;
    }

    // Theme
    if (data.theme) {
      if (data.theme.primaryColor !== undefined) updateData['theme.primaryColor'] = data.theme.primaryColor;
      if (data.theme.secondaryColor !== undefined) updateData['theme.secondaryColor'] = data.theme.secondaryColor;
      if (data.theme.logoUrl !== undefined) updateData['theme.logoUrl'] = data.theme.logoUrl;
      if (data.theme.bannerUrl !== undefined) updateData['theme.bannerUrl'] = data.theme.bannerUrl;
    }

    // Active status
    if (data.active !== undefined) {
      updateData['metadata.active'] = data.active;
    }

    await adminDb
      .collection(STORES_COLLECTION)
      .doc(storeId)
      .update(updateData);

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
 * No elimina el documento, solo setea metadata.active: false
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
    await adminDb
      .collection(STORES_COLLECTION)
      .doc(storeId)
      .update({
        'metadata.active': false,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });
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
    await adminDb
      .collection(STORES_COLLECTION)
      .doc(storeId)
      .update({
        'metadata.active': true,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
      });
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
 * Soporta tanto la estructura nueva como la legacy
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
    const doc = await adminDb
      .collection(STORES_COLLECTION)
      .doc(storeId)
      .get();

    if (!doc.exists) return false;

    const data = doc.data();
    
    // Verificar en la nueva estructura (metadata.ownerId) o legacy (ownerId)
    const ownerId = data?.metadata?.ownerId ?? data?.ownerId;
    
    return ownerId === userId;
  } catch (error) {
    console.error('[StoreService] Error checking store ownership:', error);
    return false;
  }
}

/**
 * Obtener tienda por slug (para páginas públicas)
 * 
 * @param slug - Slug de la tienda
 * @returns Store o null si no existe
 */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  try {
    // Buscar en la nueva estructura
    const newSnapshot = await adminDb
      .collection(STORES_COLLECTION)
      .where('basicInfo.slug', '==', slug)
      .where('metadata.active', '==', true)
      .limit(1)
      .get();

    if (!newSnapshot.empty) {
      const doc = newSnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Store;
    }

    return null;
  } catch (error) {
    console.error(`[StoreService] Error getting store by slug ${slug}:`, error);
    throw error;
  }
}
