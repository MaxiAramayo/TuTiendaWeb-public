/**
 * Auth Provider - Cliente-Servidor Sync
 * 
 * Sincroniza el estado de autenticación entre Firebase Client SDK
 * y las cookies de sesión del servidor
 * 
 * Flujo:
 * 1. onAuthStateChanged (Client SDK) detecta cambios
 * 2. Si usuario login → enviar token a /api/auth/sync-token
 * 3. Si usuario logout → llamar logoutAction()
 * 
 * @module components/providers/auth-provider
 */

'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { logoutAction } from '@/features/auth/actions/auth.actions';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Usuario autenticado: sincronizar token con servidor
                try {
                    const idToken = await user.getIdToken();

                    await fetch('/api/auth/sync-token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ idToken }),
                    });

                    console.log('[AuthProvider] Token synced with server');
                } catch (error) {
                    console.error('[AuthProvider] Error syncing token:', error);
                }
            } else {
                // Usuario no autenticado: limpiar sesión del servidor
                try {
                    await logoutAction();
                    console.log('[AuthProvider] Server session cleared');
                } catch (error) {
                    console.error('[AuthProvider] Error clearing session:', error);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    return <>{children}</>;
}
