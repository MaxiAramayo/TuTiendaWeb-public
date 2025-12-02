/**
 * Hybrid Login Helpers
 * 
 * Combina Firebase Client SDK (autenticación) con Server Actions (sesión)
 * 
 * ¿Por qué híbrido?
 * - Firebase Admin SDK NO puede verificar contraseñas
 * - Client SDK puede autenticar, pero no crear cookies httpOnly
 * - Solución: Auth en cliente + Sesión en servidor
 * 
 * Flujo:
 * 1. Cliente: signInWithEmailAndPassword() → idToken
 * 2. Servidor: verifyIdToken() + crear cookie httpOnly
 * 
 * ⚠️  Este archivo es 'use client' porque usa Firebase Client SDK
 * 
 * @module features/auth/lib/hybrid-login
 */

'use client';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { loginAction } from '../actions/auth.actions';

// ============================================================================
// TYPES
// ============================================================================

interface HybridResponse {
    success: boolean;
    data?: { userId: string };
    errors?: Record<string, string[]>;
}

// ============================================================================
// HYBRID LOGIN
// ============================================================================

/**
 * Login híbrido: Client SDK para auth + Server Action para sesión
 * 
 * Flujo completo:
 * 1. Autentica con Firebase Client SDK (verifica credenciales)
 * 2. Obtiene idToken del usuario autenticado
 * 3. Envía idToken a Server Action
 * 4. Server Action crea cookie httpOnly
 * 
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @returns Response con success/error
 * 
 * @example
 * ```typescript
 * // En LoginForm.tsx:
 * const result = await hybridLogin('user@test.com', 'password123');
 * 
 * if (result.success) {
 *   router.push('/dashboard');
 * } else {
 *   toast.error(result.errors._form[0]);
 * }
 * ```
 */
export async function hybridLogin(
    email: string,
    password: string
): Promise<HybridResponse> {
    try {
        // 1. Autenticar con Client SDK
        console.log('[HybridLogin] Authenticating with Firebase Client SDK...');

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        // 2. Obtener ID token
        console.log('[HybridLogin] Getting ID token...');

        const idToken = await userCredential.user.getIdToken();

        // 3. Crear sesión en servidor
        console.log('[HybridLogin] Creating server session...');

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('idToken', idToken);

        const result = await loginAction(null, formData);

        if (result.success) {
            console.log('[HybridLogin] Login successful');
        } else {
            console.error('[HybridLogin] Server session failed:', result.errors);
        }

        return result;
    } catch (error: any) {
        console.error('[HybridLogin] Error:', error);

        // Errores específicos de Firebase
        if (error.code === 'auth/wrong-password') {
            return {
                success: false,
                errors: { _form: ['Contraseña incorrecta'] },
            };
        }

        if (error.code === 'auth/user-not-found') {
            return {
                success: false,
                errors: { _form: ['No existe una cuenta con este email'] },
            };
        }

        if (error.code === 'auth/too-many-requests') {
            return {
                success: false,
                errors: { _form: ['Demasiados intentos. Intenta más tarde.'] },
            };
        }

        if (error.code === 'auth/user-disabled') {
            return {
                success: false,
                errors: { _form: ['Esta cuenta ha sido desactivada'] },
            };
        }

        if (error.code === 'auth/invalid-credential') {
            return {
                success: false,
                errors: { _form: ['Credenciales inválidas'] },
            };
        }

        // Error genérico
        return {
            success: false,
            errors: { _form: ['Error al iniciar sesión. Intenta nuevamente.'] },
        };
    }
}

// ============================================================================
// HYBRID REGISTER
// ============================================================================

/**
 * Registro híbrido: Después de que Server Action crea cuenta
 * 
 * Usado después de registerAction() para autenticar al usuario
 * y crear la sesión
 * 
 * Flujo:
 * 1. registerAction() ya creó el usuario en Firebase Auth
 * 2. Esta función autentica al usuario recién creado
 * 3. Obtiene idToken
 * 4. Crea sesión con loginAction()
 * 
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @returns Response con success/error
 * 
 * @example
 * ```typescript
 * // En RegisterForm.tsx:
 * // 1. Crear cuenta
 * const registerResult = await registerAction(formData);
 * 
 * if (registerResult.success) {
 *   // 2. Auto-login
 *   const loginResult = await hybridRegister(email, password);
 *   
 *   if (loginResult.success) {
 *     router.push('/auth/complete-profile');
 *   }
 * }
 * ```
 */
export async function hybridRegister(
    email: string,
    password: string
): Promise<HybridResponse> {
    try {
        console.log('[HybridRegister] Auto-login after registration...');

        // Autenticar con las credenciales recién creadas
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        // Obtener token
        const idToken = await userCredential.user.getIdToken();

        // Crear sesión
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('idToken', idToken);

        const result = await loginAction(null, formData);

        if (result.success) {
            console.log('[HybridRegister] Auto-login successful');
        } else {
            console.error('[HybridRegister] Auto-login failed:', result.errors);
        }

        return result;
    } catch (error: any) {
        console.error('[HybridRegister] Error:', error);

        return {
            success: false,
            errors: {
                _form: ['Cuenta creada pero error al iniciar sesión. Por favor inicia sesión manualmente.']
            },
        };
    }
}

// ============================================================================
// REFRESH TOKEN
// ============================================================================

/**
 * Refrescar token actual del usuario
 * 
 * Útil después de actualizar custom claims
 * 
 * @returns Nuevo idToken o null si no hay usuario
 * 
 * @example
 * ```typescript
 * // Después de completeRegistrationAction():
 * const newToken = await refreshCurrentToken();
 * 
 * if (newToken) {
 *   // Actualizar cookie con nuevo token
 *   await fetch('/api/auth/sync-token', {
 *     method: 'POST',
 *     body: JSON.stringify({ idToken: newToken })
 *   });
 * }
 * ```
 */
export async function refreshCurrentToken(): Promise<string | null> {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.log('[RefreshToken] No current user');
            return null;
        }

        console.log('[RefreshToken] Refreshing token...');

        const idToken = await currentUser.getIdToken(true); // Force refresh

        console.log('[RefreshToken] Token refreshed');

        return idToken;
    } catch (error) {
        console.error('[RefreshToken] Error:', error);
        return null;
    }
}
