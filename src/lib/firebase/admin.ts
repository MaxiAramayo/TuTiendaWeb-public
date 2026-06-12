import * as admin from 'firebase-admin';

/**
 * Inicialización del Admin SDK.
 *
 * - Modo emulador: si está `FIRESTORE_EMULATOR_HOST` (lo setea el .env.local al usar
 *   los emuladores), inicializa con un projectId demo SIN credenciales reales.
 *   El SDK enruta Firestore/Auth/Storage al emulador automáticamente vía las
 *   variables `*_EMULATOR_HOST`.
 * - Modo normal: usa el service account real desde las variables privadas.
 */
const useEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

if (!admin.apps.length) {
    if (useEmulator) {
        admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID || 'demo-tutiendaweb',
            storageBucket:
                process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-tutiendaweb.appspot.com',
        });
    } else {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID!,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
