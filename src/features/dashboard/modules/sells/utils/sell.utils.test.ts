/**
 * Tests unit de sell.utils (Fase 1 · 1B).
 * Foco: calculateItemSubtotal (con variantes), filtros, ordenamiento y CSV.
 * Funciones determinísticas; las fechas se pasan como ISO fijas.
 */
import { describe, expect, it } from 'vitest';
import {
  calculateItemSubtotal,
  calculateOrderTotal,
  calculateTotalRevenue,
  groupProductsByName,
  filterBySearchTerm,
  filterByDateRange,
  sortSales,
  generateSalesCSV,
} from './sell.utils';
import type { Sale, SaleItem } from '../schemas/sell.schema';

function makeItem(over: Partial<SaleItem> = {}): SaleItem {
  return {
    id: 'item-1',
    productId: 'p1',
    productName: 'Cargador',
    categoryId: 'c1',
    quantity: 1,
    unitPrice: 100,
    subtotal: 100,
    variants: [],
    ...over,
  };
}

function makeSaleObj(over: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    orderNumber: 'ORD-1',
    storeId: 'demo-store',
    source: 'web',
    customer: { name: 'Ana' },
    items: [makeItem()],
    delivery: { method: 'retiro' },
    payment: { method: 'efectivo', total: 100 },
    totals: { subtotal: 100, discount: 0, total: 100 },
    metadata: { createdAt: '2026-06-10T10:00:00.000Z', updatedAt: '2026-06-10T10:00:00.000Z' },
    ...over,
  } as Sale;
}

describe('calculateItemSubtotal', () => {
  it('multiplica precio unitario por cantidad sin variantes', () => {
    expect(calculateItemSubtotal(makeItem({ unitPrice: 100, quantity: 3 }))).toBe(300);
  });

  it('suma el precio de las variantes antes de multiplicar', () => {
    const item = makeItem({
      unitPrice: 100,
      quantity: 2,
      variants: [
        { id: 'v1', name: 'Queso', price: 30 },
        { id: 'v2', name: 'Salsa', price: 20 },
      ],
    });
    expect(calculateItemSubtotal(item)).toBe((100 + 50) * 2);
  });
});

describe('calculateOrderTotal / calculateTotalRevenue', () => {
  it('devuelve el total de la venta', () => {
    expect(calculateOrderTotal(makeSaleObj({ totals: { subtotal: 500, discount: 0, deliveryFee: 0, total: 500 } }))).toBe(500);
  });

  it('suma los totales de varias ventas', () => {
    const sales = [
      makeSaleObj({ totals: { subtotal: 100, discount: 0, deliveryFee: 0, total: 100 } }),
      makeSaleObj({ totals: { subtotal: 250, discount: 0, deliveryFee: 0, total: 250 } }),
    ];
    expect(calculateTotalRevenue(sales)).toBe(350);
  });
});

describe('groupProductsByName', () => {
  it('agrupa por nombre (case-insensitive) y acumula cantidad e ingresos', () => {
    const sales = [
      makeSaleObj({ items: [makeItem({ productName: 'Cargador', quantity: 2, unitPrice: 100 })] }),
      makeSaleObj({ items: [makeItem({ productName: 'cargador', quantity: 1, unitPrice: 100 })] }),
    ];
    const stats = groupProductsByName(sales);
    expect(stats.cargador.totalQuantity).toBe(3);
    expect(stats.cargador.totalRevenue).toBe(300);
    expect(stats.cargador.name).toBe('Cargador');
  });
});

describe('filterBySearchTerm', () => {
  const sales = [makeSaleObj({ customer: { name: 'Ana López' } }), makeSaleObj({ customer: { name: 'Beto' } })];

  it('filtra por nombre de cliente sin distinguir mayúsculas', () => {
    expect(filterBySearchTerm(sales, 'ana')).toHaveLength(1);
  });

  it('devuelve todas las ventas si el término está vacío', () => {
    expect(filterBySearchTerm(sales, '   ')).toHaveLength(2);
  });
});

describe('filterByDateRange', () => {
  const sales = [
    makeSaleObj({ id: 'a', metadata: { createdAt: '2026-06-01T10:00:00.000Z', updatedAt: '' } }),
    makeSaleObj({ id: 'b', metadata: { createdAt: '2026-06-15T10:00:00.000Z', updatedAt: '' } }),
  ];

  it('filtra desde startDate inclusive', () => {
    const result = filterByDateRange(sales, new Date('2026-06-10T00:00:00.000Z'));
    expect(result.map((s) => s.id)).toEqual(['b']);
  });

  it('filtra hasta endDate (fin del día) inclusive', () => {
    // Mediodía UTC: evita que setHours(23:59) local cruce el límite de día en cualquier TZ.
    const result = filterByDateRange(sales, undefined, new Date('2026-06-10T12:00:00.000Z'));
    expect(result.map((s) => s.id)).toEqual(['a']);
  });

  it('sin rango devuelve todas', () => {
    expect(filterByDateRange(sales)).toHaveLength(2);
  });
});

describe('sortSales', () => {
  const older = makeSaleObj({ id: 'old', metadata: { createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '' } });
  const newer = makeSaleObj({ id: 'new', metadata: { createdAt: '2026-06-15T00:00:00.000Z', updatedAt: '' } });

  it('ordena por fecha descendente', () => {
    expect(sortSales([older, newer], 'date-desc').map((s) => s.id)).toEqual(['new', 'old']);
  });

  it('ordena por fecha ascendente', () => {
    expect(sortSales([newer, older], 'date-asc').map((s) => s.id)).toEqual(['old', 'new']);
  });

  it('ordena por nombre de cliente ascendente', () => {
    const a = makeSaleObj({ id: 'z', customer: { name: 'Zoe' } });
    const b = makeSaleObj({ id: 'a', customer: { name: 'Ana' } });
    expect(sortSales([a, b], 'customer-asc').map((s) => s.id)).toEqual(['a', 'z']);
  });

  it('ordena por total descendente', () => {
    const lo = makeSaleObj({ id: 'lo', totals: { subtotal: 100, discount: 0, deliveryFee: 0, total: 100 } });
    const hi = makeSaleObj({ id: 'hi', totals: { subtotal: 900, discount: 0, deliveryFee: 0, total: 900 } });
    expect(sortSales([lo, hi], 'total-desc').map((s) => s.id)).toEqual(['hi', 'lo']);
  });

  it('no muta el array original', () => {
    const input = [newer, older];
    sortSales(input, 'date-asc');
    expect(input.map((s) => s.id)).toEqual(['new', 'old']);
  });
});

describe('generateSalesCSV', () => {
  it('genera encabezado y una fila por venta con celdas entrecomilladas', () => {
    const csv = generateSalesCSV([
      makeSaleObj({ customer: { name: 'Ana' }, totals: { subtotal: 17000, discount: 0, deliveryFee: 0, total: 17000 } }),
    ]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('"Fecha","Cliente","Total","Método de Pago","Método de Entrega"');
    expect(lines[1]).toContain('"Ana"');
    expect(lines[1]).toContain('"$17000.00"');
    expect(lines[1]).toContain('"efectivo"');
    expect(lines[1]).toContain('"retiro"');
  });
});
