/**
 * Helpers para tests contra emuladores de Firebase.
 *
 * Dos clientes distintos según la capa de test:
 *  - Admin SDK (`getAdminApp`/`adminDb`/`adminAuth`): para tests de INTEGRACIÓN
 *    (Fase 2). El Admin SDK ignora las security rules, por eso sirve para
 *    sembrar/leer datos arbitrarios.
 *  - rules-unit-testing (`getRulesTestEnv`): para tests de REGLAS (Fase 3),
 *    que evalúan `firestore.rules`/`storage.rules` con contextos autenticados
 *    y anónimos.
 *
 * Ver docs/test/20-integration-guide.md y docs/test/30-rules-audit-guide.md.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import admin from 'firebase-admin';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

export const TEST_PROJECT_ID = 'demo-tutiendaweb';
export const ROOT = process.cwd();

/* ------------------------------------------------------------------ */
/* Admin SDK (integración)                                            */
/* ------------------------------------------------------------------ */

let adminApp: admin.app.App | undefined;

export function getAdminApp(): admin.app.App {
  if (!adminApp) {
    adminApp =
      admin.apps.length > 0 && admin.apps[0]
        ? admin.apps[0]
        : admin.initializeApp({
            projectId: TEST_PROJECT_ID,
            storageBucket: `${TEST_PROJECT_ID}.appspot.com`,
          });
  }
  return adminApp;
}

export const adminDb = (): admin.firestore.Firestore => getAdminApp().firestore();
export const adminAuth = (): admin.auth.Auth => getAdminApp().auth();

/**
 * Borra TODOS los documentos de una colección (y subcolecciones recursivas).
 * Útil en `beforeEach`/`afterEach` para aislar suites de integración.
 */
export async function clearFirestore(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
  // Endpoint de borrado masivo del emulador de Firestore.
  const url = `http://${host}/emulator/v1/projects/${TEST_PROJECT_ID}/databases/(default)/documents`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`No se pudo limpiar Firestore emulado (${res.status})`);
  }
}

/** Borra todos los usuarios del emulador de Auth. */
export async function clearAuth(): Promise<void> {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
  const url = `http://${host}/emulator/v1/projects/${TEST_PROJECT_ID}/accounts`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`No se pudo limpiar Auth emulado (${res.status})`);
  }
}

/* ------------------------------------------------------------------ */
/* rules-unit-testing (reglas)                                        */
/* ------------------------------------------------------------------ */

let rulesEnv: RulesTestEnvironment | undefined;

export async function getRulesTestEnv(): Promise<RulesTestEnvironment> {
  if (!rulesEnv) {
    rulesEnv = await initializeTestEnvironment({
      projectId: TEST_PROJECT_ID,
      firestore: {
        rules: readFileSync(join(ROOT, 'firestore.rules'), 'utf8'),
        host: '127.0.0.1',
        port: 8080,
      },
      storage: {
        rules: readFileSync(join(ROOT, 'storage.rules'), 'utf8'),
        host: '127.0.0.1',
        port: 9199,
      },
    });
  }
  return rulesEnv;
}

export async function cleanupRulesTestEnv(): Promise<void> {
  if (rulesEnv) {
    await rulesEnv.cleanup();
    rulesEnv = undefined;
  }
}
