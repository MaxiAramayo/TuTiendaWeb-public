/**
 * Tests unit de productSchema (Fase 1 · 1A).
 * Foco: coerción de precios, preprocess de subcategoría vacía, variantes, defaults.
 * Matriz: docs/test/matrices/product.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import { productSchema } from './product.schema';

const valid = { name: 'Cargador 20W', price: 1000, categoryId: 'cat-1' };

describe('productSchema', () => {
  describe('casos válidos y defaults', () => {
    it('acepta el mínimo y aplica defaults', () => {
      const r = productSchema.safeParse(valid);
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.costPrice).toBe(0);
        expect(r.data.tags).toEqual([]);
        expect(r.data.variants).toEqual([]);
        expect(r.data.hasPromotion).toBe(false);
        expect(r.data.active).toBe(true);
      }
    });

    it('coacciona price string numérico a number', () => {
      const r = productSchema.safeParse({ ...valid, price: '2500' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.price).toBe(2500);
    });
  });

  describe('name', () => {
    it('rechaza menos de 3 caracteres', () => {
      const r = productSchema.safeParse({ ...valid, name: 'ab' });
      expect(issueFor(r, 'name')).toBe('Nombre debe tener al menos 3 caracteres');
    });
  });

  describe('price', () => {
    it('rechaza 0 (no positivo)', () => {
      const r = productSchema.safeParse({ ...valid, price: 0 });
      expect(issueFor(r, 'price')).toBe('Precio debe ser positivo');
    });

    it('rechaza negativo', () => {
      const r = productSchema.safeParse({ ...valid, price: -5 });
      expect(issueFor(r, 'price')).toBe('Precio debe ser positivo');
    });

    it('rechaza no numérico', () => {
      const r = productSchema.safeParse({ ...valid, price: 'abc' });
      expect(issueFor(r, 'price')).toBeDefined();
    });
  });

  describe('costPrice', () => {
    it('rechaza negativo', () => {
      const r = productSchema.safeParse({ ...valid, costPrice: -1 });
      expect(issueFor(r, 'costPrice')).toBe('El costo no puede ser negativo');
    });

    it('acepta 0 (borde)', () => {
      expect(productSchema.safeParse({ ...valid, costPrice: 0 }).success).toBe(true);
    });
  });

  describe('categoryId', () => {
    it('rechaza vacío con "Categoría requerida"', () => {
      const r = productSchema.safeParse({ ...valid, categoryId: '' });
      expect(issueFor(r, 'categoryId')).toBe('Categoría requerida');
    });
  });

  describe('subcategoryId (preprocess)', () => {
    it('normaliza string vacío a undefined', () => {
      const r = productSchema.safeParse({ ...valid, subcategoryId: '' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.subcategoryId).toBeUndefined();
    });

    it('normaliza null a undefined', () => {
      const r = productSchema.safeParse({ ...valid, subcategoryId: null });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.subcategoryId).toBeUndefined();
    });

    it('conserva un id real', () => {
      const r = productSchema.safeParse({ ...valid, subcategoryId: 'sub-1' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.subcategoryId).toBe('sub-1');
    });
  });

  describe('variants', () => {
    it('rechaza variante sin nombre', () => {
      const r = productSchema.safeParse({
        ...valid,
        variants: [{ id: 'v1', name: '', price: 100 }],
      });
      expect(issueFor(r, 'variants.0.name')).toBe('Nombre de variante requerido');
    });

    it('rechaza variante con precio negativo', () => {
      const r = productSchema.safeParse({
        ...valid,
        variants: [{ id: 'v1', name: 'Grande', price: -1 }],
      });
      expect(issueFor(r, 'variants.0.price')).toBe('Precio no puede ser negativo');
    });

    it('aplica isAvailable=true por defecto', () => {
      const r = productSchema.safeParse({
        ...valid,
        variants: [{ id: 'v1', name: 'Grande', price: 100 }],
      });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.variants[0].isAvailable).toBe(true);
    });
  });
});
