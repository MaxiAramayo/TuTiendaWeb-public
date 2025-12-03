/**
 * Auth Service - Firebase Admin SDK
 * 
 * Gestiona custom claims y tokens de Firebase Auth
 * 
 * Custom Claims:
 * - Metadatos adicionales en el JWT token
 * - Máximo 1000 bytes por usuario
 * - Accesibles en Security Rules de Firestore
 * - NO están en el token hasta refresh/re-login
 * 
 * @module features/auth/services/server/auth.service
 * @see https://firebase.google.com/docs/auth/admin/custom-claims
 */

import { adminAuth } from '@/lib/firebase/admin';

// ============================================================================
// TYPES
// ============================================================================

export interface CustomClaims {
    storeId?: string;
    role?: 'owner' | 'admin' | 'employee';
}

// ============================================================================
// CUSTOM CLAIMS
// ============================================================================

/**
 * Setear custom claims en Firebase Auth user
 * 
 * ⚠️  IMPORTANTE: Los claims NO están disponibles en el token actual
 * hasta que el usuario haga refresh del token o re-login
 * 
 * Solución: Llamar a revokeUserTokens() después para forzar refresh
 * 
 * @param userId - UID del usuario
 * @param claims - Claims a setear (reemplaza claims existentes)
 * 
 * @throws {Error} Si el usuario no existe o falla el seteo
 * 
 * @example
 * ```typescript
 * // Flujo correcto en Server Action:
 * await setUserClaims('user123', { 
 *   storeId: 'store456', 
 *   role: 'owner' 
 * });
 * 
 * await revokeUserTokens('user123');  // ← Forzar refresh
 * 
 * // Ahora el usuario debe re-login y tendrá los nuevos claims
 * ```
 */
export async function setUserClaims(
    userId: string,
    claims: CustomClaims
): Promise<void> {
    try {
        await adminAuth.setCustomUserClaims(userId, claims);
        console.log(`[AuthService] Set custom claims for user: ${userId}`, claims);
    } catch (error) {
        console.error(`[AuthService] Error setting claims for ${userId}:`, error);
        throw error;
    }
}

/**
 * Obtener custom claims de un usuario
 * 
 * @param userId - UID del usuario
 * @returns Custom claims actuales
 * 
 * @example
 * ```typescript
 * const claims = await getUserClaims('user123');
 * console.log(claims.storeId);  // 'store456'
 * console.log(claims.role);     // 'owner'
 * ```
 */
export async function getUserClaims(
    userId: string
): Promise<CustomClaims> {
    try {
        const user = await adminAuth.getUser(userId);
        return (user.customClaims || {}) as CustomClaims;
    } catch (error) {
        console.error(`[AuthService] Error getting claims for ${userId}:`, error);
        throw error;
    }
}

/**
 * Actualizar custom claims (merge con existentes)
 * 
 * Combina claims actuales con nuevos claims
 * 
 * @param userId - UID del usuario
 * @param newClaims - Claims a agregar/actualizar
 * 
 * @example
 * ```typescript
 * // Usuario tiene: { role: 'user' }
 * 
 * await updateUserClaims('user123', { storeId: 'store456' });
 * 
 * // Ahora tiene: { role: 'user', storeId: 'store456' }
 * ```
 */
export async function updateUserClaims(
    userId: string,
    newClaims: Partial<CustomClaims>
): Promise<void> {
    try {
        const currentClaims = await getUserClaims(userId);
        const mergedClaims = { ...currentClaims, ...newClaims };

        await setUserClaims(userId, mergedClaims);
    } catch (error) {
        console.error(`[AuthService] Error updating claims for ${userId}:`, error);
        throw error;
    }
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Revocar todos los refresh tokens de un usuario
 * 
 * Fuerza al usuario a hacer re-login para obtener nuevos claims
 * 
 * ⚠️  IMPORTANTE: Esto invalida TODOS los tokens existentes
 * El usuario será deslogueado en TODOS los dispositivos
 * 
 * Uso típico:
 * - Después de setear custom claims (para aplicarlos inmediatamente)
 * - Después de cambiar permisos críticos
 * - En caso de compromiso de seguridad
 * 
 * @param userId - UID del usuario
 * 
 * @example
 * ```typescript
 * // Flujo completo para cambiar rol:
 * await setUserClaims(userId, { role: 'admin' });
 * await revokeUserTokens(userId);  // Claims disponibles inmediatamente
 * 
 * // Usuario debe re-login en su próxima request
 * ```
 */
export async function revokeUserTokens(userId: string): Promise<void> {
    try {
        await adminAuth.revokeRefreshTokens(userId);
        console.log(`[AuthService] Revoked tokens for user: ${userId}`);
    } catch (error) {
        console.error(`[AuthService] Error revoking tokens for ${userId}:`, error);
        throw error;
    }
}

/**
 * Verificar ID token y obtener claims
 * 
 * @param idToken - Token JWT del cliente
 * @param checkRevoked - Si debe verificar revocación (default: true)
 * @returns Decoded token con claims
 * 
 * @throws {Error} Si el token es inválido, expirado o revocado
 * 
 * @example
 * ```typescript
 * try {
 *   const decoded = await verifyIdToken(idToken, true);
 *   console.log(decoded.uid);              // Firebase Auth UID
 *   console.log(decoded.email);            // Email del usuario
 *   console.log(decoded.storeId);          // Custom claim
 *   console.log(decoded.role);             // Custom claim
 * } catch (error) {
 *   // Token inválido o revocado
 * }
 * ```
 */
export async function verifyIdToken(
    idToken: string,
    checkRevoked: boolean = true
) {
    try {
        return await adminAuth.verifyIdToken(idToken, checkRevoked);
    } catch (error) {
        console.error('[AuthService] Error verifying token:', error);
        throw error;
    }
}

// ============================================================================
// USER PROFILE (AUTH)
// ============================================================================

/**
 * Actualizar perfil de Firebase Auth (displayName, photoURL)
 * 
 * ⚠️  Esto actualiza el perfil en Firebase Auth, NO en Firestore
 * Debes actualizar Firestore por separado usando user.service.ts
 * 
 * @param userId - UID del usuario
 * @param data - Datos a actualizar
 * 
 * @example
 * ```typescript
 * // Actualizar en ambos lugares:
 * await updateAuthProfile(userId, { displayName: 'Jane Doe' });  // Auth
 * await updateUserInFirestore(userId, { displayName: 'Jane Doe' });  // Firestore
 * ```
 */
export async function updateAuthProfile(
    userId: string,
    data: { displayName?: string; photoURL?: string }
): Promise<void> {
    try {
        await adminAuth.updateUser(userId, data);
        console.log(`[AuthService] Updated auth profile for user: ${userId}`);
    } catch (error) {
        console.error(`[AuthService] Error updating profile for ${userId}:`, error);
        throw error;
    }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Desactivar usuario (Firebase Auth)
 * 
 * El usuario NO podrá hacer login
 * 
 * @param userId - UID del usuario
 */
export async function disableUser(userId: string): Promise<void> {
    try {
        await adminAuth.updateUser(userId, { disabled: true });
        console.log(`[AuthService] Disabled user: ${userId}`);
    } catch (error) {
        console.error(`[AuthService] Error disabling user ${userId}:`, error);
        throw error;
    }
}

/**
 * Reactivar usuario (Firebase Auth)
 * 
 * @param userId - UID del usuario
 */
export async function enableUser(userId: string): Promise<void> {
    try {
        await adminAuth.updateUser(userId, { disabled: false });
        console.log(`[AuthService] Enabled user: ${userId}`);
    } catch (error) {
        console.error(`[AuthService] Error enabling user ${userId}:`, error);
        throw error;
    }
}

/**
 * Eliminar usuario de Firebase Auth
 * 
 * ⚠️  IMPORTANTE: Esto NO elimina datos de Firestore
 * Debes eliminar manualmente de Firestore usando user.service.ts
 * 
 * @param userId - UID del usuario
 * 
 * @example
 * ```typescript
 * // Eliminar completamente:
 * await deleteAuthUser(userId);           // Firebase Auth
 * await deleteUserFromFirestore(userId);  // Firestore
 * ```
 */
export async function deleteAuthUser(userId: string): Promise<void> {
    try {
        await adminAuth.deleteUser(userId);
        console.log(`[AuthService] Deleted auth user: ${userId}`);
    } catch (error) {
        console.error(`[AuthService] Error deleting user ${userId}:`, error);
        throw error;
    }
}
