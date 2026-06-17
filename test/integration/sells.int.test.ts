/**
 * Tests de integración del módulo de ventas (Fase 2).
 *
 * Ejercita el service `sale.service.ts` y las Server Actions `sale.actions.ts`
 * contra Firestore EMULADO (Admin SDK, sin mocks de Firebase). Cubre el cálculo
 * de totales (incluida la regresión de INT-01: el envío integra el total),
 * filtros de lectura, actualización con notación-punto, borrado y estadísticas.
 *
 * Guía: docs/test/20-integration-guide.md · Criterio de salida (Fase 2) → Sells.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import admin from 'firebase-admin';

// `react.cache` y `next/cache` se neutralizan globalmente en
// test/helpers/integration-mocks.ts (ver vitest.integration.config.ts).

// Las actions llaman getServerSession; se controla por test.
vi.mock('@/lib/auth/server-session', () => ({
  getServerSession: vi.fn(),
}));

import type { ServerSession } from '@/lib/auth/server-session';
import { getServerSession } from '@/lib/auth/server-session';
import {
  createSale,
  updateSale,
  deleteSale,
  getSales,
  getSaleById,
  calculateSalesStats,
} from '@/features/dashboard/modules/sells/services/sale.service';
import {
  createSaleAction,
  getSalesAction,
  deleteSaleAction,
} from '@/features/dashboard/modules/sells/actions/sale.actions';
import type { CreateSaleData } from '@/features/dashboard/modules/sells/schemas/sell.schema';
import { adminDb, clearFirestore } from '../helpers/firebase-emulator';
import { makeSale, makeSession, TEST_STORE_ID } from '../helpers/factories';

/** Referencia a la subcolección real `stores/{storeId}/sells`. */
function sellsRef(storeId = TEST_STORE_ID) {
  return adminDb().collection('stores').doc(storeId).collection('sells');
}

/**
 * Siembra una venta YA PERSISTIDA con `metadata.createdAt` controlado.
 * Necesario porque `getSales` ordena por `metadata.createdAt`: un doc sin ese
 * campo quedaría fuera de los resultados.
 */
async function seedSale(over: Record<string, unknown> = {}, createdAt = new Date('2026-06-10T12:00:00Z')) {
  const ref = sellsRef().doc();
  await ref.set({
    ...makeSale(over),
    id: ref.id,
    metadata: { createdAt, updatedAt: createdAt },
  });
  return ref.id;
}

/** Construye un CreateSaleData válido reutilizando el factory. */
function makeCreateData(over: Record<string, unknown> = {}): CreateSaleData {
  return makeSale(over) as unknown as CreateSaleData;
}

beforeEach(async () => {
  await clearFirestore();
  vi.mocked(getServerSession).mockResolvedValue(makeSession() as ServerSession);
});

afterEach(() => {
  vi.useRealTimers();
});

// =============================================================================
// createSale
// =============================================================================
describe('createSale · cálculo de totales', () => {
  it('recalcula el subtotal por item desde unitPrice y variantes', async () => {
    const sale = await createSale(
      makeCreateData({
        items: [
          {
            id: 'i1',
            productId: 'p1',
            productName: 'Combo',
            categoryId: 'c1',
            quantity: 2,
            unitPrice: 1000,
            subtotal: 999999, // mentira del cliente: se ignora
            variants: [{ id: 'v1', name: 'Extra', price: 200 }],
          },
        ],
        totals: { subtotal: 0, discount: 0, deliveryFee: 0, total: 0 },
      }),
      TEST_STORE_ID,
    );

    // (1000 + 200) * 2
    expect(sale.items[0].subtotal).toBe(2400);
    expect(sale.totals.subtotal).toBe(2400);
    expect(sale.totals.total).toBe(2400);
  });

  it('resta el descuento del total', async () => {
    const sale = await createSale(
      makeCreateData({
        items: [
          { id: 'i1', productId: 'p1', productName: 'X', categoryId: 'c1', quantity: 1, unitPrice: 1000, subtotal: 1000, variants: [] },
        ],
        totals: { subtotal: 1000, discount: 300, deliveryFee: 0, total: 0 },
      }),
      TEST_STORE_ID,
    );

    expect(sale.totals.discount).toBe(300);
    expect(sale.totals.total).toBe(700); // 1000 - 300
  });

  // --- Regresión INT-01 ---
  it('suma el costo de envío al total y lo persiste (INT-01)', async () => {
    const sale = await createSale(
      makeCreateData({
        items: [
          { id: 'i1', productId: 'p1', productName: 'X', categoryId: 'c1', quantity: 1, unitPrice: 2000, subtotal: 2000, variants: [] },
        ],
        delivery: { method: 'delivery', address: 'Av. Siempreviva 742' },
        totals: { subtotal: 2000, discount: 0, deliveryFee: 1500, total: 0 },
      }),
      TEST_STORE_ID,
    );

    expect(sale.totals.deliveryFee).toBe(1500);
    expect(sale.totals.total).toBe(3500); // 2000 - 0 + 1500
    expect(sale.payment.total).toBe(3500);

    // Persistido en Firestore, no solo en el objeto devuelto.
    const snap = await sellsRef().doc(sale.id).get();
    expect(snap.data()?.totals.deliveryFee).toBe(1500);
    expect(snap.data()?.totals.total).toBe(3500);
  });

  it('combina descuento y envío: total = subtotal - discount + deliveryFee', async () => {
    const sale = await createSale(
      makeCreateData({
        items: [
          { id: 'i1', productId: 'p1', productName: 'X', categoryId: 'c1', quantity: 1, unitPrice: 5000, subtotal: 5000, variants: [] },
        ],
        delivery: { method: 'delivery', address: 'Calle 123, Ciudad' },
        totals: { subtotal: 5000, discount: 500, deliveryFee: 800, total: 0 },
      }),
      TEST_STORE_ID,
    );

    expect(sale.totals.total).toBe(5300); // 5000 - 500 + 800
  });

  it('usa el orderNumber provisto', async () => {
    const sale = await createSale(makeCreateData({ orderNumber: 'ORD-MANUAL' }), TEST_STORE_ID);
    expect(sale.orderNumber).toBe('ORD-MANUAL');
  });

  it('rechaza la creación sin storeId', async () => {
    await expect(createSale(makeCreateData(), '')).rejects.toThrow('Store ID is required');
  });
});

// =============================================================================
// getSales
// =============================================================================
describe('getSales · lectura y filtros', () => {
  it('devuelve [] cuando no hay storeId', async () => {
    expect(await getSales('')).toEqual([]);
  });

  it('ordena las ventas por fecha descendente', async () => {
    await seedSale({ orderNumber: 'ORD-OLD' }, new Date('2026-06-01T10:00:00Z'));
    await seedSale({ orderNumber: 'ORD-NEW' }, new Date('2026-06-15T10:00:00Z'));

    const sales = await getSales(TEST_STORE_ID);

    expect(sales.map((s) => s.orderNumber)).toEqual(['ORD-NEW', 'ORD-OLD']);
  });

  it('filtra por método de pago', async () => {
    await seedSale({ orderNumber: 'EF', payment: { method: 'efectivo', total: 100 } });
    await seedSale({ orderNumber: 'TR', payment: { method: 'transferencia', total: 100 } });

    const sales = await getSales(TEST_STORE_ID, { paymentMethod: 'transferencia' });

    expect(sales).toHaveLength(1);
    expect(sales[0].orderNumber).toBe('TR');
  });

  it('filtra por método de entrega', async () => {
    await seedSale({ orderNumber: 'RET', delivery: { method: 'retiro' } });
    await seedSale({ orderNumber: 'DEL', delivery: { method: 'delivery', address: 'X' } });

    const sales = await getSales(TEST_STORE_ID, { deliveryMethod: 'delivery' });

    expect(sales.map((s) => s.orderNumber)).toEqual(['DEL']);
  });

  it('filtra por nombre de cliente sin distinguir mayúsculas', async () => {
    await seedSale({ orderNumber: 'A', customer: { name: 'Juan Pérez' } });
    await seedSale({ orderNumber: 'B', customer: { name: 'Ana López' } });

    const sales = await getSales(TEST_STORE_ID, { customerName: 'pérez' });

    expect(sales).toHaveLength(1);
    expect(sales[0].orderNumber).toBe('A');
  });

  it('limita la cantidad de resultados', async () => {
    await seedSale({ orderNumber: '1' }, new Date('2026-06-01T10:00:00Z'));
    await seedSale({ orderNumber: '2' }, new Date('2026-06-02T10:00:00Z'));
    await seedSale({ orderNumber: '3' }, new Date('2026-06-03T10:00:00Z'));

    const sales = await getSales(TEST_STORE_ID, { limit: 2 });

    expect(sales).toHaveLength(2);
  });

  it('filtra por rango de fechas', async () => {
    await seedSale({ orderNumber: 'MAYO' }, new Date('2026-05-15T10:00:00Z'));
    await seedSale({ orderNumber: 'JUNIO' }, new Date('2026-06-15T10:00:00Z'));

    const sales = await getSales(TEST_STORE_ID, {
      startDate: new Date('2026-06-01T00:00:00Z'),
      endDate: new Date('2026-06-30T00:00:00Z'),
    });

    expect(sales.map((s) => s.orderNumber)).toEqual(['JUNIO']);
  });
});

// =============================================================================
// getSaleById
// =============================================================================
describe('getSaleById', () => {
  it('devuelve la venta cuando existe', async () => {
    const id = await seedSale({ orderNumber: 'ORD-X' });

    const sale = await getSaleById(TEST_STORE_ID, id);

    expect(sale?.orderNumber).toBe('ORD-X');
  });

  it('devuelve null cuando no existe', async () => {
    expect(await getSaleById(TEST_STORE_ID, 'no-existe')).toBeNull();
  });

  it('devuelve null con ids vacíos', async () => {
    expect(await getSaleById('', '')).toBeNull();
  });
});

// =============================================================================
// updateSale
// =============================================================================
describe('updateSale', () => {
  it('recalcula los totales al reemplazar los items (preservando el envío, INT-01)', async () => {
    const id = await seedSale({
      delivery: { method: 'delivery', address: 'X' },
      totals: { subtotal: 1000, discount: 0, deliveryFee: 1500, total: 2500 },
    });

    const updated = await updateSale(
      id,
      {
        items: [
          { id: 'i1', productId: 'p1', productName: 'Nuevo', categoryId: 'c1', quantity: 2, unitPrice: 1000, subtotal: 0, variants: [] },
        ],
      },
      TEST_STORE_ID,
    );

    expect(updated.totals.subtotal).toBe(2000);
    expect(updated.totals.total).toBe(3500); // 2000 + envío 1500 preservado
  });

  it('preserva el descuento existente al reemplazar items sin enviar totals (INT-02)', async () => {
    const id = await seedSale({
      totals: { subtotal: 1000, discount: 200, deliveryFee: 0, total: 800 },
    });

    const updated = await updateSale(
      id,
      {
        items: [
          { id: 'i1', productId: 'p1', productName: 'Nuevo', categoryId: 'c1', quantity: 2, unitPrice: 1000, subtotal: 0, variants: [] },
        ],
      },
      TEST_STORE_ID,
    );

    expect(updated.totals.subtotal).toBe(2000);
    expect(updated.totals.discount).toBe(200); // no se resetea
    expect(updated.totals.total).toBe(1800); // 2000 - 200 descuento preservado
  });

  it('recalcula el total al cambiar solo el descuento', async () => {
    const id = await seedSale({ totals: { subtotal: 1000, discount: 0, deliveryFee: 0, total: 1000 } });

    const updated = await updateSale(id, { totals: { subtotal: 1000, discount: 200, deliveryFee: 0, total: 0 } }, TEST_STORE_ID);

    expect(updated.totals.total).toBe(800); // 1000 - 200
  });

  it('lanza error si la venta no existe', async () => {
    await expect(
      updateSale('no-existe', { notes: 'x' }, TEST_STORE_ID),
    ).rejects.toThrow('Sale not found');
  });
});

// =============================================================================
// deleteSale
// =============================================================================
describe('deleteSale', () => {
  it('elimina la venta', async () => {
    const id = await seedSale();

    await deleteSale(id, TEST_STORE_ID);

    expect((await sellsRef().doc(id).get()).exists).toBe(false);
  });

  it('lanza error si falta el saleId', async () => {
    await expect(deleteSale('', TEST_STORE_ID)).rejects.toThrow('Store ID and Sale ID are required');
  });
});

// =============================================================================
// calculateSalesStats
// =============================================================================
describe('calculateSalesStats', () => {
  it('devuelve ceros cuando no hay ventas', async () => {
    const stats = await calculateSalesStats(TEST_STORE_ID);

    expect(stats).toEqual({ totalSales: 0, totalOrders: 0, averageOrderValue: 0, todaySales: 0 });
  });

  it('agrega total, cantidad y promedio; cuenta las ventas de hoy', async () => {
    // Solo congelamos Date: si falseáramos también setTimeout, el IO del SDK de
    // Firestore (que usa timers internos) quedaría colgado.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-06-17T15:00:00Z'));

    await seedSale({ totals: { subtotal: 100, discount: 0, deliveryFee: 0, total: 100 } }, new Date('2026-06-17T09:00:00Z')); // hoy
    await seedSale({ totals: { subtotal: 300, discount: 0, deliveryFee: 0, total: 300 } }, new Date('2026-06-10T09:00:00Z')); // antes

    const stats = await calculateSalesStats(TEST_STORE_ID);

    expect(stats.totalSales).toBe(400);
    expect(stats.totalOrders).toBe(2);
    expect(stats.averageOrderValue).toBe(200);
    expect(stats.todaySales).toBe(100); // solo la del 17
  });
});

// =============================================================================
// Server Actions (getServerSession mockeado)
// =============================================================================
describe('sale.actions · autorización y flujo', () => {
  it('createSaleAction persiste la venta con la sesión actual', async () => {
    const result = await createSaleAction(makeCreateData({ orderNumber: 'ORD-ACT' }));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sale.orderNumber).toBe('ORD-ACT');

    const snap = await sellsRef().get();
    expect(snap.size).toBe(1);
  });

  it('createSaleAction rechaza sin sesión', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const result = await createSaleAction(makeCreateData());

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors._form).toEqual(['No autenticado']);
    expect((await sellsRef().get()).size).toBe(0);
  });

  it('getSalesAction devuelve ventas y estadísticas de la tienda de la sesión', async () => {
    await seedSale({ orderNumber: 'ORD-1', totals: { subtotal: 500, discount: 0, deliveryFee: 0, total: 500 } });

    const result = await getSalesAction();

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sales).toHaveLength(1);
    expect(result.data.stats.totalOrders).toBe(1);
  });

  it('deleteSaleAction rechaza sin sesión', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const result = await deleteSaleAction('cualquier-id');

    expect(result.success).toBe(false);
  });
});
