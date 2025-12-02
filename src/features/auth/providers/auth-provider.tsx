'use client';

import { useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { logoutAction } from '../actions/auth.actions';
import { useRouter } from 'next/navigation';

/**
 * Auth Provider (Client Side)
 * 
 * Sincroniza el estado de autenticación de Firebase (Client SDK)
 * con la sesión del servidor (Cookies)
 * 
 * - Si el usuario se desloguea en Firebase -> Llama a logoutAction
 * - Maneja refresh de tokens automáticamente
 * 
 * Nota: El login se maneja en hybridLogin directamente
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        // Escuchar cambios en el token ID (login, logout, refresh)
        const unsubscribe = onIdTokenChanged(auth, async (user) => {
            if (!user) {
                // Usuario deslogueado
                await logoutAction();
                // Refrescar router para actualizar Server Components
                router.refresh();
            }
            // Si hay usuario, el token se gestiona automáticamente
            //  La sesión se crea en hybridLogin cuando el usuario inicia sesión
        });

        return () => unsubscribe();
    }, [router]);

    return <>{children}</>;
}
