import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// ============================================================================
// CONSTANTS
// ============================================================================

const COOKIE_NAME = 'session';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Session del servidor (con custom claims)
 * Retornado por getServerSession()
 */
export interface ServerSession {
    userId: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    emailVerified: boolean;
    
    // Custom Claims (desde token JWT o Firestore fallback)
    storeId: string | null;
    role: 'owner' | 'admin' | 'employee' | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Buscar storeId en Firestore cuando no está en custom claims
 * Fallback para usuarios que existían antes de la migración a claims
 */
async function findStoreIdByOwnerId(userId: string): Promise<string | null> {
    try {
        const storesRef = adminDb.collection('stores');
        const snapshot = await storesRef.where('ownerId', '==', userId).limit(1).get();
        
        if (snapshot.empty) {
            return null;
        }
        
        return snapshot.docs[0].id;
    } catch (error) {
        console.error('[getServerSession] Error fetching storeId from Firestore:', error);
        return null;
    }
}

// ============================================================================
// SERVER SESSION
// ============================================================================

/**
 * Obtener sesión del usuario en el servidor
 * 
 * Verifica el cookie 'session' y decodifica el token usando Firebase Admin SDK.
 * Retorna null si no hay token o es inválido.
 * 
 * Si storeId no está en custom claims, busca en Firestore (fallback para migración)
 * 
 * @returns ServerSession | null
 */
export async function getServerSession(): Promise<ServerSession | null> {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionToken) return null;

    try {
        // Verificar token y chequear revocación
        const decodedToken = await adminAuth.verifyIdToken(sessionToken, true);

        // Obtener datos frescos del usuario para displayName y photoURL
        const user = await adminAuth.getUser(decodedToken.uid);

        // Obtener storeId de claims o buscar en Firestore (fallback)
        let storeId = (decodedToken.storeId as string) || null;
        
        if (!storeId) {
            // Fallback: buscar en Firestore para usuarios sin claims
            storeId = await findStoreIdByOwnerId(decodedToken.uid);
        }

        return {
            userId: decodedToken.uid,
            email: decodedToken.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || null,
            emailVerified: decodedToken.email_verified || false,
            
            // Custom Claims (o fallback de Firestore)
            storeId,
            role: (decodedToken.role as 'owner' | 'admin' | 'employee') || null,
        };
    } catch (error) {
        // Token inválido, expirado o revocado
        console.error('[getServerSession] Error:', error);
        return null;
    }
}
