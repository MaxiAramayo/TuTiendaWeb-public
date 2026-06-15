/**
 * Tests unit de sell schemas (Fase 1 · 1A).
 * Foco: saleItemSchema (int/nonnegative), totals (default discount),
 * createSaleSchema (refine de dirección en delivery).
 * Matriz: docs/test/matrices/sell.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../../../test/helpers/zod';
import { makeSale } from '../../../../../../test/helpers/factories';
import {
  saleItemSchema,
  customerInfoSchema,
  saleTotalsSchema,
  createSaleSchema,
} from './sell.schema';

const validItem = {
  id: 'item-1',
  productId: 'prod-1',
  productName: 'Cargador 20W',
  categoryId: 'cat-1',
  quantity: 2,
  unitPrice: 8500,
  subtotal: 17000,
  variants: [],
};

describe('saleItemSchema', () => {
  it('acepta un item válido', () => {
    expect(saleItemSchema.safeParse(validItem).success).toBe(true);
  });

  it.each([0, -1, 1.5])('rechaza quantity inválida (%s)', (quantity) => {
    expect(saleItemSchema.safeParse({ ...validItem, quantity }).success).toBe(false);
  });

  it('rechaza unitPrice negativo', () => {
    expect(saleItemSchema.safeParse({ ...validItem, unitPrice: -1 }).success).toBe(false);
  });

  it('acepta unitPrice 0 (borde nonnegative)', () => {
    expect(saleItemSchema.safeParse({ ...validItem, unitPrice: 0, subtotal: 0 }).success).toBe(true);
  });
});

describe('customerInfoSchema', () => {
  it('rechaza nombre vacío con el mensaje requerido', () => {
    expect(issueFor(customerInfoSchema.safeParse({ name: '' }), 'name')).toBe(
      'El nombre del cliente es requerido',
    );
  });

  it('rechaza email con formato inválido si se provee', () => {
    expect(customerInfoSchema.safeParse({ name: 'Ana', email: 'no-email' }).success).toBe(false);
  });
});

describe('saleTotalsSchema', () => {
  it('aplica discount 0 por defecto', () => {
    const r = saleTotalsSchema.safeParse({ subtotal: 100, total: 100 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.discount).toBe(0);
  });

  it('rechaza total negativo', () => {
    expect(saleTotalsSchema.safeParse({ subtotal: 100, total: -1 }).success).toBe(false);
  });
});

describe('createSaleSchema', () => {
  it('acepta una venta válida (factory)', () => {
    expect(createSaleSchema.safeParse(makeSale()).success).toBe(true);
  });

  it('rechaza una venta sin items', () => {
    const r = createSaleSchema.safeParse(makeSale({ items: [] }));
    expect(issueFor(r, 'items')).toBe('Debe agregar al menos un item');
  });

  describe('refine de dirección en delivery', () => {
    it('rechaza delivery sin dirección', () => {
      const r = createSaleSchema.safeParse(makeSale({ delivery: { method: 'delivery' } }));
      expect(issueFor(r, 'delivery.address')).toBe('La dirección es obligatoria para delivery');
    });

    it('rechaza delivery con dirección de solo espacios', () => {
      const r = createSaleSchema.safeParse(makeSale({ delivery: { method: 'delivery', address: '   ' } }));
      expect(issueFor(r, 'delivery.address')).toBe('La dirección es obligatoria para delivery');
    });

    it('acepta delivery con dirección válida', () => {
      const r = createSaleSchema.safeParse(
        makeSale({ delivery: { method: 'delivery', address: 'Av. Siempreviva 742' } }),
      );
      expect(r.success).toBe(true);
    });

    it('acepta retiro sin dirección', () => {
      expect(createSaleSchema.safeParse(makeSale({ delivery: { method: 'retiro' } })).success).toBe(true);
    });
  });
});
