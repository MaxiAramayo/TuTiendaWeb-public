import { cookies } from 'next/headers';

const COOKIE_NAME = 'idToken';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 5; // 5 días

/**
 * Setear cookie de sesión
 * 
 * @param idToken - Token JWT de Firebase
 */
export async function setSessionCookie(idToken: string) {
    const cookieStore = await cookies();

    cookieStore.set(COOKIE_NAME, idToken, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
    });
}

/**
 * Eliminar cookie de sesión
 */
export async function removeSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

/**
 * Obtener token de sesión raw
 */
export async function getSessionToken() {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value;
}
