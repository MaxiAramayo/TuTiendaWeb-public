/**
 * Hook para obtener configuración de métodos de pago y entrega desde Firebase
 * 
 * @module features/store/hooks
 */

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { PaymentMethod, DeliveryMethod } from '@/shared/types/firebase.types';
import { useStoreClient } from '../api/storeclient';

interface StoreSettings {
  paymentMethods: PaymentMethod[];
  deliveryMethods: DeliveryMethod[];
  currency: string;
  language: string;
  orderSettings?: {
    preparationTime?: number;
  };
}

interface UseStoreSettingsReturn {
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener configuración de la tienda desde Firebase
 */
export const useStoreSettings = (): UseStoreSettingsReturn => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { store } = useStoreClient();

  const fetchSettings = async () => {
    if (!store) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Log para debug - verificar estructura de datos
      console.log('🔍 [useStoreSettings] Store completo:', store);
      console.log('🔍 [useStoreSettings] Store.settings:', store.settings);
      console.log('🔍 [useStoreSettings] PaymentMethods:', store.settings?.paymentMethods);
      console.log('🔍 [useStoreSettings] DeliveryMethods:', store.settings?.deliveryMethods);
      
      // Los datos están en store.settings (estructura actual de Firebase)
      
      // Estructura de configuración con valores por defecto
      const storeSettings: StoreSettings = {
        paymentMethods: store.settings?.paymentMethods || getDefaultPaymentMethods(),
        deliveryMethods: store.settings?.deliveryMethods || getDefaultDeliveryMethods(),
        currency: store.settings?.currency || 'ARS',
        language: store.settings?.language || 'es',
        orderSettings: {
          preparationTime: store.settings?.orderSettings?.preparationTime || 30
        }
      };

      console.log('✅ [useStoreSettings] Configuración final:', storeSettings);
      setSettings(storeSettings);
    } catch (err) {
      console.error('❌ [useStoreSettings] Error al procesar configuración de la tienda:', err);
      setError('Error al cargar la configuración de la tienda');
      
      // Fallback a configuración por defecto en caso de error
      setSettings({
        paymentMethods: getDefaultPaymentMethods(),
        deliveryMethods: getDefaultDeliveryMethods(),
        currency: 'ARS',
        language: 'es',
        orderSettings: {
          preparationTime: 30
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [store]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings
  };
};

/**
 * Métodos de pago por defecto
 */
function getDefaultPaymentMethods(): PaymentMethod[] {
  return [
    {
      id: 'efectivo',
      name: 'Efectivo',
      enabled: true,
      instructions: 'Pago en efectivo al momento de la entrega'
    },
    {
      id: 'transferencia',
      name: 'Transferencia bancaria',
      enabled: false,
      instructions: 'Realizar transferencia a la cuenta indicada'
    },
    {
      id: 'mercadopago',
      name: 'MercadoPago',
      enabled: false,
      instructions: 'Pago online con MercadoPago'
    }
  ];
}

/**
 * Métodos de entrega por defecto
 */
function getDefaultDeliveryMethods(): DeliveryMethod[] {
  return [
    {
      id: 'retiro',
      name: 'Retiro en local',
      enabled: true,
      price: 0
    },
    {
      id: 'delivery',
      name: 'Delivery',
      enabled: true,
      price: 0
    }
  ];
}

/**
 * Hook para obtener solo métodos de pago habilitados
 */
export const useEnabledPaymentMethods = () => {
  const { settings, loading, error } = useStoreSettings();
  
  const enabledMethods = settings?.paymentMethods.filter(method => method.enabled) || [];
  
  return {
    paymentMethods: enabledMethods,
    loading,
    error
  };
};

/**
 * Hook para obtener solo métodos de entrega habilitados
 */
export const useEnabledDeliveryMethods = () => {
  const { settings, loading, error } = useStoreSettings();
  
  const enabledMethods = settings?.deliveryMethods.filter(method => method.enabled) || [];
  
  return {
    deliveryMethods: enabledMethods,
    loading,
    error
  };
};