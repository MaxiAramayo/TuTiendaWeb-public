/**
 * Tests unit de productImportRowSchema (Fase 1 · 1A).
 * Foco: transform de `extras` ("Nombre:Precio;…"), split de tags, `activo`→bool,
 * coerce de precio/costo, mensajes de error, MAX_IMPORT_PRODUCTS.
 * Matriz: docs/test/matrices/product-import.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import { productImportRowSchema, MAX_IMPORT_PRODUCTS } from './product-import.schema';

const validRow = {
  nombre: 'Producto Demo',
  precio: '1000',
  categoria: 'Cargadores',
};

describe('productImportRowSchema', () => {
  it('acepta una fila mínima válida y aplica defaults', () => {
    const r = productImportRowSchema.safeParse(validRow);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.costo).toBe(0);
      expect(r.data.subcategoria).toBeUndefined();
      expect(r.data.tags).toEqual([]);
      expect(r.data.activo).toBe(true);
      expect(r.data.extras).toEqual([]);
    }
  });

  describe('nombre', () => {
    it('rechaza nombre < 3 caracteres', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, nombre: 'ab' });
      expect(issueFor(r, 'nombre')).toBe('Nombre debe tener al menos 3 caracteres');
    });
  });

  describe('precio (coerce)', () => {
    it('convierte el string a número', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, precio: '2500' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.precio).toBe(2500);
    });

    it('rechaza precio no numérico', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, precio: 'abc' });
      expect(issueFor(r, 'precio')).toBe('Precio debe ser un número');
    });

    it.each(['0', '-10'])('rechaza precio no positivo "%s"', (precio) => {
      const r = productImportRowSchema.safeParse({ ...validRow, precio });
      expect(issueFor(r, 'precio')).toBe('Precio debe ser mayor a 0');
    });
  });

  describe('costo (coerce, default 0)', () => {
    it('rechaza costo negativo', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, costo: '-1' });
      expect(issueFor(r, 'costo')).toBe('Costo no puede ser negativo');
    });

    it('acepta costo 0 (borde)', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, costo: '0' });
      expect(r.success).toBe(true);
    });
  });

  describe('categoria', () => {
    it('rechaza categoría vacía', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, categoria: '' });
      expect(issueFor(r, 'categoria')).toBe('Categoría requerida');
    });
  });

  describe('subcategoria (transform)', () => {
    it('normaliza string vacío a undefined', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, subcategoria: '' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.subcategoria).toBeUndefined();
    });

    it('normaliza ausente (undefined) a undefined', () => {
      const r = productImportRowSchema.safeParse(validRow);
      if (r.success) expect(r.data.subcategoria).toBeUndefined();
    });

    it('preserva una subcategoría con valor', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, subcategoria: 'USB-C' });
      if (r.success) expect(r.data.subcategoria).toBe('USB-C');
    });
  });

  describe('tags (split)', () => {
    it('separa por coma, recorta y descarta vacíos', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, tags: ' nuevo , oferta ,, ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.tags).toEqual(['nuevo', 'oferta']);
    });

    it('devuelve [] cuando no hay tags', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, tags: '' });
      if (r.success) expect(r.data.tags).toEqual([]);
    });
  });

  describe('activo (transform a boolean)', () => {
    it.each(['no', 'false', '0', 'inactivo', 'NO', ' Inactivo '])(
      'interpreta "%s" como inactivo (false)',
      (activo) => {
        const r = productImportRowSchema.safeParse({ ...validRow, activo });
        if (r.success) expect(r.data.activo).toBe(false);
      },
    );

    it.each(['si', 'true', '1', 'activo'])('interpreta "%s" como activo (true)', (activo) => {
      const r = productImportRowSchema.safeParse({ ...validRow, activo });
      if (r.success) expect(r.data.activo).toBe(true);
    });

    it('por defecto (ausente) es activo', () => {
      const r = productImportRowSchema.safeParse(validRow);
      if (r.success) expect(r.data.activo).toBe(true);
    });
  });

  describe('extras (transform "Nombre:Precio;…")', () => {
    it('parsea un único extra', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, extras: 'Salsa:100' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.extras).toEqual([{ name: 'Salsa', price: 100 }]);
    });

    it('parsea múltiples extras separados por ;', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, extras: 'Salsa:100; Queso:50' });
      if (r.success) {
        expect(r.data.extras).toEqual([
          { name: 'Salsa', price: 100 },
          { name: 'Queso', price: 50 },
        ]);
      }
    });

    it('separa por el ÚLTIMO ":" para tolerar ":" en el nombre', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, extras: 'Combo:Doble:200' });
      if (r.success) expect(r.data.extras).toEqual([{ name: 'Combo:Doble', price: 200 }]);
    });

    it('acepta precio 0 (borde)', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, extras: 'Gratis:0' });
      if (r.success) expect(r.data.extras).toEqual([{ name: 'Gratis', price: 0 }]);
    });

    it('devuelve [] cuando está vacío o en blanco', () => {
      const r = productImportRowSchema.safeParse({ ...validRow, extras: '   ' });
      if (r.success) expect(r.data.extras).toEqual([]);
    });

    it.each(['Salsa', 'Salsa:', 'Salsa:abc', 'Salsa:-1'])(
      'rechaza el extra mal formado "%s" con mensaje custom',
      (token) => {
        const r = productImportRowSchema.safeParse({ ...validRow, extras: token });
        expect(issueFor(r, 'extras')).toBe(
          `Extra "${token}" debe tener formato Nombre:Precio con precio numérico >= 0`,
        );
      },
    );
  });

  it('MAX_IMPORT_PRODUCTS es 300', () => {
    expect(MAX_IMPORT_PRODUCTS).toBe(300);
  });
});
