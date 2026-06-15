/**
 * Tests unit de checkout schemas (Fase 1 · 1A).
 * Foco de seguridad: publicCheckoutItemSchema NO acepta precios; refine de
 * dirección obligatoria en delivery; mensajes en español.
 * Matriz: docs/test/matrices/checkout.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import {
  publicCheckoutItemSchema,
  checkoutFormSchema,
  customerSchema,
  deliverySchema,
  paymentSchema,
} from './checkout.schema';

describe('publicCheckoutItemSchema (entrada pública del carrito)', () => {
  it('acepta solo productId, quantity, variantIds y notes', () => {
    const r = publicCheckoutItemSchema.safeParse({ productId: 'p1', quantity: 2 });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.variantIds).toEqual([]); // default
      expect(r.data).not.toHaveProperty('unitPrice');
      expect(r.data).not.toHaveProperty('subtotal');
    }
  });

  it('SEGURIDAD: descarta cualquier precio enviado por el cliente', () => {
    const r = publicCheckoutItemSchema.safeParse({
      productId: 'p1',
      quantity: 1,
      unitPrice: 1, // intento de tampering
      subtotal: 1,
      price: 0,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      // Zod strip por defecto: estos campos no llegan al dato parseado.
      expect(r.data).not.toHaveProperty('unitPrice');
      expect(r.data).not.toHaveProperty('subtotal');
      expect(r.data).not.toHaveProperty('price');
    }
  });

  it('rechaza quantity 0 o negativa', () => {
    expect(issueFor(publicCheckoutItemSchema.safeParse({ productId: 'p1', quantity: 0 }), 'quantity')).toBe(
      'Cantidad inválida',
    );
    expect(publicCheckoutItemSchema.safeParse({ productId: 'p1', quantity: -1 }).success).toBe(false);
  });

  it('rechaza quantity > 99 (borde)', () => {
    expect(publicCheckoutItemSchema.safeParse({ productId: 'p1', quantity: 100 }).success).toBe(false);
    expect(publicCheckoutItemSchema.safeParse({ productId: 'p1', quantity: 99 }).success).toBe(true);
  });

  it('rechaza productId vacío', () => {
    expect(publicCheckoutItemSchema.safeParse({ productId: '', quantity: 1 }).success).toBe(false);
  });

  it('rechaza notes > 500 caracteres', () => {
    const r = publicCheckoutItemSchema.safeParse({ productId: 'p1', quantity: 1, notes: 'x'.repeat(501) });
    expect(r.success).toBe(false);
  });
});

describe('checkoutFormSchema', () => {
  const valid = { nombre: 'Ana', formaDeConsumir: 'retiro', formaDePago: 'efectivo' };

  it('acepta retiro sin dirección', () => {
    expect(checkoutFormSchema.safeParse(valid).success).toBe(true);
  });

  it('recorta el nombre', () => {
    const r = checkoutFormSchema.safeParse({ ...valid, nombre: '  Ana  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.nombre).toBe('Ana');
  });

  it('rechaza nombre < 2 caracteres', () => {
    const r = checkoutFormSchema.safeParse({ ...valid, nombre: 'A' });
    expect(issueFor(r, 'nombre')).toBe('El nombre debe tener al menos 2 caracteres');
  });

  it('rechaza método de consumo inválido', () => {
    const r = checkoutFormSchema.safeParse({ ...valid, formaDeConsumir: 'teletransporte' });
    expect(issueFor(r, 'formaDeConsumir')).toBe('Método de entrega inválido');
  });

  it('rechaza método de pago inválido', () => {
    const r = checkoutFormSchema.safeParse({ ...valid, formaDePago: 'bitcoin' });
    expect(issueFor(r, 'formaDePago')).toBe('Método de pago inválido');
  });

  describe('refine de dirección en delivery', () => {
    it('rechaza delivery sin dirección', () => {
      const r = checkoutFormSchema.safeParse({ ...valid, formaDeConsumir: 'delivery' });
      expect(issueFor(r, 'direccion')).toBe('La dirección es requerida para delivery');
    });

    it('rechaza delivery con dirección < 10 caracteres', () => {
      const r = checkoutFormSchema.safeParse({ ...valid, formaDeConsumir: 'delivery', direccion: 'Calle 1' });
      expect(issueFor(r, 'direccion')).toBe('La dirección es requerida para delivery');
    });

    it('acepta delivery con dirección válida (≥10)', () => {
      const r = checkoutFormSchema.safeParse({
        ...valid,
        formaDeConsumir: 'delivery',
        direccion: 'Av. Siempreviva 742',
      });
      expect(r.success).toBe(true);
    });
  });
});

describe('customerSchema', () => {
  it('recorta el nombre y acepta phone/email opcionales', () => {
    const r = customerSchema.safeParse({ name: '  Ana  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe('Ana');
  });

  it('rechaza email con formato inválido si se provee', () => {
    expect(customerSchema.safeParse({ name: 'Ana', email: 'no-email' }).success).toBe(false);
  });
});

describe('deliverySchema', () => {
  it('rechaza delivery sin dirección suficiente', () => {
    const r = deliverySchema.safeParse({ method: 'delivery', address: 'corta' });
    expect(issueFor(r, 'address')).toBe('La dirección es requerida para delivery');
  });

  it('acepta retiro sin dirección', () => {
    expect(deliverySchema.safeParse({ method: 'retiro' }).success).toBe(true);
  });
});

describe('paymentSchema', () => {
  it('rechaza total negativo', () => {
    expect(paymentSchema.safeParse({ method: 'efectivo', total: -1 }).success).toBe(false);
  });

  it('acepta método válido con total 0', () => {
    expect(paymentSchema.safeParse({ method: 'transferencia', total: 0 }).success).toBe(true);
  });
});
