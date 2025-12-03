/**
 * Tipos centralizados para el módulo QR
 * 
 * @module features/dashboard/modules/qr/types
 */

import { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";

/**
 * Usuario compatible con AuthContext
 */
export interface QRUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Configuración del código QR
 */
export interface QRConfig {
  /** Tamaño del QR en píxeles */
  size: number;
  /** Nivel de corrección de errores */
  level: 'L' | 'M' | 'Q' | 'H';
  /** Incluir margen */
  includeMargin: boolean;
  /** Color de primer plano */
  fgColor?: string;
  /** Color de fondo */
  bgColor?: string;
}

/**
 * Datos para generar el QR
 */
export interface QRData {
  /** URL de la tienda */
  storeURL: string;
  /** Información del usuario */
  user?: QRUser | null;
  /** Perfil de la tienda */
  storeProfile?: StoreProfile;
  /** Configuración del QR */
  config: QRConfig;
}

/**
 * Props para el documento PDF
 */
export interface QRPDFDocumentProps {
  /** Data URL del QR generado */
  qrDataURL: string;
  /** Información del usuario */
  user?: QRUser | null;
  /** Perfil de la tienda */
  storeProfile?: StoreProfile;
}

/**
 * Estado del generador de QR
 */
export interface QRGeneratorState {
  /** Data URL del QR generado */
  qrDataURL: string;
  /** URL de la tienda */
  storeURL: string;
  /** Indica si se está generando PDF */
  isGenerating: boolean;
  /** Error si existe */
  error?: string;
}

/**
 * Props para el componente QR Generator
 */
export interface QRGeneratorProps {
  /** Usuario actual */
  user: QRUser;
  /** Callback cuando se genera un QR */
  onQRGenerated?: (dataURL: string) => void;
  /** Callback cuando hay error */
  onError?: (error: string) => void;
}

/**
 * Props para el preview del QR
 */
export interface QRPreviewProps {
  /** Usuario actual */
  user: QRUser | null;
  /** Perfil de la tienda */
  storeProfile?: StoreProfile;
  /** URL de la tienda */
  storeURL: string;
  /** Data URL del QR (opcional para mostrar versión generada) */
  qrDataURL?: string;
  /** Callback cuando se actualiza el QR */
  onQRUpdate?: () => void;
}

/**
 * Props para las acciones del QR
 */
export interface QRActionsProps {
  /** Indica si se está generando PDF */
  isGenerating: boolean;
  /** Data URL del QR */
  qrDataURL: string;
  /** Usuario actual */
  user: QRUser | null;
  /** Perfil de la tienda */
  storeProfile?: StoreProfile;
  /** Callback para actualizar QR */
  onUpdateQR: () => void;
  /** Callback para descargar PDF */
  onDownloadPDF: () => void;
}
