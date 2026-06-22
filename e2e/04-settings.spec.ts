/**
 * Configuración de la tienda: editar el WhatsApp de contacto y verificar que
 * el cambio persiste.
 *
 * Usa la sesión del owner. Se edita el WhatsApp (no el slug) a propósito: el
 * slug es la ruta del catálogo y cambiarlo rompería el aislamiento del resto de
 * los specs (checkout, productos). Ver hallazgo E2E sobre selectores de guardado.
 */
import { test, expect } from '@playwright/test';
import { loginAsOwner } from './helpers/auth';

test.beforeEach(async ({ page }) => {
  await loginAsOwner(page);
});

test('edita el WhatsApp de contacto y persiste tras recargar', async ({ page }) => {
  const newNumber = '1133224455';

  await page.goto('/dashboard/settings/general');

  // El perfil se carga async y hace `reset(formData)`: esperar a que el input
  // tenga el número sembrado ANTES de editar, si no el reset borra el cambio.
  const whatsapp = page.getByLabel(/whatsapp/i);
  await expect(whatsapp).toHaveValue(/\d{3,}/);

  // Hay un "Guardar cambios" por sección (Básica, Contacto, …). El de Contacto
  // es el segundo. Ver hallazgo E2E-03 (falta selector estable) y E2E-09
  // (el perfil dispara resets async que reponen el form a no-dirty).
  // Reintentar editar+guardar hasta que el guardado tome efecto evita esa carrera.
  const saveContact = page.getByRole('button', { name: /guardar cambios/i }).nth(1);
  await expect(async () => {
    await whatsapp.fill(newNumber);
    await expect(saveContact).toBeEnabled({ timeout: 2_000 });
    await saveContact.click({ timeout: 2_000 });
    await expect(
      page.getByText(/información de contacto guardada/i),
    ).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 25_000 });

  // Recargar y confirmar que el número quedó persistido.
  await page.reload();
  await expect(page.getByLabel(/whatsapp/i)).toHaveValue(new RegExp(newNumber));
});
