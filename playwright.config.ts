/**
 * Configuración de Playwright para tests E2E (Fase 4).
 *
 * Los flujos corren contra `next dev` + emuladores de Firebase, con datos
 * sembrados (nunca contra producción). El job de CI dedicado instala los
 * browsers; en local se instalan con `npx playwright install chromium`.
 *
 * Comandos:
 *   npm run test:e2e       → headless
 *   npm run test:e2e:ui    → modo UI interactivo
 *
 * Pre-requisito local: emuladores arriba (`npm run emulators`) y seed
 * (`npm run seed:emulator`). Ver docs/test/40-e2e-guide.md.
 */
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Arranca la app en modo dev apuntando a emuladores. Asume emuladores ya
  // levantados (en CI se orquesta con firebase emulators:exec).
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
    },
  },
});
