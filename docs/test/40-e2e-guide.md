# 40 · Guía E2E con Playwright (Fase 4)

Valida los caminos críticos de punta a punta en el navegador, contra `next dev`
+ emuladores con datos sembrados.

## Cómo corre

- Config: `playwright.config.ts` (proyecto chromium, `webServer` levanta `next dev`).
- Requiere: emuladores arriba + `npm run seed:emulator` previo.

```bash
# Terminal 1
npm run emulators
# Terminal 2
npm run seed:emulator
# Terminal 3
npm run test:e2e        # headless
npm run test:e2e:ui     # interactivo
```

La app se levanta con `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` para que el
Client SDK apunte a los emuladores.

## Flujos a cubrir

1. **Registro → onboarding → dashboard** — validaciones por paso, slug en vivo.
2. **Login** — credenciales válidas e inválidas, mensajes de error.
3. **Alta/edición de producto** — subida de imagen, validación precio/subcategoría,
   y verlo reflejado en el catálogo público.
4. **Catálogo → carrito → checkout → WhatsApp** *(camino crítico de negocio)* —
   el total mostrado coincide con el recalculado y el link `wa.me` se genera bien.
5. **Settings** — cambiar slug/whatsapp/horarios y ver el impacto.
6. **Import de productos por Excel** — fixture válido e inválido.

## Buenas prácticas

- **Selectores estables:** preferir roles (`getByRole`) y `getByLabel`. Donde no
  alcance, agregar `data-testid` mínimos y no invasivos al componente (se listan
  abajo).
- **Web-first assertions:** `await expect(locator).toBeVisible()` —
  auto-esperan; nada de `waitForTimeout`.
- **Aislamiento:** cada spec parte de un estado conocido (seed). Si un spec
  muta datos, que use IDs propios o limpie al final.
- **Auth de prueba:** el seed crea `demo@tutiendaweb.test` / `123456`. Los flujos
  autenticados loguean por UI con `loginAsOwner(page)` (`e2e/helpers/auth.ts`) en
  un `beforeEach`. No se reutiliza `storageState`: Chromium no entrega de forma
  fiable la cookie httpOnly de sesión en la primera navegación de un contexto
  creado desde storageState (hallazgo E2E-07).

## `data-testid` agregados en la Fase 4

Mínimos y no invasivos, solo donde los roles no alcanzaban (ver hallazgo E2E-01):

- `product-card` — card de producto en el catálogo (`ProductCard`); además
  `data-product-name` para filtrar por nombre.
- `add-to-cart` — botón "añadir al carrito" de cada card (+ `aria-label`).
- `cart-button` — botón flotante "Ver carrito" (`CartFloatingButton`, + `aria-label`).

El resto de los selectores usa roles/labels/placeholder/texto.

## Ejemplo (flujo real de checkout)

El submit del checkout abre WhatsApp por `window.open` (popup); la aserción del
link `wa.me` se hace sobre el **ticket de confirmación** (`OrderTicket`), que
expone un `<a>` nativo. Ver hallazgo E2E-06.

```ts
import { test, expect } from '@playwright/test';
import { STORE_PATH, SEED, priceDigits } from './helpers/seed-data';

test('checkout genera el total recalculado y link de WhatsApp', async ({ page, context }) => {
  await context.route(/wa\.me/, (route) => route.abort()); // CI offline-safe

  await page.goto(STORE_PATH);
  const card = page.getByTestId('product-card').filter({ hasText: SEED.PRODUCT.name });
  await card.getByTestId('add-to-cart').click();

  await page.getByTestId('cart-button').click();
  await page.getByRole('button', { name: /proceder al checkout/i }).click();

  await page.getByLabel(/nombre completo/i).fill('Cliente E2E');
  await page.getByRole('button', { name: /confirmar pedido/i }).click();

  await expect(page.getByText(/pedido confirmado/i)).toBeVisible();
  await expect(page.getByText(new RegExp(priceDigits(SEED.PRODUCT.price))).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /reenviar por whatsapp/i }))
    .toHaveAttribute('href', /wa\.me/);
});
```

## Artefactos

- En fallo: screenshot + video + trace (configurado en `playwright.config.ts`).
- Reporte HTML en `playwright-report/` (subido como artifact en CI).

## Criterio de salida (Fase 4)

Los 6 flujos verdes en chromium, estables (sin flakiness), con esperas por estado.
