/**
 * User Service - Firebase Admin SDK
 * 
 * ⚠️  IMPORTANTE: Este servicio SOLO se usa en el servidor
 * - Server Actions ✅
 * - Server Components ✅
 * - API Routes ✅
 * - Client Components ❌
 * 
 * Operaciones:
 * - CRUD de usuarios en Firestore
 * - Google OAuth user handler
 * - Email existence check
 * 
 * Collection: 'users'
 * Document ID: Firebase Auth UID
 * 
 * @module features/user/services/user.service
 * @see https://firebase.google.com/docs/firestore/server/manage-data-with-admin
 */

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { cleanForFirestore } from '@/lib/utils/firestore';
import * as admin from 'firebase-admin';

// ============================================================================
// CONSTANTS
// ============================================================================

const USERS_COLLECTION = 'users';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateUserData {
    email: string;
    displayName: string;
    phone?: string;
    photoURL?: string;
    role?: 'user' | 'owner' | 'admin';
}

export interface UpdateUserData {
    displayName?: string;
    phone?: string;
    photoURL?: string;
    storeId?: string;
    role?: 'user' | 'owner' | 'admin';
}

export interface FirestoreUser {
    id: string;
    email: string;
    displayName: string;
    phone?: string;
    photoURL?: string;
    role: string;
    storeId?: string;
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Crear usuario en Firestore
 * 
 * ⚠️  PREREQUISITO: Usuario debe existir en Firebase Auth antes
 * 
 * Flujo correcto:
 * 1. adminAuth.createUser() → Crea en Firebase Auth
 * 2. createUserInFirestore() → Crea en Firestore
 * 
 * @param userId - UID del usuario en Firebase Auth
 * @param data - Datos del usuario
 * 
 * @throws {Error} Si falla la escritura en Firestore
 * 
 * @example
 * ```typescript
 * // En Server Action:
 * const userRecord = await adminAuth.createUser({
 *   email: 'user@test.com',
 *   password: 'password123'
 * });
 * 
 * await createUserInFirestore(userRecord.uid, {
 *   email: 'user@test.com',
 *   displayName: 'John Doe',
 *   role: 'user'
 * });
 * ```
 */
export async function createUserInFirestore(
    userId: string,
    data: CreateUserData
): Promise<void> {
    const cleanData = cleanForFirestore({
        email: data.email,
        displayName: data.displayName,
        phone: data.phone,
        photoURL: data.photoURL,
        role: data.role || 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await adminDb
        .collection(USERS_COLLECTION)
        .doc(userId)
        .set(cleanData);

    console.log(`[UserService] Created user in Firestore: ${userId}`);
}

// ============================================================================
// READ
// ============================================================================

/**
 * Obtener usuario de Firestore por ID
 * 
 * @param userId - UID del usuario
 * @returns User data o null si no existe
 * 
 * @example
 * ```typescript
 * const user = await getUserFromFirestore('abc123');
 * if (user) {
 *   console.log(user.displayName);
 * } else {
 *   console.log('Usuario no encontrado');
 * }
 * ```
 */
export async function getUserFromFirestore(
    userId: string
): Promise<FirestoreUser | null> {
    try {
        const doc = await adminDb
            .collection(USERS_COLLECTION)
            .doc(userId)
            .get();

        if (!doc.exists) {
            console.log(`[UserService] User not found in Firestore: ${userId}`);
            return null;
        }

        return {
            id: doc.id,
            ...doc.data()
        } as FirestoreUser;
    } catch (error) {
        console.error(`[UserService] Error getting user ${userId}:`, error);
        throw error;
    }
}

/**
 * Verificar si un email ya existe en Firestore
 * 
 * Útil antes de crear usuario para prevenir duplicados
 * 
 * @param email - Email a verificar (case-insensitive)
 * @returns true si existe, false si no
 * 
 * @example
 * ```typescript
 * const exists = await emailExistsInFirestore('user@test.com');
 * if (exists) {
 *   return { error: 'Email ya registrado' };
 * }
 * ```
 */
export async function emailExistsInFirestore(email: string): Promise<boolean> {
    try {
        const snapshot = await adminDb
            .collection(USERS_COLLECTION)
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();

        return !snapshot.empty;
    } catch (error) {
        console.error('[UserService] Error checking email existence:', error);
        throw error;
    }
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Actualizar usuario en Firestore
 * 
 * Update parcial: solo campos proporcionados
 * 
 * @param userId - UID del usuario
 * @param data - Datos a actualizar (parcial)
 * 
 * @throws {Error} Si el usuario no existe o falla la actualización
 * 
 * @example
 * ```typescript
 * await updateUserInFirestore('abc123', {
 *   displayName: 'Jane Doe',
 *   phone: '+5491123456789'
 * });
 * // Solo actualiza displayName y phone, otros campos no cambian
 * ```
 */
export async function updateUserInFirestore(
    userId: string,
    data: UpdateUserData
): Promise<void> {
    try {
        const cleanData = cleanForFirestore({
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await adminDb
            .collection(USERS_COLLECTION)
            .doc(userId)
            .update(cleanData);

        console.log(`[UserService] Updated user in Firestore: ${userId}`);
    } catch (error) {
        console.error(`[UserService] Error updating user ${userId}:`, error);
        throw error;
    }
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Eliminar usuario de Firestore
 * 
 * ⚠️  IMPORTANTE: Esto NO elimina el usuario de Firebase Auth
 * Debes llamar a adminAuth.deleteUser(userId) por separado
 * 
 * @param userId - UID del usuario
 * 
 * @example
 * ```typescript
 * // Eliminar completamente un usuario:
 * await deleteUserFromFirestore(userId);  // Firestore
 * await adminAuth.deleteUser(userId);     // Firebase Auth
 * ```
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
    try {
        await adminDb
            .collection(USERS_COLLECTION)
            .doc(userId)
            .delete();

        console.log(`[UserService] Deleted user from Firestore: ${userId}`);
    } catch (error) {
        console.error(`[UserService] Error deleting user ${userId}:`, error);
        throw error;
    }
}

// ============================================================================
// GOOGLE OAUTH
// ============================================================================

/**
 * Obtener o crear usuario desde Google OAuth
 * 
 * Flujo:
 * 1. Si usuario existe → actualizar foto/nombre si cambió
 * 2. Si no existe → crear nuevo usuario
 * 
 * @param decodedToken - Token decodificado de Google (ya verificado con Admin SDK)
 * @returns Datos básicos del usuario
 * 
 * @throws {Error} Si el token no tiene email
 * 
 * @example
 * ```typescript
 * // En Server Action:
 * const decodedToken = await adminAuth.verifyIdToken(idToken);
 * const user = await getOrCreateUserFromGoogle(decodedToken);
 * 
 * console.log(user.id);           // Firebase Auth UID
 * console.log(user.email);        // Email de Google
 * console.log(user.displayName);  // Nombre de Google
 * console.log(user.photoURL);     // Avatar de Google
 * ```
 */
export async function getOrCreateUserFromGoogle(
    decodedToken: admin.auth.DecodedIdToken
): Promise<{
    id: string;
    email: string;
    displayName: string;
    photoURL: string;
}> {
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
        throw new Error('[UserService] Email not provided by Google OAuth');
    }

    try {
        // Verificar si existe en Firestore
        const existingUser = await getUserFromFirestore(uid);

        if (existingUser) {
            // Usuario existe: actualizar foto/nombre si cambió
            const needsUpdate =
                (name && name !== existingUser.displayName) ||
                (picture && picture !== existingUser.photoURL);

            if (needsUpdate) {
                await updateUserInFirestore(uid, {
                    displayName: name || existingUser.displayName,
                    photoURL: picture || existingUser.photoURL,
                });

                console.log(`[UserService] Updated user from Google OAuth: ${uid}`);
            }

            return {
                id: uid,
                email: existingUser.email,
                displayName: name || existingUser.displayName,
                photoURL: picture || existingUser.photoURL || '',
            };
        }

        // Usuario NO existe: crear nuevo
        const displayName = name || email.split('@');

        await createUserInFirestore(uid, {
            email,
            displayName,
            photoURL: picture,
            role: 'user',
        });

        console.log(`[UserService] Created user from Google OAuth: ${uid}`);

        return {
            id: uid,
            email,
            displayName,
            photoURL: picture || '',
        };
    } catch (error) {
        console.error('[UserService] Error in getOrCreateUserFromGoogle:', error);
        throw error;
    }
}
