/**
 * Exportaciones de componentes de autenticación
 * 
 * @module components/auth
 */

export { AuthGuard } from './AuthGuard';

// Re-exportar desde providers para conveniencia
export { AuthProvider, useAuthContext, useRequireAuth } from '../providers/AuthProvider';
export type { AuthContextType } from '../providers/AuthProvider';