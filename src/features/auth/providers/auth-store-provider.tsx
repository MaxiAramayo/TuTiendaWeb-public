/**
 * Auth Store Provider - Zustand + Context Hybrid Pattern
 * 
 * Provee el store de Zustand a través de React Context para:
 * 1. SSR-safe: Cada request tiene su propia instancia del store
 * 2. Performance: Selectores granulares de Zustand (menos re-renders)
 * 3. Testing: Fácil de mockear con diferentes estados iniciales
 * 
 * @module features/auth/providers/auth-store-provider
 * 
 * @see https://github.com/pmndrs/zustand/discussions/2740
 * @see https://tkdodo.eu/blog/zustand-and-react-context
 */

'use client';

import {
    type ReactNode,
    createContext,
    useContext,
    useRef,
} from 'react';
import { useStore } from 'zustand';
import {
    type AuthStore,
    type AuthState,
    createAuthStore,
} from '@/stores/auth-store';

// ============================================================================
// TYPES
// ============================================================================

/** Tipo del store API (lo que retorna createAuthStore) */
export type AuthStoreApi = ReturnType<typeof createAuthStore>;

export interface AuthStoreProviderProps {
    children: ReactNode;
    /** Estado inicial opcional (útil para SSR o testing) */
    initialState?: Partial<AuthState>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthStoreContext = createContext<AuthStoreApi | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Provider que crea y expone el store de Zustand.
 * 
 * Usa useRef para garantizar que el store se crea una sola vez
 * durante el ciclo de vida del componente.
 * 
 * @example
 * ```tsx
 * // En layout.tsx
 * <AuthStoreProvider>
 *   <AuthSyncProvider>
 *     {children}
 *   </AuthSyncProvider>
 * </AuthStoreProvider>
 * ```
 */
export function AuthStoreProvider({
    children,
    initialState,
}: AuthStoreProviderProps) {
    const storeRef = useRef<AuthStoreApi>(undefined);

    if (!storeRef.current) {
        storeRef.current = createAuthStore(
            initialState
                ? { user: null, isLoading: true, isAuthenticated: false, ...initialState }
                : undefined
        );
    }

    return (
        <AuthStoreContext.Provider value={storeRef.current}>
            {children}
        </AuthStoreContext.Provider>
    );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook para acceder al store de auth con selectores.
 * 
 * Los selectores permiten que el componente solo re-renderee
 * cuando el valor seleccionado cambia (no todo el store).
 * 
 * @param selector - Función que selecciona parte del store
 * @returns El valor seleccionado del store
 * @throws Error si se usa fuera de AuthStoreProvider
 * 
 * @example
 * ```tsx
 * // Solo re-renderea si user cambia (no si isLoading cambia)
 * const user = useAuthStore((state) => state.user);
 * 
 * // Múltiples valores (re-renderea si cualquiera cambia)
 * const { user, isLoading } = useAuthStore((state) => ({
 *   user: state.user,
 *   isLoading: state.isLoading,
 * }));
 * 
 * // Acceso a acciones
 * const setUser = useAuthStore((state) => state.setUser);
 * ```
 */
export function useAuthStore<T>(selector: (store: AuthStore) => T): T {
    const authStoreContext = useContext(AuthStoreContext);

    if (!authStoreContext) {
        throw new Error('useAuthStore must be used within AuthStoreProvider');
    }

    return useStore(authStoreContext, selector);
}

/**
 * Hook de conveniencia para obtener todo el estado de auth.
 * 
 * ⚠️ NOTA: Esto causa re-render en cualquier cambio del store.
 * Preferir useAuthStore con selector específico para mejor performance.
 * 
 * @example
 * ```tsx
 * // Menos performante (re-renderea en cualquier cambio)
 * const { user, isLoading, isAuthenticated } = useAuth();
 * 
 * // Más performante (solo re-renderea si user cambia)
 * const user = useAuthStore((state) => state.user);
 * ```
 */
export function useAuth() {
    return useAuthStore((state) => ({
        user: state.user,
        isLoading: state.isLoading,
        isAuthenticated: state.isAuthenticated,
    }));
}
