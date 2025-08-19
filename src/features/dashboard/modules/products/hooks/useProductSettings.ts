/**
 * Hook para gestión de configuraciones de productos
 * 
 * Proporciona funcionalidades para obtener y gestionar las configuraciones
 * modulares de productos, incluyendo SKU, impuestos, stock y promociones.
 * 
 * @module features/dashboard/modules/products/hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { productSettingsService } from '../api/settings.service';
import { ProductSettings, ProductSettingsState, UpdateProductSettingsData } from '../types/settings.types';
import { toast } from 'sonner';

/**
 * Hook para gestión de configuraciones de productos
 * @param storeId - ID de la tienda
 * @returns Estado y funciones para gestionar configuraciones
 */
export const useProductSettings = (storeId: string) => {
  const [state, setState] = useState<ProductSettingsState>({
    settings: null,
    loading: true,
    error: null
  });

  /**
   * Carga las configuraciones de productos
   */
  const loadSettings = useCallback(async () => {
    if (!storeId) return;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const settings = await productSettingsService.getProductSettings(storeId);
      
      setState({
        settings,
        loading: false,
        error: null
      });
    } catch (error) {
      setState({
        settings: null,
        loading: false,
        error: 'Error al cargar las configuraciones de productos'
      });
    }
  }, [storeId]);

  /**
   * Actualiza las configuraciones de productos
   */
  const updateSettings = useCallback(async (updates: UpdateProductSettingsData) => {
    if (!storeId || !state.settings) return false;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await productSettingsService.updateProductSettings(storeId, updates);
      
      // Actualizar estado local
      const updatedSettings: ProductSettings = {
        ...state.settings,
        ...updates,
        updatedAt: new Date()
      };
      
      setState({
        settings: updatedSettings,
        loading: false,
        error: null
      });
      
      toast.success('Configuraciones actualizadas correctamente');
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al actualizar las configuraciones'
      }));
      toast.error('Error al actualizar las configuraciones');
      return false;
    }
  }, [storeId, state.settings]);

  /**
   * Verifica si una funcionalidad está habilitada
   */
  const isFeatureEnabled = useCallback((feature: keyof ProductSettings): boolean => {
    if (!state.settings) return false;
    return Boolean(state.settings[feature]);
  }, [state.settings]);



  /**
   * Calcula el precio con impuestos
   */
  const calculatePriceWithTax = useCallback(async (basePrice: number): Promise<number> => {
    if (!storeId) return basePrice;
    
    try {
      return await productSettingsService.calculatePriceWithTax(storeId, basePrice);
    } catch (error) {
      return basePrice;
    }
  }, [storeId]);

  /**
   * Refresca las configuraciones
   */
  const refresh = useCallback(() => {
    loadSettings();
  }, [loadSettings]);

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    // Estado
    settings: state.settings,
    loading: state.loading,
    error: state.error,
    
    // Funciones
    updateSettings,
    isFeatureEnabled,

    calculatePriceWithTax,
    refresh,
    
    // Configuraciones específicas (helpers)

    taxEnabled: state.settings?.taxEnabled ?? false,

    promotionsEnabled: state.settings?.promotionsEnabled ?? false,
    taxRate: state.settings?.taxRate ?? 0,


    allowedPromotionTypes: state.settings?.allowedPromotionTypes ?? ['percentage', 'fixed']
  };
};