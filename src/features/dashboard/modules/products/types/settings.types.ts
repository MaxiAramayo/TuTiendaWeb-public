/**
 * Tipos para configuraciones de productos
 * 
 * Define las interfaces y tipos para la gestión de configuraciones
 * modulares de productos en el dashboard.
 * 
 * @module features/dashboard/modules/products/types
 */

/**
 * Configuraciones de productos para una tienda
 */
export interface ProductSettings {
  /** ID de la tienda */
  storeId: string;
  
  /** Si los impuestos están habilitados */
  taxEnabled: boolean;
  
  /** Tasa de impuesto (porcentaje) */
  taxRate: number;
  
  /** Si las promociones están habilitadas */
  promotionsEnabled: boolean;
  
  /** Tipos de promociones permitidos */
  allowedPromotionTypes: ('percentage' | 'fixed')[];
  
  /** Fecha de última actualización */
  updatedAt: Date;
}

/**
 * Tipos de promociones disponibles
 */
export type PromotionType = 'percentage' | 'fixed';

/**
 * Configuraciones parciales para actualizaciones
 */
export type ProductSettingsUpdate = Partial<Omit<ProductSettings, 'storeId' | 'updatedAt'>>;

/**
 * Estado del hook de configuraciones de productos
 */
export interface ProductSettingsState {
  /** Configuraciones actuales */
  settings: ProductSettings | null;
  
  /** Si está cargando */
  loading: boolean;
  
  /** Error si existe */
  error: string | null;
}

/**
 * Datos para actualizar configuraciones de productos
 */
export type UpdateProductSettingsData = Partial<Omit<ProductSettings, 'storeId' | 'updatedAt'>>;