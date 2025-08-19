/**
 * Esquemas de validación para el formulario de login
 * 
 * @module features/auth/validation/loginSchema
 */

import { z } from 'zod';
import { emailSchema, passwordSchema } from './registerSchema';

/**
 * Esquema de validación para el formulario de login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
  remember: z.boolean().optional()
});

/**
 * Tipo inferido del esquema de login
 */
export type LoginFormData = z.infer<typeof loginSchema>;