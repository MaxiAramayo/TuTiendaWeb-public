import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function getServerSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return null;
    }

    try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);

        // Fetch user data to get storeId (since custom claims might not be set)
        const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
        const userData = userDoc.data();
        const storeId = userData?.storeIds?.[0] || null;

        return {
            userId: decodedClaims.uid,
            storeId: storeId,
            role: userData?.role || 'owner',
        };
    } catch (error) {
        return null;
    }
}
