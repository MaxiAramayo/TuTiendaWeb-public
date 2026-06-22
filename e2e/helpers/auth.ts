/**
 * Helper de autenticación para E2E.
 *
 * Login real por UI (`hybridLogin` → `loginAction`), que contra los emuladores
 * deja la cookie httpOnly de sesión. Los specs autenticados llaman a
 * `loginAsOwner` en un `beforeEach`: el login se hace en la misma página y las
 * navegaciones siguientes son same-site, así que la cookie viaja correctamente.
 *
 * (Se evaluó reutilizar `storageState`, pero Chromium no entrega de forma fiable
 * la cookie httpOnly de sesión en la primera navegación de un contexto creado
 * desde storageState; ver hallazgo E2E-07.)
 */
import { expect, type Page } from '@playwright/test';
import { SEED } from './seed-data';

/**
 * Inicia sesión por la UI con las credenciales del owner sembrado y espera a
 * aterrizar en el dashboard. El owner del seed ya tiene el onboarding completo,
 * así que `hybridLogin` redirige directo a `/dashboard`.
 */
export async function loginAsOwner(page: Page): Promise<void> {
  await page.goto('/sign-in');

  await page.getByLabel(/email/i).fill(SEED.OWNER_EMAIL);
  await page.getByLabel(/contraseña/i).fill(SEED.OWNER_PASSWORD);
  await page.getByRole('button', { name: /^iniciar sesión$/i }).click();

  // La redirección la dispara `window.location.href = '/dashboard'`.
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);
}
