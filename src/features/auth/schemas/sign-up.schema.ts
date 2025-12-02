import { z } from 'zod';
import { registerBaseSchema } from './register.schema';
import { storeSetupSchema } from './store-setup.schema';

/**
 * Schema unificado para el formulario de registro completo
 * Combina registro de usuario + configuración inicial de tienda
 */
export const signUpSchema = registerBaseSchema
    .merge(storeSetupSchema)
    .extend({
        // Campos adicionales específicos del formulario
        slug: z.string().optional(), // Validado por hook aparte, pero presente en form
        terms: z.literal(true, {
            errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' }),
        }),
    })
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: 'Las contraseñas no coinciden',
            path: ['confirmPassword'],
        }
    );

export type SignUpFormData = z.infer<typeof signUpSchema>;
