/**
 * User Profile Schema - Datos de perfil de usuario
 * 
 * Usado en Multi-Step Register (Paso 1)
 * 
 * Phone format: E.164 internacional
 * Ejemplos válidos:
 * - +5491123456789 (Argentina)
 * - +12025551234 (USA)
 * - +447911123456 (UK)
 * 
 * @module features/auth/schemas/user-profile.schema
 * @see https://en.wikipedia.org/wiki/E.164
 */

import { z } from 'zod';

// ============================================================================
// SCHEMA
// ============================================================================

export const userProfileSchema = z.object({
    displayName: z
        .string({ required_error: 'Nombre es requerido' })
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(50, 'El nombre no puede exceder 50 caracteres')
        .trim(),

    phone: z
        .string()
        .regex(
            /^\+?[1-9]\d{1,14}$/,
            'Número de teléfono inválido. Formato: +5491123456789'
        )
        .optional()
        .or(z.literal('')), // Permitir string vacío como válido

    photoURL: z
        .string()
        .url('URL de imagen inválida')
        .optional()
        .or(z.literal('')),
});

// ============================================================================
// TYPES
// ============================================================================

export type UserProfileData = z.infer<typeof userProfileSchema>;
