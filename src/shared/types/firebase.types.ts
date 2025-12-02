/**
 * Tipos Firebase para la nueva estructura NoSQL multi-tenant
 * 
 * Define todas las interfaces para la nueva arquitectura optimizada
 * con configuraciones unificadas y separación clara de responsabilidades.
 * 
 * @module shared/types/firebase
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// STORE METADATA
// ============================================================================

/**
 * Metadatos básicos de la tienda
 * Documento: /stores/{storeId}/metadata
 */
export interface StoreMetadata {
  /** Nombre de la tienda */
  name: string;
  /** UID del propietario (Firebase Auth) */
  ownerId: string;
  /** UIDs de colaboradores con permisos de escritura */
  collaborators?: string[];
  /** Fecha de creación */
  createdAt: Timestamp;
  /** Fecha de última actualización */
  updatedAt: Timestamp;
}

// ============================================================================
// STORE SETTINGS (CONFIGURACIONES UNIFICADAS)
// ============================================================================

/**
 * Método de pago
 */
export interface PaymentMethod {
  /** ID único del método */
  id: string;
  /** Nombre del método */
  name: string;
  /** Si está habilitado */
  enabled: boolean;
  /** Instrucciones adicionales */
  instructions?: string;
}

/**
 * Método de entrega
 */
export interface DeliveryMethod {
  /** ID único del método */
  id: string;
  /** Nombre del método */
  name: string;
  /** Si está habilitado */
  enabled: boolean;
  /** Precio del método (opcional) */
  price?: number;
}

/**
 * Configuraciones de comercio
 */
export interface CommerceConfig {
  /** Métodos de pago disponibles */
  paymentMethods: PaymentMethod[];
  /** Métodos de entrega disponibles */
  deliveryMethods: DeliveryMethod[];
}

/**
 * Configuraciones de notificaciones
 */
export interface NotificationsConfig {
  /** WhatsApp habilitado */
  whatsapp: boolean;
  /** Notificaciones in-app habilitadas */
  inApp: boolean;
  /** Push notifications habilitadas */
  push: boolean;
}

/**
 * Planes de suscripción disponibles
 */
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

/**
 * Configuraciones de suscripción
 */
export interface SubscriptionConfig {
  /** Plan actual */
  plan: SubscriptionPlan;
  /** Fecha de fin del período de prueba */
  trialEndsAt?: Timestamp;
  /** Días de período de gracia */
  gracePeriodDays: number;
}

/**
 * Configuraciones unificadas de la tienda
 * Documento: /stores/{storeId}/settings
 */
export interface StoreSettings {
  /** Configuraciones de comercio */
  commerce: CommerceConfig;
  /** Configuraciones de notificaciones */
  notifications: NotificationsConfig;
  /** Configuraciones de suscripción */
  subscription: SubscriptionConfig;
  /** Fecha de última actualización */
  updatedAt: Timestamp;
}

// ============================================================================
// PRODUCT
// ============================================================================

/**
 * Estados de producto
 */
export type ProductStatus = 'active' | 'inactive' | 'draft';

/**
 * Variante de producto
 */
export interface ProductVariant {
  /** ID único de la variante */
  id: string;
  /** Nombre de la variante */
  name: string;
  /** Precio de la variante */
  price: number;
  /** Si está disponible */
  isAvailable: boolean;
  /** URL de imagen (opcional) */
  imageUrl?: string;
}

/**
 * Tag de producto con configuración visual
 * Documento: /stores/{storeId}/productTags/{tagId}
 */
export interface ProductTag {
  /** ID único del tag */
  id: string;
  /** ID de la tienda */
  storeId: string;
  /** Nombre del tag */
  name: string;
  /** Color del tag (hex) */
  color: string;
  /** Color del texto (hex) */
  textColor: string;
  /** Icono del tag (opcional) */
  icon?: string;
  /** Fecha de creación */
  createdAt: Timestamp;
  /** Fecha de actualización */
  updatedAt: Timestamp;
}

/**
 * Producto simplificado
 * Documento: /stores/{storeId}/products/{productId}
 */
export interface Product {
  /** ID único del producto */
  id: string;
  /** ID de la tienda (para collectionGroup queries) */
  storeId: string;

  // Información básica
  /** Nombre del producto */
  name: string;
  /** Slug para URLs amigables */
  slug: string;
  /** Descripción completa */
  description?: string;

  // Categorización
  /** ID de la categoría */
  categoryId: string;
  /** IDs de tags */
  tags?: string[];
  /** IDs de tags de productos */
  tagIds?: string[];
  /** Tags populados (para consultas) */
  productTags?: ProductTag[];

  // Precios
  /** Precio de venta */
  price: number;
  /** Precio de costo (opcional) */
  costPrice?: number;
  /** Moneda (fijo: ARS) */
  currency: 'ARS';

  // Visual
  /** URLs de imágenes */
  imageUrls?: string[];

  // Variantes
  /** Variantes del producto */
  variants?: ProductVariant[];

  // Stock (si está habilitado)
  /** Cantidad en stock */
  stockQuantity?: number;
  /** Umbral de stock bajo */
  lowStockThreshold?: number;

  // Estado
  /** Estado del producto */
  status: ProductStatus;
  /** Fecha de creación */
  createdAt: Timestamp;
  /** Fecha de última actualización */
  updatedAt: Timestamp;

  // Deprecated but kept for compatibility if needed, or removed if sure
  hasPromotion?: boolean;
}

// ============================================================================
// CATEGORY
// ============================================================================

/**
 * Categoría independiente
 * Documento: /stores/{storeId}/categories/{categoryId}
 */
export interface Category {
  /** ID único de la categoría */
  id: string;
  /** ID de la tienda */
  storeId: string;
  /** Nombre de la categoría */
  name: string;
  /** Slug para URLs amigables */
  slug: string;
  /** ID de la categoría padre (para jerarquía) */
  parentId?: string;
  /** Si está activa */
  isActive: boolean;
  /** Fecha de creación */
  createdAt: Timestamp;
  /** Fecha de última actualización */
  updatedAt: Timestamp;
}

// ============================================================================
// TAG
// ============================================================================

/**
 * Tag/etiqueta independiente
 * Documento: /stores/{storeId}/tags/{tagId}
 */
export interface Tag {
  /** ID único del tag */
  id: string;
  /** ID de la tienda */
  storeId: string;
  /** Nombre del tag */
  name: string;
  /** Slug para URLs amigables */
  slug: string;
  /** Fecha de creación */
  createdAt: Timestamp;
  /** Fecha de última actualización */
  updatedAt: Timestamp;
}

// ============================================================================
// USERS (COLABORADORES)
// ============================================================================

/**
 * Roles de usuario en la tienda
 */
export type UserRole = 'owner' | 'collaborator';

/**
 * Usuario/colaborador de la tienda
 * Documento: /stores/{storeId}/users/{userId}
 */
export interface StoreUser {
  /** UID del usuario (Firebase Auth) */
  userId: string;
  /** ID de la tienda */
  storeId: string;
  /** Rol en la tienda */
  role: UserRole;
  /** Permisos específicos */
  permissions: string[];
  /** Fecha de invitación/agregado */
  addedAt: Timestamp;
  /** Última actividad */
  lastActivity?: Timestamp;
}

// ============================================================================
// CONFIGURACIONES POR DEFECTO
// ============================================================================

/**
 * Configuraciones por defecto para notificaciones
 */
export const DEFAULT_NOTIFICATIONS_CONFIG: NotificationsConfig = {
  whatsapp: true,
  inApp: true,
  push: false
};

/**
 * Configuraciones por defecto para suscripción
 */
export const DEFAULT_SUBSCRIPTION_CONFIG: SubscriptionConfig = {
  plan: 'free',
  gracePeriodDays: 7
};