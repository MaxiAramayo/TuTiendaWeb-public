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
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/types/**',
        'src/**/*.types.ts',
        'src/app/**', // rutas/layouts: se cubren con E2E, no con unit
        'src/**/loading.tsx',
        'src/**/*.stories.tsx',
      ],
      // Gate global (Fase 5). Overrides por carpeta crítica abajo.
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
        // Lógica sensible de dinero / auth: exigencia ≥90%.
        'src/features/store/services/**': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 85,
        },
        'src/features/dashboard/modules/sells/**': {
          lines: 90,
          statements: 90,
          functions: 90,
          branches: 85,
        },
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
