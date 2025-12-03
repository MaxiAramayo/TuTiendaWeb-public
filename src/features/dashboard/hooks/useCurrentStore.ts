'use client';

import { useState, useEffect } from 'react';
import { useAuthClient } from '@/features/auth/hooks/use-auth-client';
import { getProfileAction } from '@/features/dashboard/modules/store-settings/actions/profile.actions';
import { StoreProfile } from '@/features/dashboard/modules/store-settings/types/store.type';

/**
 * Hook to get the current store for the authenticated user.
 * 
 * Uses Server Actions to fetch the store profile.
 * This replaces the legacy useAuthStore which had storeIds in the user object.
 */
export function useCurrentStore() {
    const { user, isLoading: isAuthLoading } = useAuthClient();
    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchStore() {
            // Wait for auth to initialize
            if (isAuthLoading) return;

            if (!user?.uid) {
                if (isMounted) {
                    setIsLoading(false);
                    setStoreId(null);
                    setStoreProfile(null);
                }
                return;
            }

            try {
                // Only set loading if we don't have data yet to avoid flicker on re-renders
                if (!storeProfile) {
                    setIsLoading(true);
                }

                // Usar Server Action para obtener el perfil
                const result = await getProfileAction();

                if (isMounted) {
                    if (result.success && result.data) {
                        const profile = result.data as StoreProfile;
                        setStoreProfile(profile);
                        setStoreId(profile.id);
                    } else {
                        setStoreProfile(null);
                        setStoreId(null);
                    }
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching store profile:', err);
                if (isMounted) {
                    setError('Error loading store profile');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchStore();

        return () => {
            isMounted = false;
        };
    }, [user?.uid, isAuthLoading]);

    return {
        storeId,
        storeProfile,
        isLoading: isLoading || isAuthLoading,
        error,
        isAuthenticated: !!user,
    };
}
