/**
 * Auth Sync Provider - Sincronización de tokens con servidor
 * 
 * Este provider se encarga SOLO de:
 * 1. Escuchar cambios en Firebase Auth (onIdTokenChanged)
 * 2. Sincronizar el token con el servidor (cookie httpOnly)
 * 3. Actualizar el store de Zustand
 * 
 * NO expone contexto propio, usa el AuthStoreProvider.
 * 
 * @module features/auth/providers/auth-provider
 */

'use client';

import { useEffect, useRef } from 'react';
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { syncTokenAction, logoutAction } from '../actions/auth.actions';
import { useRouter } from 'next/navigation';
import { useAuthStore } from './auth-store-provider';

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Provider que sincroniza Firebase Auth con:
 * 1. Cookies del servidor (via Server Actions)
 * 2. Store de Zustand (para UI)
 * 
 * Flujo:
 * - Firebase Auth emite cambio de token
 * - Sincroniza cookie con syncTokenAction
 * - Actualiza Zustand store para UI
 * 
 * @example
 * ```tsx
 * // En layout.tsx (debe estar dentro de AuthStoreProvider)
 * <AuthStoreProvider>
 *   <AuthSyncProvider>
 *     {children}
 *   </AuthSyncProvider>
 * </AuthStoreProvider>
 * ```
 */
export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const isLoggingOut = useRef(false);

    // Zustand actions (no causan re-render porque son estables)
    const setUser = useAuthStore((state) => state.setUser);
    const reset = useAuthStore((state) => state.reset);

    useEffect(() => {
        const unsubscribe = onIdTokenChanged(
            auth,
            async (firebaseUser: FirebaseUser | null) => {
                // Evitar loops: si estamos en proceso de logout, no hacer nada
                if (isLoggingOut.current) return;

                if (firebaseUser) {
                    // =====================================================
                    // USUARIO AUTENTICADO
                    // =====================================================

                    // 1. Actualizar Zustand store para UI
                    setUser({
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName || '',
                        email: firebaseUser.email || '',
                        photoURL: firebaseUser.photoURL || null,
                        emailVerified: firebaseUser.emailVerified,
                    });

                    // 2. Sincronizar token con servidor (cookie httpOnly)
                    try {
                        const idToken = await firebaseUser.getIdToken();
                        await syncTokenAction(idToken);
                        console.log('[AuthSyncProvider] Token synced');
                    } catch (error) {
                        console.error('[AuthSyncProvider] Error syncing token:', error);
                    }
                } else {
                    // =====================================================
                    // USUARIO DESLOGUEADO
                    // =====================================================

                    // 1. Resetear Zustand store
                    reset();

                    // 2. Limpiar sesión del servidor
                    try {
                        isLoggingOut.current = true;
                        await logoutAction();
                        console.log('[AuthSyncProvider] Logged out');
                    } catch (error) {
                        console.error('[AuthSyncProvider] Error logging out:', error);
                    } finally {
                        isLoggingOut.current = false;
                    }

                    // 3. Refrescar router para actualizar Server Components
                    router.refresh();
                }
            }
        );

        return () => unsubscribe();
    }, [router, setUser, reset]);

    return <>{children}</>;
}

// ============================================================================
// LEGACY EXPORTS (Compatibilidad)
// ============================================================================

/**
 * @deprecated Usar AuthSyncProvider en su lugar
 * Mantenido para compatibilidad durante la migración
 */
export const AuthProvider = AuthSyncProvider;
