/**
 * Esquemas de validación para el formulario de registro
 * 
 * @module features/auth/validation/registerSchema
 */

import { z } from 'zod';
import { 
  emailSchema as centralEmailSchema,
  whatsappSchema,
  slugSchema as centralSlugSchema,
  storeNameSchema,
  storeTypeSchema
} from '@shared/validations';

/**
 * Esquema de validación para contraseña con confirmación
 */
const passwordWithConfirmSchema = z
  .string()
  .min(6, 'La contraseña debe tener al menos 6 caracteres')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'
  );

/**
 * Esquema de validación para el formulario de registro
 */
export const registerSchema = z.object({
  email: centralEmailSchema,
  
  password: passwordWithConfirmSchema,
  
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
  
  displayName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  whatsappNumber: whatsappSchema,
  
  name: storeNameSchema,
  
  storeType: storeTypeSchema,
  
  slug: centralSlugSchema,
  
  terms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' })
  })
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  }
);

/**
 * Tipo inferido del esquema de registro
 */
export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Re-exportar esquemas centralizados para compatibilidad
 */
export const slugSchema = centralSlugSchema;
export const emailSchema = centralEmailSchema;
export const passwordSchema = passwordWithConfirmSchema;