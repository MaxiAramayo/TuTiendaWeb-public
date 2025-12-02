/**
 * Register Schema - Validación de formulario de registro
 * 
 * Seguridad (OWASP):
 * - Password mínimo 8 caracteres
 * - Requiere al menos una mayúscula
 * - Requiere al menos un número
 * - Confirmación de contraseña (prevenir typos)
 * 
 * @module features/auth/schemas/register.schema
 * @see https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks
 */

import { z } from 'zod';

// ============================================================================
// SCHEMA
// ============================================================================

export const registerBaseSchema = z.object({
    email: z
        .string({ required_error: 'Email es requerido' })
        .min(1, 'Email es requerido')
        .email('Formato de email inválido')
        .toLowerCase()
        .trim(),

    password: z
        .string({ required_error: 'Contraseña es requerida' })
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .max(100, 'La contraseña no puede exceder 100 caracteres')
        .regex(
            /[A-Z]/,
            'La contraseña debe contener al menos una letra mayúscula'
        )
        .regex(
            /[0-9]/,
            'La contraseña debe contener al menos un número'
        ),

    confirmPassword: z
        .string({ required_error: 'Confirma tu contraseña' }),

    displayName: z
        .string({ required_error: 'Nombre es requerido' })
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(50, 'El nombre no puede exceder 50 caracteres')
        .trim(),
});

export const registerSchema = registerBaseSchema.refine(
    (data) => data.password === data.confirmPassword,
    {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    }
);

// ============================================================================
// TYPES
// ============================================================================

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema para Server Action (sin confirmPassword)
 * Se usa después de validar en cliente
 */
export const registerServerSchema = registerBaseSchema.omit({
    confirmPassword: true
});

export type RegisterServerData = z.infer<typeof registerServerSchema>;
