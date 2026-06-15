/**
 * Tests unit de loginSchema (Fase 1 · 1A).
 * Matriz: docs/test/matrices/login.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import { loginSchema } from './login.schema';

const valid = { email: 'user@example.com', password: 'secret1' };

describe('loginSchema', () => {
  describe('casos válidos', () => {
    it('acepta email + password válidos', () => {
      const r = loginSchema.safeParse(valid);
      expect(r.success).toBe(true);
    });

    it('normaliza el email a minúsculas', () => {
      const r = loginSchema.safeParse({ ...valid, email: 'USER@Example.COM' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.email).toBe('user@example.com');
    });

    // QUIRK conocido: el schema encadena .email() ANTES de .trim(), por lo que
    // un email con espacios alrededor se rechaza en vez de recortarse (el
    // .trim() queda inefectivo para validación). Ver docs/test/60 (hallazgos).
    it('rechaza email con espacios alrededor (trim inefectivo, comportamiento actual)', () => {
      const r = loginSchema.safeParse({ ...valid, email: '  user@example.com  ' });
      expect(r.success).toBe(false);
    });

    it('acepta remember opcional', () => {
      expect(loginSchema.safeParse({ ...valid, remember: true }).success).toBe(true);
      expect(loginSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('email', () => {
    it('rechaza email vacío con "Email es requerido"', () => {
      const r = loginSchema.safeParse({ ...valid, email: '' });
      expect(issueFor(r, 'email')).toBe('Email es requerido');
    });

    it('rechaza formato inválido con "Formato de email inválido"', () => {
      const r = loginSchema.safeParse({ ...valid, email: 'no-es-email' });
      expect(issueFor(r, 'email')).toBe('Formato de email inválido');
    });

    it('rechaza email ausente (undefined)', () => {
      const r = loginSchema.safeParse({ password: 'secret1' });
      expect(issueFor(r, 'email')).toBeDefined();
    });
  });

  describe('password', () => {
    it('rechaza menos de 6 caracteres con mensaje exacto', () => {
      const r = loginSchema.safeParse({ ...valid, password: '12345' });
      expect(issueFor(r, 'password')).toBe('La contraseña debe tener al menos 6 caracteres');
    });

    it('acepta exactamente 6 caracteres (borde)', () => {
      expect(loginSchema.safeParse({ ...valid, password: '123456' }).success).toBe(true);
    });
  });
});
