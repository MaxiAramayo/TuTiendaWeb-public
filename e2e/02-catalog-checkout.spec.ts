/**
 * Flujo crítico de negocio: catálogo → carrito → checkout → WhatsApp.
 *
 * Verifica el camino del dinero de punta a punta:
 *  - agregar un producto al carrito desde el catálogo público,
 *  - ir al checkout y confirmar el pedido,
 *  - que el TOTAL mostrado sea el recalculado server-side (no el del cliente),
 *  - que se genere el link `wa.me` del pedido.
 *
 * Es el espejo E2E del test de price-tampering de la Fase 2 (integración):
 * el cliente nunca envía precios; el servidor los recalcula desde Firestore.
 *
 * Público → no requiere sesión.
 */
import { test, expect } from '@playwright/test';
import { STORE_PATH, SEED, priceDigits } from './helpers/seed-data';

// Sin sesión: el catálogo es público.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Catálogo público → checkout → WhatsApp', () => {
  test('agrega un producto, confirma el pedido y genera el link de WhatsApp con el total recalculado', async ({
    page,
    context,
  }) => {
    // Evita que la pestaña de WhatsApp intente navegar a la red real en CI.
    await context.route(/wa\.me/, (route) => route.abort());

    // Suprime el modal de bienvenida (visitante recurrente): es un Dialog modal
    // que, tras 550ms, se solapa con los controles del catálogo/carrito.
    await page.addInitScript((storeId) => {
      try {
        localStorage.setItem(`ttw-welcome:${storeId}`, '1');
      } catch {
        /* noop */
      }
    }, SEED.STORE_ID);

    // 1) Catálogo
    await page.goto(STORE_PATH);
    const card = page
      .getByTestId('product-card')
      .filter({ hasText: SEED.PRODUCT.name });
    await expect(card).toBeVisible();

    // 2) Agregar al carrito
    await card.getByTestId('add-to-cart').click();

    // 3) Abrir carrito (esperar a que el botón flotante aparezca) y proceder
    const cartButton = page.getByTestId('cart-button');
    await expect(cartButton).toBeVisible();
    await cartButton.click();

    const cartDialog = page.getByRole('dialog');
    await expect(cartDialog).toBeVisible();
    await cartDialog
      .getByRole('button', { name: /proceder al checkout/i })
      .click();
    await page.waitForURL(/\/checkout$/);

    // 4) Completar datos (retiro + efectivo vienen seleccionados por defecto)
    await page.getByLabel(/nombre completo/i).fill('Cliente E2E');

    // 5) Confirmar pedido (abre popup de WhatsApp de forma síncrona)
    await page.getByRole('button', { name: /confirmar pedido/i }).click();

    // 6) Ticket de confirmación
    await expect(page.getByText(/pedido confirmado/i)).toBeVisible();

    // El total mostrado es el recalculado por el servidor desde Firestore.
    const expectedTotal = priceDigits(SEED.PRODUCT.price); // 8.500
    await expect(
      page.getByText(new RegExp(expectedTotal.replace(/\./g, '\\.'))).first(),
    ).toBeVisible();

    // El link de WhatsApp del pedido apunta a wa.me.
    await expect(
      page.getByRole('link', { name: /reenviar por whatsapp/i }),
    ).toHaveAttribute('href', /wa\.me/);
  });

  test('el checkout vacío invita a volver a la tienda', async ({ page }) => {
    await page.goto(`${STORE_PATH}/checkout`);
    await expect(page.getByText(/tu carrito está vacío/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /volver a la tienda/i }),
    ).toBeVisible();
  });
});
