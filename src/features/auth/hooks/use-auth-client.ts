'use client';

import { useAuth } from '../providers/auth-provider';

/**
 * Hook público para estado de auth en cliente
 * 
 * @deprecated Usar `useAuth` directamente desde auth-provider
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

// Re-exportar useAuth para migración gradual
export { useAuth } from '../providers/auth-provider';
