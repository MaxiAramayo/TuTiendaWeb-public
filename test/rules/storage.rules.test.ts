/**
 * Tests de reglas de seguridad de Storage (Fase 3).
 *
 * Evalúa `storage.rules` con `@firebase/rules-unit-testing` contra el emulador.
 * Cada `allow` tiene su espejo `deny` (criterio de aceptación F).
 *
 * `isStoreOwner` en Storage consulta el doc `/stores/{id}` en Firestore, así que
 * el setup siembra ese doc con reglas deshabilitadas antes de cada test.
 *
 * Guía: docs/test/30-rules-audit-guide.md
 */
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  deleteObject,
  getBytes,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

import {
  cleanupRulesTestEnv,
  getRulesTestEnv,
} from '../helpers/firebase-emulator';
import { makeStore, TEST_OWNER_UID, TEST_STORE_ID } from '../helpers/factories';

const INTRUDER_UID = 'intruso-uid';

/** Bytes mínimos con cabecera PNG; el rule solo mira contentType y tamaño. */
const IMG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
const IMG_META = { contentType: 'image/png' } as const;
/** Archivo > 5 MB para ejercitar el tope de tamaño. */
const BIG_BYTES = new Uint8Array(5 * 1024 * 1024 + 1);

let env: RulesTestEnvironment;

const ownerStorage = () => env.authenticatedContext(TEST_OWNER_UID).storage();
const intruderStorage = () => env.authenticatedContext(INTRUDER_UID).storage();
const anonStorage = () => env.unauthenticatedContext().storage();

async function seedObject(path: string) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(ref(ctx.storage(), path), IMG_BYTES, IMG_META);
  });
}

beforeAll(async () => {
  env = await getRulesTestEnv();
});

afterAll(async () => {
  await cleanupRulesTestEnv();
});

beforeEach(async () => {
  await env.clearStorage();
  await env.clearFirestore();
  // isStoreOwner (storage.rules) lee /stores/{id} de Firestore.
  await env.withSecurityRulesDisabled(async (ctx) => {
    await (ctx.firestore() as unknown as FirebaseFirestore.Firestore)
      .doc(`stores/${TEST_STORE_ID}`)
      .set(makeStore());
  });
});

// =============================================================================
// stores/{id}/** — read público, write/delete solo owner + imagen válida
// =============================================================================

describe('stores/{storeId}/**', () => {
  const path = `stores/${TEST_STORE_ID}/products/foto.png`;

  it('permite la lectura pública de una imagen de tienda', async () => {
    await seedObject(path);
    await assertSucceeds(getBytes(ref(anonStorage(), path)));
  });

  it('permite al owner subir una imagen válida', async () => {
    await assertSucceeds(
      uploadBytes(ref(ownerStorage(), path), IMG_BYTES, IMG_META),
    );
  });

  it('permite al owner borrar una imagen', async () => {
    await seedObject(path);
    await assertSucceeds(deleteObject(ref(ownerStorage(), path)));
  });

  it('rechaza que un no-owner suba una imagen', async () => {
    await assertFails(
      uploadBytes(ref(intruderStorage(), path), IMG_BYTES, IMG_META),
    );
  });

  it('rechaza que un no-owner borre una imagen', async () => {
    await seedObject(path);
    await assertFails(deleteObject(ref(intruderStorage(), path)));
  });

  it('rechaza subir un archivo de más de 5 MB', async () => {
    await assertFails(
      uploadBytes(ref(ownerStorage(), path), BIG_BYTES, IMG_META),
    );
  });

  it('rechaza subir un archivo que no es imagen (application/pdf)', async () => {
    await assertFails(
      uploadBytes(ref(ownerStorage(), path), IMG_BYTES, {
        contentType: 'application/pdf',
      }),
    );
  });
});

// =============================================================================
// users/{uid}/avatar/** — solo el propio uid + imagen válida
// =============================================================================

describe('users/{userId}/avatar/**', () => {
  const path = `users/${TEST_OWNER_UID}/avatar/me.png`;

  it('permite al propio usuario subir su avatar (imagen válida)', async () => {
    await assertSucceeds(
      uploadBytes(ref(ownerStorage(), path), IMG_BYTES, IMG_META),
    );
  });

  it('rechaza que otro usuario suba el avatar ajeno', async () => {
    await assertFails(
      uploadBytes(ref(intruderStorage(), path), IMG_BYTES, IMG_META),
    );
  });

  it('rechaza subir un avatar que no es imagen', async () => {
    await assertFails(
      uploadBytes(ref(ownerStorage(), path), IMG_BYTES, {
        contentType: 'application/pdf',
      }),
    );
  });

  it('rechaza el acceso anónimo al avatar', async () => {
    await assertFails(
      uploadBytes(ref(anonStorage(), path), IMG_BYTES, IMG_META),
    );
  });
});

// =============================================================================
// temp/{uid}/** — archivos temporales del propio usuario
// =============================================================================

describe('temp/{userId}/**', () => {
  const path = `temp/${TEST_OWNER_UID}/upload.png`;

  it('permite al propio usuario subir un archivo temporal (imagen)', async () => {
    await assertSucceeds(
      uploadBytes(ref(ownerStorage(), path), IMG_BYTES, IMG_META),
    );
  });

  it('rechaza que otro usuario suba en la carpeta temporal ajena', async () => {
    await assertFails(
      uploadBytes(ref(intruderStorage(), path), IMG_BYTES, IMG_META),
    );
  });
});

// =============================================================================
// Catch-all — denegar cualquier otra ruta
// =============================================================================

describe('catch-all', () => {
  it('rechaza subir a una ruta no contemplada', async () => {
    await assertFails(
      uploadBytes(ref(ownerStorage(), 'random/file.png'), IMG_BYTES, IMG_META),
    );
  });

  it('rechaza leer una ruta no contemplada', async () => {
    await assertFails(getBytes(ref(anonStorage(), 'random/file.png')));
  });
});
