/**
 * Tests unit de product.utils (Fase 1 · 1B).
 * Foco: labels/colores de estado, imagen principal, descripción.
 */
import { describe, expect, it } from 'vitest';
import type { Product } from '@/shared/types/firebase.types';
import {
  getProductStatusLabel,
  getProductStatusColor,
  getProductMainImage,
  getProductDescription,
} from './product.utils';

describe('getProductStatusLabel', () => {
  it.each([
    ['active', 'Activo'],
    ['inactive', 'Inactivo'],
    ['draft', 'Borrador'],
  ])('traduce el estado "%s" a "%s"', (status, label) => {
    expect(getProductStatusLabel(status)).toBe(label);
  });

  it('devuelve el valor original para un estado desconocido', () => {
    expect(getProductStatusLabel('archivado')).toBe('archivado');
  });
});

describe('getProductStatusColor', () => {
  it('usa verde para activo y rojo para inactivo', () => {
    expect(getProductStatusColor('active')).toContain('green');
    expect(getProductStatusColor('inactive')).toContain('red');
  });

  it('cae a gris para estados desconocidos', () => {
    expect(getProductStatusColor('archivado')).toContain('gray');
  });
});

describe('getProductMainImage', () => {
  it('devuelve la primera imagen cuando existen', () => {
    const product = { imageUrls: ['a.jpg', 'b.jpg'] } as Product;
    expect(getProductMainImage(product)).toBe('a.jpg');
  });

  it('devuelve null cuando no hay imágenes', () => {
    expect(getProductMainImage({ imageUrls: [] } as unknown as Product)).toBeNull();
  });
});

describe('getProductDescription', () => {
  it('devuelve la descripción si existe', () => {
    expect(getProductDescription({ description: 'Hola' } as Product)).toBe('Hola');
  });

  it('devuelve string vacío si la descripción es falsy', () => {
    expect(getProductDescription({ description: '' } as Product)).toBe('');
  });
});
