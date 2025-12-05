/**
 * Schemas de validación Zod para el módulo de ventas
 * 
 * Estructura simplificada y limpia para ventas.
 * 
 * @module features/dashboard/modules/sells/schemas/sell.schema
 */

import { z } from 'zod';

// =============================================================================
// CONSTANTES Y TIPOS
// =============================================================================

/**
 * Método de entrega
 */
export const DELIVERY_METHODS = {
  RETIRO: 'retiro',
  DELIVERY: 'delivery',
} as const;

export type DeliveryMethod = 'retiro' | 'delivery';

/**
 * Método de pago
 */
export const PAYMENT_METHODS = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  MERCADOPAGO: 'mercadopago',
} as const;

export type PaymentMethod = 'efectivo' | 'transferencia' | 'mercadopago';

/**
 * Origen de la venta
 */
export const SALE_SOURCES = {
  LOCAL: 'local',
  WEB: 'web',
  WHATSAPP: 'whatsapp',
} as const;

export type SaleSource = 'local' | 'web' | 'whatsapp';

// =============================================================================
// LABELS PARA UI
// =============================================================================

export const DELIVERY_METHODS_LABELS: Record<string, string> = {
  retiro: 'Retiro en local',
  delivery: 'Delivery',
};

export const PAYMENT_METHODS_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercadopago: 'MercadoPago',
};

export const SALE_SOURCE_LABELS: Record<string, string> = {
  local: 'Local',
  web: 'Sitio Web',
  whatsapp: 'WhatsApp',
};

// =============================================================================
// SCHEMAS
// =============================================================================

/**
 * Variante/Topping aplicado al item
 */
export const saleItemVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
});

/**
 * Item individual de la venta
 */
export const saleItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  categoryId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  variants: z.array(saleItemVariantSchema).optional(),
  notes: z.string().optional(),
});

/**
 * Información del cliente
 */
export const customerInfoSchema = z.object({
  name: z.string().min(1, 'El nombre del cliente es requerido'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * Información de entrega
 */
export const deliveryInfoSchema = z.object({
  method: z.enum(['retiro', 'delivery']),
  address: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Información de pago
 */
export const paymentInfoSchema = z.object({
  method: z.enum(['efectivo', 'transferencia', 'mercadopago']),
  total: z.number().nonnegative(),
});

/**
 * Totales de la venta
 */
export const saleTotalsSchema = z.object({
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
});

/**
 * Metadata de la venta
 */
export const saleMetadataSchema = z.object({
  createdAt: z.any(),
  updatedAt: z.any(),
});

/**
 * Schema base para crear una venta (sin ID ni metadata)
 */
export const createSaleBaseSchema = z.object({
  orderNumber: z.string(),
  storeId: z.string(),
  source: z.enum(['local', 'web', 'whatsapp']),
  customer: customerInfoSchema,
  items: z.array(saleItemSchema).min(1, 'Debe agregar al menos un item'),
  delivery: deliveryInfoSchema,
  payment: paymentInfoSchema,
  totals: saleTotalsSchema,
  notes: z.string().optional(),
});

/**
 * Schema con validación condicional
 */
export const createSaleSchema = createSaleBaseSchema.refine(
  (data) => {
    if (data.delivery.method === 'delivery' && !data.delivery.address?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: 'La dirección es obligatoria para delivery',
    path: ['delivery', 'address'],
  }
);

/**
 * Schema completo de venta (con ID y metadata)
 */
export const saleSchema = createSaleBaseSchema.extend({
  id: z.string(),
  metadata: saleMetadataSchema,
});

/**
 * Schema para actualización parcial
 */
export const updateSaleSchema = z.object({
  customer: customerInfoSchema.optional(),
  items: z.array(saleItemSchema).optional(),
  delivery: deliveryInfoSchema.optional(),
  payment: paymentInfoSchema.optional(),
  totals: saleTotalsSchema.optional(),
  source: z.enum(['local', 'web', 'whatsapp']).optional(),
  notes: z.string().optional(),
});

// =============================================================================
// SCHEMAS DE FILTROS
// =============================================================================

export const salesFilterSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  customerName: z.string().optional(),
  paymentMethod: z.string().optional(),
  deliveryMethod: z.string().optional(),
  source: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

export const salesFilterValuesSchema = z.object({
  customerSearch: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  paymentMethod: z.string(),
  deliveryMethod: z.string(),
  sortBy: z.enum(['date-desc', 'date-asc', 'customer-asc', 'total-desc']),
});

// =============================================================================
// SCHEMAS DE ESTADÍSTICAS
// =============================================================================

export const salesStatsSchema = z.object({
  totalSales: z.number().nonnegative(),
  totalOrders: z.number().int().nonnegative(),
  averageOrderValue: z.number().nonnegative(),
  todaySales: z.number().nonnegative(),
});

// =============================================================================
// TIPOS INFERIDOS
// =============================================================================

export type SaleItemVariant = z.infer<typeof saleItemVariantSchema>;
export type SaleItem = z.infer<typeof saleItemSchema>;
export type CustomerInfo = z.infer<typeof customerInfoSchema>;
export type DeliveryInfo = z.infer<typeof deliveryInfoSchema>;
export type PaymentInfo = z.infer<typeof paymentInfoSchema>;
export type SaleTotals = z.infer<typeof saleTotalsSchema>;
export type SaleMetadata = z.infer<typeof saleMetadataSchema>;
export type CreateSaleData = z.infer<typeof createSaleSchema>;
export type Sale = z.infer<typeof saleSchema>;
export type UpdateSaleData = z.infer<typeof updateSaleSchema>;
export type SalesFilter = z.infer<typeof salesFilterSchema>;
export type SalesFilterValues = z.infer<typeof salesFilterValuesSchema>;
export type SalesStats = z.infer<typeof salesStatsSchema>;
export type SortOption = 'date-desc' | 'date-asc' | 'customer-asc' | 'total-desc';

// =============================================================================
// TIPOS PARA SERVER ACTIONS
// =============================================================================

export type ActionResponse<T = unknown> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

// =============================================================================
// COMPATIBILIDAD TEMPORAL (para migración gradual)
// =============================================================================

// Aliases para compatibilidad con código existente
export type Sell = Sale;
export type SellBase = CreateSaleData;
export type SellsFilter = SalesFilter;
export type SellsFilterValues = SalesFilterValues;
export type SellsStats = SalesStats;

// Re-export con nombres antiguos
export const sellSchema = saleSchema;
export const sellBaseSchema = createSaleSchema;
export const sellsFilterSchema = salesFilterSchema;
export const sellsFilterValuesSchema = salesFilterValuesSchema;
export const sellsStatsSchema = salesStatsSchema;

// Constantes antiguas para compatibilidad
export const SELL_SOURCES = SALE_SOURCES;
export const SELL_SOURCE_LABELS = SALE_SOURCE_LABELS;
