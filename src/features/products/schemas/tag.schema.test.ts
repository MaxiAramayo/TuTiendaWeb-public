/**
 * Tests unit de tagSchema (Fase 1 · 1A).
 * Foco: name min 2, color hex opcional (#RRGGBB).
 */
import { describe, expect, it } from 'vitest';
import { tagSchema } from './tag.schema';

describe('tagSchema', () => {
  it('acepta un tag con nombre válido sin color', () => {
    expect(tagSchema.safeParse({ name: 'Oferta' }).success).toBe(true);
  });

  it('acepta un color hex de 6 dígitos', () => {
    expect(tagSchema.safeParse({ name: 'Oferta', color: '#FF00AA' }).success).toBe(true);
  });

  it('rechaza nombre < 2 caracteres', () => {
    expect(tagSchema.safeParse({ name: 'a' }).success).toBe(false);
  });

  it.each(['FF00AA', '#FFF', '#GG0000'])('rechaza color inválido "%s"', (color) => {
    expect(tagSchema.safeParse({ name: 'Oferta', color }).success).toBe(false);
  });
});
