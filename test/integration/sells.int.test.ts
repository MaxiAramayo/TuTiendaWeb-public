/**
 * Tests de integración del módulo de ventas (Fase 2).
 *
 * Ejercita el service `sale.service` y las Server Actions `sale.actions` contra
 * Firestore EMULADO: creación con totales recalculados, actualización con
 * notación de punto, filtros de lectura, estadísticas, borrado y la venta
 * pública sin sesión.
 *
 * Guía: docs/test/20-integration-guide.md (sección 2 · Sells).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import admin from 'firebase-admin';

// La sesión la controla cada test; se mockea antes de importar las actions.
vi.mock('@/lib/auth/server-session', () => ({ getServerSession: vi.fn() }));

import { getServerSession } from '@/lib/auth/server-session';
import {
  createSale,
  updateSale,
  getSales,
  calculateSalesStats,
  deleteSale,
} from '@/features/dashboard/modules/sells/services/sale.service';
import {
  createSaleAction,
  deleteSaleAction,
  createPublicSaleAction,
} from '@/features/dashboard/modules/sells/actions/sale.actions';
import type { CreateSaleData } from '@/features/dashboard/modules/sells/schemas/sell.schema';
import { adminDb, clearFirestore } from '../helpers/firebase-emulator';
import { makeSale, makeSession, TEST_STORE_ID } from '../helpers/factories';

const sellsCol = () =>
  adminDb().collection('stores').doc(TEST_STORE_ID).collection('sells');

/** Siembra una venta cruda con createdAt controlable (para filtros/stats). */
async function seedSale(
  id: string,
  over: Record<string, unknown> = {},
  createdAt: Date = new Date(),
) {
  const base = makeSale(over);
  await sellsCol().doc(id).set({
    ...base,
    id,
    metadata: {
      createdAt: admin.firestore.Timestamp.fromDate(createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(createdAt),
    },
  });
}

beforeEach(async () => {
  await clearFirestore();
  vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
});

describe('createSale (service)', () => {
  it('persiste la venta con id generado, metadata y totales recalculados', async () => {
    const sale = await createSale(makeSale() as CreateSaleData, TEST_STORE_ID);

    expect(sale.id).toBeTruthy();
    expect(sale.totals.subtotal).toBe(17000); // 8500 * 2
    expect(sale.totals.total).toBe(17000);
    expect(sale.metadata.createdAt).toBeDefined();

    // El doc realmente quedó en Firestore.
    const snap = await sellsCol().doc(sale.id).get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.totals.subtotal).toBe(17000);
  });

  it('recalcula el subtotal ignorando un subtotal inconsistente de entrada', async () => {
    // El cliente manda totals mentirosos; el service recalcula desde items.
    const data = makeSale({
      items: [
        {
          id: 'i1',
          productId: 'p1',
          productName: 'X',
          categoryId: 'c1',
          quantity: 3,
          unitPrice: 1000,
          subtotal: 1, // mentira
          variants: [],
        },
      ],
      totals: { subtotal: 1, discount: 0, total: 1 },
    }) as CreateSaleData;

    const sale = await createSale(data, TEST_STORE_ID);
    expect(sale.totals.subtotal).toBe(3000);
    expect(sale.totals.total).toBe(3000);
  });
});

describe('updateSale (service)', () => {
  it('actualiza items y recalcula totales aplicando el descuento', async () => {
    const created = await createSale(makeSale() as CreateSaleData, TEST_STORE_ID);

    const updated = await updateSale(
      created.id,
      {
        items: [
          {
            id: 'i1',
            productId: 'p1',
            productName: 'Nuevo',
            categoryId: 'c1',
            quantity: 3,
            unitPrice: 1000,
            subtotal: 0,
            variants: [],
          },
        ],
        totals: { subtotal: 0, discount: 500, total: 0 },
      },
      TEST_STORE_ID,
    );

    expect(updated.totals.subtotal).toBe(3000);
    expect(updated.totals.total).toBe(2500); // 3000 - 500
    expect(updated.payment.total).toBe(2500);

    // Persistido con notación de punto (sin pisar otros campos anidados).
    const snap = await sellsCol().doc(created.id).get();
    expect(snap.data()?.totals.total).toBe(2500);
    expect(snap.data()?.orderNumber).toBe(created.orderNumber); // intacto
  });

  it('lanza error si la venta no existe', async () => {
    await expect(
      updateSale('no-existe', { notes: 'x' }, TEST_STORE_ID),
    ).rejects.toThrow();
  });
});

describe('getSales (service) · filtros', () => {
  beforeEach(async () => {
    await seedSale(
      's1',
      { customer: { name: 'Juan Pérez' }, payment: { method: 'efectivo', total: 100 }, delivery: { method: 'retiro' }, source: 'web' },
      new Date('2026-01-10T12:00:00Z'),
    );
    await seedSale(
      's2',
      { customer: { name: 'María López' }, payment: { method: 'transferencia', total: 200 }, delivery: { method: 'delivery' }, source: 'local' },
      new Date('2026-02-15T12:00:00Z'),
    );
    await seedSale(
      's3',
      { customer: { name: 'Juana Gómez' }, payment: { method: 'efectivo', total: 300 }, delivery: { method: 'retiro' }, source: 'whatsapp' },
      new Date('2026-03-20T12:00:00Z'),
    );
  });

  it('devuelve todas las ventas ordenadas por fecha descendente', async () => {
    const sales = await getSales(TEST_STORE_ID);
    expect(sales.map((s) => s.id)).toEqual(['s3', 's2', 's1']);
  });

  it('filtra por método de pago', async () => {
    const sales = await getSales(TEST_STORE_ID, { paymentMethod: 'efectivo' });
    expect(sales.map((s) => s.id).sort()).toEqual(['s1', 's3']);
  });

  it('filtra por método de entrega', async () => {
    const sales = await getSales(TEST_STORE_ID, { deliveryMethod: 'delivery' });
    expect(sales.map((s) => s.id)).toEqual(['s2']);
  });

  it('filtra por nombre de cliente (case-insensitive, parcial)', async () => {
    const sales = await getSales(TEST_STORE_ID, { customerName: 'jua' });
    expect(sales.map((s) => s.id).sort()).toEqual(['s1', 's3']); // Juan y Juana
  });

  it('filtra por rango de fechas', async () => {
    const sales = await getSales(TEST_STORE_ID, {
      startDate: new Date('2026-02-01T00:00:00Z'),
      endDate: new Date('2026-02-28T00:00:00Z'),
    });
    expect(sales.map((s) => s.id)).toEqual(['s2']);
  });

  it('respeta el límite', async () => {
    const sales = await getSales(TEST_STORE_ID, { limit: 2 });
    expect(sales).toHaveLength(2);
  });
});

describe('calculateSalesStats (service)', () => {
  it('devuelve ceros cuando no hay ventas (sin dividir por cero)', async () => {
    const stats = await calculateSalesStats(TEST_STORE_ID);
    expect(stats).toEqual({
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      todaySales: 0,
    });
  });

  it('suma total, cuenta órdenes y promedia; todaySales solo cuenta hoy', async () => {
    // Dos ventas de hoy y una vieja.
    await seedSale('hoy1', { totals: { subtotal: 1000, discount: 0, total: 1000 } }, new Date());
    await seedSale('hoy2', { totals: { subtotal: 3000, discount: 0, total: 3000 } }, new Date());
    await seedSale(
      'vieja',
      { totals: { subtotal: 5000, discount: 0, total: 5000 } },
      new Date('2020-01-01T12:00:00Z'),
    );

    const stats = await calculateSalesStats(TEST_STORE_ID);
    expect(stats.totalOrders).toBe(3);
    expect(stats.totalSales).toBe(9000);
    expect(stats.averageOrderValue).toBe(3000);
    expect(stats.todaySales).toBe(4000); // solo hoy1 + hoy2
  });
});

describe('Server Actions · ventas', () => {
  it('createSaleAction crea la venta cuando hay sesión', async () => {
    const res = await createSaleAction(makeSale() as CreateSaleData);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.id).toBeTruthy();
  });

  it('createSaleAction rechaza sin sesión y no escribe nada', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);

    const res = await createSaleAction(makeSale() as CreateSaleData);
    expect(res.success).toBe(false);

    const snap = await sellsCol().get();
    expect(snap.size).toBe(0);
  });

  it('deleteSaleAction elimina la venta y devuelve stats recalculadas', async () => {
    const created = await createSale(makeSale() as CreateSaleData, TEST_STORE_ID);

    const res = await deleteSaleAction(created.id);
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.stats.totalOrders).toBe(0);

    const snap = await sellsCol().doc(created.id).get();
    expect(snap.exists).toBe(false);
  });

  it('createPublicSaleAction (sin sesión) valida y persiste la venta del checkout', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);

    const res = await createPublicSaleAction(TEST_STORE_ID, makeSale() as CreateSaleData);
    expect(res.success).toBe(true);
    if (!res.success) return;

    const snap = await sellsCol().doc(res.data.id).get();
    expect(snap.exists).toBe(true);
  });

  it('createPublicSaleAction rechaza una venta con estructura inválida', async () => {
    // delivery=delivery sin dirección → refine del createSaleSchema falla.
    const invalid = makeSale({ delivery: { method: 'delivery', address: '' } }) as CreateSaleData;
    const res = await createPublicSaleAction(TEST_STORE_ID, invalid);
    expect(res.success).toBe(false);

    const snap = await sellsCol().get();
    expect(snap.size).toBe(0);
  });
});
