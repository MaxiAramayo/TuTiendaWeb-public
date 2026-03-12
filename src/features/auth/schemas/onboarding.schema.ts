/**
 * Onboarding Schema - Validacion del onboarding mejorado (10 slices)
 *
 * Slices:
 * 0: Welcome (interstitial)
 * 1: Nombre y Tipo de tienda
 * 2: Direccion (street, city, zipCode)
 * 3: Contacto (whatsapp con prefijo +54)
 * 4: Descripcion y Slug (con validacion de disponibilidad)
 * 5: Paleta de colores
 * 6: Producto preview (read-only, no se guarda)
 * 7: WhatsApp share + URL de tienda (informativo)
 * 8: Prueba gratuita (informativo, CTA suscripcion)
 * 9: Fin / submit
 *
 * @module features/auth/schemas/onboarding.schema
 */

import { z } from 'zod';

// ============================================================================
// STORE TYPE ENUM (5 tipos orientados a productos, sin servicios)
// ============================================================================

export const onboardingStoreTypeEnum = z.enum(
  ['restaurant', 'clothing', 'retail', 'beauty', 'other'],
  { errorMap: () => ({ message: 'Selecciona un tipo de tienda' }) }
);

// ============================================================================
// NEW ONBOARDING COMPLETE SCHEMA (flat structure for the wizard form)
// ============================================================================

export const onboardingCompleteSchema = z.object({
  // Step 1: Store name & type
  name: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'Maximo 100 caracteres')
    .trim(),
  storeType: onboardingStoreTypeEnum,

  // Step 2: Address
  street: z.string().max(200, 'Maximo 200 caracteres').optional().or(z.literal('')),
  city: z.string().max(100, 'Maximo 100 caracteres').optional().or(z.literal('')),
  zipCode: z.string().max(20, 'Maximo 20 caracteres').optional().or(z.literal('')),

  // Step 3: Contact
  whatsapp: z
    .string({ required_error: 'El WhatsApp es requerido' })
    .min(10, 'Numero de WhatsApp invalido')
    .max(25, 'Numero de WhatsApp invalido'),

  // Step 4: Description & Slug
  description: z
    .string({ required_error: 'La descripcion es requerida' })
    .min(10, 'La descripcion debe tener al menos 10 caracteres')
    .max(300, 'Maximo 300 caracteres'),
  slug: z
    .string({ required_error: 'La URL es requerida' })
    .min(3, 'La URL debe tener al menos 3 caracteres')
    .max(50, 'Maximo 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo minusculas, numeros y guiones'),

  // Step 5: Design
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido')
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido')
    .optional(),
  accentColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido')
    .optional(),
});

// ============================================================================
// PER-STEP FIELD MAPS (for wizard validation)
// ============================================================================

/** Fields to validate per step index */
export const ONBOARDING_STEP_FIELDS: Record<number, string[]> = {
  0: [],                                    // welcome
  1: ['name', 'storeType'],                 // store name & type
  2: [],                                    // address (all optional)
  3: ['whatsapp'],                          // contact
  4: ['description', 'slug'],               // description & slug
  5: [],                                    // colors (optional, has defaults)
  6: [],                                    // product preview (read-only)
  7: [],                                    // whatsapp share + url (read-only)
  8: [],                                    // prueba gratuita (read-only)
  9: [],                                    // finish / submit
};

export const ONBOARDING_TOTAL_STEPS = 10; // 0-9

// ============================================================================
// LEGACY SCHEMAS (backward compatibility - used by onboarding.actions.ts)
// ============================================================================

export const onboardingBasicInfoSchema = z.object({
  name: z.string().min(2, 'El nombre de la tienda debe tener al menos 2 caracteres'),
  description: z.string().min(10, 'La descripcion debe tener al menos 10 caracteres').max(300, 'Maximo 300 caracteres'),
  whatsapp: z.string().min(8, 'Numero de WhatsApp invalido').max(25, 'Numero de WhatsApp invalido'),
  storeType: z.enum([
    'retail', 'restaurant', 'clothing', 'beauty', 'other',
    // Legacy values kept for backward compat with existing stores
    'service', 'digital', 'fashion', 'health', 'sports', 'electronics', 'home', 'automotive',
  ]),
  slug: z.string().min(3, 'La URL debe tener al menos 3 caracteres').max(50).regex(/^[a-z0-9-]+$/, 'Solo minusculas, numeros y guiones'),
});

export const onboardingDesignSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido').optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido').optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido').optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

export const onboardingProductSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  price: z.coerce.number().optional(),
  categoryName: z.string().optional().default('General'),
  description: z.string().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type OnboardingCompleteInput = z.infer<typeof onboardingCompleteSchema>;
export type OnboardingBasicInfoInput = z.infer<typeof onboardingBasicInfoSchema>;
export type OnboardingDesignInput = z.infer<typeof onboardingDesignSchema>;
export type OnboardingProductInput = z.infer<typeof onboardingProductSchema>;
