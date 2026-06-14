# Tests, verificacion y code review — TuTiendaWeb

Como probar cambios y como revisar cambios fuertes antes de mergear. Leer esto al planear tests, validar localmente, o revisar un cambio que toca auth, ventas/checkout, import masivo, suscripcion o reglas Firestore.

## Contenido
- [Estado actual del testing](#estado-actual-del-testing)
- [Niveles de verificacion](#niveles-de-verificacion)
- [Verificacion con emulador (sin runner)](#verificacion-con-emulador-sin-runner)
- [Montar Vitest (cuando se quiera suite real)](#montar-vitest-cuando-se-quiera-suite-real)
- [Que testear y como](#que-testear-y-como)
- [Code review de cambios fuertes](#code-review-de-cambios-fuertes)
- [Checklist de revision](#checklist-de-revision)
- [Riesgos abiertos conocidos](#riesgos-abiertos-conocidos)

---

## Estado actual del testing

**No hay runner de tests configurado en el repo** (no hay jest/vitest ni `npm test` en `package.json`). CI (`.github/workflows/ci.yml`) corre solo `npm run lint` + `npx tsc --noEmit`, mas CodeQL semanal. No hay build ni tests automaticos en CI.

Implicancia: hoy la "prueba" minima de cualquier cambio es **`npm run tsc` + `npm run build` en verde**, mas verificacion manual contra el emulador. Si el cambio amerita tests automatizados (ver abajo), hay que montar el runner como parte del trabajo.

## Niveles de verificacion

Elegir segun el peso del cambio:

| Nivel | Cuando | Como |
|-------|--------|------|
| 1. Type-check + build | Todo cambio, siempre | `npm run tsc && npm run build` |
| 2. Verificacion manual | Cambios de UI/flujo | Emulador + `npm run dev`, recorrer el flujo |
| 3. Tests automatizados | Logica critica (schemas, actions, calculos de precio/totales, idempotencia) | Vitest (montar si no existe) |
| 4. Code review asistido | Cambios fuertes antes de PR/merge | `/code-review`, `/security-review` |

## Verificacion con emulador (sin runner)

Prueba la app 100% local (Auth/Firestore/Storage) sin tocar produccion. Guia completa: `docs/guias/emulador-local.md`.

Requisitos: **Java 21+** (`java -version`); el JDK 21 debe estar primero en el PATH.

```bash
# 1. Copiar .env.emulator dentro de .env.local (o reemplazarlo temporalmente)
# 2. Terminal 1: levantar emuladores (UI en http://127.0.0.1:4000)
npm run emulators
# 3. Terminal 2: sembrar datos demo
npm run seed:emulator     # login: demo@tutiendaweb.test / 123456 — tienda slug: tienda-demo
# 4. Terminal 3: levantar la app (con NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true)
npm run dev
```

Util para validar flujos que escriben de verdad en Firestore (categorias/subcategorias con borrado bloqueante, creacion de ventas, import de productos). Limitacion: las URLs publicas de Storage no resuelven al emulador, asi que las imagenes subidas en modo emulador pueden no previsualizarse.

Para verificacion de flujos en navegador de forma asistida, considerar la skill `webapp-testing` (Playwright) o el comando `/verify`.

## Montar Vitest (cuando se quiera suite real)

Vitest encaja mejor que Jest aca (TS + ESM nativo, rapido, sin config pesada). Setup minimo:

```bash
npm i -D vitest @vitest/coverage-v8
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { environment: 'node', globals: true },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

```jsonc
// package.json → scripts
"test": "vitest run",
"test:watch": "vitest"
```

Agregar `npm test` al job de CI (`.github/workflows/ci.yml`) despues de `tsc`.

## Que testear y como

Prioridad por valor/fragilidad:

1. **Schemas Zod (unit, alto valor, bajo costo).** Casos validos e invalidos de `product-import.schema`, `sell.schema`, `checkout.schema` y schemas de store-settings. Son funciones puras: testeo directo sin mocks.

```typescript
import { describe, it, expect } from 'vitest';
import { createSaleSchema } from '@/features/dashboard/modules/sells/schemas/sell.schema';

describe('createSaleSchema', () => {
  it('rechaza items con precio negativo', () => {
    const r = createSaleSchema.safeParse({ /* ...payload con unitPrice: -1 */ });
    expect(r.success).toBe(false);
  });
});
```

2. **Server Actions (mock de sesion + service).** Verificar las 4 etapas: rechaza sin auth, rechaza payload invalido, llama al service con `session.storeId`, retorna `ActionResponse` bien formado.

```typescript
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/auth/server-session', () => ({ getServerSession: vi.fn() }));
vi.mock('../services/my.service', () => ({ myService: { create: vi.fn() } }));

import { getServerSession } from '@/lib/auth/server-session';
import { createSomethingAction } from './my.actions';

it('rechaza sin sesion', async () => {
  vi.mocked(getServerSession).mockResolvedValue(null);
  const res = await createSomethingAction({ name: 'x' });
  expect(res.success).toBe(false);
});
```

3. **Casos de regresion de los riesgos abiertos** (ver mas abajo): doble ejecucion de `importProductsAction` no debe duplicar ni superar `MAX_IMPORT_PRODUCTS`; `createPublicSaleAction` debe rechazar payloads manipulados.

No perseguir cobertura de UI con tests unitarios; para UI usar verificacion manual/emulador o Playwright.

## Code review de cambios fuertes

Considerar "cambio fuerte" cualquiera que toque: **auth/sesion, ventas/checkout publico, import masivo de productos, suscripcion/MercadoPago, reglas Firestore, o services con Admin SDK**.

Flujo sugerido antes de abrir/mergear PR:

1. `npm run tsc && npm run build` en verde.
2. **`/code-review`** sobre el diff (correctness + simplificacion). Para cambios grandes, `/code-review high`; para revision profunda multi-agente, el usuario puede lanzar `/code-review ultra` (es disparado por el usuario y facturado; no se puede lanzar por cuenta propia).
3. **`/security-review`** si el cambio toca permisos, datos publicos (catalogo/ventas), manejo de tokens o reglas Firestore.
4. Verificacion manual contra el emulador del flujo afectado.
5. Repasar la checklist de abajo.

## Checklist de revision

- [ ] `npm run tsc` y `npm run build` pasan.
- [ ] Server Actions: `getServerSession()` primero; sin sesion/`storeId` → error.
- [ ] El `storeId` sale de la sesion, **nunca** del payload del cliente.
- [ ] Input validado con Zod (`safeParse`) — incluido el flujo publico del catalogo.
- [ ] `ActionResponse` importado de `@/features/auth/auth.types` (no redeclarado).
- [ ] `revalidatePath()` en cada mutacion.
- [ ] Botones de submit deshabilitados mientras `isPending` (anti doble-submit).
- [ ] Sin `index.ts` (barrels) nuevos.
- [ ] Sin `useEffect` para fetch inicial; sin datos de negocio en Zustand.
- [ ] Precios/totales de ventas recalculados en el servidor.
- [ ] Si cambian reglas Firestore: revisado el impacto sobre la lectura publica del catalogo.
- [ ] `env.example` actualizado si se agregaron variables.

## Riesgos abiertos conocidos

Hallazgos documentados en [`docs/hallazgos/`](../../../../docs/hallazgos/). Estado verificado contra el codigo el **2026-06-13** (re-verificar antes de afirmar que algo sigue abierto, el codigo cambia):

- **Doble-submit en import de Excel (`product-import`)** — *parcialmente mitigado*. `importProductsAction` ya re-valida el tope en el servidor (por archivo y total via `count()`), pero **sigue sin ser idempotente**: dos requests rapidos pueden duplicar el lote, y el `count()+suma` tiene race. En el cliente (`product-import-dialog.tsx`), el boton del paso `preview` (≈linea 412) **no** se deshabilita con `isPending` ni hay guard sincronico en `proceedToImport()` (el de `confirm-warnings` si tiene `disabled={isPending}`). Fix pendiente: guard sincronico + `disabled={isPending}` en `preview` + idempotencia/dedupe en servidor.
- **`ActionResponse` redeclarado** — *abierto* en `products/actions/product.actions.ts`, `store/actions/checkout.actions.ts`, `dashboard/modules/store-settings/actions/profile.actions.ts` y `sells/schemas/sell.schema.ts` (de donde lo importa `sale.actions.ts`). Ya corregido en auth, onboarding, category y product-import (importan de `@/features/auth/auth.types`). En modulos nuevos usar siempre el import canonico.
- **`createTagAction`** (`products/actions/tag.actions.ts`) — *abierto*. Lanza `throw new Error` en vez de devolver `ActionResponse` y define el schema inline en vez de usar `tag.schema.ts`. No replicar este patron.
- **`updateSubscriptionAction`** (`store-settings/actions/profile.actions.ts`) — *abierto*. Acepta `provider:'stripe'` (inexistente en el modelo) y permite escritura manual de la suscripcion que gestionan las Cloud Functions. Restringir/eliminar.
- **`deleteSale`** (`sells/services/sale.service.ts`) — *abierto*. El JSDoc dice "(soft delete)" pero ejecuta hard `.delete()`. Corregir comentario o implementar soft delete.

**Ya corregido (usar como ejemplo del patron correcto):** `createPublicSaleAction` (`sells/actions/sale.actions.ts`) ahora valida el payload con `createSaleSchema.safeParse` antes de persistir, y los precios/totales se recalculan en el servidor con `buildTrustedSale()` (`store/services/checkout.service.ts`), que ignora lo que mande el cliente.

Al tocar estas areas, no reintroducir el problema y, si esta a mano, dejarlo mejor.
