/**
 * Alta de producto desde el dashboard y reflejo en el catálogo público.
 *
 * Usa la fixture `authed-test` (login real por UI antes de cada test). Crea un
 * producto con nombre único por corrida para no chocar con otros specs ni con
 * re-ejecuciones.
 */
import { test, expect } from './helpers/authed-test';
import { STORE_PATH } from './helpers/seed-data';

test('crea un producto y lo muestra en el listado y en el catálogo público', async ({ page }) => {
  const ts = Date.now();
  const productName = `Producto E2E ${ts}`;

  // 1) Ir a productos y abrir el alta
  await page.goto('/dashboard/products');
  await page.getByRole('button', { name: /crear producto/i }).click();
  await page.waitForURL(/\/dashboard\/products\/new/);

  // 2) Completar el formulario (nombre, precio, categoría)
  await page.getByPlaceholder(/^Ej:/).fill(productName);
  await page.getByTestId('product-price').fill('1234');
  await page
    .locator('select')
    .filter({ hasText: 'Seleccionar categoría' })
    .selectOption({ label: 'Cables' });

  // 3) Guardar → vuelve al listado
  await page.getByRole('button', { name: /guardar/i }).click();
  await page.waitForURL(/\/dashboard\/products$/, { timeout: 20_000 });

  // 4) Aparece en el listado del dashboard
  await expect(page.getByText(productName)).toBeVisible({ timeout: 15_000 });

  // 5) Y en el catálogo público de la tienda
  await page.goto(STORE_PATH);
  await expect(page.getByText(productName)).toBeVisible({ timeout: 15_000 });
});
