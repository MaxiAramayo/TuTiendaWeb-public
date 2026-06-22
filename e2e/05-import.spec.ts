/**
 * Import de productos por Excel desde el dashboard.
 *
 * Usa la sesión del owner. Sube fixtures generados por `make-e2e-fixtures.ts`:
 *  - productos-validos.xlsx   → import completo (pantalla de éxito).
 *  - productos-invalidos.xlsx → preview marca filas con errores.
 */
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { loginAsOwner } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await loginAsOwner(page);
});

const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

async function openImportDialog(page: import('@playwright/test').Page) {
  await page.goto('/dashboard/products');
  await page.getByRole('button', { name: /importar excel/i }).click();
  await expect(
    page.getByRole('heading', { name: /importar productos desde excel/i }),
  ).toBeVisible();
}

test('importa un archivo válido y muestra la pantalla de éxito', async ({ page }) => {
  await openImportDialog(page);

  await page.locator('input[type="file"]').setInputFiles(fixture('productos-validos.xlsx'));

  // Paso preview: 2 filas válidas, 0 con errores.
  await expect(page.getByText(/filas válidas/i)).toBeVisible();
  await page.getByRole('button', { name: /^importar \d+ producto/i }).click();

  // Pantalla final.
  await expect(page.getByText(/importación completada/i)).toBeVisible({ timeout: 20_000 });
});

test('marca las filas con errores en el preview de un archivo inválido', async ({ page }) => {
  await openImportDialog(page);

  await page.locator('input[type="file"]').setInputFiles(fixture('productos-invalidos.xlsx'));

  // El preview marca el bloque de filas con errores (no se importarán).
  await expect(page.getByText(/no se importarán/i)).toBeVisible();
});
