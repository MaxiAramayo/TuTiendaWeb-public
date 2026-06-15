/**
 * Factories de datos de prueba.
 *
 * Construyen objetos coherentes con el modelo de Firestore (ver
 * scripts/seed-emulator.ts) y aceptan overrides parciales. Se usan tanto en
 * unit como en integración para no repetir literales en cada test.
 *
 * Regla: los factories devuelven datos VÁLIDOS por defecto; cada test muta lo
 * mínimo necesario para ejercitar el caso (válido/ inválido/ borde).
 */

export const TEST_STORE_ID = 'demo-store';
export const TEST_OWNER_UID = 'demo-owner';

type Override<T> = Partial<T>;

export function makeStore(over: Override<Record<string, unknown>> = {}) {
  return {
    id: TEST_STORE_ID,
    ownerId: TEST_OWNER_UID,
    basicInfo: {
      name: 'Tienda Demo',
      slug: 'tienda-demo',
      description: 'Tienda de prueba',
      type: 'general',
    },
    contactInfo: { whatsapp: '+5491100000000', website: '' },
    settings: {
      currency: 'ARS',
      language: 'es',
      timezone: 'America/Argentina/Buenos_Aires',
      paymentMethods: [
        { id: 'efectivo', name: 'Efectivo', enabled: true },
        { id: 'transferencia', name: 'Transferencia', enabled: true },
      ],
      deliveryMethods: [
        { id: 'retiro', name: 'Retiro en local', type: 'pickup', enabled: true, price: 0 },
        { id: 'delivery', name: 'Envío a domicilio', type: 'delivery', enabled: true, price: 1500 },
      ],
    },
    subscription: { plan: 'pro', active: true, trialUsed: false },
    metadata: {
      ownerId: TEST_OWNER_UID,
      status: 'active',
      version: 1,
      onboardingCompleted: true,
      onboardingStep: 'complete',
    },
    ...over,
  };
}

export function makeProduct(over: Override<Record<string, unknown>> = {}) {
  return {
    storeId: TEST_STORE_ID,
    name: 'Producto de prueba',
    slug: 'producto-de-prueba',
    description: 'Descripción de prueba',
    price: 1000,
    costPrice: 500,
    categoryId: 'cat-cargadores',
    tags: [],
    variants: [],
    imageUrls: [],
    currency: 'ARS',
    status: 'active',
    hasPromotion: false,
    ...over,
  };
}

export function makeCategory(over: Override<Record<string, unknown>> = {}) {
  return {
    storeId: TEST_STORE_ID,
    name: 'Categoría de prueba',
    slug: 'categoria-de-prueba',
    parentId: null,
    isActive: true,
    order: 0,
    ...over,
  };
}

export function makeSale(over: Override<Record<string, unknown>> = {}) {
  return {
    orderNumber: 'ORD-TEST01',
    storeId: TEST_STORE_ID,
    source: 'web',
    customer: { name: 'Cliente Test', phone: '+5491100000000' },
    items: [
      {
        id: 'item-1',
        productId: 'prod-cargador-20w',
        productName: 'Cargador 20W USB-C',
        categoryId: 'cat-cargadores',
        quantity: 2,
        unitPrice: 8500,
        subtotal: 17000,
        variants: [],
      },
    ],
    delivery: { method: 'retiro' },
    payment: { method: 'efectivo', total: 17000 },
    totals: { subtotal: 17000, discount: 0, total: 17000 },
    ...over,
  };
}

/** Sesión simulada para inyectar en Server Actions que llaman getServerSession. */
export function makeSession(over: Override<Record<string, unknown>> = {}) {
  return {
    userId: TEST_OWNER_UID,
    email: 'demo@tutiendaweb.test',
    displayName: 'Dueño Demo',
    photoURL: null,
    emailVerified: true,
    storeId: TEST_STORE_ID,
    role: 'owner',
    ...over,
  };
}
