/**
 * Configuración de Vitest para tests UNIT (Fase 1).
 *
 * Define dos "projects" internos:
 *  - unit: lógica pura / schemas Zod / services aislados  → environment node
 *  - dom:  componentes y formularios React                → environment jsdom
 *
 * Los tests de INTEGRACIÓN (emuladores) y de REGLAS usan una config aparte
 * (`vitest.integration.config.ts`) para no levantar emuladores en el run rápido.
 *
 * Comandos:
 *   npm run test         → corre unit + dom
 *   npm run test:cov     → idem con cobertura y thresholds (gate de CI)
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Resolución nativa de los paths de tsconfig (@/, @features/, @shared/).
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Excluir del run rápido todo lo que necesita emuladores o navegador.
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/e2e/**',
      '**/test/integration/**',
      '**/test/rules/**',
      '**/*.int.test.ts',
      '**/*.rules.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // El gate mide SOLO schemas Zod y lógica pura (utils): lo que el run unit
      // ejecuta de forma determinista y sin renderizar. Los componentes tienen
      // tests, pero su .tsx NO entra al include (render parcial en jsdom = ruido
      // y cobertura engañosa). Las capas que se cubren por otros runners
      // —services (integración, Fase 2), reglas
      // (Fase 3), UI completa (E2E, Fase 4)— NO entran al `include`, porque el
      // provider v8 del run unit no las observa y las contaría como 0% (falso
      // negativo). Medir cobertura combinada cross-runner es trabajo futuro
      // (ver docs/test/50-coverage-and-ci.md y hallazgo F5-01).
      include: [
        'src/features/**/schemas/**/*.ts',
        'src/features/**/utils/**/*.ts',
        'src/shared/utils/**/*.ts',
        'src/lib/utils/**/*.ts',
        'src/lib/utils.ts',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/types/**',
        'src/**/*.types.ts',
      ],
      // Thresholds calibrados al valor real del run unit (Fase 5), con ~2pt de
      // margen. Funcionan como ratchet: previenen que la cobertura baje del piso
      // actual y obligan a testear (o excluir justificadamente) el código nuevo.
      // A medida que se cubran los utils pendientes (theme/profile/qr/error-
      // handling — ver hallazgo F5-02) estos números se suben.
      thresholds: {
        // Gate global del scope unit-testeable (medido: 56/45/66/56).
        lines: 54,
        statements: 54,
        functions: 63,
        branches: 43,
        // Schemas Zod: fuente única de validación, se exige cobertura casi total.
        'src/features/**/schemas/**': {
          lines: 95,
          statements: 95,
          functions: 90,
          branches: 90,
        },
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts', 'test/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx', 'test/unit/**/*.test.tsx'],
        },
      },
    ],
  },
});
