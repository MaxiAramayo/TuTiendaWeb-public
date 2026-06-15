# 30 · Guía de Reglas Firestore/Storage (Fase 3)

Verifica que `firestore.rules` y `storage.rules` protegen los datos, y de paso
**audita la seguridad** con la skill `firebase-security-rules-auditor`.

## Cómo corre

- Librería: `@firebase/rules-unit-testing` contra el emulador.
- Helper: `getRulesTestEnv()` en `test/helpers/firebase-emulator.ts` carga las
  rules reales del repo.
- Config: `vitest.integration.config.ts` (mismo runner que integración).

```bash
npm run test:rules   # con emulador arriba
# o
npm run test:emu     # levanta emulador + integración + reglas
```

## Patrón de test

```ts
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

let env: RulesTestEnvironment;
beforeAll(async () => { env = await getRulesTestEnv(); });
afterAll(async () => { await cleanupRulesTestEnv(); });
beforeEach(async () => { await env.clearFirestore(); });

it('permite la lectura pública de un producto', async () => {
  const anon = env.unauthenticatedContext();
  await assertSucceeds(
    anon.firestore().doc('stores/s1/products/p1').get()
  );
});

it('rechaza que un no-owner escriba un producto', async () => {
  const intruso = env.authenticatedContext('otro-uid');
  await assertFails(
    intruso.firestore().doc('stores/s1/products/p1').set({ name: 'x', price: 1, storeId: 's1' })
  );
});
```

> Para sembrar datos saltándose las reglas (setup), usar
> `env.withSecurityRulesDisabled(async (ctx) => { ... })`.

## Matriz allow/deny a cubrir

Cada `allow` lleva su **espejo `deny`** (criterio de aceptación F).

| Recurso | Operación | Permitido | Denegado |
|---------|-----------|-----------|----------|
| `stores/{id}` | read | cualquiera (catálogo público) | — |
| `stores/{id}` | write | owner | no-owner, anónimo |
| `products` / `categories` / `tags` | read | cualquiera | — |
| `products` / `categories` / `tags` | create/update | owner + data válida | no-owner; data inválida (falta name/price/storeId) |
| `products` / `categories` / `tags` | delete | owner | no-owner |
| `sells` | create | anónimo **si** `isValidSellData()` y `storeId` coincide | items vacío; `total < 0`; storeId distinto |
| `sells` | read/update/delete | owner | anónimo, no-owner |
| `settings` | read/write | owner | resto |
| `notifications` | read/update | owner | — |
| `notifications` | create/delete | nadie (solo Admin SDK) | cliente |
| `users/{uid}` | read/write | el propio uid | otro uid, anónimo |
| `{document=**}` (catch-all) | cualquiera | — | todo |

`isStoreOwner` debe validarse con los **3 campos legacy** (`ownerId`, `userId`,
`metadata.ownerId`).

### Storage

| Ruta | Permitido | Denegado |
|------|-----------|----------|
| `stores/{id}/**` read | cualquiera | — |
| `stores/{id}/**` write | owner + `isValidImage` (image/*, <5MB) | no-owner; archivo >5MB; no-imagen |
| `users/{uid}/avatar/**` | el propio uid + imagen válida | otro uid |
| catch-all | — | todo |

## Auditoría con la skill

Tras tener los tests verdes, se ejecuta la skill
`firebase-security-rules-auditor` sobre `firestore.rules`/`storage.rules`. Su
informe (hallazgos, severidad, recomendaciones) se vuelca en
[`60-firebase-security-audit.md`](./60-firebase-security-audit.md).

También se revisa `firestore.indexes.json` contra las queries reales detectadas
en Fase 2 para detectar índices faltantes.

## Criterio de salida (Fase 3)

- Matriz allow/deny completa, toda verde.
- Informe de auditoría escrito en `60-...md`.
- Lista de gaps de índices (si los hay).
