/**
 * Tests de reglas de seguridad de Firestore (Fase 3).
 *
 * Evalúa `firestore.rules` con `@firebase/rules-unit-testing` contra el
 * emulador. Cada `allow` tiene su espejo `deny` (criterio de aceptación F).
 *
 * Contextos:
 *  - `env.unauthenticatedContext()` → anónimo (catálogo público / checkout).
 *  - `env.authenticatedContext(uid)` → usuario logueado (owner vs intruso).
 *
 * El setup (sembrar datos saltándose las reglas) usa
 * `env.withSecurityRulesDisabled(...)`. Cada test parte de Firestore limpio
 * (`env.clearFirestore()` en beforeEach).
 *
 * Guía: docs/test/30-rules-audit-guide.md
 */
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  cleanupRulesTestEnv,
  getRulesTestEnv,
} from '../helpers/firebase-emulator';
import {
  makeCategory,
  makeProduct,
  makeSale,
  makeStore,
  TEST_OWNER_UID,
  TEST_STORE_ID,
} from '../helpers/factories';

const INTRUDER_UID = 'intruso-uid';
const OTHER_STORE_ID = 'otra-tienda';

let env: RulesTestEnvironment;

/** Firestore del owner legítimo de la tienda demo. */
const ownerDb = () => env.authenticatedContext(TEST_OWNER_UID).firestore();
/** Firestore de un usuario autenticado que NO es owner. */
const intruderDb = () => env.authenticatedContext(INTRUDER_UID).firestore();
/** Firestore anónimo (catálogo público / checkout). */
const anonDb = () => env.unauthenticatedContext().firestore();

/** Siembra documentos saltándose las reglas (setup). */
async function seed(fn: (db: FirebaseFirestore.Firestore) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    // El tipo del contexto deshabilitado expone un firestore() compatible.
    await fn(ctx.firestore() as unknown as FirebaseFirestore.Firestore);
  });
}

/** Una venta pública válida según `isValidSellData()` (incluye `metadata`). */
const makeValidSell = (over: Record<string, unknown> = {}) =>
  makeSale({ metadata: { createdAt: Date.now() }, ...over });

beforeAll(async () => {
  env = await getRulesTestEnv();
});

afterAll(async () => {
  await cleanupRulesTestEnv();
});

beforeEach(async () => {
  await env.clearFirestore();
  // La mayoría de las reglas (isStoreOwner) consultan el doc /stores/{id}.
  await seed(async (db) => {
    await db.doc(`stores/${TEST_STORE_ID}`).set(makeStore());
  });
});

// =============================================================================
// stores/{id}
// =============================================================================

describe('stores/{storeId}', () => {
  it('permite la lectura pública (catálogo) a un usuario anónimo', async () => {
    await assertSucceeds(anonDb().doc(`stores/${TEST_STORE_ID}`).get());
  });

  it('permite al owner modificar su tienda', async () => {
    await assertSucceeds(
      ownerDb()
        .doc(`stores/${TEST_STORE_ID}`)
        .set(makeStore({ basicInfo: { name: 'Nuevo nombre' } })),
    );
  });

  it('rechaza que un usuario no-owner modifique la tienda', async () => {
    await assertFails(
      intruderDb().doc(`stores/${TEST_STORE_ID}`).update({ x: 1 }),
    );
  });

  it('rechaza que un usuario anónimo modifique la tienda', async () => {
    await assertFails(anonDb().doc(`stores/${TEST_STORE_ID}`).update({ x: 1 }));
  });
});

// =============================================================================
// Ownership — isStoreOwner soporta 3 campos legacy
// =============================================================================

describe('isStoreOwner — campos de ownership', () => {
  it('reconoce al owner por el campo raíz ownerId', async () => {
    await seed(async (db) => {
      await db
        .doc(`stores/${TEST_STORE_ID}`)
        .set(makeStore({ ownerId: TEST_OWNER_UID, metadata: { status: 'active' } }));
    });
    await assertSucceeds(
      ownerDb().doc(`stores/${TEST_STORE_ID}/products/p1`).set(makeProduct()),
    );
  });

  it('reconoce al owner por el campo raíz userId (legacy)', async () => {
    await seed(async (db) => {
      // Sin ownerId raíz ni metadata.ownerId: solo userId.
      await db.doc(`stores/${TEST_STORE_ID}`).set({
        userId: TEST_OWNER_UID,
        basicInfo: { name: 'Legacy' },
        metadata: { status: 'active' },
      });
    });
    await assertSucceeds(
      ownerDb().doc(`stores/${TEST_STORE_ID}/products/p1`).set(makeProduct()),
    );
  });

  it('reconoce al owner por metadata.ownerId (canónico actual)', async () => {
    await seed(async (db) => {
      // Solo metadata.ownerId, sin ownerId/userId raíz.
      await db.doc(`stores/${TEST_STORE_ID}`).set({
        basicInfo: { name: 'Canónico' },
        metadata: { ownerId: TEST_OWNER_UID, status: 'active' },
      });
    });
    await assertSucceeds(
      ownerDb().doc(`stores/${TEST_STORE_ID}/products/p1`).set(makeProduct()),
    );
  });

  it('no da acceso cruzado: un owner de otra tienda no puede escribir en esta', async () => {
    await seed(async (db) => {
      await db
        .doc(`stores/${OTHER_STORE_ID}`)
        .set(makeStore({ ownerId: INTRUDER_UID }));
    });
    // INTRUDER es owner de OTHER_STORE_ID pero intenta escribir en TEST_STORE_ID.
    await assertFails(
      intruderDb()
        .doc(`stores/${TEST_STORE_ID}/products/p1`)
        .set(makeProduct()),
    );
  });
});

// =============================================================================
// products / categories / tags — read público, escritura owner + data válida
// =============================================================================

describe.each([
  {
    col: 'products',
    valid: () => makeProduct(),
    factoryName: 'makeProduct',
  },
  {
    col: 'categories',
    valid: () => makeCategory(),
    factoryName: 'makeCategory',
  },
  {
    col: 'tags',
    valid: () => ({ name: 'Oferta', storeId: TEST_STORE_ID }),
    factoryName: 'tag',
  },
])('$col', ({ col, valid }) => {
  const docPath = `stores/${TEST_STORE_ID}/${col}/x1`;

  it('permite la lectura pública a un anónimo', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set(valid());
    });
    await assertSucceeds(anonDb().doc(docPath).get());
  });

  it('permite al owner crear con data válida', async () => {
    await assertSucceeds(ownerDb().doc(docPath).set(valid()));
  });

  it('permite al owner actualizar con data válida', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set(valid());
    });
    await assertSucceeds(ownerDb().doc(docPath).set(valid()));
  });

  it('permite al owner borrar', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set(valid());
    });
    await assertSucceeds(ownerDb().doc(docPath).delete());
  });

  it('rechaza que un no-owner cree', async () => {
    await assertFails(intruderDb().doc(docPath).set(valid()));
  });

  it('rechaza que un no-owner borre', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set(valid());
    });
    await assertFails(intruderDb().doc(docPath).delete());
  });

  it('rechaza crear sin el campo name (data inválida)', async () => {
    const { name, ...sinName } = valid() as Record<string, unknown>;
    void name;
    await assertFails(ownerDb().doc(docPath).set(sinName));
  });

  it('rechaza crear con name vacío (data inválida)', async () => {
    await assertFails(ownerDb().doc(docPath).set({ ...valid(), name: '' }));
  });

  it('rechaza crear sin storeId (data inválida)', async () => {
    const { storeId, ...sinStore } = valid() as Record<string, unknown>;
    void storeId;
    await assertFails(ownerDb().doc(docPath).set(sinStore));
  });
});

// Reglas específicas de products: price requerido, numérico y no-negativo.
describe('products — validación de price', () => {
  const docPath = `stores/${TEST_STORE_ID}/products/x1`;

  it('rechaza crear sin price', async () => {
    const { price, ...sinPrice } = makeProduct() as Record<string, unknown>;
    void price;
    await assertFails(ownerDb().doc(docPath).set(sinPrice));
  });

  it('rechaza crear con price negativo', async () => {
    await assertFails(ownerDb().doc(docPath).set(makeProduct({ price: -1 })));
  });

  it('rechaza crear con price no numérico', async () => {
    await assertFails(
      ownerDb().doc(docPath).set(makeProduct({ price: '1000' })),
    );
  });

  it('permite crear con price 0 (borde válido)', async () => {
    await assertSucceeds(ownerDb().doc(docPath).set(makeProduct({ price: 0 })));
  });
});

// =============================================================================
// sells — create público (checkout), lectura/escritura solo owner
// =============================================================================

describe('sells/{sellId}', () => {
  const docPath = `stores/${TEST_STORE_ID}/sells/s1`;

  it('permite a un anónimo crear una venta válida con storeId coincidente', async () => {
    await assertSucceeds(anonDb().doc(docPath).set(makeValidSell()));
  });

  it('rechaza crear una venta con items vacío', async () => {
    await assertFails(anonDb().doc(docPath).set(makeValidSell({ items: [] })));
  });

  it('rechaza crear una venta con total negativo', async () => {
    await assertFails(
      anonDb()
        .doc(docPath)
        .set(
          makeValidSell({
            totals: { subtotal: 0, discount: 0, deliveryFee: 0, total: -1 },
          }),
        ),
    );
  });

  it('rechaza crear una venta con storeId ajeno (tienda A apunta a B)', async () => {
    await assertFails(
      anonDb().doc(docPath).set(makeValidSell({ storeId: OTHER_STORE_ID })),
    );
  });

  it('rechaza crear una venta sin una key requerida (metadata)', async () => {
    const { metadata, ...sinMetadata } = makeValidSell() as Record<
      string,
      unknown
    >;
    void metadata;
    await assertFails(anonDb().doc(docPath).set(sinMetadata));
  });

  it('rechaza crear una venta con customer.name vacío', async () => {
    await assertFails(
      anonDb()
        .doc(docPath)
        .set(makeValidSell({ customer: { name: '', phone: '+549110000' } })),
    );
  });

  // SEC-01: la ruta pública (anónima) impone topes de tamaño para evitar abuso.
  it('rechaza crear una venta con un array de items excesivo (SEC-01)', async () => {
    const items = Array.from({ length: 101 }, (_, i) => ({
      id: `item-${i}`,
      productName: 'x',
      quantity: 1,
      unitPrice: 1,
      subtotal: 1,
    }));
    await assertFails(anonDb().doc(docPath).set(makeValidSell({ items })));
  });

  it('rechaza crear una venta con customer.name desmesuradamente largo (SEC-01)', async () => {
    await assertFails(
      anonDb()
        .doc(docPath)
        .set(
          makeValidSell({
            customer: { name: 'a'.repeat(201), phone: '+549110000' },
          }),
        ),
    );
  });

  it('permite 100 items (borde superior válido, SEC-01)', async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: `item-${i}`,
      productName: 'x',
      quantity: 1,
      unitPrice: 1,
      subtotal: 1,
    }));
    await assertSucceeds(anonDb().doc(docPath).set(makeValidSell({ items })));
  });

  it('permite al owner leer las ventas de su tienda', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set(makeValidSell());
    });
    await assertSucceeds(ownerDb().doc(docPath).get());
  });

  it('rechaza que un anónimo lea una venta', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set(makeValidSell());
    });
    await assertFails(anonDb().doc(docPath).get());
  });

  it('rechaza que un no-owner lea una venta', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set(makeValidSell());
    });
    await assertFails(intruderDb().doc(docPath).get());
  });

  it('permite al owner actualizar y borrar una venta', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set(makeValidSell());
    });
    await assertSucceeds(ownerDb().doc(docPath).update({ 'metadata.note': 'x' }));
    await assertSucceeds(ownerDb().doc(docPath).delete());
  });

  it('rechaza que un anónimo actualice o borre una venta', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set(makeValidSell());
    });
    await assertFails(anonDb().doc(docPath).update({ x: 1 }));
    await assertFails(anonDb().doc(docPath).delete());
  });
});

// =============================================================================
// settings — solo owner
// =============================================================================

describe('settings/{settingId}', () => {
  const docPath = `stores/${TEST_STORE_ID}/settings/general`;

  it('permite al owner leer y escribir settings', async () => {
    await assertSucceeds(ownerDb().doc(docPath).set({ theme: 'dark' }));
    await assertSucceeds(ownerDb().doc(docPath).get());
  });

  it('rechaza que un anónimo lea o escriba settings', async () => {
    await assertFails(anonDb().doc(docPath).get());
    await assertFails(anonDb().doc(docPath).set({ theme: 'dark' }));
  });

  it('rechaza que un no-owner lea o escriba settings', async () => {
    await assertFails(intruderDb().doc(docPath).get());
    await assertFails(intruderDb().doc(docPath).set({ theme: 'dark' }));
  });
});

// =============================================================================
// notifications — read/update owner; create/delete nadie (solo Admin SDK)
// =============================================================================

describe('notifications/{notificationId}', () => {
  const docPath = `stores/${TEST_STORE_ID}/notifications/n1`;

  it('permite al owner leer y actualizar notificaciones', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set({ read: false, message: 'hola' });
    });
    await assertSucceeds(ownerDb().doc(docPath).get());
    await assertSucceeds(ownerDb().doc(docPath).update({ read: true }));
  });

  it('rechaza que el owner cree una notificación (solo Admin SDK)', async () => {
    await assertFails(ownerDb().doc(docPath).set({ read: false }));
  });

  it('rechaza que el owner borre una notificación (solo Admin SDK)', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set({ read: false });
    });
    await assertFails(ownerDb().doc(docPath).delete());
  });

  it('rechaza que un no-owner lea notificaciones', async () => {
    await seed(async (db) => {
      await db.doc(docPath).set({ read: false });
    });
    await assertFails(intruderDb().doc(docPath).get());
  });
});

// =============================================================================
// users/{uid} — solo el propio uid
// =============================================================================

describe('users/{userId}', () => {
  it('permite al usuario leer y escribir su propio documento', async () => {
    await assertSucceeds(
      ownerDb().doc(`users/${TEST_OWNER_UID}`).set({ displayName: 'Yo' }),
    );
    await assertSucceeds(ownerDb().doc(`users/${TEST_OWNER_UID}`).get());
  });

  it('rechaza que un usuario lea el documento de otro uid', async () => {
    await seed(async (db) => {
      await db.doc(`users/${TEST_OWNER_UID}`).set({ displayName: 'Yo' });
    });
    await assertFails(intruderDb().doc(`users/${TEST_OWNER_UID}`).get());
  });

  it('rechaza que un usuario escriba el documento de otro uid', async () => {
    await assertFails(
      intruderDb().doc(`users/${TEST_OWNER_UID}`).set({ displayName: 'hack' }),
    );
  });

  it('rechaza el acceso anónimo a cualquier documento de usuario', async () => {
    await assertFails(anonDb().doc(`users/${TEST_OWNER_UID}`).get());
  });
});

// =============================================================================
// Catch-all — denegar todo lo no especificado
// =============================================================================

describe('catch-all', () => {
  it('rechaza la lectura de una colección no contemplada', async () => {
    await assertFails(ownerDb().doc('coleccion-random/doc1').get());
  });

  it('rechaza la escritura en una colección no contemplada', async () => {
    await assertFails(ownerDb().doc('coleccion-random/doc1').set({ x: 1 }));
  });
});
