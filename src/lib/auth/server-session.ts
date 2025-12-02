import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export interface ServerSession {
    userId: string;
    email: string;
    storeId?: string;
    role: 'user' | 'owner' | 'admin';
}

/**
 * Obtener sesión del usuario en el servidor
 * 
 * Verifica el cookie 'idToken' y decodifica el token usando Firebase Admin SDK.
 * Retorna null si no hay token o es inválido.
 * 
 * @returns ServerSession | null
 */
export async function getServerSession(): Promise<ServerSession | null> {
    const cookieStore = await cookies();
    const idToken = cookieStore.get('idToken')?.value;

    if (!idToken) return null;

    try {
        // Verificar token y chequear revocación
        const decodedToken = await adminAuth.verifyIdToken(idToken, true);

        // Opcional: Obtener datos frescos del usuario si se necesita más info
        // const user = await adminAuth.getUser(decodedToken.uid);

        return {
            userId: decodedToken.uid,
            email: decodedToken.email || '',
            storeId: decodedToken.storeId as string | undefined,
            role: (decodedToken.role as 'user' | 'owner' | 'admin') || 'user',
        };
    } catch (error) {
        // Token inválido, expirado o revocado
        return null;
    }
}
