/**
 * Store Types - Tipos de tienda centralizados para onboarding
 * 
 * Solo incluye tipos de negocio orientados a productos con delivery.
 * Los servicios (barbería, consultoría, etc.) están excluidos intencionalmente.
 * 
 * @module features/onboarding/data/store-types
 */

export const ONBOARDING_STORE_TYPES = [
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'clothing', label: 'Ropa y Accesorios' },
  { value: 'retail', label: 'Tienda General' },
  { value: 'beauty', label: 'Belleza y Cuidado' },
  { value: 'other', label: 'Otro' },
] as const;

export type OnboardingStoreType = (typeof ONBOARDING_STORE_TYPES)[number]['value'];

/**
 * Mapeo de tipo de tienda a categoría de producto template.
 * restaurant → restaurant, clothing → retail, resto → retail
 */
export function getProductTemplateKey(storeType: string): 'restaurant' | 'retail' {
  if (storeType === 'restaurant') return 'restaurant';
  return 'retail';
}
