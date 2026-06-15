/**
 * Tests unit de whatsapp.utils (Fase 1 · 1B).
 * Foco: formatWhatsAppMessageFromSale (delivery/retiro, variantes, notas, envío)
 * y normalización de número con formatWhatsAppNumber.
 */
import { describe, expect, it } from 'vitest';
import { formatWhatsAppMessageFromSale, formatWhatsAppNumber } from './whatsapp.utils';

const baseArgs = {
  customerName: 'Ana',
  storeName: 'Tienda Demo',
  items: [{ productName: 'Cargador', quantity: 2, unitPrice: 100 }],
  subtotal: 200,
  deliveryFee: 0,
  total: 200,
  deliveryMethod: 'retiro',
  paymentMethod: 'efectivo',
};

describe('formatWhatsAppMessageFromSale', () => {
  it('incluye encabezado, cliente, entrega y pago', () => {
    const msg = formatWhatsAppMessageFromSale(baseArgs);
    expect(msg).toContain('*NUEVO PEDIDO - Tienda Demo*');
    expect(msg).toContain('*Cliente:* Ana');
    expect(msg).toContain('*Entrega:* Retiro en local');
    expect(msg).toContain('*Pago:* efectivo');
  });

  it('lista los productos con su total de línea', () => {
    const msg = formatWhatsAppMessageFromSale(baseArgs);
    expect(msg).toContain('> 2x Cargador - $200');
  });

  it('muestra la dirección solo en delivery', () => {
    const conDir = formatWhatsAppMessageFromSale({
      ...baseArgs,
      deliveryMethod: 'delivery',
      address: 'Av. Siempreviva 742',
    });
    expect(conDir).toContain('*Entrega:* Delivery');
    expect(conDir).toContain('*Dirección:* Av. Siempreviva 742');
    expect(formatWhatsAppMessageFromSale(baseArgs)).not.toContain('*Dirección:*');
  });

  it('lista las variantes de cada item', () => {
    const msg = formatWhatsAppMessageFromSale({
      ...baseArgs,
      items: [{ productName: 'Pizza', quantity: 1, unitPrice: 500, variants: [{ name: 'Extra queso', price: 100 }] }],
    });
    expect(msg).toContain('+ Extra queso (+$100)');
  });

  it('muestra la línea de envío solo si deliveryFee > 0', () => {
    const conEnvio = formatWhatsAppMessageFromSale({ ...baseArgs, deliveryFee: 1500, total: 1700 });
    expect(conEnvio).toContain('*Envío:* $1500');
    expect(formatWhatsAppMessageFromSale(baseArgs)).not.toContain('*Envío:*');
  });

  it('agrega las notas al final cuando existen', () => {
    const msg = formatWhatsAppMessageFromSale({ ...baseArgs, notes: 'Sin sal' });
    expect(msg).toContain('*Notas:* Sin sal');
  });

  it('siempre incluye subtotal y total', () => {
    const msg = formatWhatsAppMessageFromSale(baseArgs);
    expect(msg).toContain('*Subtotal:* $200');
    expect(msg).toContain('*TOTAL:* $200');
  });
});

describe('formatWhatsAppNumber', () => {
  it.each([
    ['+5491112345678', '5491112345678'],
    ['11 1234 5678', '541112345678'],
    ['541112345678', '541112345678'],
  ])('normaliza "%s" a "%s"', (input, expected) => {
    expect(formatWhatsAppNumber(input)).toBe(expected);
  });
});
