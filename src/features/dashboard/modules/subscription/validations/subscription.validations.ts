/**
 * Validaciones para el módulo de suscripciones
 */

import { z } from 'zod';
import { SubscriptionStatus, PlanType, BillingFrequency } from '../types/subscription.types';

/**
 * Schema de validación para crear una suscripción
 */
export const createSubscriptionSchema = z.object({
  planId: z.string({
    required_error: 'El ID del plan es requerido',
    invalid_type_error: 'El ID del plan debe ser una cadena'
  }).min(1, 'El ID del plan no puede estar vacío'),
  
  paymentMethodId: z.string().optional(),
  
  autoRenew: z.boolean({
    required_error: 'La renovación automática es requerida',
    invalid_type_error: 'La renovación automática debe ser un booleano'
  })
});

/**
 * Schema de validación para actualizar una suscripción
 */
export const updateSubscriptionSchema = z.object({
  subscriptionId: z.string({
    required_error: 'El ID de la suscripción es requerido',
    invalid_type_error: 'El ID de la suscripción debe ser una cadena'
  }).min(1, 'El ID de la suscripción no puede estar vacío'),
  
  newPlanId: z.string({
    required_error: 'El ID del nuevo plan es requerido',
    invalid_type_error: 'El ID del nuevo plan debe ser una cadena'
  }).min(1, 'El ID del nuevo plan no puede estar vacío')
});

/**
 * Schema de validación para el estado de suscripción
 */
export const subscriptionStatusSchema = z.object({
  subscriptionId: z.string({
    required_error: 'El ID de la suscripción es requerido',
    invalid_type_error: 'El ID de la suscripción debe ser una cadena'
  }).min(1, 'El ID de la suscripción no puede estar vacío'),
  
  status: z.enum(['active', 'pending', 'cancelled', 'expired', 'paused'], {
    required_error: 'El estado es requerido',
    invalid_type_error: 'El estado debe ser uno de los valores permitidos'
  })
});

/**
 * Schema de validación para un plan de suscripción
 */
export const subscriptionPlanSchema = z.object({
  id: z.string({
    required_error: 'El ID del plan es requerido',
    invalid_type_error: 'El ID del plan debe ser una cadena'
  }).min(1, 'El ID del plan no puede estar vacío'),
  
  name: z.string({
    required_error: 'El nombre del plan es requerido',
    invalid_type_error: 'El nombre del plan debe ser una cadena'
  }).min(1, 'El nombre del plan no puede estar vacío').max(100, 'El nombre del plan es demasiado largo'),
  
  description: z.string({
    required_error: 'La descripción del plan es requerida',
    invalid_type_error: 'La descripción del plan debe ser una cadena'
  }).min(1, 'La descripción del plan no puede estar vacía').max(500, 'La descripción del plan es demasiado larga'),
  
  type: z.enum(['basic', 'premium', 'enterprise'], {
    required_error: 'El tipo de plan es requerido',
    invalid_type_error: 'El tipo de plan debe ser uno de los valores permitidos'
  }),
  
  price: z.number({
    required_error: 'El precio es requerido',
    invalid_type_error: 'El precio debe ser un número'
  }).min(0, 'El precio no puede ser negativo'),
  
  currency: z.string({
    required_error: 'La moneda es requerida',
    invalid_type_error: 'La moneda debe ser una cadena'
  }).length(3, 'La moneda debe tener exactamente 3 caracteres'),
  
  billingFrequency: z.enum(['monthly', 'yearly'], {
    required_error: 'La frecuencia de facturación es requerida',
    invalid_type_error: 'La frecuencia de facturación debe ser mensual o anual'
  }),
  
  features: z.array(z.string(), {
    required_error: 'Las características son requeridas',
    invalid_type_error: 'Las características deben ser un array de cadenas'
  }).min(1, 'Debe haber al menos una característica'),
  
  maxProducts: z.number({
    required_error: 'El máximo de productos es requerido',
    invalid_type_error: 'El máximo de productos debe ser un número'
  }).int('El máximo de productos debe ser un entero').min(-1, 'El máximo de productos debe ser -1 (ilimitado) o mayor a 0'),
  
  maxOrders: z.number({
    required_error: 'El máximo de pedidos es requerido',
    invalid_type_error: 'El máximo de pedidos debe ser un número'
  }).int('El máximo de pedidos debe ser un entero').min(-1, 'El máximo de pedidos debe ser -1 (ilimitado) o mayor a 0'),
  
  hasAnalytics: z.boolean({
    required_error: 'La disponibilidad de analíticas es requerida',
    invalid_type_error: 'La disponibilidad de analíticas debe ser un booleano'
  }),
  
  hasCustomDomain: z.boolean({
    required_error: 'La disponibilidad de dominio personalizado es requerida',
    invalid_type_error: 'La disponibilidad de dominio personalizado debe ser un booleano'
  }),
  
  hasWhatsAppIntegration: z.boolean({
    required_error: 'La disponibilidad de integración WhatsApp es requerida',
    invalid_type_error: 'La disponibilidad de integración WhatsApp debe ser un booleano'
  }),
  
  isPopular: z.boolean().optional(),
  discountPercentage: z.number().min(0).max(100).optional()
});

/**
 * Schema de validación para webhook de MercadoPago
 */
export const mercadoPagoWebhookSchema = z.object({
  id: z.string({
    required_error: 'El ID del webhook es requerido',
    invalid_type_error: 'El ID del webhook debe ser una cadena'
  }),
  
  live_mode: z.boolean({
    required_error: 'El modo live es requerido',
    invalid_type_error: 'El modo live debe ser un booleano'
  }),
  
  type: z.string({
    required_error: 'El tipo de webhook es requerido',
    invalid_type_error: 'El tipo de webhook debe ser una cadena'
  }),
  
  date_created: z.string({
    required_error: 'La fecha de creación es requerida',
    invalid_type_error: 'La fecha de creación debe ser una cadena'
  }),
  
  application_id: z.string({
    required_error: 'El ID de la aplicación es requerido',
    invalid_type_error: 'El ID de la aplicación debe ser una cadena'
  }),
  
  user_id: z.string({
    required_error: 'El ID del usuario es requerido',
    invalid_type_error: 'El ID del usuario debe ser una cadena'
  }),
  
  version: z.string({
    required_error: 'La versión es requerida',
    invalid_type_error: 'La versión debe ser una cadena'
  }),
  
  api_version: z.string({
    required_error: 'La versión de la API es requerida',
    invalid_type_error: 'La versión de la API debe ser una cadena'
  }),
  
  action: z.string({
    required_error: 'La acción es requerida',
    invalid_type_error: 'La acción debe ser una cadena'
  }),
  
  data: z.object({
    id: z.string({
      required_error: 'El ID de los datos es requerido',
      invalid_type_error: 'El ID de los datos debe ser una cadena'
    })
  })
});

/**
 * Schema de validación para parámetros de consulta de suscripciones
 */
export const subscriptionQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.enum(['active', 'pending', 'cancelled', 'expired', 'paused']).optional(),
  planType: z.enum(['basic', 'premium', 'enterprise']).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'endDate', 'price']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Tipos inferidos de los schemas
 */
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type SubscriptionStatusInput = z.infer<typeof subscriptionStatusSchema>;
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
export type MercadoPagoWebhookInput = z.infer<typeof mercadoPagoWebhookSchema>;
export type SubscriptionQueryInput = z.infer<typeof subscriptionQuerySchema>;

/**
 * Función para validar datos de creación de suscripción
 * @param data - Datos a validar
 * @returns Datos validados o error
 */
export const validateCreateSubscription = (data: unknown): CreateSubscriptionInput => {
  return createSubscriptionSchema.parse(data);
};

/**
 * Función para validar datos de actualización de suscripción
 * @param data - Datos a validar
 * @returns Datos validados o error
 */
export const validateUpdateSubscription = (data: unknown): UpdateSubscriptionInput => {
  return updateSubscriptionSchema.parse(data);
};

/**
 * Función para validar estado de suscripción
 * @param data - Datos a validar
 * @returns Datos validados o error
 */
export const validateSubscriptionStatus = (data: unknown): SubscriptionStatusInput => {
  return subscriptionStatusSchema.parse(data);
};

/**
 * Función para validar plan de suscripción
 * @param data - Datos a validar
 * @returns Datos validados o error
 */
export const validateSubscriptionPlan = (data: unknown): SubscriptionPlanInput => {
  return subscriptionPlanSchema.parse(data);
};

/**
 * Función para validar webhook de MercadoPago
 * @param data - Datos a validar
 * @returns Datos validados o error
 */
export const validateMercadoPagoWebhook = (data: unknown): MercadoPagoWebhookInput => {
  return mercadoPagoWebhookSchema.parse(data);
};

/**
 * Función para validar parámetros de consulta
 * @param data - Datos a validar
 * @returns Datos validados o error
 */
export const validateSubscriptionQuery = (data: unknown): SubscriptionQueryInput => {
  return subscriptionQuerySchema.parse(data);
};

/**
 * Función para validar ID de usuario
 * @param userId - ID del usuario
 * @returns true si es válido
 */
export const validateUserId = (userId: string): boolean => {
  return typeof userId === 'string' && userId.length > 0;
};

/**
 * Función para validar ID de suscripción
 * @param subscriptionId - ID de la suscripción
 * @returns true si es válido
 */
export const validateSubscriptionId = (subscriptionId: string): boolean => {
  return typeof subscriptionId === 'string' && subscriptionId.length > 0;
};

/**
 * Función para validar ID de plan
 * @param planId - ID del plan
 * @returns true si es válido
 */
export const validatePlanId = (planId: string): boolean => {
  return typeof planId === 'string' && planId.length > 0;
};