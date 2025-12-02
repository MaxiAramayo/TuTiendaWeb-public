import { z } from 'zod';
import { storeTypeEnum } from './store-setup.schema';

/**
 * Schema para completar perfil con Google
 * Reconstruido para mantener compatibilidad con GoogleProfileSetup.tsx
 */
export const googleProfileSchema = z.object({
    name: z
        .string({ required_error: 'Nombre de la tienda es requerido' })
        .min(3, 'El nombre debe tener al menos 3 caracteres'),

    slug: z
        .string({ required_error: 'URL de la tienda es requerida' })
        .min(3, 'La URL debe tener al menos 3 caracteres')
        .regex(/^[a-z0-9-]+$/, 'La URL solo puede contener letras minúsculas, números y guiones'),

    whatsappNumber: z
        .string({ required_error: 'Número de WhatsApp es requerido' })
        .min(10, 'Número inválido'),

    storeType: storeTypeEnum,

    description: z
        .string()
        .optional(),

    address: z
        .string()
        .optional(),
});

export type GoogleProfileSetupValues = z.infer<typeof googleProfileSchema>;
