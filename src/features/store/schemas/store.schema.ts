import { z } from 'zod';

export const errorMessages = {
    required: 'Este campo es obligatorio',
    invalid: 'Valor inválido',
    minLength: (min: number) => `Debe contener al menos ${min} caracteres`,
    maxLength: (max: number) => `No puede exceder ${max} caracteres`,
    email: 'Formato de email inválido',
    url: 'Formato de URL inválido',
    phone: 'Número de teléfono inválido',
    color: 'Color hexadecimal inválido (ej: #FF0000)',
    slug: 'Solo letras minúsculas, números y guiones',
    time: 'Formato de hora inválido (HH:MM)',
    address: 'Dirección inválida',
    coordinates: 'Coordenadas inválidas'
};

/**
 * Esquema para validar números de WhatsApp
 */
export const whatsappSchema = z
    .string()
    .min(1, errorMessages.required)
    .regex(
        /^\+?[1-9]\d{1,14}$/,
        'Número de WhatsApp inválido. Debe incluir código de país'
    )
    .transform((val) => {
        const cleaned = val.replace(/[^\d+]/g, '');
        if (!cleaned.startsWith('+')) {
            return `+54${cleaned}`;
        }
        return cleaned;
    });

export const instagramUrlSchema = z
    .string()
    .optional()
    .refine(
        (url) => {
            if (!url) return true;
            const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/;
            return instagramPattern.test(url);
        },
        { message: 'URL de Instagram inválida' }
    );

export const facebookUrlSchema = z
    .string()
    .optional()
    .refine(
        (url) => {
            if (!url) return true;
            const facebookPattern = /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9_.]+\/?$/;
            return facebookPattern.test(url);
        },
        { message: 'URL de Facebook inválida' }
    );

export const slugSchema = z
    .string()
    .min(3, errorMessages.minLength(3))
    .max(30, errorMessages.maxLength(30))
    .regex(/^[a-z0-9-]+$/, errorMessages.slug)
    .refine((val) => !val.includes('--'), 'No puede contener guiones dobles')
    .refine((val) => !val.startsWith('-') && !val.endsWith('-'), 'No puede empezar o terminar con guión');

export const storeNameSchema = z
    .string()
    .min(2, errorMessages.minLength(2))
    .max(50, errorMessages.maxLength(50))
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .transform((val) => val.trim());

export const descriptionSchema = z
    .string()
    .min(10, errorMessages.minLength(10))
    .max(500, errorMessages.maxLength(500))
    .transform((val) => val.trim());

export const hexColorSchema = z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, errorMessages.color);

export const emailSchema = z
    .string()
    .min(1, errorMessages.required)
    .email(errorMessages.email)
    .transform((val) => val.toLowerCase().trim());

export const urlSchema = z.string().url(errorMessages.url).optional();

export const timeSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, errorMessages.time);

export const dayOfWeekSchema = z.enum([
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'
], {
    errorMap: () => ({ message: 'Día de la semana inválido' })
});

export const scheduleSchema = z.object({
    day: dayOfWeekSchema,
    isOpen: z.boolean(),
    openTime: timeSchema.optional(),
    closeTime: timeSchema.optional()
}).refine(
    (data) => {
        if (data.isOpen) return data.openTime && data.closeTime;
        return true;
    },
    { message: 'Horarios de apertura y cierre son requeridos cuando está abierto' }
).refine(
    (data) => {
        if (data.isOpen && data.openTime && data.closeTime) {
            return data.openTime < data.closeTime;
        }
        return true;
    },
    { message: 'La hora de apertura debe ser anterior a la de cierre' }
);

export const addressSchema = z.object({
    street: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(200, 'La dirección no puede exceder 200 caracteres'),
    city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').max(100, 'La ciudad no puede exceder 100 caracteres'),
    state: z.string().min(2, 'La provincia debe tener al menos 2 caracteres').max(100, 'La provincia no puede exceder 100 caracteres'),
    zipCode: z.string().regex(/^[0-9]{4,8}$/, 'Código postal inválido').optional(),
    country: z.string().min(2, 'El país debe tener al menos 2 caracteres').max(100, 'El país no puede exceder 100 caracteres').default('Argentina')
});

export const coordinatesSchema = z.object({
    latitude: z.number().min(-90, 'Latitud debe estar entre -90 y 90').max(90, 'Latitud debe estar entre -90 y 90'),
    longitude: z.number().min(-180, 'Longitud debe estar entre -180 y 180').max(180, 'Longitud debe estar entre -180 y 180')
});

export const themeConfigSchema = z.object({
    primaryColor: hexColorSchema,
    secondaryColor: hexColorSchema.optional(),
    backgroundColor: hexColorSchema.optional(),
    textColor: hexColorSchema.optional(),
    fontFamily: z.enum(['inter', 'roboto', 'poppins', 'montserrat'], {
        errorMap: () => ({ message: 'Fuente no válida' })
    }).default('inter')
});

export const storeBasicInfoSchema = z.object({
    name: storeNameSchema,
    slug: slugSchema,
    description: descriptionSchema.optional(),
    email: emailSchema.optional(),
    phone: whatsappSchema.optional(),
    website: urlSchema.optional()
});

export const socialMediaSchema = z.object({
    instagram: instagramUrlSchema.optional(),
    facebook: facebookUrlSchema.optional(),
    twitter: urlSchema.optional(),
    youtube: urlSchema.optional(),
    tiktok: urlSchema.optional()
});

export const storeProfileSchema = z.object({
    basicInfo: storeBasicInfoSchema,
    address: addressSchema.optional(),
    coordinates: coordinatesSchema.optional(),
    schedule: z.array(scheduleSchema).length(7, 'Debe incluir horarios para todos los días').optional(),
    socialMedia: socialMediaSchema.optional(),
    theme: themeConfigSchema.optional()
});

export const STORE_TYPES = [
    'retail', 'restaurant', 'service', 'digital', 'fashion',
    'beauty', 'health', 'sports', 'electronics', 'home',
    'automotive', 'other'
] as const;

export const storeTypeSchema = z.enum(STORE_TYPES, {
    errorMap: () => ({ message: 'Tipo de tienda inválido' })
});

export const validateWhatsApp = (phone: string) => whatsappSchema.safeParse(phone);
export const validateInstagramUrl = (url: string) => instagramUrlSchema.safeParse(url);
export const validateFacebookUrl = (url: string) => facebookUrlSchema.safeParse(url);
export const validateSlug = (slug: string) => slugSchema.safeParse(slug);
export const validateStoreName = (name: string) => storeNameSchema.safeParse(name);
export const validateDescription = (description: string) => descriptionSchema.safeParse(description);
export const validateHexColor = (color: string) => hexColorSchema.safeParse(color);
export const validateEmail = (email: string) => emailSchema.safeParse(email);
export const validateUrl = (url: string) => urlSchema.safeParse(url);
export const validateTime = (time: string) => timeSchema.safeParse(time);

export type DescriptionInput = z.infer<typeof descriptionSchema>;
export type HexColorInput = z.infer<typeof hexColorSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type UrlInput = z.infer<typeof urlSchema>;
export type TimeInput = z.infer<typeof timeSchema>;
export type DayOfWeekInput = z.infer<typeof dayOfWeekSchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CoordinatesInput = z.infer<typeof coordinatesSchema>;
export type ThemeConfigInput = z.infer<typeof themeConfigSchema>;
export type StoreBasicInfoInput = z.infer<typeof storeBasicInfoSchema>;
export type SocialMediaInput = z.infer<typeof socialMediaSchema>;
export type StoreProfileInput = z.infer<typeof storeProfileSchema>;
export type StoreType = typeof STORE_TYPES[number];
