/**
 * Tests unit de las utilidades de formateo (Fase 1 · 1B).
 *
 * Funciones puras y deterministas. Para `formatDate` relativo se congelan los
 * timers (vi.useFakeTimers) para evitar dependencia de la fecha real.
 *
 * Nota sobre locales: la salida exacta de Intl depende de la versión de ICU
 * del runtime, por eso para precios/fechas localizadas se afirman propiedades
 * estructurales (contiene el número agrupado) y no el string literal completo.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatPrice,
  formatNumber,
  formatDate,
  formatTime,
  generateSlug,
  formatWhatsAppNumber,
} from './format.utils';

describe('formatPrice', () => {
  it('formatea un entero con separador de miles y símbolo de moneda', () => {
    const out = formatPrice(8500);
    expect(out).toMatch(/8\.500/);
    expect(out).toContain('$');
  });

  it('soporta 0 sin decimales', () => {
    expect(formatPrice(0)).toMatch(/0/);
  });

  it('respeta hasta 2 decimales', () => {
    expect(formatPrice(1234.5)).toMatch(/1\.234,5/);
  });
});

describe('formatNumber', () => {
  it('deja números menores a mil tal cual', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
  });

  it('abrevia miles con sufijo k y sin .0 redundante', () => {
    expect(formatNumber(1000)).toBe('1k');
    expect(formatNumber(1500)).toBe('1.5k');
  });

  it('abrevia millones con sufijo M', () => {
    expect(formatNumber(1000000)).toBe('1M');
    expect(formatNumber(2500000)).toBe('2.5M');
  });
});

describe('generateSlug', () => {
  it('convierte a kebab-case en minúsculas', () => {
    expect(generateSlug('Hola Mundo')).toBe('hola-mundo');
  });

  it('elimina caracteres especiales y acentos (no translitera)', () => {
    expect(generateSlug('Café del Río!')).toBe('caf-del-ro');
  });

  it('colapsa espacios y guiones múltiples y recorta extremos', () => {
    expect(generateSlug('  Multiple   spaces  ')).toBe('multiple-spaces');
    expect(generateSlug('--leading--')).toBe('leading');
  });

  it('devuelve string vacío si no quedan caracteres válidos', () => {
    expect(generateSlug('¡!¿?')).toBe('');
  });
});

describe('formatWhatsAppNumber', () => {
  it('agrega +54 cuando no hay código de país', () => {
    expect(formatWhatsAppNumber('11 1234-5678')).toBe('+541112345678');
  });

  it('conserva el número si ya tiene prefijo +', () => {
    expect(formatWhatsAppNumber('+5491112345678')).toBe('+5491112345678');
  });

  it('limpia caracteres no numéricos antes de prefijar', () => {
    expect(formatWhatsAppNumber('(011) 15-1234')).toBe('+5401115 1234'.replace(/\s/g, ''));
  });
});

describe('formatTime', () => {
  it('devuelve string vacío para entrada vacía', () => {
    expect(formatTime('')).toBe('');
  });

  it('formatea HH:mm en 24h', () => {
    expect(formatTime('09:30')).toBe('09:30');
    expect(formatTime('23:05')).toBe('23:05');
  });
});

describe('formatDate', () => {
  it('devuelve string vacío para null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('acepta timestamp tipo { seconds } de Firestore', () => {
    // 2024-01-15T00:00:00Z = 1705276800 s
    const out = formatDate({ seconds: 1705276800 }, { format: 'iso' });
    expect(out).toBe(new Date(1705276800 * 1000).toISOString());
  });

  it('formato iso devuelve ISO 8601', () => {
    const d = new Date('2024-03-10T12:00:00.000Z');
    expect(formatDate(d, { format: 'iso' })).toBe('2024-03-10T12:00:00.000Z');
  });

  describe('formato relativo (timers congelados)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('mismo día → "Hoy"', () => {
      expect(formatDate(new Date('2024-06-15T08:00:00.000Z'), { relative: true })).toBe('Hoy');
    });

    it('día anterior → "Ayer"', () => {
      expect(formatDate(new Date('2024-06-14T08:00:00.000Z'), { relative: true })).toBe('Ayer');
    });

    it('dentro de la semana → "Hace N días"', () => {
      expect(formatDate(new Date('2024-06-12T12:00:00.000Z'), { relative: true })).toBe(
        'Hace 3 días',
      );
    });
  });
});
