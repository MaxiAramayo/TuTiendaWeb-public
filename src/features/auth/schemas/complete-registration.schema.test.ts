/**
 * Tests unit de completeRegistrationSchema (Fase 1 · 1A).
 * Foco: merge de userProfileSchema + storeSetupSchema (campos de ambos requeridos).
 */
import { describe, expect, it } from 'vitest';
import { failedPaths } from '../../../../test/helpers/zod';
import { completeRegistrationSchema } from './complete-registration.schema';

const valid = {
  displayName: 'Juan Pérez',
  phone: '',
  photoURL: '',
  storeName: 'Tienda Demo',
  storeType: 'retail' as const,
  slug: 'tienda-demo',
  address: '',
  phone2: undefined,
};

describe('completeRegistrationSchema', () => {
  it('acepta un registro completo válido (perfil + tienda)', () => {
    expect(completeRegistrationSchema.safeParse(valid).success).toBe(true);
  });

  it('falla si falta un campo del perfil de usuario', () => {
    const { displayName, ...rest } = valid;
    expect(failedPaths(completeRegistrationSchema.safeParse(rest))).toContain('displayName');
  });

  it('falla si falta un campo del setup de la tienda', () => {
    const { storeName, ...rest } = valid;
    expect(failedPaths(completeRegistrationSchema.safeParse(rest))).toContain('storeName');
  });
});
