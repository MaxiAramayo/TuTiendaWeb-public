/**
 * Schemas de validación para Checkout
 * 
 * @module features/store/schemas/checkout.schema
 */

import { z } from 'zod';

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const checkoutErrorMessages = {
  required: 'Este campo es obligatorio',
  nameMin: 'El nombre debe tener al menos 2 caracteres',
  nameMax: 'El nombre no puede exceder 100 caracteres',
  addressRequired: 'La dirección es requerida para delivery',
  addressMin: 'La dirección debe tener al menos 10 caracteres',
  addressMax: 'La dirección no puede exceder 500 caracteres',
  notesMax: 'Las notas no pueden exceder 500 caracteres',
  invalidDeliveryMethod: 'Método de entrega inválido',
  invalidPaymentMethod: 'Método de pago inválido',
  emptyCart: 'El carrito está vacío',
  invalidQuantity: 'Cantidad inválida',
  invalidPrice: 'Precio inválido'
};

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Schema para item del carrito en checkout
 */
export const checkoutItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive(checkoutErrorMessages.invalidQuantity),
  unitPrice: z.number().nonnegative(checkoutErrorMessages.invalidPrice),
  subtotal: z.number().nonnegative(),
  categoryId: z.string().optional(),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number()
  })).optional(),
  notes: z.string().max(500).optional()
});

/**
 * Schema para datos del cliente
 */
export const customerSchema = z.object({
  name: z.string()
    .min(2, checkoutErrorMessages.nameMin)
    .max(100, checkoutErrorMessages.nameMax)
    .transform(val => val.trim()),
  phone: z.string().optional(),
  email: z.string().email().optional()
});

/**
 * Schema para información de entrega
 */
export const deliverySchema = z.object({
  method: z.enum(['delivery', 'retiro', 'pickup'], {
    errorMap: () => ({ message: checkoutErrorMessages.invalidDeliveryMethod })
  }),
  address: z.string().max(500, checkoutErrorMessages.addressMax).optional(),
  notes: z.string().max(500, checkoutErrorMessages.notesMax).optional()
}).refine(
  (data) => {
    // Si es delivery, la dirección es requerida
    if (data.method === 'delivery') {
      return data.address && data.address.length >= 10;
    }
    return true;
  },
  {
    message: checkoutErrorMessages.addressRequired,
    path: ['address']
  }
);

/**
 * Schema para información de pago
 */
export const paymentSchema = z.object({
  method: z.enum(['efectivo', 'transferencia', 'mercadopago'], {
    errorMap: () => ({ message: checkoutErrorMessages.invalidPaymentMethod })
  }),
  total: z.number().nonnegative()
});

/**
 * Schema para totales
 */
export const totalsSchema = z.object({
  subtotal: z.number().nonnegative(),
  deliveryFee: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative()
});

/**
 * Schema completo para el formulario de checkout
 */
export const checkoutFormSchema = z.object({
  nombre: z.string()
    .min(2, checkoutErrorMessages.nameMin)
    .max(100, checkoutErrorMessages.nameMax)
    .transform(val => val.trim()),
  formaDeConsumir: z.enum(['delivery', 'retiro'], {
    errorMap: () => ({ message: checkoutErrorMessages.invalidDeliveryMethod })
  }),
  formaDePago: z.enum(['efectivo', 'transferencia', 'mercadopago'], {
    errorMap: () => ({ message: checkoutErrorMessages.invalidPaymentMethod })
  }),
  direccion: z.string().max(500).optional(),
  aclaracion: z.string().max(500).optional()
}).refine(
  (data) => {
    if (data.formaDeConsumir === 'delivery') {
      return data.direccion && data.direccion.length >= 10;
    }
    return true;
  },
  {
    message: checkoutErrorMessages.addressRequired,
    path: ['direccion']
  }
);

/**
 * Schema para crear una orden desde el checkout público
 */
export const createOrderSchema = z.object({
  storeId: z.string().min(1),
  customer: customerSchema,
  items: z.array(checkoutItemSchema).min(1, checkoutErrorMessages.emptyCart),
  delivery: deliverySchema,
  payment: paymentSchema,
  totals: totalsSchema,
  notes: z.string().max(500).optional(),
  source: z.literal('web').default('web')
});

// ============================================================================
// TYPES
// ============================================================================

export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type CustomerData = z.infer<typeof customerSchema>;
export type DeliveryData = z.infer<typeof deliverySchema>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type TotalsData = z.infer<typeof totalsSchema>;
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;
export type CreateOrderData = z.infer<typeof createOrderSchema>;
