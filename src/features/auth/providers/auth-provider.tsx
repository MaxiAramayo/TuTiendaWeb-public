'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { syncTokenAction, logoutAction } from '../actions/auth.actions';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Usuario mínimo para UI cliente
 * (solo datos de Firebase Auth, sin custom claims)
 */
interface AuthUser {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    emailVerified: boolean;
}

interface AuthContextValue {
    /** Estado de carga inicial */
    isLoading: boolean;
    /** Usuario autenticado (Firebase Auth) */
    isAuthenticated: boolean;
    /** Datos del usuario para UI */
    user: AuthUser | null;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Auth Provider Unificado
 * 
 * Combina:
 * 1. Estado de autenticación para UI (isLoading, user, isAuthenticated)
 * 2. Sincronización de tokens con servidor (cookies httpOnly)
 * 
 * Flujo:
 * - Cuando el token cambia (login, logout, refresh) → sincroniza cookie
 * - Expone estado de auth para componentes cliente
 * - Evita loops usando refs para tracking
 * 
 * NOTA: 
 * - El login inicial se maneja en hybridLogin/createSessionAction
 * - Para acceder a custom claims (storeId, role) usar getServerSession() en servidor
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const isLoggingOut = useRef(false);
    
    const [state, setState] = useState<AuthContextValue>({
        isLoading: true,
        isAuthenticated: false,
        user: null,
    });

    useEffect(() => {
        // Escuchar cambios en el token ID (login, logout, refresh)
        const unsubscribe = onIdTokenChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            // Evitar loops: si estamos en proceso de logout, no hacer nada
            if (isLoggingOut.current) return;

            if (firebaseUser) {
                // Usuario autenticado
                
                // 1. Actualizar estado para UI
                setState({
                    isLoading: false,
                    isAuthenticated: true,
                    user: {
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName || '',
                        email: firebaseUser.email || '',
                        photoURL: firebaseUser.photoURL || null,
                        emailVerified: firebaseUser.emailVerified,
                    },
                });

                // 2. Sincronizar token con servidor
                try {
                    const idToken = await firebaseUser.getIdToken();
                    await syncTokenAction(idToken);
                    console.log('[AuthProvider] Token synced');
                } catch (error) {
                    console.error('[AuthProvider] Error syncing token:', error);
                }
            } else {
                // Usuario deslogueado
                
                // 1. Actualizar estado para UI
                setState({
                    isLoading: false,
                    isAuthenticated: false,
                    user: null,
                });

                // 2. Limpiar sesión del servidor
                try {
                    isLoggingOut.current = true;
                    await logoutAction();
                    console.log('[AuthProvider] Logged out');
                } catch (error) {
                    console.error('[AuthProvider] Error logging out:', error);
                } finally {
                    isLoggingOut.current = false;
                }
                
                // 3. Refrescar router para actualizar Server Components
                router.refresh();
            }
        });

        return () => unsubscribe();
    }, [router]);

    return (
        <AuthContext.Provider value={state}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para acceder al estado de auth en cliente
 * 
 * ⚠️ Solo para UI state (mostrar/ocultar elementos, datos del usuario)
 * 
 * Para auth en servidor usar:
 * - getServerSession() → acceso a custom claims (storeId, role)
 * - Server Actions → validación y mutaciones
 * 
 * @example
 * ```tsx
 * function Navbar() {
 *   const { isLoading, isAuthenticated, user } = useAuth();
 *   
 *   if (isLoading) return <Skeleton />;
 *   if (!isAuthenticated) return <LoginButton />;
 *   
 *   return <Avatar src={user.photoURL} />;
 * }
 * ```
 */
export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
}
