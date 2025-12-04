/**
 * Tipos centralizados para el módulo QR
 * 
 * Refactorizado para seguir arquitectura Server-First:
 * - Eliminada dependencia de User type (se usa storeProfile.basicInfo.name)
 * - Los datos vienen del Server Component via props
 * 
 * @module features/dashboard/modules/qr/types
 */

import { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";

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
 * Props para el preview del QR
 */
export interface QRPreviewProps {
  /** Perfil de la tienda */
  storeProfile: StoreProfile;
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
  /** Perfil de la tienda */
  storeProfile: StoreProfile;
  /** Callback para actualizar QR */
  onUpdateQR: () => void;
  /** Callback para descargar PDF */
  onDownloadPDF: () => void;
}
