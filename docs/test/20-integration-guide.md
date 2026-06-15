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

## Criterio de salida (Fase 2)

- ≥ 90% en checkout/sells/auth (services + actions).
- Test de price-tampering verde.
- Suites idempotentes: corren en cualquier orden y limpian su estado.
