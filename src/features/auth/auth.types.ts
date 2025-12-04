/**
 * Tipos específicos para autenticación
 * 
 * @module features/auth/auth.types
 */

import type { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// USER DOCUMENT (Firestore)
// ============================================================================

/**
 * Documento de usuario en Firestore (/users/{userId})
 * 
 * ⚠️ NOTA DE MIGRACIÓN:
 * - storeIds y role deben moverse a Custom Claims
 * - Mantener estos campos temporalmente para compatibilidad
 */
export interface UserDocument {
    id: string;                           // UID de Firebase Auth
    email: string;                        // Email principal
    displayName: string;                  // Nombre completo
    photoURL?: string;                    // Avatar URL (opcional)
    phone?: string;                       // Teléfono E.164 (opcional)
    
    // ⚠️ DEPRECADO: Mover a Custom Claims
    role: 'owner' | 'admin' | 'employee'; // Rol del usuario
    storeIds: string[];                   // Array de tiendas asociadas
    currentStoreId?: string;              // Tienda activa (opcional)
    
    // Metadata
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Datos para crear usuario en Firestore
 */
export type CreateUserData = Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Datos para actualizar perfil
 */
export type UpdateUserData = Partial<Pick<UserDocument, 'displayName' | 'phone' | 'photoURL'>>;

// ============================================================================
// UI TYPES (Cliente)
// ============================================================================

/**
 * Datos mínimos del usuario para UI cliente
 * (usado en AuthProvider)
 */
export interface AuthUser {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
    emailVerified: boolean;
}

/**
 * Estado de autenticación para cliente
 */
export interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// ============================================================================
// SERVER SESSION
// ============================================================================

/**
 * Session del servidor (con custom claims)
 * Retornado por getServerSession()
 * 
 * NOTA: Este tipo también está definido en lib/auth/server-session.ts
 * Mantener sincronizados
 */
export interface ServerSession {
    userId: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    emailVerified: boolean;
    
    // Custom Claims (desde token JWT)
    storeId: string | null;
    role: 'owner' | 'admin' | 'employee' | null;
}

// ============================================================================
// CUSTOM CLAIMS
// ============================================================================

/**
 * Custom Claims de Firebase Auth
 * Almacenados en el JWT token
 */
export interface CustomClaims {
    storeId?: string;
    role?: 'owner' | 'admin' | 'employee';
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

/**
 * Credenciales de autenticación
 */
export interface AuthCredentials {
    email: string;
    password: string;
}

/**
 * Error de autenticación estructurado
 */
export interface AuthError {
    code: string;
    message: string;
    field?: 'email' | 'password' | 'general';
}

/**
 * Resultado de autenticación con Google
 */
export interface GoogleAuthResult {
    userId: string;
    needsSetup: boolean; // true si no tiene tienda configurada
}

// ============================================================================
// ACTION RESPONSE
// ============================================================================

/**
 * Respuesta estándar de Server Actions
 */
export type ActionResponse<T = unknown> =
    | { success: true; data: T }
    | { success: false; errors: Record<string, string[]> };