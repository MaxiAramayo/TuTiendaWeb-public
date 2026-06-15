/**
 * Mocks globales para tests de integración (Fase 2).
 *
 * Se registran como setupFile (ver vitest.integration.config.ts) para que
 * apliquen a TODAS las suites sin repetirlos archivo por archivo.
 *
 * - `react.cache`: en el runtime de Next, los services server-only envuelven sus
 *   lecturas con `cache()` (memoización por request). Fuera de Next, el paquete
 *   `react` no expone `cache`, así que lo shimeamos como identidad (sin
 *   memoizar). Esto es CLAVE en integración: cada test resiembra Firestore, y un
 *   `cache` real devolvería datos viejos entre casos.
 * - `next/cache`: `revalidatePath`/`revalidateTag` requieren el contexto de
 *   request de Next; acá son no-ops.
 */
import { vi } from 'vitest';

vi.mock('react', async (importActual) => {
  const actual = await importActual<typeof import('react')>();
  return {
    ...actual,
    cache: <T,>(fn: T): T => fn,
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: <T,>(fn: T): T => fn,
}));
