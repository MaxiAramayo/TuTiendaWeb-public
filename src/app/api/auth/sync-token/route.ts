/**
 * Sync Token API Route
 * 
 * Endpoint para sincronizar el token de Firebase con la cookie de sesión
 * 
 * Usado por AuthProvider cuando detecta cambios en el estado de auth
 * 
 * @module app/api/auth/sync-token/route
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'Token requerido' },
                { status: 400 }
            );
        }

        // Verificar token
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // Actualizar cookie
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, idToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });

        console.log(`[SyncToken] Token synced for user: ${decodedToken.uid}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[SyncToken] Error:', error);

        return NextResponse.json(
            { error: 'Error al sincronizar token' },
            { status: 500 }
        );
    }
}
