/**
 * Hook para manejo de tiendas
 * 
 * @module features/user/hooks/useStoreManagement
 */

'use client';

import { useState, useCallback } from 'react';
import { useUserStore } from '@/features/user/api/userStore';
import { StoreProfile, CreateStoreProfileData } from '@/features/dashboard/modules/store-settings/types/store.type';
import { toast } from 'sonner';
import { useSlugValidation } from './useSlugValidation';
import { validateStoreName, validateWhatsApp, validateQrStoreData } from '@shared/validations';

/**
 * Normaliza un número de WhatsApp
 */
const normalizeWhatsApp = (whatsapp: string): string => {
  const cleaned = whatsapp.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    return `+54${cleaned}`;
  }
  return cleaned;
};

export interface UseStoreManagementOptions {
  /** Auto-validar slug al cambiar nombre */
  autoValidateSlug?: boolean;
  /** Mostrar notificaciones toast */
  showToasts?: boolean;
}

export interface UseStoreManagementReturn {
  /** Estado de carga */
  isLoading: boolean;
  /** Error actual */
  error: string | null;
  /** Tiendas del usuario */
  stores: StoreProfile[];
  /** Hook de validación de slug */
  slugValidation: ReturnType<typeof useSlugValidation>;
  /** Crear nueva tienda */
  createStore: (storeData: Omit<CreateStoreProfileData, 'basicInfo'> & { basicInfo: Omit<CreateStoreProfileData['basicInfo'], 'slug'> & { slug?: string } }) => Promise<string | null>;
  /** Validar datos de tienda */
  validateStoreData: (data: Partial<CreateStoreProfileData>) => { isValid: boolean; errors: string[] };
  /** Normalizar datos de tienda */
  normalizeStoreData: (data: Partial<CreateStoreProfileData>) => Partial<CreateStoreProfileData>;
  /** Cargar tiendas */
  loadStores: (ownerId: string) => Promise<void>;
  /** Limpiar errores */
  clearError: () => void;
}

/**
 * Hook especializado para el manejo de tiendas
 */
export const useStoreManagement = (options: UseStoreManagementOptions = {}): UseStoreManagementReturn => {
  const {
    autoValidateSlug = true,
    showToasts = true
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    createStore: createStoreAction,
    getUserStores,
    stores
  } = useUserStore();

  const slugValidation = useSlugValidation({
    autoSuggest: true,
    maxSuggestions: 5
  });

  /**
   * Valida los datos de una tienda
   */
  const validateStoreData = useCallback((data: Partial<CreateStoreProfileData>) => {
    const errors: string[] = [];

    if (!data.basicInfo?.name || !validateStoreName(data.basicInfo.name).success) {
      errors.push('Nombre de tienda inválido');
    }

    if (!data.contactInfo?.whatsapp || !validateWhatsApp(data.contactInfo.whatsapp).success) {
      errors.push('Número de WhatsApp inválido');
    }

    if (!data.basicInfo?.type || !['restaurant', 'kiosco', 'other'].includes(data.basicInfo.type)) {
      errors.push('Tipo de tienda inválido');
    }

    if (!data.ownerId) {
      errors.push('ID de propietario requerido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Normaliza los datos de una tienda
   */
  const normalizeStoreData = useCallback((data: Partial<CreateStoreProfileData>): Partial<CreateStoreProfileData> => {
    const normalized: Partial<CreateStoreProfileData> = { ...data };

    // Normalizar WhatsApp
    if (normalized.contactInfo?.whatsapp) {
      normalized.contactInfo.whatsapp = normalizeWhatsApp(normalized.contactInfo.whatsapp);
    }

    // Normalizar nombre (trim)
    if (normalized.basicInfo?.name) {
      normalized.basicInfo.name = normalized.basicInfo.name.trim();
    }

    return normalized;
  }, []);

  /**
   * Crea una nueva tienda
   */
  const createStore = useCallback(async (
    storeData: Omit<CreateStoreProfileData, 'basicInfo'> & { basicInfo: Omit<CreateStoreProfileData['basicInfo'], 'slug'> & { slug?: string } }
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Usar slug del hook de validación si no se proporciona
      const slug = storeData.basicInfo.slug || slugValidation.slug;
      
      if (!slug) {
        throw new Error('Slug es requerido');
      }

      // Verificar que el slug esté disponible
      if (slugValidation.isAvailable !== true) {
        const isAvailable = await slugValidation.checkAvailability(slug);
        if (!isAvailable) {
          throw new Error('El nombre de tienda no está disponible');
        }
      }

      // Normalizar datos
      const normalizedData = normalizeStoreData({ 
        ...storeData, 
        basicInfo: { ...storeData.basicInfo, slug }
      });

      // Validar datos
       const validation = validateQrStoreData(normalizedData as CreateStoreProfileData);
       if (!validation.success) {
         throw new Error(validation.error?.issues.map(issue => issue.message).join(', ') || 'Datos inválidos');
      }

      // Crear tienda
      const storeId = await createStoreAction(normalizedData as CreateStoreProfileData);
      
      if (showToasts) {
        toast.success('Tienda creada correctamente');
      }
      
      // Limpiar validación de slug
      slugValidation.reset();
      
      return storeId;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al crear la tienda';
      setError(errorMessage);
      
      if (showToasts) {
        toast.error(errorMessage);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [createStoreAction, slugValidation, validateStoreData, normalizeStoreData, showToasts]);

  /**
   * Carga las tiendas del usuario
   */
  const loadStores = useCallback(async (ownerId: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await getUserStores(ownerId);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar tiendas';
      setError(errorMessage);
      
      if (showToasts) {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getUserStores, showToasts]);

  /**
   * Limpia los errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-generar slug cuando cambia el nombre de la tienda
  const handleNameChange = useCallback((name: string) => {
    if (autoValidateSlug && name) {
      slugValidation.generateFromText(name);
    }
  }, [autoValidateSlug, slugValidation]);

  return {
    isLoading,
    error,
    stores,
    slugValidation,
    createStore,
    validateStoreData,
    normalizeStoreData,
    loadStores,
    clearError
  };
};