/**
 * Configuración de Vitest para tests de INTEGRACIÓN y de REGLAS (Fases 2 y 3).
 *
 * Estos tests requieren los emuladores de Firebase corriendo. Se ejecutan
 * preferentemente vía `firebase emulators:exec` para que el ciclo de vida del
 * emulador lo gestione la CLI (ver script `test:emu` en package.json).
 *
 * - environment node (no DOM).
 * - singleThread + sin paralelismo entre archivos: las suites comparten un
 *   único emulador y deben aislarse limpiando su propio estado (ver
 *   docs/test/20-integration-guide.md). Evita carreras entre archivos.
 * - timeouts amplios: el arranque del Admin SDK contra emulador puede tardar.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/integration/**/*.int.test.ts', 'test/rules/**/*.rules.test.ts'],
    setupFiles: ['./test/helpers/integration-setup.ts', './test/helpers/integration-mocks.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    // Ejecuta los archivos de a uno (sin paralelismo) para no abrir múltiples
    // conexiones concurrentes al emulador y permitir aislamiento por suite.
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
