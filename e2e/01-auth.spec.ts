/**
 * Flujos de autenticación:
 *  - Login con credenciales válidas e inválidas (mensajes de error).
 *  - Registro → onboarding (wizard de 10 pasos) → dashboard.
 *
 * Corre SIN sesión previa (no usa el storageState del owner): el objetivo es
 * probar el login/registro reales.
 */
import { test, expect } from '@playwright/test';
import { SEED } from './helpers/seed-data';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
  test('rechaza credenciales inválidas con un mensaje de error', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByLabel(/email/i).fill('noexiste@tutiendaweb.test');
    await page.getByLabel(/contraseña/i).fill('claveincorrecta');
    await page.getByRole('button', { name: /^iniciar sesión$/i }).click();

    // Sonner muestra el error y NO se redirige al dashboard.
    await expect(
      page.getByText(/credenciales|incorrecta|no existe|inválid/i).first(),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('inicia sesión con credenciales válidas y entra al dashboard', async ({ page }) => {
    await page.goto('/sign-in');

    await page.getByLabel(/email/i).fill(SEED.OWNER_EMAIL);
    await page.getByLabel(/contraseña/i).fill(SEED.OWNER_PASSWORD);
    await page.getByRole('button', { name: /^iniciar sesión$/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Registro → onboarding → dashboard', () => {
  test('crea una cuenta nueva, completa el onboarding y llega al panel', async ({ page }) => {
    const ts = Date.now();
    const email = `e2e-${ts}@tutiendaweb.test`;
    const storeName = `Tienda E2E ${ts}`;

    // ── Sign-up (datos del usuario) ──
    await page.goto('/sign-up');
    // El schema del servidor exige ≥8 chars con mayúscula y número.
    const password = 'TestE2E123';
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/nombre completo/i).fill('Dueño E2E');
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByLabel(/confirmar contraseña/i).fill(password);
    await page.getByLabel(/términos y condiciones/i).check();
    // "Continuar" exacto: en sign-up convive con "Continuar con Google".
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();

    // Redirige al wizard de onboarding.
    await page.waitForURL(/\/onboarding/, { timeout: 20_000 });

    // ── Paso 0: bienvenida ──
    await page.getByRole('button', { name: /empezar ahora/i }).click();

    // ── Paso 1: nombre + categoría (genera el slug automáticamente) ──
    await expect(page.getByRole('heading', { name: /tu negocio/i })).toBeVisible();
    await page.getByPlaceholder(/Mi Tienda Increible/i).fill(storeName);
    await page.getByRole('button', { name: /^continuar$/i }).click();

    // ── Paso 2: dirección (opcional) ──
    await expect(page.getByRole('heading', { name: /tu direccion/i })).toBeVisible();
    await page.getByRole('button', { name: /^continuar$/i }).click();

    // ── Paso 3: WhatsApp ──
    await expect(page.getByRole('heading', { name: /tu contacto/i })).toBeVisible();
    await page.getByPlaceholder(/1234-5678/).fill('1122334455');
    await page.getByRole('button', { name: /^continuar$/i }).click();

    // ── Paso 4: descripción + slug (esperar disponibilidad) ──
    await expect(page.getByRole('heading', { name: /identidad online/i })).toBeVisible();
    await page.getByPlaceholder(/Cuenta un poco/i).fill('Tienda creada por el test E2E.');
    await expect(page.getByText(/¡disponible!/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /^continuar$/i }).click();

    // ── Paso 5: colores (preset por defecto ya seleccionado) ──
    await expect(page.getByRole('heading', { name: /paleta de colores/i })).toBeVisible();
    await page.getByRole('button', { name: /^continuar$/i }).click();

    // ── Paso 6: preview del producto ──
    await expect(page.getByRole('heading', { name: /tu catalogo/i })).toBeVisible();
    await page.getByRole('button', { name: /^continuar$/i }).click();

    // ── Paso 7: compartir por WhatsApp ──
    await expect(page.getByRole('heading', { name: /comparte por whatsapp/i })).toBeVisible();
    await page.getByRole('button', { name: /^continuar$/i }).click();

    // ── Paso 8: prueba gratis ──
    await expect(page.getByRole('heading', { name: /prueba gratis/i })).toBeVisible();
    await page.getByRole('button', { name: /entendido, continuar/i }).click();

    // ── Paso 9: cierre → crear tienda ──
    await expect(page.getByRole('heading', { name: /todo listo/i })).toBeVisible();
    await page.getByRole('button', { name: /crear mi tienda/i }).click();

    // ── Pantalla de éxito → ir al panel ──
    await expect(page.getByText(/felicitaciones/i)).toBeVisible({ timeout: 20_000 });
    await page.getByRole('button', { name: /agregar productos/i }).click();
    await page.waitForURL(/\/dashboard\/products/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/dashboard\/products/);
  });
});
