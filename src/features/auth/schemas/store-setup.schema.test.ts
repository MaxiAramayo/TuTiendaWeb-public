/**
 * Tests unit de storeSetupSchema (Fase 1 · 1A).
 * Foco: enum de tipos de tienda (errorMap), slug regex, teléfono E.164, trim.
 * Matriz: docs/test/matrices/store-setup.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import { storeSetupSchema, storeTypeEnum } from './store-setup.schema';

const valid = {
  storeName: 'Tienda Demo',
  storeType: 'retail' as const,
  slug: 'tienda-demo',
  address: '',
  phone: '',
};

describe('storeSetupSchema', () => {
  describe('casos válidos', () => {
    it('acepta una configuración mínima válida', () => {
      expect(storeSetupSchema.safeParse(valid).success).toBe(true);
    });

    it('acepta address y phone válidos', () => {
      const r = storeSetupSchema.safeParse({
        ...valid,
        address: 'Av. Siempreviva 742',
        phone: '+5491112345678',
      });
      expect(r.success).toBe(true);
    });

    it('acepta address y phone ausentes (undefined)', () => {
      const { address, phone, ...rest } = valid;
      expect(storeSetupSchema.safeParse(rest).success).toBe(true);
    });
  });

  describe('storeName', () => {
    it('recorta los espacios del nombre', () => {
      const r = storeSetupSchema.safeParse({ ...valid, storeName: '  Tienda Demo  ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.storeName).toBe('Tienda Demo');
    });

    it('rechaza nombre < 3 caracteres', () => {
      const r = storeSetupSchema.safeParse({ ...valid, storeName: 'ab' });
      expect(issueFor(r, 'storeName')).toBe('El nombre debe tener al menos 3 caracteres');
    });

    it('acepta nombre de exactamente 3 caracteres (borde)', () => {
      expect(storeSetupSchema.safeParse({ ...valid, storeName: 'abc' }).success).toBe(true);
    });

    it('rechaza nombre > 100 caracteres', () => {
      const r = storeSetupSchema.safeParse({ ...valid, storeName: 'a'.repeat(101) });
      expect(issueFor(r, 'storeName')).toBe('El nombre no puede exceder 100 caracteres');
    });

    it('rechaza nombre ausente con el mensaje requerido', () => {
      const { storeName, ...rest } = valid;
      const r = storeSetupSchema.safeParse(rest);
      expect(issueFor(r, 'storeName')).toBe('Nombre de la tienda es requerido');
    });
  });

  describe('storeType', () => {
    it.each([
      'restaurant', 'retail', 'services', 'clothing', 'electronics', 'beauty',
      'home', 'sports', 'books', 'health', 'automotive', 'other',
    ])('acepta el tipo de tienda "%s"', (storeType) => {
      expect(storeSetupSchema.safeParse({ ...valid, storeType }).success).toBe(true);
    });

    it('rechaza un tipo de tienda inválido con el mensaje del errorMap', () => {
      const r = storeSetupSchema.safeParse({ ...valid, storeType: 'teletransporte' });
      expect(issueFor(r, 'storeType')).toBe('Selecciona un tipo de tienda válido');
    });

    it('el enum expone los 12 tipos soportados', () => {
      expect(storeTypeEnum.options).toHaveLength(12);
    });
  });

  describe('slug', () => {
    it('rechaza slug < 3 caracteres', () => {
      const r = storeSetupSchema.safeParse({ ...valid, slug: 'ab' });
      expect(issueFor(r, 'slug')).toBe('El nombre del sitio debe tener al menos 3 caracteres');
    });

    it('rechaza slug > 50 caracteres', () => {
      const r = storeSetupSchema.safeParse({ ...valid, slug: 'a'.repeat(51) });
      expect(issueFor(r, 'slug')).toBe('El nombre del sitio no puede exceder 50 caracteres');
    });

    it.each(['Tienda', 'tienda demo', 'tienda_demo', 'tiénda', 'tienda!'])(
      'rechaza slug con caracteres inválidos: "%s"',
      (slug) => {
        const r = storeSetupSchema.safeParse({ ...valid, slug });
        expect(issueFor(r, 'slug')).toBe('Solo letras minúsculas, números y guiones');
      },
    );

    it('acepta slug con minúsculas, números y guiones', () => {
      expect(storeSetupSchema.safeParse({ ...valid, slug: 'tienda-123' }).success).toBe(true);
    });
  });

  describe('address (opcional)', () => {
    it('acepta string vacío', () => {
      expect(storeSetupSchema.safeParse({ ...valid, address: '' }).success).toBe(true);
    });

    it('rechaza una dirección no vacía con menos de 10 caracteres', () => {
      expect(storeSetupSchema.safeParse({ ...valid, address: 'Calle 1' }).success).toBe(false);
    });

    it('rechaza una dirección de más de 200 caracteres', () => {
      expect(storeSetupSchema.safeParse({ ...valid, address: 'a'.repeat(201) }).success).toBe(false);
    });
  });

  describe('phone (opcional, E.164)', () => {
    it('acepta string vacío', () => {
      expect(storeSetupSchema.safeParse({ ...valid, phone: '' }).success).toBe(true);
    });

    it.each(['+5491112345678', '5491112345678'])('acepta el teléfono "%s"', (phone) => {
      expect(storeSetupSchema.safeParse({ ...valid, phone }).success).toBe(true);
    });

    it.each(['0123456789', 'abc', '+', '+1234567890123456'])(
      'rechaza el teléfono inválido "%s"',
      (phone) => {
        expect(storeSetupSchema.safeParse({ ...valid, phone }).success).toBe(false);
      },
    );
  });
});
