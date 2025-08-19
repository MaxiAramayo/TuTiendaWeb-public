/**
 * Utilidades para el módulo QR
 * 
 * @module features/dashboard/modules/qr/utils
 */

import { QRConfig, QRData } from "../types/qr-types";
import { User } from "@/features/user/user.types";
import { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";

/**
 * Configuración por defecto del QR
 */
export const DEFAULT_QR_CONFIG: QRConfig = {
  size: 160,
  level: 'H',
  includeMargin: true,
  fgColor: '#000000',
  bgColor: '#FFFFFF'
};

/**
 * Configuración del QR para PDF (mayor calidad)
 */
export const PDF_QR_CONFIG: QRConfig = {
  size: 300,
  level: 'H',
  includeMargin: true,
  fgColor: '#000000',
  bgColor: '#FFFFFF'
};

/**
 * Genera la URL de la tienda usando el slug
 */
export const generateStoreURL = (slug: string): string => {
  if (!slug) return '';
  return `tutiendaweb.com.ar/${slug}`;
};

/**
 * Verifica si el QR está listo para ser usado
 */
export const isQRReady = (elementId: string = 'qr-code'): boolean => {
  const qrCodeElement = document.getElementById(elementId);
  
  if (!qrCodeElement) {
    return false;
  }

  // Si es un canvas directamente
  if (qrCodeElement instanceof HTMLCanvasElement) {
    return true;
  }

  // Buscar canvas dentro del elemento contenedor
  const canvas = qrCodeElement.querySelector('canvas');
  return !!canvas;
};

/**
 * Obtiene el Data URL del QR desde el canvas con reintentos
 */
export const getQRDataURL = async (elementId: string = 'qr-code', maxRetries: number = 3): Promise<string> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const qrCodeElement = document.getElementById(elementId);
      
      if (!qrCodeElement) {
        if (attempt === maxRetries) {
          throw new Error(`No se encontró el elemento QR con ID: ${elementId} después de ${maxRetries} intentos`);
        }
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 200 * attempt));
        continue;
      }

      // Si es un canvas directamente, usar toDataURL
      if (qrCodeElement instanceof HTMLCanvasElement) {
        return qrCodeElement.toDataURL("image/png");
      }

      // Buscar canvas dentro del elemento contenedor
      const canvas = qrCodeElement.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        return canvas.toDataURL("image/png");
      }

      if (attempt === maxRetries) {
        throw new Error(`No se encontró un canvas en el elemento con ID: ${elementId}. Asegúrate de que el QR esté renderizado como canvas.`);
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 200 * attempt));
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 200 * attempt));
    }
  }
  
  throw new Error(`No se pudo obtener el QR después de ${maxRetries} intentos`);
};

/**
 * Genera el nombre del archivo PDF
 */
export const generatePDFFileName = (name: string): string => {
  if (!name) return 'qr-menu.pdf';
  return `${name.toLowerCase().replace(/\s+/g, '-')}-qr.pdf`;
};







/**
 * Crea datos del QR desde el perfil de la tienda
 */
export const createQRDataFromStore = (storeProfile: StoreProfile, config: QRConfig = DEFAULT_QR_CONFIG): QRData => {
  if (!storeProfile) {
    throw new Error('Perfil de tienda no disponible');
  }
  
  if (!storeProfile.basicInfo?.name) {
    throw new Error('Nombre de la tienda no configurado');
  }
  
  if (!storeProfile.basicInfo?.slug) {
    throw new Error('Slug de la tienda no configurado');
  }
  
  return {
    storeURL: generateStoreURL(storeProfile.basicInfo.slug),
    storeProfile,
    config
  };
};

/**
 * Configuración para html2canvas
 */
export const HTML2CANVAS_CONFIG = {
  backgroundColor: null,
  scale: 3,
  logging: false,
  useCORS: true,
  allowTaint: true,
  foreignObjectRendering: true,
  scrollX: 0,
  scrollY: 0,
  width: 500,
  height: 600
};

/**
 * Configuración para jsPDF
 */
export const JSPDF_CONFIG = {
  orientation: 'portrait' as const,
  unit: 'mm' as const,
  format: 'a4' as const
};

/**
 * Dimensiones para el PDF
 */
export const PDF_DIMENSIONS = {
  imageWidth: 150,
  margin: 30
};

/**
 * Calcula las dimensiones centradas para el PDF
 */
export const calculatePDFDimensions = (
  pageWidth: number,
  pageHeight: number,
  imageWidth: number,
  imageHeight: number
) => {
  const x = (pageWidth - imageWidth) / 2;
  const y = (pageHeight - imageHeight) / 2;
  
  return { x, y };
};
