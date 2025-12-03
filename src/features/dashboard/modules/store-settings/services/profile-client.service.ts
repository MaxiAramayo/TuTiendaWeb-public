/**
 * Servicio cliente para operaciones de perfil que requieren client SDK
 * 
 * Este servicio maneja operaciones que NO pueden ser Server Actions:
 * - Upload de imágenes (requiere acceso directo a Storage)
 * - Lectura cliente-side para casos específicos
 * 
 * Las mutaciones de datos deben usar Server Actions en actions/profile.actions.ts
 * 
 * @module features/dashboard/modules/store-settings/services
 */

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '@/lib/firebase/client';

/**
 * Configuración de optimización de imágenes
 */
const IMAGE_CONFIG = {
  logo: {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
  },
  banner: {
    maxWidth: 1920,
    maxHeight: 600,
    quality: 0.80,
  },
  profile: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
  },
} as const;

/**
 * Servicio cliente para operaciones de Storage
 */
class ProfileClientService {
  /**
   * Convierte una imagen a WebP optimizado
   * @param file - Archivo de imagen original
   * @param type - Tipo de imagen para aplicar configuración específica
   * @returns Blob de imagen WebP optimizada
   */
  private async optimizeImage(
    file: File,
    type: 'logo' | 'banner' | 'profile'
  ): Promise<Blob> {
    const config = IMAGE_CONFIG[type];
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo crear el contexto del canvas'));
        return;
      }

      img.onload = () => {
        // Calcular dimensiones manteniendo aspect ratio
        let { width, height } = img;
        
        if (width > config.maxWidth) {
          height = (height * config.maxWidth) / width;
          width = config.maxWidth;
        }
        
        if (height > config.maxHeight) {
          width = (width * config.maxHeight) / height;
          height = config.maxHeight;
        }

        // Redondear dimensiones
        width = Math.round(width);
        height = Math.round(height);

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada con suavizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`📷 Imagen optimizada: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${((1 - blob.size / file.size) * 100).toFixed(0)}% reducción)`);
              resolve(blob);
            } else {
              reject(new Error('Error al convertir imagen a WebP'));
            }
          },
          'image/webp',
          config.quality
        );
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      // Crear URL temporal para cargar la imagen
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Subir imagen de logo o banner (optimizada a WebP)
   */
  async uploadImage(
    storeId: string, 
    file: File, 
    type: 'logo' | 'banner' | 'profile'
  ): Promise<string> {
    if (!storage) {
      throw new Error('Storage no inicializado');
    }

    // Validar tamaño (5MB máximo antes de optimización)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen debe ser menor a 5MB');
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    // Optimizar imagen a WebP
    const optimizedBlob = await this.optimizeImage(file, type);
    
    // Usar extensión .webp para el archivo optimizado
    const fileName = `${type}-${Date.now()}.webp`;
    const path = `stores/${storeId}/${type}/${fileName}`;
    
    const storageRef = ref(storage, path);
    
    const snapshot = await uploadBytes(storageRef, optimizedBlob, {
      contentType: 'image/webp',
    });
    
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  }

  /**
   * Eliminar imagen
   */
  async deleteImage(storeId: string, imageUrl: string, type: 'logo' | 'banner'): Promise<void> {
    if (!storage) {
      throw new Error('Storage no inicializado');
    }

    try {
      // Extraer la ruta del archivo desde la URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (!pathMatch) {
        console.warn('No se pudo extraer la ruta de la imagen');
        return;
      }
      
      const path = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      // Si el archivo no existe, no es un error crítico
      console.warn('Error al eliminar imagen:', error);
    }
  }
}

export const profileClientService = new ProfileClientService();
