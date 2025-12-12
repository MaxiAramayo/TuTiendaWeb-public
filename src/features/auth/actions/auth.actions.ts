/**
 * Auth Server Actions
 * 
 * Acciones del servidor para autenticación usando Next.js Server Actions
 * 
 * Patrón Híbrido:
 * - Client SDK verifica credenciales (loginAction recibe idToken ya validado)
 * - Server Actions crean/eliminan cookies httpOnly
 * - Admin SDK para operaciones de backend (crear usuario, custom claims)
 * 
 * @module features/auth/actions/auth.actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase/admin';
import { createUserInFirestore } from '@/features/user/services/user.service';
import { createStore } from '@/features/store/services/store.service';
import { setUserClaims, revokeUserTokens } from '@/features/auth/services/server/auth.service';
import { loginSchema } from '@/features/auth/schemas/login.schema';
import { registerServerSchema } from '@/features/auth/schemas/register.schema';
import { resetPasswordSchema } from '@/features/auth/schemas/reset-password.schema';
import { completeRegistrationSchema } from '@/features/auth/schemas/complete-registration.schema';
import type { StoreType } from '@/features/auth/schemas/store-setup.schema';

// ============================================================================
// TYPES
// ============================================================================

type ActionResponse<T = unknown> =
    | { success: true; data: T }
    | { success: false; errors: Record<string, string[]> };

// ============================================================================
// COOKIE HELPERS
// ============================================================================

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

async function setSessionCookie(idToken: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, idToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
    });
}

async function deleteSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

// ============================================================================
// LOGIN ACTION
// ============================================================================

/**
 * Login Action - Crear sesión después de auth con Client SDK
 * 
 * ⚠️  IMPORTANTE: Este action NO verifica credenciales
 * Las credenciales ya fueron verificadas por hybridLogin() usando Client SDK
 * 
 * Flujo:
 * 1. Recibe idToken (ya autenticado por Client SDK)
 * 2. Verifica idToken con Admin SDK
 * 3. Crea cookie httpOnly con el token
 * 4. Retorna success
 * 
 * @param prevState - Estado previo (no usado, requerido por useFormState)
 * @param formData - FormData con email, password, idToken
 * @returns ActionResponse con userId
 */
export async function loginAction(
    prevState: any,
    formData: FormData
): Promise<ActionResponse<{ userId: string }>> {
    try {
        // 1. PARSE FormData
        const rawData = {
            email: formData.get('email'),
            password: formData.get('password'),
            idToken: formData.get('idToken'),
        };

        // 2. VALIDATE
        const validation = loginSchema.safeParse({
            email: rawData.email,
            password: rawData.password,
        });

        if (!validation.success) {
            return {
                success: false,
                errors: validation.error.flatten().fieldErrors,
            };
        }

        const idToken = rawData.idToken as string;

        if (!idToken) {
            return {
                success: false,
                errors: { _form: ['Token de autenticación requerido'] },
            };
        }

        // 3. VERIFY TOKEN
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // 4. SET COOKIE
        await setSessionCookie(idToken);

        console.log(`[LoginAction] Session created for user: ${decodedToken.uid}`);

        // 5. REVALIDATE
        revalidatePath('/dashboard');

        // 6. RETURN SUCCESS
        return {
            success: true,
            data: { userId: decodedToken.uid },
        };
    } catch (error: any) {
        console.error('[LoginAction] Error:', error);

        return {
            success: false,
            errors: { _form: ['Error al crear sesión. Intenta nuevamente.'] },
        };
    }
}

// ============================================================================
// CREATE SESSION ACTION (for OAuth flows)
// ============================================================================

/**
 * Create Session Action - Crear sesión directamente desde idToken
 * 
 * Usado por Google OAuth y otros flujos donde ya tenemos idToken
 * Sin validación de email/password (ya autenticado por OAuth provider)
 * 
 * @param idToken - ID token de Firebase Auth
 * @returns ActionResponse con userId
 */
export async function createSessionAction(
    idToken: string
): Promise<ActionResponse<{ userId: string }>> {
    try {
        // 1. VERIFY TOKEN
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // 2. SET COOKIE
        await setSessionCookie(idToken);

        console.log(`[CreateSessionAction] Session created for user: ${decodedToken.uid}`);

        // 3. RETURN SUCCESS
        return {
            success: true,
            data: { userId: decodedToken.uid },
        };
    } catch (error: any) {
        console.error('[CreateSessionAction] Error:', error);

        return {
            success: false,
            errors: { _form: ['Error al crear sesión. Intenta nuevamente.'] },
        };
    }
}

// ============================================================================
// REGISTER ACTION
// ============================================================================

/**
 * Register Action - Crear cuenta de usuario
 * 
 * Flujo:
 * 1. Validar datos
 * 2. Crear usuario en Firebase Auth (Admin SDK)
 * 3. Crear documento en Firestore
 * 4. Retornar userId (hybridRegister hará el login)
 * 
 * @param prevState - Estado previo
 * @param formData - FormData con email, password, displayName
 * @returns ActionResponse con userId
 */
export async function registerAction(
    prevState: any,
    formData: FormData
): Promise<ActionResponse<{ userId: string }>> {
    try {
        // 1. PARSE FormData
        const rawData = {
            email: formData.get('email'),
            password: formData.get('password'),
            displayName: formData.get('displayName'),
        };

        // 2. VALIDATE
        const validation = registerServerSchema.safeParse(rawData);

        if (!validation.success) {
            return {
                success: false,
                errors: validation.error.flatten().fieldErrors,
            };
        }

        const { email, password, displayName } = validation.data;

        // 3. CREATE USER IN FIREBASE AUTH
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName,
        });

        console.log(`[RegisterAction] User created in Auth: ${userRecord.uid}`);

        // 4. CREATE USER IN FIRESTORE
        await createUserInFirestore(userRecord.uid, {
            email,
            displayName,
            role: 'user', // Sin tienda todavía
        });

        console.log(`[RegisterAction] User created in Firestore: ${userRecord.uid}`);

        // 5. RETURN SUCCESS (hybridRegister hará el login)
        return {
            success: true,
            data: { userId: userRecord.uid },
        };
    } catch (error: any) {
        console.error('[RegisterAction] Error:', error);

        // Errores específicos
        if (error.code === 'auth/email-already-exists') {
            return {
                success: false,
                errors: { email: ['Este email ya está registrado'] },
            };
        }

        if (error.code === 'auth/invalid-email') {
            return {
                success: false,
                errors: { email: ['Formato de email inválido'] },
            };
        }

        if (error.code === 'auth/weak-password') {
            return {
                success: false,
                errors: { password: ['La contraseña es muy débil'] },
            };
        }

        return {
            success: false,
            errors: { _form: ['Error al crear cuenta. Intenta nuevamente.'] },
        };
    }
}

// ============================================================================
// COMPLETE REGISTRATION ACTION
// ============================================================================

/**
 * Complete Registration Action - Completar perfil y crear tienda
 * 
 * Usado después de registro básico o Google OAuth
 * 
 * Flujo:
 * 1. Validar datos de perfil + tienda
 * 2. Crear tienda
 * 3. Actualizar custom claims (storeId, role: owner)
 * 4. Revocar tokens para aplicar claims
 * 5. Retornar storeId
 * 
 * @param prevState - Estado previo
 * @param formData - FormData con displayName, phone, storeName, storeType, etc
 * @returns ActionResponse con storeId
 */
export async function completeRegistrationAction(
    prevState: any,
    formData: FormData
): Promise<ActionResponse<{ storeId: string }>> {
    try {
        // 1. AUTH CHECK
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(COOKIE_NAME);

        if (!sessionCookie) {
            return {
                success: false,
                errors: { _form: ['No autenticado'] },
            };
        }

        const decodedToken = await adminAuth.verifyIdToken(sessionCookie.value);
        const userId = decodedToken.uid;

        // 2. PARSE FormData
        const rawData = {
            displayName: formData.get('displayName'),
            phone: formData.get('phone'),
            storeName: formData.get('storeName'),
            storeType: formData.get('storeType'),
            address: formData.get('address'),
        };

        // 3. VALIDATE
        const validation = completeRegistrationSchema.safeParse(rawData);

        if (!validation.success) {
            return {
                success: false,
                errors: validation.error.flatten().fieldErrors,
            };
        }

        const { storeName, storeType, address, phone } = validation.data;

        // 4. CREATE STORE
        const store = await createStore({
            storeName,
            storeType: storeType as StoreType,
            address,
            phone,
            ownerId: userId,
        });

        console.log(`[CompleteRegistrationAction] Store created: ${store.id}`);

        // 5. UPDATE CUSTOM CLAIMS
        await setUserClaims(userId, {
            storeId: store.id,
            role: 'owner',
        });

        console.log(`[CompleteRegistrationAction] Custom claims set for user: ${userId}`);

        // 6. REVOKE TOKENS (para aplicar claims inmediatamente)
        await revokeUserTokens(userId);

        console.log(`[CompleteRegistrationAction] Tokens revoked for user: ${userId}`);

        // 7. REVALIDATE
        revalidatePath('/dashboard');

        // 8. RETURN SUCCESS
        return {
            success: true,
            data: { storeId: store.id },
        };
    } catch (error: any) {
        console.error('[CompleteRegistrationAction] Error:', error);

        return {
            success: false,
            errors: { _form: ['Error al completar registro. Intenta nuevamente.'] },
        };
    }
}

// ============================================================================
// LOGOUT ACTION
// ============================================================================

/**
 * Logout Action - Cerrar sesión
 * 
 * Flujo:
 * 1. Eliminar cookie de sesión
 * 2. Revalidar cache
 * 3. Redirect a home
 */
export async function logoutAction(): Promise<void> {
    try {
        await deleteSessionCookie();

        console.log('[LogoutAction] Session cookie deleted');

        revalidatePath('/');
    } catch (error) {
        console.error('[LogoutAction] Error:', error);
    }

    redirect('/');
}

/**
 * Clear Session Action - Limpiar sesión sin redirección
 * 
 * Usado por AuthSyncProvider para limpiar la sesión sin redirigir
 * (útil cuando el usuario ya está en una página pública)
 */
export async function clearSessionAction(): Promise<void> {
    try {
        await deleteSessionCookie();
        console.log('[ClearSessionAction] Session cookie deleted');
        revalidatePath('/');
    } catch (error) {
        console.error('[ClearSessionAction] Error:', error);
    }
}

// ============================================================================
// RESET PASSWORD ACTION
// ============================================================================

/**
 * Reset Password Action - Enviar email de recuperación
 * 
 * ⚠️  IMPORTANTE: Solo genera el link, NO lo envía
 * Firebase Admin SDK NO puede enviar emails directamente
 * Debes configurar Firebase Email Templates
 * 
 * @param prevState - Estado previo
 * @param formData - FormData con email
 * @returns ActionResponse vacío
 */
export async function resetPasswordAction(
    prevState: any,
    formData: FormData
): Promise<ActionResponse<null>> {
    try {
        // 1. PARSE FormData
        const rawData = {
            email: formData.get('email'),
        };

        // 2. VALIDATE
        const validation = resetPasswordSchema.safeParse(rawData);

        if (!validation.success) {
            return {
                success: false,
                errors: validation.error.flatten().fieldErrors,
            };
        }

        const { email } = validation.data;

        // 3. GENERATE RESET LINK
        const resetLink = await adminAuth.generatePasswordResetLink(email);

        console.log(`[ResetPasswordAction] Reset link generated for: ${email}`);
        console.log(`[ResetPasswordAction] Link: ${resetLink}`);

        // TODO: Enviar email con el link (usando SendGrid, Resend, etc)
        // Por ahora solo lo logueamos

        // 4. RETURN SUCCESS
        return {
            success: true,
            data: null,
        };
    } catch (error: any) {
        console.error('[ResetPasswordAction] Error:', error);

        if (error.code === 'auth/user-not-found') {
            // Por seguridad, no revelamos si el email existe o no
            return {
                success: true,
                data: null,
            };
        }

        return {
            success: false,
            errors: { _form: ['Error al enviar email. Intenta nuevamente.'] },
        };
    }
}

// ============================================================================
// SYNC TOKEN ACTION
// ============================================================================

/**
 * Sync Token Action - Sincronizar token de Firebase con cookie de sesión
 * 
 * Usado por AuthProvider cuando detecta cambios en el estado de auth
 * (ej: después de actualizar custom claims)
 * 
 * NOTA: Reemplaza el endpoint /api/auth/sync-token
 * Seguimos el patrón de Server Actions en lugar de API Routes
 * 
 * @param idToken - ID token de Firebase Auth
 * @returns ActionResponse vacío
 */
export async function syncTokenAction(
    idToken: string
): Promise<ActionResponse<null>> {
    try {
        if (!idToken) {
            return {
                success: false,
                errors: { _form: ['Token requerido'] },
            };
        }

        // 1. VERIFY TOKEN
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // 2. UPDATE COOKIE
        await setSessionCookie(idToken);

        console.log(`[SyncTokenAction] Token synced for user: ${decodedToken.uid}`);

        // 3. RETURN SUCCESS
        return {
            success: true,
            data: null,
        };
    } catch (error: any) {
        console.error('[SyncTokenAction] Error:', error);

        return {
            success: false,
            errors: { _form: ['Error al sincronizar token'] },
        };
    }
}

// ============================================================================
// CHECK SLUG AVAILABILITY ACTION
// ============================================================================

/**
 * Check Slug Availability Action - Verificar si un slug está disponible
 * 
 * Usado durante el registro para validar el nombre único de la tienda
 * 
 * @param slug - Slug a verificar
 * @returns ActionResponse con isAvailable
 */
export async function checkSlugAvailabilityAction(
    slug: string
): Promise<ActionResponse<{ isAvailable: boolean }>> {
    try {
        // 1. VALIDATE FORMAT
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slug || !slugRegex.test(slug) || slug.length < 3 || slug.length > 50) {
            return {
                success: false,
                errors: { _form: ['Formato de slug inválido'] },
            };
        }

        // 2. CHECK IN FIRESTORE using Admin SDK
        const { adminDb } = await import('@/lib/firebase/admin');
        const storesQuery = adminDb
            .collection('stores')
            .where('basicInfo.slug', '==', slug)
            .limit(1);
        
        const querySnapshot = await storesQuery.get();
        const isAvailable = querySnapshot.empty;

        console.log(`[CheckSlugAvailabilityAction] Slug "${slug}" available: ${isAvailable}`);

        // 3. RETURN SUCCESS
        return {
            success: true,
            data: { isAvailable },
        };
    } catch (error: any) {
        console.error('[CheckSlugAvailabilityAction] Error:', error);

        return {
            success: false,
            errors: { _form: ['Error al verificar disponibilidad'] },
        };
    }
}
