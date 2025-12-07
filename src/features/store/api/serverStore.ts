/**
 * Server-side data fetching para Store feature
 * 
 * Re-exporta funciones del servicio público para compatibilidad
 * con imports existentes. Usa Firebase Admin SDK.
 * 
 * @module features/store/api/serverStore
 * @deprecated Usar directamente las funciones de public-store.service.ts
 */

// Re-export todas las funciones del servicio público
export {
  getPublicStoreBySlug as getStoreBySlug,
  getPublicStoreById,
  getPublicProducts as getStoreProducts,
  getStoreCategories,
  getStoreSettings,
  isStoreActiveBySlug,
  getStoreIdBySlug,
  type PublicStoreData,
  type StoreSettings
} from '../services/public-store.service';
