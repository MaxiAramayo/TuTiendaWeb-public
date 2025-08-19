/**
 * Hook para manejar la hidratación del estado de autenticación
 * 
 * @module features/auth/hooks/useAuthHydrated
 */

'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore } from '@/features/auth/api/authStore';
import { useUserStore } from '@/features/user/api/userStore';
import { useHydrated } from '@/hooks/useHydrated';
import { User } from '@/features/user/user.types';

/**
 * Hook que combina autenticación con hidratación para evitar errores de SSR
 */
export const useAuthHydrated = () => {
  const [user, setUser] = useState<User | undefined | null>(undefined);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isHydrated = useHydrated();
  const { setUser: setAuthUser } = useAuthStore();
  const { getUser, getUserStores } = useUserStore();

  useEffect(() => {
    if (!isHydrated) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      setError(null);

      try {
        if (firebaseUser) {
          // Usuario autenticado, cargar datos desde Firestore
          await getUser(firebaseUser.uid);
          await getUserStores(firebaseUser.uid);
          
          // Obtener el usuario actualizado del store
          const userData = useUserStore.getState().user;
          setAuthUser(userData || null);
          setUser(userData);
        } else {
          // No hay usuario autenticado
          setUser(null);
        }
      } catch (error: any) {
        console.error('Error en useAuthHydrated:', error);
        setError(error.message || 'Error al cargar datos del usuario');
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    });

    return () => unsubscribe();
  }, [isHydrated, setAuthUser, getUser, getUserStores]);

  return { user, isReady, isLoading, error };
};
