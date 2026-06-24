/**
 * Tests unit de registerSchema / registerServerSchema (Fase 1 · 1A).
 * Foco: política OWASP de password + refine de confirmación.
 * Matriz: docs/test/matrices/register.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import { passwordSchema, registerSchema, registerServerSchema } from './register.schema';

const valid = {
  email: 'user@example.com',
  password: 'Abcdef12',
  confirmPassword: 'Abcdef12',
  displayName: 'Juan Perez',
};

describe('registerSchema', () => {
  describe('casos válidos', () => {
    it('acepta un registro válido', () => {
      expect(registerSchema.safeParse(valid).success).toBe(true);
    });

    it('normaliza email a minúsculas', () => {
      const r = registerSchema.safeParse({ ...valid, email: 'USER@EXAMPLE.COM' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.email).toBe('user@example.com');
    });

    // Mismo QUIRK que loginSchema: .email() antes de .trim(). Ver docs/test/60.
    it('rechaza email con espacios alrededor (comportamiento actual)', () => {
      const r = registerSchema.safeParse({ ...valid, email: '  user@example.com  ' });
      expect(r.success).toBe(false);
    });
  });

  describe('password (OWASP)', () => {
    it('rechaza menos de 8 caracteres', () => {
      const r = registerSchema.safeParse({ ...valid, password: 'Abc123', confirmPassword: 'Abc123' });
      expect(issueFor(r, 'password')).toBe('La contraseña debe tener al menos 8 caracteres');
    });

    it('rechaza más de 100 caracteres', () => {
      const long = 'A1' + 'a'.repeat(100);
      const r = registerSchema.safeParse({ ...valid, password: long, confirmPassword: long });
      expect(issueFor(r, 'password')).toBe('La contraseña no puede exceder 100 caracteres');
    });

    it('rechaza sin mayúscula', () => {
      const r = registerSchema.safeParse({ ...valid, password: 'abcdef12', confirmPassword: 'abcdef12' });
      expect(issueFor(r, 'password')).toBe('La contraseña debe contener al menos una letra mayúscula');
    });

    it('rechaza sin número', () => {
      const r = registerSchema.safeParse({ ...valid, password: 'Abcdefgh', confirmPassword: 'Abcdefgh' });
      expect(issueFor(r, 'password')).toBe('La contraseña debe contener al menos un número');
    });

    it('acepta exactamente 8 con mayúscula y número (borde)', () => {
      const r = registerSchema.safeParse({ ...valid, password: 'Abcdefg1', confirmPassword: 'Abcdefg1' });
      expect(r.success).toBe(true);
    });
  });

  describe('confirmPassword (refine)', () => {
    it('rechaza cuando no coincide, en el path confirmPassword', () => {
      const r = registerSchema.safeParse({ ...valid, confirmPassword: 'Otra1234' });
      expect(issueFor(r, 'confirmPassword')).toBe('Las contraseñas no coinciden');
    });
  });

  describe('displayName', () => {
    it('rechaza menos de 3 caracteres', () => {
      const r = registerSchema.safeParse({ ...valid, displayName: 'Jo' });
      expect(issueFor(r, 'displayName')).toBe('El nombre debe tener al menos 3 caracteres');
    });

    it('rechaza más de 50 caracteres', () => {
      const r = registerSchema.safeParse({ ...valid, displayName: 'a'.repeat(51) });
      expect(issueFor(r, 'displayName')).toBe('El nombre no puede exceder 50 caracteres');
    });
  });

  // passwordSchema es la fuente única compartida entre el form cliente
  // (UserRegistrationStep) y el servidor (registerAction). Lockear su política
  // acá garantiza que el cliente no acepte contraseñas que el servidor rechaza
  // (hallazgo E2E-08).
  describe('passwordSchema (contrato compartido cliente/servidor)', () => {
    it('rechaza la contraseña débil "123456" que el cliente aceptaba antes', () => {
      const r = passwordSchema.safeParse('123456');
      expect(r.success).toBe(false);
    });

    it('acepta una contraseña que cumple la política OWASP', () => {
      expect(passwordSchema.safeParse('Abcdefg1').success).toBe(true);
    });
  });

  describe('registerServerSchema', () => {
    it('no incluye confirmPassword (omitido)', () => {
      const { confirmPassword, ...serverInput } = valid;
      const r = registerServerSchema.safeParse(serverInput);
      expect(r.success).toBe(true);
      if (r.success) expect('confirmPassword' in r.data).toBe(false);
    });
  });
});
