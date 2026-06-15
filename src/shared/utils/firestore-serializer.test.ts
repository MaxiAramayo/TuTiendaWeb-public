/**
 * Tests unit de serializeFirestoreData (Fase 1 · 1B).
 * Foco: Timestamp/Date → ISO, recursividad en objetos y arrays, primitivos.
 */
import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase-admin/firestore';
import { serializeFirestoreData } from './firestore-serializer';

describe('serializeFirestoreData', () => {
  it.each([null, undefined])('devuelve %s tal cual', (value) => {
    expect(serializeFirestoreData(value)).toBe(value);
  });

  it('convierte un Timestamp a ISO string', () => {
    const date = new Date('2026-06-15T12:00:00.000Z');
    expect(serializeFirestoreData(Timestamp.fromDate(date))).toBe(date.toISOString());
  });

  it('convierte un Date nativo a ISO string', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    expect(serializeFirestoreData(date)).toBe('2026-01-01T00:00:00.000Z');
  });

  it.each([['texto', 'texto'], [42, 42], [true, true], [0, 0]])(
    'deja el primitivo %s sin cambios',
    (input, expected) => {
      expect(serializeFirestoreData(input)).toBe(expected);
    },
  );

  it('serializa timestamps anidados en objetos', () => {
    const ts = Timestamp.fromDate(new Date('2026-06-15T00:00:00.000Z'));
    const result = serializeFirestoreData<{ metadata: { createdAt: string } }>({
      name: 'venta',
      metadata: { createdAt: ts },
    });
    expect(result.metadata.createdAt).toBe('2026-06-15T00:00:00.000Z');
  });

  it('serializa timestamps dentro de arrays', () => {
    const ts = Timestamp.fromDate(new Date('2026-06-15T00:00:00.000Z'));
    const result = serializeFirestoreData<Array<{ at: string }>>([{ at: ts }]);
    expect(result[0].at).toBe('2026-06-15T00:00:00.000Z');
  });
});
