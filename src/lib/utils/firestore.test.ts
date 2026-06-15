/**
 * Tests unit de cleanForFirestore (Fase 1 · 1B).
 * Foco: elimina undefined, preserva null/''/0/false (valores válidos en Firestore).
 */
import { describe, expect, it } from 'vitest';
import { cleanForFirestore } from './firestore';

describe('cleanForFirestore', () => {
  it('elimina las claves con valor undefined', () => {
    const result = cleanForFirestore({ name: 'John', phone: undefined });
    expect(result).toEqual({ name: 'John' });
    expect('phone' in result).toBe(false);
  });

  it('preserva null, string vacío, 0 y false', () => {
    const result = cleanForFirestore({ notes: null, label: '', age: 0, active: false });
    expect(result).toEqual({ notes: null, label: '', age: 0, active: false });
  });

  it('devuelve un objeto vacío si todo es undefined', () => {
    expect(cleanForFirestore({ a: undefined, b: undefined })).toEqual({});
  });

  it('conserva los valores anidados sin recorrerlos (limpieza superficial)', () => {
    const nested = { deep: undefined };
    const result = cleanForFirestore({ nested });
    expect(result.nested).toBe(nested);
  });
});
