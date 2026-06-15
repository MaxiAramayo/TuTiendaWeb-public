/**
 * Tests unit de userProfileSchema (Fase 1 · 1A).
 * Foco: displayName (min/max/trim), phone E.164 opcional, photoURL URL opcional.
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import { userProfileSchema } from './user-profile.schema';

const valid = { displayName: 'Juan Pérez', phone: '', photoURL: '' };

describe('userProfileSchema', () => {
  it('acepta un perfil válido', () => {
    expect(userProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('recorta el displayName', () => {
    const r = userProfileSchema.safeParse({ ...valid, displayName: '  Juan  ' });
    if (r.success) expect(r.data.displayName).toBe('Juan');
  });

  it('rechaza displayName < 3 caracteres', () => {
    expect(issueFor(userProfileSchema.safeParse({ ...valid, displayName: 'ab' }), 'displayName')).toBe(
      'El nombre debe tener al menos 3 caracteres',
    );
  });

  it('rechaza displayName > 50 caracteres', () => {
    expect(issueFor(userProfileSchema.safeParse({ ...valid, displayName: 'a'.repeat(51) }), 'displayName')).toBe(
      'El nombre no puede exceder 50 caracteres',
    );
  });

  describe('phone (opcional, E.164)', () => {
    it.each(['', '+5491123456789', '12025551234'])('acepta "%s"', (phone) => {
      expect(userProfileSchema.safeParse({ ...valid, phone }).success).toBe(true);
    });

    it('rechaza un teléfono inválido', () => {
      expect(userProfileSchema.safeParse({ ...valid, phone: '0123' }).success).toBe(false);
    });
  });

  describe('photoURL (opcional, URL)', () => {
    it('acepta string vacío y URL válida', () => {
      expect(userProfileSchema.safeParse({ ...valid, photoURL: '' }).success).toBe(true);
      expect(userProfileSchema.safeParse({ ...valid, photoURL: 'https://x.com/a.png' }).success).toBe(true);
    });

    it('rechaza una URL inválida', () => {
      expect(userProfileSchema.safeParse({ ...valid, photoURL: 'no-url' }).success).toBe(false);
    });
  });
});
