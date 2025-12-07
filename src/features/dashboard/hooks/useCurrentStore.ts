'use client';

import { useEffect, useRef } from 'react';
import { useAuthClient } from '@/features/auth/hooks/use-auth-client';
import { getProfileAction } from '@/features/dashboard/modules/store-settings/actions/profile.actions';
import { useProfileStore } from '@/features/dashboard/modules/store-settings/stores/profile.store';

/**
 * Hook to get the current store for the authenticated user.
 * 
 * Uses the global profile store as source of truth.
 * Fetches via Server Action only once per user session.
 */
export function useCurrentStore() {
    const { user, isLoading: isAuthLoading } = useAuthClient();
    
    // Store global - fuente de verdad única
    const profile = useProfileStore((state) => state.profile);
    const isLoading = useProfileStore((state) => state.isLoading);
    const setProfile = useProfileStore((state) => state.setProfile);
    const setLoading = useProfileStore((state) => state.setLoading);
    const clear = useProfileStore((state) => state.clear);
    
    // Control de fetch único por usuario
    const fetchedForUserRef = useRef<string | null>(null);

    useEffect(() => {
        // Esperar a que auth inicialice
        if (isAuthLoading) return;

        // Si no hay usuario, limpiar
        if (!user?.uid) {
            clear();
            fetchedForUserRef.current = null;
            return;
        }

        // Si ya cargamos para este usuario, no hacer nada
        if (fetchedForUserRef.current === user.uid) {
            return;
        }

        // Si ya tenemos el perfil cargado (de otro componente), marcar como cargado
        if (profile && profile.id) {
            fetchedForUserRef.current = user.uid;
            return;
        }

        // Cargar perfil
        async function fetchProfile() {
            setLoading(true);
            fetchedForUserRef.current = user!.uid; // Marcar antes para evitar duplicados
            
            try {
                const result = await getProfileAction();
                
                if (result.success && result.data) {
                    setProfile(result.data);
                }
            } catch (err) {
                console.error('Error fetching store profile:', err);
                fetchedForUserRef.current = null; // Permitir reintento
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [user?.uid, isAuthLoading, profile, setProfile, setLoading, clear]);

    return {
        storeId: profile?.id ?? null,
        storeSlug: profile?.basicInfo?.slug ?? null,
        storeName: profile?.basicInfo?.name ?? null,
        storeProfile: profile,
        isLoading: isLoading || isAuthLoading,
        error: null,
        isAuthenticated: !!user,
    };
}
