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
  en el PR de la fase).
- **Web-first assertions:** `await expect(locator).toBeVisible()` —
  auto-esperan; nada de `waitForTimeout`.
- **Aislamiento:** cada spec parte de un estado conocido (seed). Si un spec
  muta datos, que use IDs propios o limpie al final.
- **Auth de prueba:** el seed crea `demo@tutiendaweb.test` / `123456`. Para
  flujos autenticados, loguear vía UI o sembrar la cookie de sesión.

## Ejemplo

```ts
import { test, expect } from '@playwright/test';

test('checkout público genera el total recalculado y link de WhatsApp', async ({ page }) => {
  await page.goto('/tienda-demo');
  await page.getByRole('button', { name: /agregar/i }).first().click();
  await page.getByTestId('cart-button').click();
  await page.getByRole('button', { name: /finalizar/i }).click();
  await page.getByLabel(/nombre/i).fill('Cliente E2E');
  await page.getByRole('button', { name: /enviar pedido/i }).click();
  await expect(page.getByText(/total/i)).toContainText('8.500');
  // el botón abre wa.me con el mensaje
  await expect(page.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
    'href', /wa\.me/,
  );
});
```

## Artefactos

- En fallo: screenshot + video + trace (configurado en `playwright.config.ts`).
- Reporte HTML en `playwright-report/` (subido como artifact en CI).

## Criterio de salida (Fase 4)

Los 6 flujos verdes en chromium, estables (sin flakiness), con esperas por estado.
