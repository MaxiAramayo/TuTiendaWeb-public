/**
 * Exportaciones centralizadas de esquemas de validación
 * 
 * @module features/auth/validation
 */

// Esquemas de registro
export {
  registerSchema,
  slugSchema,
  emailSchema,
  passwordSchema,
  type RegisterFormData
} from './registerSchema';

// Esquemas de login
export {
  loginSchema,
  type LoginFormData
} from './loginSchema';

// Esquemas de perfil de Google
export {
  googleProfileSchema,
  addressSchema,
  type GoogleProfileFormData
} from './googleProfileSchema';

// Esquemas de reset de contraseña
export {
  resetPasswordSchema,
  type ResetPasswordFormData
} from './resetPasswordSchema';

// Tipos inferidos de Zod para compatibilidad
import type { z } from 'zod';
import { registerSchema } from './registerSchema';
import { loginSchema } from './loginSchema';
import { googleProfileSchema } from './googleProfileSchema';
import { resetPasswordSchema } from './resetPasswordSchema';

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type GoogleProfileSetupValues = z.infer<typeof googleProfileSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;