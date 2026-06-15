/**
 * Tests unit de category schemas (Fase 1 · 1A).
 * Foco: refine "letras o números", slug regex, jerarquía parentId, reorder.
 * Matriz: docs/test/matrices/category.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import {
  categorySchema,
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
} from './category.schema';

describe('categorySchema', () => {
  const valid = { name: 'Cargadores', slug: 'cargadores' };

  it('acepta una categoría válida con defaults (parentId null, isActive true)', () => {
    const r = categorySchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.parentId).toBeNull();
      expect(r.data.isActive).toBe(true);
    }
  });

  describe('name', () => {
    it('recorta espacios', () => {
      const r = categorySchema.safeParse({ ...valid, name: '  Cables  ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.name).toBe('Cables');
    });

    it('rechaza menos de 2 caracteres', () => {
      const r = categorySchema.safeParse({ ...valid, name: 'a' });
      expect(issueFor(r, 'name')).toBe('El nombre debe tener al menos 2 caracteres');
    });

    it('rechaza más de 60 caracteres', () => {
      const r = categorySchema.safeParse({ ...valid, name: 'a'.repeat(61) });
      expect(issueFor(r, 'name')).toBe('El nombre no puede superar los 60 caracteres');
    });

    it('rechaza nombre solo de símbolos (refine)', () => {
      const r = categorySchema.safeParse({ ...valid, name: '!!!' });
      expect(issueFor(r, 'name')).toBe('El nombre debe contener letras o números');
    });

    it('acepta nombre con acentos (À-ÿ)', () => {
      expect(categorySchema.safeParse({ ...valid, name: 'Té & Café' }).success).toBe(true);
    });
  });

  describe('slug', () => {
    it('rechaza mayúsculas/espacios', () => {
      const r = categorySchema.safeParse({ ...valid, slug: 'Cargadores Tipo C' });
      expect(issueFor(r, 'slug')).toBe('Slug inválido');
    });

    it('acepta minúsculas, números y guiones', () => {
      expect(categorySchema.safeParse({ ...valid, slug: 'cargador-tipo-c-2' }).success).toBe(true);
    });
  });

  describe('createCategorySchema', () => {
    it('acepta parentId null (categoría principal)', () => {
      expect(createCategorySchema.safeParse({ name: 'Cables', parentId: null }).success).toBe(true);
    });

    it('rechaza parentId string vacío', () => {
      const r = createCategorySchema.safeParse({ name: 'Cables', parentId: '' });
      expect(r.success).toBe(false);
    });
  });

  describe('updateCategorySchema', () => {
    it('requiere id', () => {
      const r = updateCategorySchema.safeParse({ name: 'Cables' });
      expect(issueFor(r, 'id')).toBeDefined();
    });

    it('permite actualización parcial con id', () => {
      expect(updateCategorySchema.safeParse({ id: 'cat-1', isActive: false }).success).toBe(true);
    });
  });

  describe('reorderCategoriesSchema', () => {
    it('rechaza lista vacía', () => {
      expect(reorderCategoriesSchema.safeParse([]).success).toBe(false);
    });

    it('rechaza order negativo', () => {
      expect(reorderCategoriesSchema.safeParse([{ id: 'c1', order: -1 }]).success).toBe(false);
    });

    it('acepta pares id/order válidos', () => {
      expect(
        reorderCategoriesSchema.safeParse([
          { id: 'c1', order: 0 },
          { id: 'c2', order: 1 },
        ]).success,
      ).toBe(true);
    });
  });
});
