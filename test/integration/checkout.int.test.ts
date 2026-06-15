/**
 * Tests de integración del checkout público (Fase 2).
 *
 * Foco: la regla H-1 (price-tampering). Se ejercita `buildTrustedSale` y
 * `processCheckoutAction` contra Firestore EMULADO, sembrando productos y
 * configuración reales. El cliente solo dice QUÉ y CUÁNTO; el servidor decide
 * CUÁNTO CUESTA. Estos tests prueban precisamente eso: cualquier precio o costo
 * de envío que mande el cliente se ignora y se recalcula desde Firestore.
 *
 * Guía: docs/test/20-integration-guide.md · Criterio de seguridad F (H-1).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// `react.cache` y `next/cache` se neutralizan globalmente en
// test/helpers/integration-mocks.ts (ver vitest.integration.config.ts).

// IDs deterministas (criterio A): nanoid(6) → orderNumber, nanoid(8) → id de item.
vi.mock('nanoid', () => ({
  nanoid: vi.fn((size?: number) => (size === 6 ? 'ORD001' : 'ITEM0001')),
}));

import { buildTrustedSale, CheckoutValidationError } from '@/features/store/services/checkout.service';
import { processCheckoutAction } from '@/features/store/actions/checkout.actions';
import { adminDb, clearFirestore } from '../helpers/firebase-emulator';
import { makeProduct, makeStore, TEST_STORE_ID } from '../helpers/factories';

/** Siembra un producto en la subcolección real `stores/{storeId}/products`. */
async function seedProduct(id: string, over: Record<string, unknown> = {}) {
  await adminDb()
    .collection('stores')
    .doc(TEST_STORE_ID)
    .collection('products')
    .doc(id)
    .set(makeProduct(over));
}

/** Siembra/actualiza la tienda raíz con settings (métodos de pago/entrega). */
async function seedStore(over: Record<string, unknown> = {}) {
  await adminDb().collection('stores').doc(TEST_STORE_ID).set(makeStore(over));
}

beforeEach(async () => {
  await clearFirestore();
  await seedStore();
});

describe('buildTrustedSale · seguridad H-1', () => {
  it('ignora el precio enviado por el cliente y recalcula desde Firestore', async () => {
    // Arrange: producto real a $1000.
    await seedProduct('p1', { name: 'Cargador 20W', price: 1000, status: 'active' });

    // Act: el cliente "miente" mandando unitPrice: 1.
    const result = await buildTrustedSale({
      storeId: TEST_STORE_ID,
      customerName: 'Cliente Test',
      deliveryMethodId: 'retiro',
      paymentMethodId: 'efectivo',
      items: [{ productId: 'p1', quantity: 2, variantIds: [], unitPrice: 1 } as never],
    });

    // Assert: el precio sale del producto, no del cliente.
    expect(result.saleData.items[0].unitPrice).toBe(1000);
    expect(result.saleData.items[0].subtotal).toBe(2000);
    expect(result.subtotal).toBe(2000);
    expect(result.saleData.items[0].productName).toBe('Cargador 20W'); // snapshot del servidor
  });

  it('toma el costo de envío real de settings.deliveryMethods, no del cliente', async () => {
    await seedProduct('p1', { price: 1000 });

    const result = await buildTrustedSale({
      storeId: TEST_STORE_ID,
      customerName: 'Cliente Test',
      deliveryMethodId: 'delivery',
      paymentMethodId: 'efectivo',
      address: 'Calle Falsa 123, Springfield',
      items: [{ productId: 'p1', quantity: 1, variantIds: [] }],
    });

    expect(result.deliveryFee).toBe(1500); // de makeStore, no del cliente
    expect(result.total).toBe(result.subtotal + 1500);
  });

  it('suma el precio real de las variantes disponibles', async () => {
    await seedProduct('p1', {
      price: 1000,
      variants: [
        { id: 'v1', name: 'Grande', price: 200, isAvailable: true },
        { id: 'v2', name: 'Extra', price: 50, isAvailable: true },
      ],
    });

    const result = await buildTrustedSale({
      storeId: TEST_STORE_ID,
      customerName: 'Cliente Test',
      deliveryMethodId: 'retiro',
      paymentMethodId: 'efectivo',
      items: [{ productId: 'p1', quantity: 1, variantIds: ['v1', 'v2'] }],
    });

    // (1000 + 200 + 50) * 1
    expect(result.saleData.items[0].subtotal).toBe(1250);
    expect(result.subtotal).toBe(1250);
  });
});

describe('buildTrustedSale · validaciones de negocio', () => {
  it('rechaza un producto que no existe', async () => {
    await expect(
      buildTrustedSale({
        storeId: TEST_STORE_ID,
        customerName: 'Cliente Test',
        deliveryMethodId: 'retiro',
        paymentMethodId: 'efectivo',
        items: [{ productId: 'no-existe', quantity: 1, variantIds: [] }],
      }),
    ).rejects.toBeInstanceOf(CheckoutValidationError);
  });

  it('rechaza un producto con status distinto de active', async () => {
    await seedProduct('p1', { status: 'inactive' });

    await expect(
      buildTrustedSale({
        storeId: TEST_STORE_ID,
        customerName: 'Cliente Test',
        deliveryMethodId: 'retiro',
        paymentMethodId: 'efectivo',
        items: [{ productId: 'p1', quantity: 1, variantIds: [] }],
      }),
    ).rejects.toBeInstanceOf(CheckoutValidationError);
  });

  it('rechaza una variante marcada como no disponible', async () => {
    await seedProduct('p1', {
      price: 1000,
      variants: [{ id: 'v1', name: 'Agotada', price: 100, isAvailable: false }],
    });

    await expect(
      buildTrustedSale({
        storeId: TEST_STORE_ID,
        customerName: 'Cliente Test',
        deliveryMethodId: 'retiro',
        paymentMethodId: 'efectivo',
        items: [{ productId: 'p1', quantity: 1, variantIds: ['v1'] }],
      }),
    ).rejects.toBeInstanceOf(CheckoutValidationError);
  });

  it('rechaza un método de pago inexistente en la tienda', async () => {
    await seedProduct('p1');

    await expect(
      buildTrustedSale({
        storeId: TEST_STORE_ID,
        customerName: 'Cliente Test',
        deliveryMethodId: 'retiro',
        paymentMethodId: 'mercadopago', // no está en makeStore
        items: [{ productId: 'p1', quantity: 1, variantIds: [] }],
      }),
    ).rejects.toThrow('El método de pago seleccionado no está disponible');
  });

  it('rechaza un método de pago deshabilitado', async () => {
    await seedStore({
      settings: {
        ...makeStore().settings,
        paymentMethods: [{ id: 'efectivo', name: 'Efectivo', enabled: false }],
      },
    });
    await seedProduct('p1');

    await expect(
      buildTrustedSale({
        storeId: TEST_STORE_ID,
        customerName: 'Cliente Test',
        deliveryMethodId: 'retiro',
        paymentMethodId: 'efectivo',
        items: [{ productId: 'p1', quantity: 1, variantIds: [] }],
      }),
    ).rejects.toThrow('El método de pago seleccionado no está disponible');
  });

  it('exige dirección cuando el método es delivery', async () => {
    await seedProduct('p1');

    await expect(
      buildTrustedSale({
        storeId: TEST_STORE_ID,
        customerName: 'Cliente Test',
        deliveryMethodId: 'delivery',
        paymentMethodId: 'efectivo',
        address: '   ', // vacía tras trim
        items: [{ productId: 'p1', quantity: 1, variantIds: [] }],
      }),
    ).rejects.toThrow('La dirección es obligatoria para delivery');
  });
});

describe('buildTrustedSale · happy path', () => {
  it('genera orderNumber con formato ORD-xxxxxx y total = subtotal + envío', async () => {
    await seedProduct('p1', { price: 1000 });

    const result = await buildTrustedSale({
      storeId: TEST_STORE_ID,
      customerName: 'Cliente Test',
      deliveryMethodId: 'delivery',
      paymentMethodId: 'transferencia',
      address: 'Av. Siempreviva 742, Local 3',
      items: [{ productId: 'p1', quantity: 3, variantIds: [] }],
    });

    expect(result.saleData.orderNumber).toMatch(/^ORD-.{6}$/);
    expect(result.subtotal).toBe(3000);
    expect(result.total).toBe(4500); // 3000 + 1500
    expect(result.deliveryMethodName).toBe('Envío a domicilio');
    expect(result.paymentMethodName).toBe('Transferencia');
  });
});

describe('processCheckoutAction · flujo completo H-1', () => {
  it('recalcula precios desde Firestore y persiste la venta confiable', async () => {
    await seedProduct('p1', { name: 'Cargador 20W', price: 1000, status: 'active' });

    const result = await processCheckoutAction({
      storeId: TEST_STORE_ID,
      formData: {
        nombre: 'Cliente Test',
        formaDeConsumir: 'retiro',
        formaDePago: 'efectivo',
      },
      // El carrito NO trae precios; el servidor los recalcula.
      items: [{ productId: 'p1', quantity: 2, variantIds: [] }],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.subtotal).toBe(2000);
    expect(result.data.total).toBe(2000);
    expect(result.data.orderNumber).toMatch(/^ORD-.{6}$/);
    expect(result.data.whatsappMessage).toContain('Cargador 20W');
    expect(result.data.whatsappNumber).toBe('5491100000000');

    // La venta quedó persistida con el precio real, no con uno falso.
    const snap = await adminDb()
      .collection('stores')
      .doc(TEST_STORE_ID)
      .collection('sells')
      .get();
    expect(snap.size).toBe(1);
    const sale = snap.docs[0].data();
    expect(sale.items[0].unitPrice).toBe(1000);
    expect(sale.totals.subtotal).toBe(2000);
  });

  it('devuelve error de formulario cuando la dirección de delivery es muy corta', async () => {
    await seedProduct('p1');

    const result = await processCheckoutAction({
      storeId: TEST_STORE_ID,
      formData: {
        nombre: 'Cliente Test',
        formaDeConsumir: 'delivery',
        formaDePago: 'efectivo',
        direccion: 'corta', // < 10 chars → rechazo del checkoutFormSchema
      },
      items: [{ productId: 'p1', quantity: 1, variantIds: [] }],
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.direccion).toBeDefined();

    // Nada se persiste si el formulario es inválido.
    const snap = await adminDb()
      .collection('stores')
      .doc(TEST_STORE_ID)
      .collection('sells')
      .get();
    expect(snap.size).toBe(0);
  });

  it('rechaza el checkout si la tienda no existe', async () => {
    const result = await processCheckoutAction({
      storeId: 'tienda-inexistente',
      formData: {
        nombre: 'Cliente Test',
        formaDeConsumir: 'retiro',
        formaDePago: 'efectivo',
      },
      items: [{ productId: 'p1', quantity: 1, variantIds: [] }],
    });

    expect(result.success).toBe(false);
  });
});
