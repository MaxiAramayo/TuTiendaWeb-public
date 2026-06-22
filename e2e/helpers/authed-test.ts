/**
 * Fixture de Playwright con el owner ya autenticado.
 *
 * Sobrescribe el fixture `page` para hacer login real por UI (`loginAsOwner`)
 * antes de cada test. Los specs autenticados importan `test`/`expect` desde acá
 * en vez de repetir un `beforeEach` de login.
 *
 * (No se usa `storageState`: Chromium no entrega de forma fiable la cookie
 * httpOnly de sesión en la primera navegación de un contexto creado desde
 * storageState; ver hallazgo E2E-07.)
 */
import { test as base, expect } from '@playwright/test';
import { loginAsOwner } from './auth';

export const test = base.extend({
  // El segundo parámetro de un fixture de Playwright se llama `use` por
  // convención, pero eslint-plugin-react-hooks lo confunde con el hook `use`.
  // Lo renombramos a `run` para evitar el falso positivo.
  page: async ({ page }, run) => {
    await loginAsOwner(page);
    await run(page);
  },
});

export { expect };
