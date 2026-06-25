/**
 * Configuración de la tienda: editar el WhatsApp de contacto y verificar que
 * el cambio persiste.
 *
 * Usa la fixture `authed-test`. Se edita el WhatsApp (no el slug) a propósito: el
 * slug es la ruta del catálogo y cambiarlo rompería el aislamiento del resto de
 * los specs (checkout, productos).
 */
import { test, expect } from './helpers/authed-test';

test('edita el WhatsApp de contacto y persiste tras recargar', async ({ page }) => {
  const newNumber = '1133224455';

  await page.goto('/dashboard/settings/general');

  // El perfil se carga async y hace `reset(formData)`: esperar a que el input
  // tenga el número sembrado ANTES de editar, si no el reset borra el cambio.
  const whatsapp = page.getByLabel(/whatsapp/i);
  await expect(whatsapp).toHaveValue(/\d{3,}/);

  const saveContact = page.getByTestId('save-contact');

  // El perfil dispara resets async que reponen el form a no-dirty (hallazgo
  // E2E-09): reintentar editar+guardar hasta que el guardado tome efecto.
  //
  // Claves de robustez:
  // - Si un intento previo YA guardó, react-hook-form rebasa el form e `isDirty`
  //   vuelve a `false` con el nuevo número como baseline; reescribir el MISMO número
  //   no vuelve a ensuciar el form. Por eso cada intento detecta primero si el número
  //   ya quedó guardado (valor + botón deshabilitado = guardado + rebaseline) y corta.
  // - Se ESPERA la completitud real del guardado vía el toast "información de contacto
  //   guardada", que aparece recién después de `updateContactInfoAction` +
  //   `getProfileAction`. NO basta `toBeDisabled` tras el click: el botón también se
  //   deshabilita por `isSectionSaving` (guardado en vuelo), y recargar en ese momento
  //   aborta el request (no persiste).
  await expect(async () => {
    const current = (await whatsapp.inputValue()).replace(/\D/g, '');
    if (current.includes(newNumber)) {
      await expect(saveContact).toBeDisabled({ timeout: 1_000 });
      return;
    }

    await whatsapp.fill(newNumber);
    await expect(saveContact).toBeEnabled({ timeout: 2_000 });
    await saveContact.click({ timeout: 2_000 });
    await expect(
      page.getByText(/información de contacto guardada/i),
    ).toBeVisible({ timeout: 6_000 });
  }).toPass({ timeout: 30_000 });

  // Recargar y confirmar que el número quedó persistido (comparando solo dígitos,
  // tolerante a que el número se reformatee con espacios/guiones).
  await page.reload();
  const persisted = (await page.getByLabel(/whatsapp/i).inputValue()).replace(/\D/g, '');
  expect(persisted).toContain(newNumber);
});
