/**
 * Reset Password Schema - Recuperación de contraseña
 * 
 * Validación simple de email para envío de reset link
 * 
 * @module features/auth/schemas/reset-password.schema
 */

import { z } from 'zod';

// ============================================================================
// SCHEMA
// ============================================================================

export const resetPasswordSchema = z.object({
    email: z
        .string({ required_error: 'Email es requerido' })
        .min(1, 'Email es requerido')
        .email('Formato de email inválido')
        .toLowerCase()
        .trim(),
});

// ============================================================================
// TYPES
// ============================================================================

export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
