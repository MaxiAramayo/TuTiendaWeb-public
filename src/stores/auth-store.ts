/**
 * Auth Store - Zustand Vanilla Store
 * 
 * Store de autenticación usando Zustand con patrón SSR-safe.
 * Se usa con createStore (vanilla) para poder wrapearlo con Context
 * y evitar problemas de estado global en SSR de Next.js.
 * 
 * @module stores/auth-store
 * 
 * @see https://github.com/pmndrs/zustand/discussions/2740
 */

import { createStore } from 'zustand/vanilla';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Usuario para UI cliente (solo datos de Firebase Auth)
 */
export interface AuthUser {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    emailVerified: boolean;
}

/**
 * Estado de autenticación
 */
export interface AuthState {
    /** Usuario autenticado (null si no hay sesión) */
    user: AuthUser | null;
    /** Estado de carga inicial */
    isLoading: boolean;
    /** Si el usuario está autenticado */
    isAuthenticated: boolean;
}

/**
 * Acciones del store
 */
export interface AuthActions {
    /** Establecer usuario (actualiza isAuthenticated e isLoading) */
    setUser: (user: AuthUser | null) => void;
    /** Cambiar estado de carga */
    setLoading: (isLoading: boolean) => void;
    /** Resetear a estado inicial */
    reset: () => void;
}

/**
 * Store completo (estado + acciones)
 */
export type AuthStore = AuthState & AuthActions;

// ============================================================================
// DEFAULT STATE
// ============================================================================

const defaultInitState: AuthState = {
    user: null,
    isLoading: true,
    isAuthenticated: false,
};

/** Estado después de verificar auth (usuario no logueado) */
const loggedOutState: AuthState = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
};

// ============================================================================
// STORE FACTORY
// ============================================================================

/**
 * Factory para crear instancias del store.
 * 
 * Se usa factory pattern para que cada request de SSR tenga
 * su propia instancia del store (evita compartir estado entre requests).
 * 
 * @param initState - Estado inicial opcional
 * @returns Nueva instancia del store
 * 
 * @example
 * ```ts
 * // En el provider
 * const store = createAuthStore();
 * 
 * // Con estado inicial (ej: desde servidor)
 * const store = createAuthStore({ 
 *   user: serverUser, 
 *   isLoading: false, 
 *   isAuthenticated: true 
 * });
 * ```
 */
export const createAuthStore = (initState: AuthState = defaultInitState) => {
    return createStore<AuthStore>()((set) => ({
        ...initState,

        setUser: (user) =>
            set({
                user,
                isAuthenticated: !!user,
                isLoading: false,
            }),

        setLoading: (isLoading) => set({ isLoading }),

        // Reset pone isLoading: false porque ya verificamos que no hay usuario
        reset: () => set(loggedOutState),
    }));
};
