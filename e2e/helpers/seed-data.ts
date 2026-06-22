/**
 * Constantes espejo del seed de emuladores (`scripts/seed-emulator.ts`).
 *
 * Los specs E2E corren contra los datos sembrados por `npm run seed:emulator`.
 * Mantener estos valores sincronizados con el seed: si cambia el seed, cambiar acá.
 */

export const SEED = {
  /** Slug público de la tienda demo → ruta del catálogo: `/${STORE_SLUG}` */
  STORE_SLUG: 'tienda-demo',
  STORE_NAME: 'Tienda Demo',
  STORE_ID: 'demo-store',
  WHATSAPP: '+5491100000000',

  /** Credenciales del owner sembrado (onboarding ya completado). */
  OWNER_EMAIL: 'demo@tutiendaweb.test',
  OWNER_PASSWORD: '123456',

  /** Producto de referencia para el flujo de checkout. */
  PRODUCT: {
    name: 'Cargador 20W USB-C',
    price: 8500,
  },
} as const;

/** Ruta del catálogo público de la tienda demo. */
export const STORE_PATH = `/${SEED.STORE_SLUG}`;

/** Ruta del checkout público de la tienda demo. */
export const CHECKOUT_PATH = `/${SEED.STORE_SLUG}/checkout`;

/**
 * Formatea un monto igual que `formatPrice` (es-AR, ARS, sin decimales) para
 * comparaciones en la UI. Devuelve solo la parte numérica con separador de
 * miles (p. ej. `8.500`) — el símbolo y los espacios varían por entorno, así
 * que las aserciones usan esta parte como regex tolerante.
 */
export function priceDigits(amount: number): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(amount);
}
