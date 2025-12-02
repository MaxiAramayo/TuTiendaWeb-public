/**
 * Esquemas de validación para el formulario de reset de contraseña
 * 
 * @module features/auth/validation/resetPasswordSchema
 */

import { z } from 'zod';
import { emailSchema } from './registerSchema';

/**
 * Esquema de validación para el formulario de reset de contraseña
 */
export const resetPasswordSchema = z.object({
  email: emailSchema
});

/**
 * Tipo inferido del esquema de reset de contraseña
 */
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;