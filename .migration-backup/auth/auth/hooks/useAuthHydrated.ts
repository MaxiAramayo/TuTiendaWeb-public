/**
 * Hook para manejar la hidratación del estado de autenticación (Optimizado)
 * 
 * @module features/auth/hooks/useAuthHydrated
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore } from '@/features/auth/api/authStore';
import { useUserStore } from '@/features/user/api/userStore';
import { useHydrated } from '@/hooks/useHydrated';
import { User } from '@/features/user/user.types';

/**
 * Hook que combina autenticación con hidratación para evitar errores de SSR
 * Optimizado para minimizar llamadas a Firebase y mejorar performance
 */
export const useAuthHydrated = () => {
  const [user, setUser] = useState<User | undefined | null>(undefined);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isHydrated = useHydrated();
  const { setUser: setAuthUser, user: persistedUser } = useAuthStore();
  const { getUser, getUserStores } = useUserStore();
  const unsubscribedRef = useRef(false);
  const dataLoadedRef = useRef<string | null>(null); // Track loaded user ID

  useEffect(() => {
    if (!isHydrated) return;

    unsubscribedRef.current = false;
    
    // Si tenemos un usuario persistido, usarlo INMEDIATAMENTE sin llamadas
    if (persistedUser && !user) {
      setUser(persistedUser);
      setIsReady(true);
      setIsLoading(false);
      dataLoadedRef.current = persistedUser.id; // Mark as loaded
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribedRef.current) return;
      
      try {
        if (firebaseUser) {
          // OPTIMIZACIÓN CRÍTICA: Solo cargar datos UNA VEZ por usuario
          if (dataLoadedRef.current === firebaseUser.uid) {
            // Datos ya cargados para este usuario, usar cache
            if (persistedUser && persistedUser.id === firebaseUser.uid) {
              setUser(persistedUser);
              setIsReady(true);
              setIsLoading(false);
              return;
            }
          }

          // Verificar si ya tenemos datos persistidos para este usuario
          if (persistedUser && persistedUser.id === firebaseUser.uid) {
            setUser(persistedUser);
            setIsReady(true);
            setIsLoading(false);
            dataLoadedRef.current = firebaseUser.uid;
            return;
          }

          // SOLO si es un usuario completamente nuevo, hacer llamada a Firestore
          if (!dataLoadedRef.current || dataLoadedRef.current !== firebaseUser.uid) {
            setIsLoading(true);
            setError(null);
            
            await getUser(firebaseUser.uid);
            await getUserStores(firebaseUser.uid);
            
            const userData = useUserStore.getState().user;
            setAuthUser(userData || null);
            setUser(userData);
            dataLoadedRef.current = firebaseUser.uid; // Mark as loaded
          }
        } else {
          setUser(null);
          setAuthUser(null);
          dataLoadedRef.current = null; // Reset on logout
        }
      } catch (error: any) {
        setError(error.message || 'Error al cargar datos del usuario');
        
        // Fallback a datos persistidos si hay error
        if (persistedUser && firebaseUser && persistedUser.id === firebaseUser.uid) {
          setUser(persistedUser);
          dataLoadedRef.current = firebaseUser.uid;
        } else {
          setUser(null);
        }
      } finally {
        setIsReady(true);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribedRef.current = true;
      unsubscribe();
    };
  }, [isHydrated]); // Dependencias mínimas optimizadas

  return { user, isReady, isLoading, error };
};
