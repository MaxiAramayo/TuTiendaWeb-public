/**
 * Hook específico para operaciones de datos de usuario
 * 
 * @module features/user/hooks/useUserData
 */

'use client';

import { useState, useCallback } from 'react';
import { useUserStore } from '@/features/user/api/userStore';
import { User } from '@/features/user/user.types';
import { toast } from 'sonner';
import { errorService, ErrorType, ErrorSeverity } from '@/shared/services/error.service';

export interface UseUserDataReturn {
  /** Estado de carga */
  isLoading: boolean;
  /** Error actual */
  error: string | null;
  /** Usuario actual */
  user: User | null;
  /** Actualizar datos del usuario */
  updateUserData: (uid: string, data: Partial<User>) => Promise<void>;
  /** Cargar datos del usuario */
  loadUserData: (uid: string) => Promise<User | null>;
  /** Limpiar errores */
  clearError: () => void;
}

/**
 * Hook especializado en operaciones de datos de usuario
 * Maneja la carga, actualización y gestión de errores de datos de usuario
 */
export const useUserData = (): UseUserDataReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getUser, updateUser, user } = useUserStore();

  /**
   * Actualiza los datos del usuario
   */
  const updateUserData = useCallback(async (uid: string, data: Partial<User>): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await updateUser(uid, data);
      toast.success('Datos actualizados correctamente');
    } catch (err: any) {
      const error = errorService.createError(
        ErrorType.VALIDATION,
        'USER_UPDATE_ERROR',
        'Error al actualizar datos del usuario',
        'No se pudieron actualizar los datos. Inténtalo de nuevo.',
        {
          severity: ErrorSeverity.HIGH,
          context: { uid, data },
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
  }, [updateUser]);

  /**
   * Carga los datos del usuario
   */
  const loadUserData = useCallback(async (uid: string): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await getUser(uid);
      return user;
    } catch (err: any) {
      const error = errorService.createError(
        ErrorType.FIRESTORE,
        'USER_LOAD_ERROR',
        'Error al cargar datos del usuario',
        'No se pudieron cargar los datos del usuario. Inténtalo de nuevo.',
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
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getUser, user]);

  /**
   * Limpia los errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    user,
    updateUserData,
    loadUserData,
    clearError
  };
};