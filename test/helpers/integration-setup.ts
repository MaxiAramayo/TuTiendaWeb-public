/**
 * Setup para tests de integración / reglas (Fases 2 y 3).
 *
 * Fija las variables de entorno de los emuladores ANTES de que cualquier test
 * importe firebase-admin. Sin esto, el Admin SDK intentaría conectarse a
 * Firebase de producción. Es la primera línea de defensa del criterio de
 * aceptación "nunca toca producción" (docs/test/03-acceptance-criteria.md).
 */
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= '127.0.0.1:9199';
process.env.GCLOUD_PROJECT ||= 'demo-tutiendaweb';
process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR ||= 'true';

// Guardarraíl explícito: si por error se apunta a un proyecto real, abortar.
if (!process.env.GCLOUD_PROJECT.startsWith('demo-')) {
  throw new Error(
    `[integration-setup] GCLOUD_PROJECT="${process.env.GCLOUD_PROJECT}" no es un proyecto demo. ` +
      'Los tests de integración solo deben correr contra el emulador (demo-*).',
  );
}
