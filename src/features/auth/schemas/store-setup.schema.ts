/**
 * Store Setup Schema - Configuración de tienda
 * 
 * Usado en Multi-Step Register (Paso 2)
 * 
 * Tipos de negocio soportados:
 * - restaurant: Restaurantes, cafeterías, food delivery
 * - retail: Tiendas, comercios, e-commerce
 * - services: Servicios profesionales, consultorías
 * - clothing: Ropa y accesorios
 * - electronics: Electrónicos
 * - beauty: Belleza y cuidado
 * - home: Hogar y decoración
 * - sports: Deportes y fitness
 * - books: Libros y educación
 * - health: Salud y bienestar
 * - automotive: Automotriz
 * - other: Otros rubros
 * 
 * @module features/auth/schemas/store-setup.schema
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const storeTypeEnum = z.enum(
    ['restaurant', 'retail', 'services', 'clothing', 'electronics', 'beauty', 'home', 'sports', 'books', 'health', 'automotive', 'other'],
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

    slug: z
        .string({ required_error: 'El nombre del sitio es requerido' })
        .min(3, 'El nombre del sitio debe tener al menos 3 caracteres')
        .max(50, 'El nombre del sitio no puede exceder 50 caracteres')
        .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones')
        .trim(),

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
