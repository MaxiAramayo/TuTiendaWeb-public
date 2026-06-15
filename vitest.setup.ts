/**
 * Setup global para tests unit/dom de Vitest.
 *
 * - Registra los matchers de @testing-library/jest-dom (toBeInTheDocument, etc.)
 * - Limpia el DOM tras cada test (evita fugas de estado entre tests = determinismo)
 * - Mockea módulos de Next que no existen fuera del runtime del servidor
 *   (`next/cache`, `next/navigation`, `server-only`), para poder importar
 *   Server Actions/components sin arrancar Next.
 *
 * Ver docs/test/02-conventions.md y docs/test/03-acceptance-criteria.md.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// `server-only` lanza si se importa en un bundle de cliente; en tests es no-op.
vi.mock('server-only', () => ({}));

// next/cache: revalidatePath/revalidateTag son no-ops en unit tests.
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

// next/navigation: router y helpers de navegación stubbeados.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));
