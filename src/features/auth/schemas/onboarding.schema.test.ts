/**
 * Tests unit de onboarding schemas (Fase 1 · 1A).
 * Foco: onboardingCompleteSchema (campos del wizard), colores hex, mapa de
 * campos por paso (ONBOARDING_STEP_FIELDS).
 * Matriz: docs/test/matrices/onboarding.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import {
  onboardingCompleteSchema,
  onboardingStoreTypeEnum,
  ONBOARDING_STEP_FIELDS,
  ONBOARDING_TOTAL_STEPS,
} from './onboarding.schema';

const valid = {
  name: 'Tienda Demo',
  storeType: 'retail' as const,
  whatsapp: '+5491112345678',
  description: 'Una descripción de prueba suficientemente larga',
  slug: 'tienda-demo',
};

describe('onboardingCompleteSchema', () => {
  it('acepta un onboarding válido', () => {
    expect(onboardingCompleteSchema.safeParse(valid).success).toBe(true);
  });

  describe('name', () => {
    it('recorta los espacios', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, name: '  Tienda  ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.name).toBe('Tienda');
    });

    it('rechaza nombre < 2 caracteres', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, name: 'a' });
      expect(issueFor(r, 'name')).toBe('El nombre debe tener al menos 2 caracteres');
    });

    it('rechaza nombre > 100 caracteres', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, name: 'a'.repeat(101) });
      expect(issueFor(r, 'name')).toBe('Maximo 100 caracteres');
    });

    it('rechaza nombre ausente con el mensaje requerido', () => {
      const { name, ...rest } = valid;
      expect(issueFor(onboardingCompleteSchema.safeParse(rest), 'name')).toBe('El nombre es requerido');
    });
  });

  describe('storeType', () => {
    it.each(['restaurant', 'clothing', 'retail', 'beauty', 'other'])(
      'acepta el tipo "%s"',
      (storeType) => {
        expect(onboardingCompleteSchema.safeParse({ ...valid, storeType }).success).toBe(true);
      },
    );

    it('rechaza un tipo inválido con el mensaje del errorMap', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, storeType: 'services' });
      expect(issueFor(r, 'storeType')).toBe('Selecciona un tipo de tienda');
    });

    it('el enum expone los 5 tipos del onboarding', () => {
      expect(onboardingStoreTypeEnum.options).toHaveLength(5);
    });
  });

  describe('whatsapp', () => {
    it('rechaza whatsapp < 10 caracteres', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, whatsapp: '+12345' });
      expect(issueFor(r, 'whatsapp')).toBe('Numero de WhatsApp invalido');
    });

    it('rechaza whatsapp > 25 caracteres', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, whatsapp: '+'.padEnd(26, '5') });
      expect(issueFor(r, 'whatsapp')).toBe('Numero de WhatsApp invalido');
    });

    it('rechaza whatsapp ausente con el mensaje requerido', () => {
      const { whatsapp, ...rest } = valid;
      expect(issueFor(onboardingCompleteSchema.safeParse(rest), 'whatsapp')).toBe('El WhatsApp es requerido');
    });
  });

  describe('description', () => {
    it('rechaza descripción < 10 caracteres', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, description: 'corta' });
      expect(issueFor(r, 'description')).toBe('La descripcion debe tener al menos 10 caracteres');
    });

    it('rechaza descripción > 300 caracteres', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, description: 'a'.repeat(301) });
      expect(issueFor(r, 'description')).toBe('Maximo 300 caracteres');
    });
  });

  describe('slug', () => {
    it('rechaza slug < 3 caracteres', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, slug: 'ab' });
      expect(issueFor(r, 'slug')).toBe('La URL debe tener al menos 3 caracteres');
    });

    it('rechaza slug > 50 caracteres', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, slug: 'a'.repeat(51) });
      expect(issueFor(r, 'slug')).toBe('Maximo 50 caracteres');
    });

    it('rechaza slug con caracteres inválidos', () => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, slug: 'Tienda Demo' });
      expect(issueFor(r, 'slug')).toBe('Solo minusculas, numeros y guiones');
    });
  });

  describe('colores hex (opcionales)', () => {
    it('acepta hex de 6 dígitos', () => {
      expect(onboardingCompleteSchema.safeParse({ ...valid, primaryColor: '#FF0000' }).success).toBe(true);
    });

    it('acepta hex de 3 dígitos', () => {
      expect(onboardingCompleteSchema.safeParse({ ...valid, primaryColor: '#abc' }).success).toBe(true);
    });

    it.each(['FF0000', '#GG0000', '#FF00', 'rojo'])('rechaza color inválido "%s"', (primaryColor) => {
      const r = onboardingCompleteSchema.safeParse({ ...valid, primaryColor });
      expect(issueFor(r, 'primaryColor')).toBe('Color invalido');
    });
  });
});

describe('ONBOARDING_STEP_FIELDS / ONBOARDING_TOTAL_STEPS', () => {
  it('define 10 pasos (0-9)', () => {
    expect(ONBOARDING_TOTAL_STEPS).toBe(10);
    expect(Object.keys(ONBOARDING_STEP_FIELDS)).toHaveLength(10);
  });

  it('valida nombre y tipo en el paso 1', () => {
    expect(ONBOARDING_STEP_FIELDS[1]).toEqual(['name', 'storeType']);
  });

  it('valida whatsapp en el paso 3', () => {
    expect(ONBOARDING_STEP_FIELDS[3]).toEqual(['whatsapp']);
  });

  it('valida descripción y slug en el paso 4', () => {
    expect(ONBOARDING_STEP_FIELDS[4]).toEqual(['description', 'slug']);
  });

  it.each([0, 2, 5, 6, 7, 8, 9])('no exige campos en el paso informativo %i', (step) => {
    expect(ONBOARDING_STEP_FIELDS[step]).toEqual([]);
  });
});
