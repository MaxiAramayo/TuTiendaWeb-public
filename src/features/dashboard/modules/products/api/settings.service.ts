/**
 * Servicio para la gestión de configuraciones de productos
 * 
 * Maneja la obtención y actualización de configuraciones modulares
 * para productos, incluyendo SKU, impuestos, stock y promociones.
 * 
 * @module features/dashboard/modules/products/api
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ProductSettings } from '../types/settings.types';

/**
 * Clase de servicio para configuraciones de productos
 */
export class ProductSettingsService {
  /**
   * Obtiene la referencia del documento de configuraciones de productos
   */
  private getSettingsDoc(storeId: string) {
    return doc(db, 'stores', storeId, 'settings', 'products');
  }

  /**
   * Obtiene las configuraciones de productos de una tienda
   * @param storeId - ID de la tienda
   * @returns Configuraciones de productos o configuraciones por defecto
   */
  async getProductSettings(storeId: string): Promise<ProductSettings> {
    try {
      const settingsRef = this.getSettingsDoc(storeId);
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as ProductSettings;
      }
      
      // Retornar configuraciones por defecto si no existen
      const defaultSettings: ProductSettings = {
        storeId,

        taxEnabled: false,
        taxRate: 21,
        
        promotionsEnabled: false,
        allowedPromotionTypes: ['percentage', 'fixed'],
        updatedAt: new Date()
      };
      
      // Crear documento con configuraciones por defecto
      await this.updateProductSettings(storeId, defaultSettings);
      
      return defaultSettings;
    } catch (error) {
      throw new Error('Failed to get product settings');
    }
  }

  /**
   * Actualiza las configuraciones de productos
   * @param storeId - ID de la tienda
   * @param settings - Configuraciones a actualizar
   */
  async updateProductSettings(storeId: string, settings: Partial<ProductSettings>): Promise<void> {
    try {
      const settingsRef = this.getSettingsDoc(storeId);
      
      const updateData = {
        ...settings,
        storeId,
        updatedAt: new Date()
      };
      
      await setDoc(settingsRef, updateData, { merge: true });
    } catch (error) {
      throw new Error('Failed to update product settings');
    }
  }

  /**
   * Verifica si una funcionalidad específica está habilitada
   * @param storeId - ID de la tienda
   * @param feature - Funcionalidad a verificar
   * @returns Si la funcionalidad está habilitada
   */
  async isFeatureEnabled(storeId: string, feature: keyof ProductSettings): Promise<boolean> {
    try {
      const settings = await this.getProductSettings(storeId);
      return Boolean(settings[feature]);
    } catch (error) {
      return false;
    }
  }



  /**
   * Calcula el precio con impuestos según la configuración
   * @param storeId - ID de la tienda
   * @param basePrice - Precio base
   * @returns Precio con impuestos o precio base si impuestos están deshabilitados
   */
  async calculatePriceWithTax(storeId: string, basePrice: number): Promise<number> {
    try {
      const settings = await this.getProductSettings(storeId);
      
      if (!settings.taxEnabled) {
        return basePrice;
      }
      
      const taxMultiplier = 1 + (settings.taxRate / 100);
      return Math.round(basePrice * taxMultiplier * 100) / 100;
    } catch (error) {
      return basePrice;
    }
  }
}

// Instancia singleton del servicio
export const productSettingsService = new ProductSettingsService();