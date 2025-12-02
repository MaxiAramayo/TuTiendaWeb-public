import { z } from 'zod';
import {
    whatsappSchema,
    storeNameSchema,
    storeTypeSchema,
    slugSchema as storeSlugSchema
} from '@/features/store/schemas/store.schema';

export const errorMessages = {
    required: 'Este campo es obligatorio',
    email: 'Formato de email inválido',
    minLength: (min: number) => `Debe contener al menos ${min} caracteres`,
};

export const emailSchema = z
    .string()
    .min(1, errorMessages.required)
    .email(errorMessages.email)
    .transform((val) => val.toLowerCase().trim());

export const passwordSchema = z
    .string()
    .min(6, errorMessages.minLength(6))
    .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número'
    );

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, errorMessages.required),
});

export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    displayName: z
        .string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(50, 'El nombre no puede tener más de 50 caracteres')
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
    whatsappNumber: whatsappSchema,
    name: storeNameSchema,
    storeType: storeTypeSchema,
    slug: storeSlugSchema,
    terms: z.literal(true, {
        errorMap: () => ({ message: 'Debes aceptar los términos y condiciones' })
    })
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
    email: emailSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
