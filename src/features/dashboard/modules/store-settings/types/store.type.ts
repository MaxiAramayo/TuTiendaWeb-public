/**
 * Tipos para el módulo de perfil de tienda
 * 
 * Define todas las interfaces y tipos utilizados en la gestión del perfil
 * 
 * NOTA: Este archivo mantiene compatibilidad con la estructura antigua.
 * Para la nueva estructura, ver: @/shared/types/firebase.types.ts
 * 
 * @module features/dashboard/modules/profile/types
 */

import { Timestamp } from 'firebase/firestore';
import { PaymentMethod, DeliveryMethod, CommerceConfig } from '@/shared/types/firebase.types';
import { 
  StoreMetadata, 
  StoreSettings as NewStoreSettings, 
  ProductsConfig,
  PaymentMethod as NewPaymentMethod,
  DeliveryMethod as NewDeliveryMethod,
  SubscriptionConfig
} from '@/shared/types/firebase.types';
import { StoreType } from '@shared/validations';

/**
 * Información básica de la tienda
 */
export interface BasicStoreInfo {
  /** Nombre de la tienda */
  name: string;
  /** Descripción de la tienda */
  description: string;
  /** Slug único para la URL */
  slug: string;
  /** Tipo de negocio */
  type: StoreType;
  /** Categoría del negocio */
  category?: string;

}

/**
 * Información de contacto
 */
export interface ContactInfo {
  /** Número de WhatsApp */
  whatsapp: string;
  /** Email de contacto */
  website?: string;
}

/**
 * Dirección física
 */
export interface Address {
  /** Calle y número */
  street: string;
  /** Ciudad */
  city: string;
  /** Provincia/Estado */
  province: string;
  /** País */
  country: string;
  /** Código postal */
  zipCode?: string;
  /** Coordenadas GPS */
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Período de tiempo para horarios
 */
export interface TimePeriod {
  /** Hora de apertura (formato HH:MM) */
  open: string;
  /** Hora de cierre (formato HH:MM) */
  close: string;
  /** Indica si el cierre es al día siguiente */
  nextDay?: boolean;
}

/**
 * Horario diario con soporte para múltiples períodos
 */
export interface DailySchedule {
  /** Indica si está cerrado ese día */
  closed?: boolean;
  /** Períodos de tiempo (puede tener múltiples para horarios divididos) */
  periods?: TimePeriod[];
  /** Campos legacy para compatibilidad hacia atrás */
  open?: string;
  close?: string;
  break?: {
    start: string;
    end: string;
  };
}

/**
 * Horario semanal
 */
export interface WeeklySchedule {
  monday: DailySchedule;
  tuesday: DailySchedule;
  wednesday: DailySchedule;
  thursday: DailySchedule;
  friday: DailySchedule;
  saturday: DailySchedule;
  sunday: DailySchedule;
}

/**
 * Enlaces a redes sociales
 */
export interface SocialLinks {
  /** Instagram */
  instagram?: string;
  /** Facebook */
  facebook?: string;
}

/**
 * Configuración de tema/branding
 */
export interface ThemeConfig {
  /** URL del logo */
  logoUrl?: string;
  /** URL del banner/cover */
  bannerUrl?: string;
  /** Color primario (hex) */
  primaryColor?: string;
  /** Color secundario (hex) */
  secondaryColor?: string;
  /** Color de acento (hex) */
  accentColor?: string;
  /** Fuente principal */
  fontFamily?: string;
  /** Estilo del tema */
  style?: 'modern' | 'classic' | 'minimal' | 'colorful';
  /** Estilo de botones */
  buttonStyle?: 'rounded' | 'square' | 'pill';
}



/**
 * Información de suscripción
 */
export interface SubscriptionInfo {
  /** Estado activo */
  active: boolean;
  /** Plan actual */
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  /** Fecha de inicio */
  startDate: Timestamp;
  /** Fecha de fin */
  endDate: Timestamp;
  /** Período de gracia */
  graceUntil?: Timestamp;
  /** Trial usado */
  trialUsed: boolean;
  /** Información de facturación */
  billing?: {
    provider: 'mercadopago' | 'stripe';
    customerId?: string;
    subscriptionId?: string;
    autoRenew: boolean;
  };
}

/**
 * Perfil completo de la tienda
 */
export interface StoreProfile {
  /** ID único */
  id: string;
  /** ID del propietario */
  ownerId: string;
  
  /** Información básica */
  basicInfo: BasicStoreInfo;
  /** Información de contacto */
  contactInfo: ContactInfo;
  /** Dirección física */
  address?: Address;
  /** Horarios de atención */
  schedule?: WeeklySchedule;
  /** Enlaces sociales */
  socialLinks?: SocialLinks;
  /** Configuración de tema */
  theme?: ThemeConfig;
  /** Configuración de la tienda */
  settings: CommerceConfig;
  /** Información de suscripción */
  subscription: SubscriptionInfo;
  
  /** Metadatos */
  metadata: {
    /** Fecha de creación */
    createdAt: Timestamp;
    /** Última actualización */
    updatedAt: Timestamp;
    /** Versión del perfil */
    version: number;
    /** Estado del perfil */
    status: 'draft' | 'active' | 'suspended' | 'archived';
  };
}

// StoreType ahora se importa desde @shared/validations para mantener consistencia

/**
 * Datos para crear un perfil
 */
export interface CreateStoreProfileData {
  basicInfo: Omit<BasicStoreInfo, 'slug'> & { slug?: string };
  contactInfo: Pick<ContactInfo, 'whatsapp' | 'website'>;
  ownerId: string;
}

/**
 * Datos para actualizar el perfil
 */
export interface UpdateStoreProfileData {
  basicInfo?: Partial<BasicStoreInfo>;
  contactInfo?: Partial<ContactInfo>;
  address?: Partial<Address>;
  schedule?: Partial<WeeklySchedule>;
  socialLinks?: Partial<SocialLinks>;
  theme?: Partial<ThemeConfig>;
  settings?: Partial<CommerceConfig>;
}

/**
 * Datos del formulario de perfil
 */
export interface ProfileFormData {
  // Información básica
  name: string;
  description: string;
  siteName: string;
  storeType: StoreType;
  category?: string;
  
  // Contacto
  whatsapp: string;
  website?: string;
  
  // Dirección
  street?: string;
  city?: string;
  province?: string;
  country?: string;
  zipCode?: string;
  
  // Horarios
  openingHours?: string;
  schedule?: WeeklySchedule;
  
  // Redes sociales
  instagram?: string;
  facebook?: string;
  socialLinks?: SocialLinks;
  
  // Configuración de la tienda
  currency?: string;
  language?: string;
  timezone?: string;
  
  // Métodos de pago y entrega
  paymentMethods?: PaymentMethod[];
  deliveryMethods?: DeliveryMethod[];
  

  
  // Suscripción
  subscription?: SubscriptionInfo;
  
  // Tema
  theme?: ThemeConfig;
  
  // Colores del tema (campos requeridos por el schema)
  primaryColor?: string;
  secondaryColor?: string;

}

/**
 * Estado del formulario
 */
export interface FormState {
  /** Está en modo edición */
  isEditing: boolean;
  /** Está guardando */
  isSaving: boolean;
  /** Hay cambios sin guardar */
  isDirty: boolean;
  /** Errores del formulario */
  errors: Record<string, string>;
  /** Sección activa */
  activeSection: ProfileSection;
}

/**
 * Secciones del perfil
 */
export type ProfileSection = 
  | 'basic'
  | 'contact'
  | 'address'
  | 'schedule'
  | 'social'
  | 'theme'
  | 'settings'

  | 'subscription';

/**
 * Estadísticas del perfil
 */
export interface ProfileStats {
  /** Campos faltantes */
  missingFields: string[];
  /** Última actualización */
  lastUpdated: Date;
  /** Número de visitas */
  views?: number;
  /** Número de pedidos */
  orders?: number;
}

/**
 * Configuración de validación
 */
export interface ValidationConfig {
  /** Campos requeridos */
  requiredFields: string[];
  /** Validaciones personalizadas */
  customValidations: Record<string, (value: any) => boolean | string>;
  /** Mensajes de error */
  errorMessages: Record<string, string>;
}