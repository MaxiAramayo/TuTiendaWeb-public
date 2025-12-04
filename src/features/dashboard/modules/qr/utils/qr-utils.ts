/**
 * Utilidades para el módulo QR
 * 
 * @module features/dashboard/modules/qr/utils
 */

import { QRConfig } from "../types/qr-types";

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
      
      await new Promise(resolve => setTimeout(resolve, 200 * attempt));
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 200 * attempt));
    }
  }
  
  throw new Error(`No se pudo obtener el QR después de ${maxRetries} intentos`);
};
