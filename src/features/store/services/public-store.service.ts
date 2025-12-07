/**
 * Public Store Service - Firebase Admin SDK
 * 
 * Servicios para datos públicos de tiendas (sin autenticación requerida)
 * Usado en páginas de tienda pública y checkout
 * 
 * ⚠️  SOLO USO EN SERVIDOR:
 * - Server Components ✅
 * - Server Actions ✅
 * - API Routes ✅
 * - Client Components ❌
 * 
 * @module features/store/services/public-store.service
 */

import { adminDb } from '@/lib/firebase/admin';
import { cache } from 'react';
import type { StoreData, Product } from '@/shared/types/store';
import type { Product as FirebaseProduct, Category } from '@/shared/types/firebase.types';

// Re-export types from shared types file for backward compatibility
export type { 
  PublicStoreData, 
  StoreSettings, 
  PaymentMethod, 
  DeliveryMethod 
} from '../types/store.types';

import type { 
  PublicStoreData, 
  StoreSettings, 
  PaymentMethod, 
  DeliveryMethod 
} from '../types/store.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORES_COLLECTION = 'stores';
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convierte estructura de schedule de Firebase a WeeklySchedule
 */
function adaptLegacyScheduleToWeeklySchedule(legacySchedule: any): any {
  if (!legacySchedule) return undefined;

  // Si ya tiene la estructura correcta con isOpen/openTime/closeTime, retornarlo
  if (legacySchedule.monday?.isOpen !== undefined) {
    return legacySchedule;
  }

  // Convertir estructura de Firebase (closed/periods) a WeeklySchedule (isOpen/openTime/closeTime)
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const weeklySchedule: any = {
    timezone: 'America/Argentina/Buenos_Aires'
  };

  daysOfWeek.forEach(dayName => {
    const dayData = legacySchedule[dayName];
    
    if (!dayData) {
      weeklySchedule[dayName] = { isOpen: false };
      return;
    }

    // Si el día está cerrado o no tiene períodos
    if (dayData.closed === true || !dayData.periods || dayData.periods.length === 0) {
      weeklySchedule[dayName] = { isOpen: false };
      return;
    }

    // Tomar el primer período como horario principal
    const mainPeriod = dayData.periods[0];
    weeklySchedule[dayName] = {
      isOpen: true,
      openTime: mainPeriod.open,
      closeTime: mainPeriod.close,
      breaks: []
    };

    // Si hay un segundo período, considerarlo como segundo turno (después de un break)
    if (dayData.periods.length > 1) {
      const secondPeriod = dayData.periods[1];
      // El break es entre el cierre del primer período y la apertura del segundo
      weeklySchedule[dayName].breaks = [{
        startTime: mainPeriod.close,
        endTime: secondPeriod.open
      }];
      // Actualizar el horario de cierre al del segundo período
      weeklySchedule[dayName].closeTime = secondPeriod.close;
    }
  });

  return weeklySchedule;
}

/**
 * Serializa campos Timestamp de Firebase a strings ISO
 */
function serializeTimestamps(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => serializeTimestamps(item));
  }

  const serialized = { ...obj };

  Object.keys(serialized).forEach(key => {
    const value = serialized[key];

    // Si es un Timestamp de Firebase, convertir a ISO string
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      serialized[key] = value.toDate().toISOString();
    }
    // Si es un objeto anidado, serializar recursivamente
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      serialized[key] = serializeTimestamps(value);
    }
    // Si es un array, serializar cada elemento
    else if (Array.isArray(value)) {
      serialized[key] = value.map(item => serializeTimestamps(item));
    }
  });

  return serialized;
}

/**
 * Valores por defecto para métodos de pago
 */
function getDefaultPaymentMethods(): PaymentMethod[] {
  return [
    {
      id: 'efectivo',
      name: 'Efectivo',
      enabled: true,
      instructions: 'Pago en efectivo al momento de la entrega'
    },
    {
      id: 'transferencia',
      name: 'Transferencia bancaria',
      enabled: false,
      instructions: 'Realizar transferencia a la cuenta indicada'
    },
    {
      id: 'mercadopago',
      name: 'MercadoPago',
      enabled: false,
      instructions: 'Pago online con MercadoPago'
    }
  ];
}

/**
 * Valores por defecto para métodos de entrega
 */
function getDefaultDeliveryMethods(): DeliveryMethod[] {
  return [
    {
      id: 'retiro',
      name: 'Retiro en local',
      enabled: true,
      price: 0
    },
    {
      id: 'delivery',
      name: 'Delivery',
      enabled: true,
      price: 0
    }
  ];
}

// ============================================================================
// READ - STORE DATA
// ============================================================================

/**
 * Obtiene datos públicos de una tienda por slug
 * 
 * Soporta tanto la estructura nueva (basicInfo.slug) como la legacy (siteName)
 * 
 * @param slug - Slug único de la tienda
 * @returns Datos públicos de la tienda o null
 * 
 * @example
 * ```typescript
 * const store = await getPublicStoreBySlug('mi-tienda');
 * if (store) {
 *   console.log(store.basicInfo.name);
 * }
 * ```
 */
export const getPublicStoreBySlug = cache(async (slug: string): Promise<PublicStoreData | null> => {
  try {
    if (!slug) return null;

    // Primero intentar con la estructura nueva (basicInfo.slug)
    let snapshot = await adminDb
      .collection(STORES_COLLECTION)
      .where('basicInfo.slug', '==', slug)
      .limit(1)
      .get();

    // Si no se encuentra, intentar con la estructura legacy (siteName)
    if (snapshot.empty) {
      snapshot = await adminDb
        .collection(STORES_COLLECTION)
        .where('siteName', '==', slug)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      console.log(`[PublicStoreService] Store not found for slug: ${slug}`);
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Verificar si la tienda está activa
    const isActive = data.subscription?.active !== false && data.suscripcion !== false;
    if (!isActive) {
      console.log(`[PublicStoreService] Store is inactive: ${slug}`);
      return null;
    }

    // Adaptar schedule a WeeklySchedule si es necesario
    const adaptedSchedule = adaptLegacyScheduleToWeeklySchedule(data.schedule || data.weeklySchedule);

    // Serializar y mapear datos (soportar ambas estructuras)
    const serialized = serializeTimestamps({
      id: doc.id,
      // Mapear estructura legacy a estructura nueva
      basicInfo: data.basicInfo || {
        name: data.name || '',
        slug: data.siteName || slug,
        description: data.descripcion || ''
      },
      contactInfo: data.contactInfo || {
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        phone: data.phone || ''
      },
      address: data.address || (data.localaddress ? { street: data.localaddress } : undefined),
      socialLinks: data.socialLinks || {
        instagram: data.instagramlink || ''
      },
      theme: data.theme || {
        logoUrl: data.urlProfile || '',
        bannerUrl: data.urlPortada || ''
      },
      schedule: adaptedSchedule,
      weeklySchedule: adaptedSchedule, // Mantener por compatibilidad
      settings: data.settings,
      subscription: data.subscription || { active: data.suscripcion !== false },
      // Mantener campos legacy por compatibilidad
      uid: data.uid || doc.id,
      ...data
    });

    return serialized as PublicStoreData;
  } catch (error) {
    console.error(`[PublicStoreService] Error getting store by slug ${slug}:`, error);
    return null;
  }
});

/**
 * Obtiene datos públicos de una tienda por ID
 * 
 * @param storeId - ID de la tienda
 * @returns Datos públicos de la tienda o null
 */
export const getPublicStoreById = cache(async (storeId: string): Promise<PublicStoreData | null> => {
  try {
    if (!storeId) return null;

    const doc = await adminDb
      .collection(STORES_COLLECTION)
      .doc(storeId)
      .get();

    if (!doc.exists) {
      console.log(`[PublicStoreService] Store not found: ${storeId}`);
      return null;
    }

    const data = doc.data();

    // Verificar si la tienda está activa
    const isActive = data?.subscription?.active !== false && data?.suscripcion !== false;
    if (!isActive) {
      console.log(`[PublicStoreService] Store is inactive: ${storeId}`);
      return null;
    }

    // Adaptar schedule a WeeklySchedule si es necesario
    const adaptedSchedule = adaptLegacyScheduleToWeeklySchedule(data?.schedule || data?.weeklySchedule);

    // Serializar y mapear datos (soportar ambas estructuras)
    const serialized = serializeTimestamps({
      id: doc.id,
      // Mapear estructura legacy a estructura nueva
      basicInfo: data?.basicInfo || {
        name: data?.name || '',
        slug: data?.siteName || '',
        description: data?.descripcion || ''
      },
      contactInfo: data?.contactInfo || {
        whatsapp: data?.whatsapp || '',
        email: data?.email || '',
        phone: data?.phone || ''
      },
      address: data?.address || (data?.localaddress ? { street: data.localaddress } : undefined),
      socialLinks: data?.socialLinks || {
        instagram: data?.instagramlink || ''
      },
      theme: data?.theme || {
        logoUrl: data?.urlProfile || '',
        bannerUrl: data?.urlPortada || ''
      },
      schedule: adaptedSchedule,
      weeklySchedule: adaptedSchedule, // Mantener por compatibilidad
      settings: data?.settings,
      subscription: data?.subscription || { active: data?.suscripcion !== false },
      // Mantener campos legacy por compatibilidad
      uid: data?.uid || doc.id,
      ...data
    });

    return serialized as PublicStoreData;
  } catch (error) {
    console.error(`[PublicStoreService] Error getting store by id ${storeId}:`, error);
    return null;
  }
});

// ============================================================================
// READ - STORE SETTINGS
// ============================================================================

/**
 * Obtiene configuración de la tienda (métodos de pago, entrega, etc.)
 * 
 * @param storeId - ID de la tienda
 * @returns Configuración de la tienda con valores por defecto
 */
export const getStoreSettings = cache(async (storeId: string): Promise<StoreSettings> => {
  try {
    if (!storeId) {
      return {
        paymentMethods: getDefaultPaymentMethods(),
        deliveryMethods: getDefaultDeliveryMethods(),
        currency: 'ARS',
        language: 'es'
      };
    }

    const doc = await adminDb
      .collection(STORES_COLLECTION)
      .doc(storeId)
      .get();

    if (!doc.exists) {
      return {
        paymentMethods: getDefaultPaymentMethods(),
        deliveryMethods: getDefaultDeliveryMethods(),
        currency: 'ARS',
        language: 'es'
      };
    }

    const data = doc.data();
    const settings = data?.settings;

    return {
      paymentMethods: settings?.paymentMethods || getDefaultPaymentMethods(),
      deliveryMethods: settings?.deliveryMethods || getDefaultDeliveryMethods(),
      currency: settings?.currency || 'ARS',
      language: settings?.language || 'es',
      orderSettings: {
        preparationTime: settings?.orderSettings?.preparationTime || 30
      }
    };
  } catch (error) {
    console.error(`[PublicStoreService] Error getting store settings ${storeId}:`, error);
    return {
      paymentMethods: getDefaultPaymentMethods(),
      deliveryMethods: getDefaultDeliveryMethods(),
      currency: 'ARS',
      language: 'es'
    };
  }
});

// ============================================================================
// READ - PRODUCTS
// ============================================================================

/**
 * Obtiene categorías activas de una tienda
 * 
 * @param storeId - ID de la tienda
 * @returns Map de categoryId -> nombre de categoría
 */
export const getStoreCategories = cache(async (storeId: string): Promise<Map<string, string>> => {
  try {
    if (!storeId) return new Map();

    const snapshot = await adminDb
      .collection(STORES_COLLECTION)
      .doc(storeId)
      .collection(CATEGORIES_COLLECTION)
      .where('isActive', '==', true)
      .get();

    const categoriesMap = new Map<string, string>();
    snapshot.forEach((doc) => {
      const categoryData = doc.data() as Category;
      categoriesMap.set(doc.id, categoryData.name);
    });

    return categoriesMap;
  } catch (error) {
    console.error(`[PublicStoreService] Error getting categories for store ${storeId}:`, error);
    return new Map();
  }
});

/**
 * Obtiene productos públicos (activos) de una tienda
 * 
 * @param storeId - ID de la tienda
 * @returns Array de productos
 */
export const getPublicProducts = cache(async (storeId: string): Promise<Product[]> => {
  try {
    if (!storeId) return [];

    // Obtener categorías para mapear nombres
    const categoriesMap = await getStoreCategories(storeId);

    const snapshot = await adminDb
      .collection(STORES_COLLECTION)
      .doc(storeId)
      .collection(PRODUCTS_COLLECTION)
      .where('status', '==', 'active')
      .get();

    const products: Product[] = [];

    snapshot.forEach((doc) => {
      const productData = doc.data() as FirebaseProduct;

      // Obtener nombre de categoría o usar el ID
      const categoryName = categoriesMap.get(productData.categoryId) || productData.categoryId || "Sin categoría";

      // Mapear variants a topics para compatibilidad con componentes del frontend
      const topics = productData.variants?.map(variant => ({
        id: variant.id,
        name: variant.name,
        price: variant.price
      })) || [];

      // Mapear a estructura legacy para compatibilidad con componentes existentes
      const mappedProduct: Product = {
        idProduct: doc.id,
        name: productData.name,
        description: productData.description || "",
        price: productData.price,
        image: productData.imageUrls?.[0] || "",
        imageUrl: productData.imageUrls?.[0] || "",
        category: categoryName,
        available: productData.status === "active",
        tags: productData.tags || [],
        stock: productData.stockQuantity || 0,
        topics: topics.length > 0 ? topics : undefined
      };

      // Serializar timestamps
      const serializedProduct = serializeTimestamps(mappedProduct);
      products.push(serializedProduct as Product);
    });

    return products;
  } catch (error) {
    console.error(`[PublicStoreService] Error getting products for store ${storeId}:`, error);
    return [];
  }
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Verifica si una tienda existe y está activa por slug
 * 
 * @param slug - Slug de la tienda
 * @returns true si existe y está activa
 */
export async function isStoreActiveBySlug(slug: string): Promise<boolean> {
  const store = await getPublicStoreBySlug(slug);
  return store !== null;
}

/**
 * Obtiene el ID de la tienda por slug
 * 
 * @param slug - Slug de la tienda
 * @returns ID de la tienda o null
 */
export async function getStoreIdBySlug(slug: string): Promise<string | null> {
  const store = await getPublicStoreBySlug(slug);
  return store?.id || null;
}
