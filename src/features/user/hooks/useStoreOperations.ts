/**
 * Hook específico para operaciones de tiendas de usuario
 * 
 * @module features/user/hooks/useStoreOperations
 */

'use client';

import { useState, useCallback } from 'react';
import { useUserStore } from '@/features/user/api/userStore';
import { StoreProfile, CreateStoreProfileData } from '@/features/dashboard/modules/store-settings/types/store.type';
import { toast } from 'sonner';
import { errorService, ErrorType, ErrorSeverity } from '@/shared/services/error.service';
import { validateStoreName as validateStoreNameZod, validateStoreType } from '@shared/validations';

export interface UseStoreOperationsReturn {
  /** Estado de carga */
  isLoading: boolean;
  /** Error actual */
  error: string | null;
  /** Tiendas del usuario */
  stores: StoreProfile[];
  /** Crear una nueva tienda */
  createUserStore: (storeData: CreateStoreProfileData) => Promise<string | null>;
  /** Cargar tiendas del usuario */
  loadUserStores: (uid: string) => Promise<StoreProfile[]>;
  /** Verificar disponibilidad de nombre de tienda */
  checkStoreAvailability: (name: string) => Promise<boolean>;
  /** Limpiar errores */
  clearError: () => void;
}

/**
 * Hook especializado en operaciones de tiendas de usuario
 * Maneja la creación, carga y validación de tiendas
 */
export const useStoreOperations = (): UseStoreOperationsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createStore, getUserStores, checkStoreNameAvailability, stores } = useUserStore();

  /**
   * Crea una nueva tienda con validación previa
   */
  const createUserStore = useCallback(async (storeData: CreateStoreProfileData): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validar datos antes de crear
      const nameValidation = validateStoreNameZod(storeData.basicInfo.name);
       if (!nameValidation.success) {
         throw new Error(nameValidation.error?.issues[0]?.message || 'Nombre de tienda inválido');
      }

      const typeValidation = validateStoreType(storeData.basicInfo.type);
      if (!typeValidation.success) {
        throw new Error(typeValidation.error?.issues[0]?.message || 'Tipo de tienda inválido');
      }
      
      const storeId = await createStore(storeData);
      toast.success('Tienda creada correctamente');
      return storeId;
    } catch (err: any) {
      const error = errorService.createError(
        ErrorType.VALIDATION,
        'STORE_CREATION_ERROR',
        'Error al crear la tienda',
        'No se pudo crear la tienda. Verifica los datos e inténtalo de nuevo.',
        {
          severity: ErrorSeverity.HIGH,
          context: { storeData },
          originalError: err,
          recoverable: true,
          retryable: true
        }
      );
      
      errorService.handleError(error);
      setError(error.message);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [createStore]);

  /**
   * Carga las tiendas del usuario
   */
  const loadUserStores = useCallback(async (uid: string): Promise<StoreProfile[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await getUserStores(uid);
      return stores;
    } catch (err: any) {
      const error = errorService.createError(
        ErrorType.FIRESTORE,
        'LOAD_STORES_ERROR',
        'Error al cargar tiendas del usuario',
        'No se pudieron cargar las tiendas. Inténtalo de nuevo.',
        {
          severity: ErrorSeverity.MEDIUM,
          context: { uid },
          originalError: err,
          recoverable: true,
          retryable: true
        }
      );
      
      errorService.handleError(error);
      setError(error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getUserStores, stores]);

  /**
   * Verifica la disponibilidad de un nombre de tienda
   */
  const checkStoreAvailability = useCallback(async (name: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Validar formato del nombre primero
      const nameValidation = validateStoreNameZod(name);
       if (!nameValidation.success) {
         setError(nameValidation.error?.issues[0]?.message || 'Nombre de tienda inválido');
        return false;
      }
      
      return await checkStoreNameAvailability(name);
    } catch (err: any) {
      const error = errorService.createError(
        ErrorType.VALIDATION,
        'STORE_AVAILABILITY_ERROR',
        'Error al verificar disponibilidad',
        'No se pudo verificar la disponibilidad del nombre. Inténtalo de nuevo.',
        {
          severity: ErrorSeverity.MEDIUM,
          context: { name },
          originalError: err,
          recoverable: true,
          retryable: true
        }
      );
      
      errorService.handleError(error);
      setError(error.message);
      return false;
    }
  }, [checkStoreNameAvailability]);

  /**
   * Limpia los errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    stores,
    createUserStore,
    loadUserStores,
    checkStoreAvailability,
    clearError
  };
};