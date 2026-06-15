/**
 * Tests unit de resetPasswordSchema (Fase 1 · 1A).
 * Foco: email requerido, formato RFC, normalización lowercase/trim.
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import { resetPasswordSchema } from './reset-password.schema';

describe('resetPasswordSchema', () => {
  it('acepta un email válido y lo normaliza a minúsculas', () => {
    const r = resetPasswordSchema.safeParse({ email: 'ANA@Demo.COM' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('ana@demo.com');
  });

  it('rechaza email vacío con el mensaje requerido', () => {
    expect(issueFor(resetPasswordSchema.safeParse({ email: '' }), 'email')).toBe('Email es requerido');
  });

  it('rechaza email con formato inválido', () => {
    expect(issueFor(resetPasswordSchema.safeParse({ email: 'no-email' }), 'email')).toBe(
      'Formato de email inválido',
    );
  });
});
