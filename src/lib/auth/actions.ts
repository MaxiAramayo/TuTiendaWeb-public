'use server';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export async function createSession(idToken: string) {
    try {
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const cookieStore = await cookies();
        cookieStore.set('session', sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return { success: true };
    } catch (error) {
        console.error('Error creating session cookie:', error);
        return { success: false, error: 'Failed to create session' };
    }
}

export async function deleteSession() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('session');
        return { success: true };
    } catch (error) {
        console.error('Error deleting session cookie:', error);
        return { success: false, error: 'Failed to delete session' };
    }
}
