/**
 * Tipos específicos para el módulo de tienda
 * 
 * Define las interfaces para horarios dinámicos, configuración de tema avanzada
 * y otros tipos específicos del frontend de la tienda.
 * 
 * @module features/store/types
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// HORARIOS DINÁMICOS
// ============================================================================

/**
 * Período de break/descanso
 */
export interface BreakPeriod {
  /** Hora de inicio del break (HH:mm) */
  startTime: string;
  /** Hora de fin del break (HH:mm) */
  endTime: string;
}

/**
 * Horario diario simplificado para el frontend
 */
export interface DailySchedule {
  /** Si la tienda abre este día */
  isOpen: boolean;
  /** Hora de apertura (HH:mm) */
  openTime?: string;
  /** Hora de cierre (HH:mm) */
  closeTime?: string;
  /** Períodos de break/descanso */
  breaks?: BreakPeriod[];
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
  /** Zona horaria */
  timezone?: string;
}

/**
 * Información del próximo cambio de estado
 */
export interface NextStatusChange {
  /** Fecha y hora del cambio */
  dateTime: Date;
  /** Tipo de cambio */
  type: 'open' | 'close';
  /** Mensaje descriptivo */
  message: string;
}

/**
 * Estado actual de la tienda
 */
export interface StoreStatus {
  /** Si la tienda está abierta actualmente */
  isOpen: boolean;
  /** Información del próximo cambio */
  nextChange?: NextStatusChange;
}

// ============================================================================
// CONFIGURACIÓN DE TEMA AVANZADA
// ============================================================================

/**
 * Configuración de colores del tema
 */
export interface ThemeColors {
  /** Color primario */
  primary: string;
  /** Color secundario */
  secondary: string;
  /** Color de acento */
  accent: string;
  /** Color de fondo */
  background: string;
  /** Color de superficie */
  surface: string;
  /** Color de texto */
  text: string;
  /** Color de texto secundario */
  textSecondary: string;
  /** Color de borde */
  border: string;
  /** Color de éxito */
  success: string;
  /** Color de advertencia */
  warning: string;
  /** Color de error */
  error: string;
}

/**
 * Configuración de tipografía
 */
export interface ThemeTypography {
  /** Fuente principal */
  fontFamily: string;
  /** Tamaño de fuente base */
  fontSize: 'small' | 'medium' | 'large';
  /** Peso de fuente */
  fontWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  /** Altura de línea */
  lineHeight: 'tight' | 'normal' | 'relaxed';
}

/**
 * Configuración de botones
 */
export interface ThemeButtons {
  /** Estilo de botones */
  style: 'rounded' | 'square' | 'pill';
  /** Tamaño por defecto */
  size: 'small' | 'medium' | 'large';
  /** Radio de borde personalizado */
  borderRadius?: string;
  /** Efectos hover */
  hoverEffect: 'scale' | 'shadow' | 'brightness' | 'none';
}

/**
 * Configuración de iconos
 */
export interface ThemeIcons {
  /** Estilo de iconos */
  style: 'outline' | 'filled' | 'duotone';
  /** Tamaño por defecto */
  size: 'small' | 'medium' | 'large';
  /** Grosor de línea para iconos outline */
  strokeWidth?: number;
}

/**
 * Configuración básica de tema (existente)
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
 * Configuración avanzada de tema (extiende ThemeConfig)
 */
export interface AdvancedThemeConfig extends ThemeConfig {
  /** Configuración de colores */
  colors: ThemeColors;
  /** Configuración de tipografía */
  typography: ThemeTypography;
  /** Configuración de botones */
  buttons: ThemeButtons;
  /** Configuración de iconos */
  icons: ThemeIcons;
  /** Variables CSS personalizadas */
  customCSS?: string;
  /** Modo oscuro habilitado */
  darkMode?: boolean;
  /** Animaciones habilitadas */
  animations?: boolean;
}

// ============================================================================
// FILTROS AVANZADOS DE PRODUCTOS
// ============================================================================

/**
 * Rango de precios
 */
export interface PriceRange {
  /** Precio mínimo */
  min: number;
  /** Precio máximo */
  max: number;
}

/**
 * Filtros avanzados para productos
 */
export interface AdvancedProductFilters {
  /** Filtro por categorías */
  categories?: string[];
  /** Filtro por tags */
  tags?: string[];
  /** Rango de precios */
  priceRange?: PriceRange;
  /** Solo productos en promoción */
  onSale?: boolean;
  /** Solo productos disponibles */
  inStock?: boolean;
  /** Ordenamiento */
  sortBy?: 'name' | 'price' | 'created' | 'popularity';
  /** Dirección del ordenamiento */
  sortOrder?: 'asc' | 'desc';
  /** Búsqueda por texto */
  searchQuery?: string;
}

// ============================================================================
// TIPOS DE UTILIDAD
// ============================================================================

/**
 * Resultado de validación
 */
export interface ValidationResult {
  /** Si es válido */
  isValid: boolean;
  /** Mensajes de error */
  errors?: string[];
}

/**
 * Estado de carga
 */
export interface LoadingState {
  /** Si está cargando */
  isLoading: boolean;
  /** Mensaje de error */
  error?: string;
}

/**
 * Respuesta de API genérica
 */
export interface ApiResponse<T = any> {
  /** Si fue exitoso */
  success: boolean;
  /** Datos de respuesta */
  data?: T;
  /** Mensaje de error */
  error?: string;
  /** Código de estado */
  statusCode?: number;
}