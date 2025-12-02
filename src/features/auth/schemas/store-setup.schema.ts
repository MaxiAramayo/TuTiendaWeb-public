/**
 * Store Setup Schema - Configuración de tienda
 * 
 * Usado en Multi-Step Register (Paso 2)
 * 
 * Tipos de negocio soportados:
 * - restaurant: Restaurantes, cafeterías, food delivery
 * - retail: Tiendas, comercios, e-commerce
 * - services: Servicios profesionales, consultorías
 * - other: Otros rubros
 * 
 * @module features/auth/schemas/store-setup.schema
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const storeTypeEnum = z.enum(
    ['restaurant', 'retail', 'services', 'other'],
    {
        errorMap: () => ({ message: 'Selecciona un tipo de tienda válido' }),
    }
);

// ============================================================================
// SCHEMA
// ============================================================================

export const storeSetupSchema = z.object({
    storeName: z
        .string({ required_error: 'Nombre de la tienda es requerido' })
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .trim(),

    storeType: storeTypeEnum,

    address: z
        .string()
        .min(10, 'Dirección completa requerida (mínimo 10 caracteres)')
        .max(200, 'Dirección demasiado larga')
        .optional()
        .or(z.literal('')),

    phone: z
        .string()
        .regex(
            /^\+?[1-9]\d{1,14}$/,
            'Número de teléfono inválido'
        )
        .optional()
        .or(z.literal('')),
});

// ============================================================================
// TYPES
// ============================================================================

export type StoreSetupData = z.infer<typeof storeSetupSchema>;
export type StoreType = z.infer<typeof storeTypeEnum>;
