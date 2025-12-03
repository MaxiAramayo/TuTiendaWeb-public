import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

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
    
    // Custom Claims (desde token JWT)
    storeId: string | null;
    role: 'owner' | 'admin' | 'employee' | null;
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

        return {
            userId: decodedToken.uid,
            email: decodedToken.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || null,
            emailVerified: decodedToken.email_verified || false,
            
            // Custom Claims
            storeId: (decodedToken.storeId as string) || null,
            role: (decodedToken.role as 'owner' | 'admin' | 'employee') || null,
        };
    } catch (error) {
        // Token inválido, expirado o revocado
        return null;
    }
}
