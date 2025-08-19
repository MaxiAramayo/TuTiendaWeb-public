/**
 * Provider de autenticación
 * 
 * Maneja el estado global de autenticación y proporciona contexto seguro
 * 
 * @module components/providers/AuthProvider
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, withRetry, optimizeFirestoreSettings } from '@/lib/firebase/client';
import { User } from '@/features/user/user.types';
import { useAuthStore } from '@/features/auth/api/authStore';
import { useUserStore } from '@/features/user/api/userStore';
import { userService } from '@/features/user/services/userService';

export interface AuthContextType {
  /** Usuario de Firebase Auth */
  firebaseUser: FirebaseUser | null;
  /** Usuario de la aplicación (Firestore) */
  user: User | null;
  /** Estado de carga */
  loading: boolean;
  /** Error de autenticación */
  error: Error | null;
  /** Si el usuario está autenticado */
  isAuthenticated: boolean;
  /** Si el usuario tiene datos completos */
  hasCompleteProfile: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que maneja el estado de autenticación de forma segura
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [firebaseUser, loading, error] = useAuthState(auth);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const { user, setUser, clearUser } = useAuthStore();
  const { getUser } = useUserStore();

  // Función memoizada para cargar datos del usuario
  const loadUserData = useCallback(async () => {
    if (!firebaseUser) {
      // No hay usuario de Firebase, limpiar estado
      clearUser();
      setHasInitialized(true);
      return;
    }

    try {
      setUserDataLoading(true);
      
      // Intentar cargar datos del usuario desde Firestore con retry logic mejorado
      const userData = await withRetry(async () => {
        return await userService.getUserData(firebaseUser.uid);
      }, 2, 300); // Reducir delay para mejor UX
      
      if (userData) {
        // Usuario tiene datos en Firestore
        setUser(userData);
        console.log('✅ Datos de usuario cargados exitosamente');
      } else {
        // Usuario autenticado pero sin datos en Firestore
        console.log('ℹ️ Usuario sin datos en Firestore, creando datos básicos');
        const basicUserData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          role: 'owner',
          storeIds: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        setUser(basicUserData);
      }
    } catch (error: any) {
      console.error('❌ Error al cargar datos del usuario:', error?.code, error?.message);
      
      // Manejo específico para errores de conexión
      const isConnectionError = error?.message?.includes('ERR_ABORTED') || 
                               error?.code === 'unavailable' ||
                               error?.message?.includes('network') ||
                               error?.code === 'deadline-exceeded';
      
      if (isConnectionError) {
        console.warn('⚠️ Error de conexión detectado, usando datos básicos temporalmente');
      }
      
      // En caso de error, crear datos básicos para evitar errores en la app
      if (firebaseUser) {
        const basicUserData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          role: 'owner',
          storeIds: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        setUser(basicUserData);
        console.log('🔄 Usando datos básicos de usuario debido a error de conexión');
      }
    } finally {
      setUserDataLoading(false);
      setHasInitialized(true);
    }
  }, [firebaseUser, setUser, clearUser]);

  // Cargar datos del usuario cuando cambia el estado de Firebase Auth
  useEffect(() => {
    // Evitar cargas innecesarias durante la hidratación
    if (typeof window === 'undefined') return;
    
    if (!hasInitialized || firebaseUser?.uid !== user?.id) {
      // Usar setTimeout para evitar problemas de hidratación y race conditions
      const timeoutId = setTimeout(() => {
        loadUserData();
      }, 100); // Pequeño delay para evitar race conditions
      
      return () => clearTimeout(timeoutId);
    }
  }, [firebaseUser, hasInitialized, user?.id, loadUserData]);
  
  // Optimizar Firestore al montar el componente (solo una vez)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Optimizar configuración de Firestore al inicializar la app
      // Esta será la única llamada inicial, evitando conflictos
      optimizeFirestoreSettings().catch(error => {
        console.warn('⚠️ No se pudo optimizar Firestore al inicializar:', error);
      });
    }
  }, []); // Array de dependencias vacío para ejecutar solo una vez

  const contextValue: AuthContextType = {
    firebaseUser: firebaseUser || null,
    user,
    loading: loading || userDataLoading || !hasInitialized,
    error: error || null,
    isAuthenticated: !!firebaseUser && !!user,
    hasCompleteProfile: !!user && !!user.storeIds && user.storeIds.length > 0
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext debe ser usado dentro de un AuthProvider');
  }
  return context;
};

/**
 * Hook para verificar si el usuario está autenticado
 */
export const useRequireAuth = () => {
  const { isAuthenticated, loading } = useAuthContext();
  return { isAuthenticated, loading };
};