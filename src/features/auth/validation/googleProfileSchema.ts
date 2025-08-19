/**
 * Esquemas de validación para el formulario de configuración de perfil de Google
 * 
 * @module features/auth/validation/googleProfileSchema
 */

import { z } from 'zod';
import { slugSchema } from './registerSchema';
import { storeTypeSchema } from '@shared/validations';

/**
 * Esquema de validación para la dirección
 */
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional()
}).optional();

/**
 * Esquema de validación para el formulario de configuración de perfil de Google
 */
export const googleProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre de la tienda debe tener al menos 2 caracteres')
    .max(50, 'El nombre de la tienda no puede superar los 50 caracteres'),
  
  slug: slugSchema,
  
  whatsappNumber: z
    .string()
    .min(1, 'El número de WhatsApp es requerido')
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'Número de WhatsApp inválido. Debe incluir código de país'
    ),
  
  storeType: storeTypeSchema,
  
  description: z
    .string()
    .max(500, 'La descripción no puede tener más de 500 caracteres')
    .optional(),
  
  address: addressSchema
});

/**
 * Tipo inferido del esquema de configuración de perfil de Google
 */
export type GoogleProfileFormData = z.infer<typeof googleProfileSchema>;