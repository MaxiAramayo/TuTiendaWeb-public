'use client';

import { useAuth, useAuthStore } from '../providers/auth-store-provider';

/**
 * Hook público para estado de auth en cliente
 * 
 * @deprecated Usar `useAuth` o `useAuthStore` directamente desde auth-store-provider
 * Este hook se mantiene para compatibilidad con código existente
 * 
 * ⚠️ Solo para UI state
 * Para auth en servidor, usar Server Actions:
 * - loginAction
 * - registerAction  
 * - logoutAction
 * - getServerSession()
 */
export function useAuthClient() {
    return useAuth();
}

// Re-exportar hooks para migración gradual
export { useAuth, useAuthStore } from '../providers/auth-store-provider';
