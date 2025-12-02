/**
 * Login Schema - Validación de formulario de inicio de sesión
 * 
 * Valida:
 * - Email en formato RFC 5322
 * - Password mínimo 6 caracteres (requisito de Firebase)
 * 
 * Normalización:
 * - Email a minúsculas
 * - Trim de espacios
 * 
 * @module features/auth/schemas/login.schema
 * @see https://zod.dev/
 */

import { z } from 'zod';

// ============================================================================
// SCHEMA
// ============================================================================

export const loginSchema = z.object({
    email: z
        .string({ required_error: 'Email es requerido' })
        .min(1, 'Email es requerido')
        .email('Formato de email inválido')
        .toLowerCase()
        .trim(),

    password: z
        .string({ required_error: 'Contraseña es requerida' })
        .min(6, 'La contraseña debe tener al menos 6 caracteres'),

    remember: z.boolean().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
