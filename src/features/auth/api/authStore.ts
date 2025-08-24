/**
 * Store de autenticación con Zustand
 * 
 * @module features/auth/api/authStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/features/user/user.types';
import { authService } from '@/features/auth/services/authService';

/**
 * Estado del store de autenticación
 */
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  resetPassword: (email: string) => Promise<void>;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Store de autenticación
 * 
 * Este store maneja el estado de autenticación del usuario.
 * No maneja operaciones de perfil o tienda, eso corresponde a userStore.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      /**
       * Establecer usuario autenticado
       */
      setUser: (user: User | null) => {
        set({ user });
      },

      /**
       * Enviar email de recuperación de contraseña
       */
      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          await authService.resetPassword(email);
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Error al restablecer contraseña:', error);
          set({ 
            error: error.message || 'Error al enviar email de recuperación', 
            isLoading: false 
          });
          throw error;
        }
      },

      /**
       * Limpiar estado del usuario (logout)
       */
      clearUser: () => {
        set({ user: null, error: null });
        
        // Limpiar localStorage de forma segura
        try {
          localStorage.removeItem('auth-store');
          localStorage.removeItem('sell-store');
          localStorage.removeItem('user-store');
        } catch (error) {
          // Manejo silencioso de errores de localStorage en entornos sin soporte
          console.warn('No se pudo limpiar localStorage:', error);
        }
      },

      /**
       * Establecer estado de carga
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * Establecer error
       */
      setError: (error: string | null) => {
        set({ error });
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ 
        user: state.user,
        // No persistir loading ni error states
      }),
    }
  )
);
