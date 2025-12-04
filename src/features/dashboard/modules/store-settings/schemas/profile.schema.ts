/**
 * Esquemas de validación para el módulo de perfil de tienda
 * 
 * Ubicación correcta según architecture.md:
 * features/[module]/schemas/[name].schema.ts
 * 
 * @module features/dashboard/modules/store-settings/schemas
 */

import { z } from "zod";

/**
 * Mensajes de error en español
 */
export const errorMessages = {
  required: "Este campo es obligatorio",
  minLength: (min: number) => `Debe tener al menos ${min} caracteres`,
  maxLength: (max: number) => `No puede superar los ${max} caracteres`,
  email: "Ingrese un email válido",
  url: "Ingrese una URL válida",
  phone: "Ingrese un número de teléfono válido",
  whatsapp: "Ingrese un número de WhatsApp válido (ej: +54 9 11 1234-5678)",
  slug: "Solo letras minúsculas, números y guiones",
  hexColor: "Ingrese un color hexadecimal válido (ej: #6366f1)",
  instagram: "Ingrese una URL válida de Instagram",
  facebook: "Ingrese una URL válida de Facebook",
};

/**
 * Schema para WhatsApp - Acepta formatos flexibles
 * Ejemplos válidos:
 * - +54 9 11 1234-5678
 * - +5491112345678
 * - 1112345678
 * - 011-1234-5678
 */
export const whatsappSchema = z
  .string({ required_error: errorMessages.required })
  .min(8, { message: errorMessages.minLength(8) })
  .max(25, { message: errorMessages.maxLength(25) })
  .refine(
    (val) => {
      // Eliminar espacios, guiones y paréntesis para validar
      const cleaned = val.replace(/[\s\-\(\)\.]/g, '');
      // Debe tener al menos 8 dígitos y opcionalmente empezar con +
      return /^\+?\d{8,18}$/.test(cleaned);
    },
    { message: errorMessages.whatsapp }
  );

/**
 * Schema para slug/siteName
 */
export const slugSchema = z
  .string({ required_error: errorMessages.required })
  .min(3, { message: errorMessages.minLength(3) })
  .max(30, { message: errorMessages.maxLength(30) })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: errorMessages.slug })
  .transform((val) => val.toLowerCase().trim());

/**
 * Schema para color hexadecimal
 */
export const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: errorMessages.hexColor })
  .optional();

/**
 * Schema para URL de Instagram
 */
export const instagramUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val === '') return true;
      return /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(val);
    },
    { message: errorMessages.instagram }
  )
  .optional()
  .or(z.literal(''));

/**
 * Schema para URL de Facebook
 */
export const facebookUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val === '') return true;
      return /^(https?:\/\/)?(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9.]+\/?$/.test(val);
    },
    { message: errorMessages.facebook }
  )
  .optional()
  .or(z.literal(''));

/**
 * Tipos de tienda disponibles
 */
export const storeTypes = [
  'retail', 'restaurant', 'service', 'digital', 'fashion',
  'beauty', 'health', 'sports', 'electronics', 'home',
  'automotive', 'other'
] as const;

export type StoreType = typeof storeTypes[number];

/**
 * Schema para información básica
 */
export const basicInfoSchema = z.object({
  name: z
    .string({ required_error: errorMessages.required })
    .min(2, { message: errorMessages.minLength(2) })
    .max(50, { message: errorMessages.maxLength(50) })
    .trim(),
  description: z
    .string({ required_error: errorMessages.required })
    .min(10, { message: errorMessages.minLength(10) })
    .max(300, { message: errorMessages.maxLength(300) })
    .trim(),
  slug: slugSchema,
  type: z.enum(storeTypes, {
    required_error: "Debe seleccionar un tipo de tienda",
    invalid_type_error: "Tipo de tienda no válido"
  }),
});

/**
 * Schema para información de contacto
 */
export const contactInfoSchema = z.object({
  whatsapp: whatsappSchema,
  email: z
    .string()
    .email({ message: errorMessages.email })
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(8, { message: errorMessages.minLength(8) })
    .max(15, { message: errorMessages.maxLength(15) })
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url({ message: errorMessages.url })
    .optional()
    .or(z.literal('')),
});

/**
 * Schema para dirección
 */
export const addressSchema = z.object({
  street: z
    .string()
    .min(5, { message: errorMessages.minLength(5) })
    .max(100, { message: errorMessages.maxLength(100) })
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .min(2, { message: errorMessages.minLength(2) })
    .max(50, { message: errorMessages.maxLength(50) })
    .optional()
    .or(z.literal('')),
  province: z
    .string()
    .min(2, { message: errorMessages.minLength(2) })
    .max(50, { message: errorMessages.maxLength(50) })
    .optional()
    .or(z.literal('')),
  country: z
    .string()
    .min(2, { message: errorMessages.minLength(2) })
    .max(50, { message: errorMessages.maxLength(50) })
    .default('Argentina'),
  zipCode: z
    .string()
    .min(4, { message: errorMessages.minLength(4) })
    .max(10, { message: errorMessages.maxLength(10) })
    .optional()
    .or(z.literal('')),
});

/**
 * Schema para redes sociales
 */
export const socialLinksSchema = z.object({
  instagram: instagramUrlSchema,
  facebook: facebookUrlSchema,
});

/**
 * Schema para configuración de tema
 */
export const themeConfigSchema = z.object({
  logoUrl: z.string().url({ message: errorMessages.url }).optional().or(z.literal('')),
  bannerUrl: z.string().url({ message: errorMessages.url }).optional().or(z.literal('')),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  fontFamily: z.string().optional(),
  style: z.enum(['modern', 'classic', 'minimal', 'colorful']).optional().default('modern'),
  buttonStyle: z.enum(['rounded', 'square', 'pill']).optional().default('rounded'),
}).passthrough();

/**
 * Schema para período de tiempo
 */
const timePeriodSchema = z.object({
  open: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  close: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  nextDay: z.boolean().default(false),
});

/**
 * Schema para horario diario
 */
export const dailyScheduleSchema = z.object({
  closed: z.boolean().default(false),
  periods: z.array(timePeriodSchema).default([]),
});

/**
 * Schema para horario semanal
 */
export const weeklyScheduleSchema = z.object({
  monday: dailyScheduleSchema,
  tuesday: dailyScheduleSchema,
  wednesday: dailyScheduleSchema,
  thursday: dailyScheduleSchema,
  friday: dailyScheduleSchema,
  saturday: dailyScheduleSchema,
  sunday: dailyScheduleSchema,
});

/**
 * Schema para método de pago
 */
export const paymentMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  requiresVerification: z.boolean().optional(),
  instructions: z.string().optional(),
  config: z.record(z.any()).optional(),
});

/**
 * Schema para método de entrega
 */
export const deliveryMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  price: z.number().optional(),
  freeOver: z.number().optional(),
  estimatedTime: z.string().optional(),
  instructions: z.string().optional(),
  coverageAreas: z.array(z.string()).optional(),
});

/**
 * Schema para validación de slug único
 */
export const slugValidationSchema = z.object({
  slug: slugSchema,
  currentSlug: z.string().optional(),
});

/**
 * Schema para subida de imágenes
 */
export const imageUploadSchema = z.object({
  file: z.instanceof(File, { message: "Debe seleccionar un archivo" }),
  type: z.enum(['logo', 'banner', 'profile'], {
    required_error: "Debe especificar el tipo de imagen"
  }),
}).refine(
  (data) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return allowedTypes.includes(data.file.type);
  },
  {
    message: "Solo se permiten archivos JPG, PNG o WebP",
    path: ["file"]
  }
).refine(
  (data) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return data.file.size <= maxSize;
  },
  {
    message: "El archivo no puede superar los 5MB",
    path: ["file"]
  }
);

/**
 * Schema principal del formulario de perfil
 */
export const profileFormSchema = z.object({
  // Información básica
  name: z
    .string({ required_error: errorMessages.required })
    .min(2, { message: errorMessages.minLength(2) })
    .max(50, { message: errorMessages.maxLength(50) })
    .trim(),
  description: z
    .string({ required_error: errorMessages.required })
    .min(10, { message: errorMessages.minLength(10) })
    .max(300, { message: errorMessages.maxLength(300) })
    .trim(),
  siteName: slugSchema,
  storeType: z.enum(storeTypes, {
    required_error: "Debe seleccionar un tipo de tienda"
  }),
  category: z.string().optional(),

  // Contacto
  whatsapp: whatsappSchema,
  email: z.string().email({ message: errorMessages.email }).optional().or(z.literal('')),
  website: z.string().url({ message: errorMessages.url }).optional().or(z.literal('')),

  // Dirección
  street: z.string().min(5, { message: errorMessages.minLength(5) }).optional().or(z.literal('')),
  city: z.string().min(2, { message: errorMessages.minLength(2) }).optional().or(z.literal('')),
  province: z.string().min(2, { message: errorMessages.minLength(2) }).optional().or(z.literal('')),
  country: z.string().default('Argentina'),
  zipCode: z.string().optional().or(z.literal('')),

  // Horarios
  openingHours: z.string().max(200).optional().or(z.literal('')),
  schedule: weeklyScheduleSchema.optional(),

  // Redes sociales
  instagram: instagramUrlSchema.or(z.literal('')),
  facebook: facebookUrlSchema.or(z.literal('')),

  // Configuración
  currency: z.string().default('ARS'),
  language: z.string().default('es'),
  timezone: z.string().optional(),

  // Métodos de pago y entrega
  paymentMethods: z.array(paymentMethodSchema).optional(),
  deliveryMethods: z.array(deliveryMethodSchema).optional(),

  // Tema
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  theme: themeConfigSchema.optional(),
});

/**
 * Tipos derivados de los schemas
 */
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type ContactInfoFormData = z.infer<typeof contactInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type SocialLinksFormData = z.infer<typeof socialLinksSchema>;
export type ThemeConfigFormData = z.infer<typeof themeConfigSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type SlugValidationData = z.infer<typeof slugValidationSchema>;
export type ImageUploadData = z.infer<typeof imageUploadSchema>;
export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>;
export type DailySchedule = z.infer<typeof dailyScheduleSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type DeliveryMethod = z.infer<typeof deliveryMethodSchema>;

/**
 * Funciones de validación rápida para uso en componentes
 */

/**
 * Valida un número de WhatsApp
 */
export const validateWhatsApp = (phone: string) => {
  return whatsappSchema.safeParse(phone);
};

/**
 * Valida una URL de Instagram
 */
export const validateInstagramUrl = (url: string) => {
  return instagramUrlSchema.safeParse(url);
};

/**
 * Valida una URL de Facebook
 */
export const validateFacebookUrl = (url: string) => {
  return facebookUrlSchema.safeParse(url);
};

/**
 * Valida un slug
 */
export const validateSlug = (slug: string) => {
  return slugSchema.safeParse(slug);
};
