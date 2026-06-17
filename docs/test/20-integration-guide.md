# 20 · Guía de Integración con emuladores (Fase 2)

Prueba la **lógica real de datos**: services y Server Actions contra Firestore,
Auth y Storage **emulados**. Sin mocks de Firebase — datos reales, sin tocar
producción.

## Cómo corre

- Config: `vitest.integration.config.ts` (environment node, sin paralelismo).
- Setup: `test/helpers/integration-setup.ts` fija los `*_EMULATOR_HOST` y aborta
  si el proyecto no es `demo-*`.
- Cliente: Admin SDK vía `test/helpers/firebase-emulator.ts` (`adminDb()`,
  `adminAuth()`). El Admin SDK ignora las security rules → ideal para sembrar y
  verificar datos arbitrarios.

```bash
npm run test:emu     # levanta emulador + corre integración y reglas
# o, con emulador ya arriba:
npm run test:int
```

## Aislamiento (obligatorio)

Todas las suites comparten un único emulador. Cada archivo limpia su estado:

```ts
import { beforeEach, afterAll } from 'vitest';
import { clearFirestore, adminDb } from '../../helpers/firebase-emulator';
import { makeStore, makeProduct, TEST_STORE_ID } from '../../helpers/factories';

beforeEach(async () => {
  await clearFirestore();
  await adminDb().collection('stores').doc(TEST_STORE_ID).set(makeStore());
});
```

## Simular sesión y custom claims

Las Server Actions llaman `getServerSession()`. En integración se mockea ese
módulo para devolver una sesión controlada (los claims reales se prueban aparte):

```ts
vi.mock('@/lib/auth/server-session', () => ({
  getServerSession: vi.fn(),
}));
import { getServerSession } from '@/lib/auth/server-session';
import { makeSession } from '../../helpers/factories';

beforeEach(() => {
  vi.mocked(getServerSession).mockResolvedValue(makeSession());
});
```

Para probar el flujo real de claims (Auth emulado), usar `adminAuth()` +
`setCustomUserClaims` y verificar con `getUser`.

## Qué cubrir (prioridad)

### 1. Checkout — seguridad H-1 (máxima prioridad)

`buildTrustedSale()` / `processCheckoutAction()` deben:

- Ignorar **cualquier** precio que mande el cliente y recalcular `unitPrice`
  desde el producto en Firestore. → **test de price-tampering obligatorio.**
- Rechazar productos `status !== 'active'` y variantes `isAvailable === false`.
- Validar que el método de pago existe y está `enabled`.
- Tomar el `deliveryFee` real de `settings.deliveryMethods` (no del cliente).
- Exigir dirección ≥ 10 chars cuando el método es `delivery`.
- Generar `orderNumber` (`ORD-xxxxxx`) y total = subtotal + envío.

```ts
it('ignora el precio enviado por el cliente y recalcula desde Firestore', async () => {
  await seedProduct({ id: 'p1', price: 1000, status: 'active' });
  const sale = await buildTrustedSale(storeId, {
    items: [{ productId: 'p1', quantity: 2, variantIds: [], unitPrice: 1 /* mentira */ } as any],
    /* ...form */
  });
  expect(sale.items[0].unitPrice).toBe(1000);   // no 1
  expect(sale.totals.subtotal).toBe(2000);       // no 2
});
```

### 2. Sells
`createSale`/`updateSale` (recálculo de totales con descuento, notación punto),
`getSales` (filtros), `calculateSalesStats`.

### 3. Products
`createProduct`/`updateProduct`/`deleteProduct` (limpieza de imágenes en Storage
emulado), `toggleProductStatus`, `isValidSubcategory`, import `bulkCreateProducts`
(límites 50 cat / 30 sub / 300 productos, batches de 450, dedupe case-insensitive).

### 4. Categories / Tags
Crear/actualizar/reordenar, jerarquía 2 niveles.

### 5. Store settings
`updateProfile*` (slug único case-insensitive, validación por sección).

### 6. Auth / claims
`setUserClaims` + `getServerSession` (storeId/role en claims, fallback Firestore),
`checkSlugAvailability`, flujo registro→onboarding→claims.

## Criterio de aceptación de la Fase 2 completa (Definition of Done)

La Fase 2 se considera **terminada** solo cuando **todos** los ítems están verdes.
Mismo rigor que [03-acceptance-criteria.md](./03-acceptance-criteria.md), aplicado por área.

### Cobertura por área (services + actions, contra emulador)

| Área | Archivos | Estado |
|------|----------|:---:|
| **Checkout** | `store/services/checkout.service.ts`, `store/actions/checkout.actions.ts` | ✅ (PR1) |
| **Sells** | `dashboard/modules/sells/services/sale.service.ts`, `.../actions/sale.actions.ts` | ✅ (PR2) |
| **Products** | `products/services/product.service.ts`, `.../actions/product.actions.ts` | ✅ (PR3) |
| **Import** | `products/services/product-import.service.ts` | ✅ (PR3) |
| **Categories/Tags** | `products/services/category.service.ts`, `tag.service.ts` | ⬜ |
| **Store-settings** | `dashboard/modules/store-settings/services/server/profile.server-service.ts` | ⬜ |
| **Auth/claims** | `auth/services/server/auth.service.ts`, `lib/auth/server-session.ts`, `auth/actions/**` | ⬜ |

- [ ] **Checkout** ≥ 90% líneas / ≥ 85% branches.
- [ ] **Sells** ≥ 90% líneas / ≥ 85% branches.
- [ ] **Auth/claims** ≥ 90% líneas / ≥ 85% branches.
- [x] **Products** cubierto: CRUD + limpieza de imágenes en Storage emulado + `toggleProductStatus`. *(PR3)*
- [x] **Import** cubierto: límites 50 cat / 30 sub / 300 productos, batches de 450, dedupe case-insensitive, jerarquía 2 niveles, `isValidSubcategory`. *(PR3)*
- [ ] **Categories/Tags** cubierto: crear/actualizar/reordenar, `countCategoryUsage`, `deleteCategory`, slug.
- [ ] **Store-settings** cubierto: slug único case-insensitive, validación por sección, `checkSlugAvailability`.

### Seguridad y reglas de negocio

- [x] **H-1 price-tampering** verde (cliente miente el precio → se ignora y se recalcula desde Firestore). *(PR1)*
- [x] **INT-01** resuelto: el envío integra el total persistido (`total = subtotal − discount + deliveryFee`) y hay regresión de checkout `delivery`. *(PR2)*
- [ ] Operaciones públicas (venta sin auth) validan estructura y `storeId`.
- [ ] Cada Server Action: rechazo sin sesión / sin `storeId` afirmado (`success === false`).

### Calidad transversal (cada suite cumple `03-acceptance-criteria.md`)

- [ ] Por cada regla de negocio: **caso válido + un inválido por regla + bordes**.
- [ ] Mensajes de error afirmados **literalmente** (no solo `success === false`).
- [ ] **Determinismo:** IDs (`nanoid`) y relojes (`vi.useFakeTimers`) mockeados; sin `sleep`.
      > Al usar `vi.useFakeTimers` en integración, limitar a `{ toFake: ['Date'] }`: si se
      > falsea también `setTimeout`, el IO del SDK de Firestore queda colgado.
- [ ] **Aislamiento:** `clearFirestore()` / `clearAuth()` en `beforeEach`; solo proyecto `demo-*`.
- [ ] **Idempotencia:** las suites corren en cualquier orden, sin residuos en el emulador.

### CI y cierre

- [ ] Job `emulators` verde (`npm run test:emu`) con todas las suites de integración.
- [ ] `npx tsc --noEmit` y `npm run lint` verdes.
- [ ] La suite unit (Fase 1) sigue verde tras los cambios de producción.
- [ ] Sin hallazgos **abiertos de severidad Alta** sin documentar en `docs/hallazgos/`.
