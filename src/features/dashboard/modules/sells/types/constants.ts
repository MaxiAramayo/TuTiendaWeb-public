/**
 * Constantes tipadas para el módulo de ventas
 * 
 * Define todos los valores constantes utilizados en el dominio de ventas,
 * incluyendo métodos de pago, estados y métodos de entrega.
 * 
 * @module features/dashboard/modules/sells/types/constants
 */

/**
 * Métodos de pago disponibles
 */
export const PAYMENT_METHODS = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  MERCADO_PAGO: 'Mercado Pago',
  OTHER: 'Otro'
} as const;

/**
 * Tipo derivado de las llaves de métodos de pago
 */
export type PaymentMethodKey = keyof typeof PAYMENT_METHODS;

/**
 * Tipo derivado de los valores de métodos de pago
 */
export type PaymentMethodValue = typeof PAYMENT_METHODS[PaymentMethodKey];

/**
 * Estados de venta disponibles (valores técnicos)
 */
export const SELL_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

/**
 * Tipo derivado de las llaves de estados de venta
 */
export type SellStatusKey = typeof SELL_STATUS[keyof typeof SELL_STATUS];

/**
 * Tipo derivado de los valores de estados de venta
 */
export type SellStatusValue = typeof SELL_STATUS[keyof typeof SELL_STATUS];

/**
 * Etiquetas legibles para estados de venta
 */
export const SELL_STATUS_LABELS: Record<SellStatusKey, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
} as const;

/**
 * Estados de pago disponibles
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded'
} as const;

/**
 * Tipo derivado de las llaves de estados de pago
 */
export type PaymentStatusKey = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

/**
 * Tipo derivado de los valores de estados de pago
 */
export type PaymentStatusValue = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

/**
 * Etiquetas legibles para estados de pago
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatusKey, string> = {
  pending: 'Pendiente',
  partial: 'Pago Parcial',
  paid: 'Pagado',
  refunded: 'Reembolsado'
} as const;

/**
 * Métodos de entrega disponibles
 */
export const DELIVERY_METHODS = {
  PICKUP: 'Retiro en local',
  DELIVERY: 'Delivery',
  SHIPPING: 'Envío por correo'
} as const;

/**
 * Tipo derivado de las llaves de métodos de entrega
 */
export type DeliveryMethodKey = keyof typeof DELIVERY_METHODS;

/**
 * Tipo derivado de los valores de métodos de entrega
 */
export type DeliveryMethodValue = typeof DELIVERY_METHODS[DeliveryMethodKey];

/**
 * Canales de venta disponibles
 */
export const SELL_SOURCES = {
  WEB: 'web',
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  LOCAL: 'local'
} as const;

/**
 * Tipo derivado de las llaves de canales de venta
 */
export type SellSourceKey = typeof SELL_SOURCES[keyof typeof SELL_SOURCES];

/**
 * Tipo derivado de los valores de canales de venta
 */
export type SellSourceValue = typeof SELL_SOURCES[keyof typeof SELL_SOURCES];

/**
 * Etiquetas legibles para canales de venta
 */
export const SELL_SOURCE_LABELS: Record<SellSourceKey, string> = {
  web: 'Sitio Web',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  local: 'Local'
} as const;

/**
 * Opciones de ordenamiento para las ventas
 */
export const SORT_OPTIONS = {
  DATE_DESC: 'date-desc',
  DATE_ASC: 'date-asc',
  CUSTOMER_ASC: 'customer-asc',
  TOTAL_DESC: 'total-desc'
} as const;

/**
 * Tipo derivado de las opciones de ordenamiento
 */
export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

/**
 * Etiquetas legibles para las opciones de ordenamiento
 */
export const SORT_LABELS: Record<SortOption, string> = {
  'date-desc': 'Más recientes primero',
  'date-asc': 'Más antiguos primero',
  'customer-asc': 'Cliente (A-Z)',
  'total-desc': 'Mayor monto primero'
} as const;
