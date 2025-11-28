/**
 * Esquemas de validación para el módulo de perfil
 * @module features/dashboard/modules/profile/validations
 */

import { z } from "zod";
import {
  StoreType,
  whatsappSchema,
  instagramUrlSchema,
  facebookUrlSchema,
  slugSchema,
  storeNameSchema,
  descriptionSchema,
  emailSchema,
  urlSchema,
  timeSchema,
  dayOfWeekSchema,
  scheduleSchema,
  hexColorSchema,
  validateInstagramUrl,
  validateFacebookUrl,
  validateWhatsApp,
  validateSlug,
  validateStoreName,
  validateDescription,
  validateHexColor,
  validateEmail,
  validateUrl,
  validateTime,
  errorMessages as sharedErrorMessages
} from "@/features/store/schemas/store.schema";

/**
 * Mensajes de error específicos del módulo (complementan los compartidos)
 */
const errorMessages = {
  ...sharedErrorMessages,
  slugTaken: "Este nombre ya está en uso",
  tooShort: "Demasiado corto",
  tooLong: "Demasiado largo",
};

/**
 * Validación para URLs de redes sociales (usa validación centralizada)
 */
const socialUrlSchema = urlSchema.optional().or(z.literal(''));

/**
 * Esquema para información básica de la tienda
 */
export const basicInfoSchema = z.object({
  name: storeNameSchema,
  description: descriptionSchema,
  slug: slugSchema,

  type: z.enum([
    'retail', 'restaurant', 'service', 'digital', 'fashion',
    'beauty', 'health', 'sports', 'electronics', 'home',
    'automotive', 'other'
  ] as const, {
    required_error: "Debe seleccionar un tipo de tienda",
    invalid_type_error: "Tipo de tienda no válido"
  }),
});

/**
 * Esquema para información de contacto
 */
export const contactInfoSchema = z.object({
  whatsapp: whatsappSchema,
  email: emailSchema.optional().or(z.literal('')),

  phone: z
    .string()
    .min(8, { message: errorMessages.minLength(8) })
    .max(15, { message: errorMessages.maxLength(15) })
    .optional()
    .or(z.literal('')),

  website: urlSchema.optional().or(z.literal('')),
});

/**
 * Esquema para dirección
 */
export const addressSchema = z.object({
  street: z
    .string()
    .min(5, { message: errorMessages.minLength(5) })
    .max(100, { message: errorMessages.maxLength(100) })
    .optional(),

  city: z
    .string()
    .min(2, { message: errorMessages.minLength(2) })
    .max(50, { message: errorMessages.maxLength(50) })
    .optional(),

  province: z
    .string()
    .min(2, { message: errorMessages.minLength(2) })
    .max(50, { message: errorMessages.maxLength(50) })
    .optional(),

  country: z
    .string()
    .min(2, { message: errorMessages.minLength(2) })
    .max(50, { message: errorMessages.maxLength(50) })
    .default('Argentina'),

  zipCode: z
    .string()
    .min(4, { message: errorMessages.minLength(4) })
    .max(10, { message: errorMessages.maxLength(10) })
    .optional(),
});

/**
 * Esquema para período de tiempo individual
 */
const timePeriodSchema = z.object({
  open: timeSchema,
  close: timeSchema,
  nextDay: z.boolean().default(false),
}).refine(
  (data) => {
    // Si nextDay es true, no validamos que open < close
    if (data.nextDay) return true;

    // Validar que la hora de apertura sea anterior a la de cierre
    const openTime = new Date(`1970-01-01T${data.open}:00`);
    const closeTime = new Date(`1970-01-01T${data.close}:00`);

    return openTime < closeTime;
  },
  {
    message: "La hora de apertura debe ser anterior a la de cierre",
    path: ["close"]
  }
);

/**
 * Esquema para horario diario con soporte para múltiples períodos
 */
export const dailyScheduleSchema = z.object({
  closed: z.boolean().default(false),
  periods: z.array(timePeriodSchema).default([]),
  // Campos legacy para compatibilidad hacia atrás
  open: timeSchema.optional(),
  close: timeSchema.optional(),
  break: z.object({
    start: timeSchema,
    end: timeSchema,
  }).optional(),
}).refine(
  (data) => {
    // Si está cerrado, no necesita períodos
    if (data.closed) return true;

    // Si no está cerrado, debe tener al menos un período
    return data.periods && data.periods.length > 0;
  },
  {
    message: "Debe configurar al menos un horario de atención",
    path: ["periods"]
  }
);

/**
 * Esquema para horario semanal
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
 * Esquema para redes sociales
 */
export const socialLinksSchema = z.object({
  instagram: instagramUrlSchema,
  facebook: socialUrlSchema,
});

/**
 * Esquema para configuración de tema
 */
export const themeConfigSchema = z.object({
  logoUrl: z.string().url({ message: errorMessages.url }).optional(),
  bannerUrl: z.string().url({ message: errorMessages.url }).optional(),
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  fontFamily: z.string().optional(),
  style: z.enum(['modern', 'classic', 'minimal', 'colorful']).optional(),
});

/**
 * Esquema principal del formulario de perfil
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

  storeType: z.enum([
    'retail', 'restaurant', 'service', 'digital', 'fashion',
    'beauty', 'health', 'sports', 'electronics', 'home',
    'automotive', 'other'
  ] as const, {
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

  // Horarios simplificado
  openingHours: z
    .string()
    .min(5, { message: "Ingrese los horarios de atención" })
    .max(200, { message: errorMessages.maxLength(200) })
    .optional()
    .or(z.literal('')),

  // Horarios
  schedule: weeklyScheduleSchema.optional(),

  // Redes sociales
  instagram: instagramUrlSchema.or(z.literal('')),
  facebook: socialUrlSchema.or(z.literal('')),

  // Configuración
  currency: z.string().default('ARS'),
  language: z.string().default('es'),
  timezone: z.string().optional(),

  // Métodos de pago y entrega
  paymentMethods: z.array(z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean(),
    requiresVerification: z.boolean().optional(),
    instructions: z.string().optional(),
    config: z.record(z.any()).optional(),
  })).optional(),
  deliveryMethods: z.array(z.object({
    id: z.string(),
    name: z.string(),
    enabled: z.boolean(),
    price: z.number().optional(),
    freeOver: z.number().optional(),
    estimatedTime: z.string().optional(),
    instructions: z.string().optional(),
    coverageAreas: z.array(z.string()).optional(),
  })).optional(),

  // Configuración de productos
  skuEnabled: z.boolean().optional(),
  skuFormat: z.string().optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  stockControlEnabled: z.boolean().optional(),
  stockAlertLevel: z.number().min(0).optional(),
  promotionsEnabled: z.boolean().optional(),
  allowedPromotionTypes: z.array(z.string()).optional(),



  // Tema
  primaryColor: hexColorSchema.optional(),
  secondaryColor: hexColorSchema.optional(),
});

/**
 * Esquema para validación de slug único
 */
export const slugValidationSchema = z.object({
  slug: slugSchema,
  currentSlug: z.string().optional(),
});

/**
 * Esquema para subida de imágenes
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
 * Tipos derivados de los esquemas
 */
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type ContactInfoFormData = z.infer<typeof contactInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type SocialLinksFormData = z.infer<typeof socialLinksSchema>;
export type ThemeConfigFormData = z.infer<typeof themeConfigSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type SlugValidationData = z.infer<typeof slugValidationSchema>;
export type ImageUploadData = z.infer<typeof imageUploadSchema>;

/**
 * Funciones de validación personalizadas específicas del módulo
 */
export const customValidations = {
  /**
   * Valida si un slug está disponible
   */
  validateSlugAvailability: async (slug: string, currentSlug?: string): Promise<boolean> => {
    if (slug === currentSlug) return true;

    // Aquí iría la lógica para verificar en la base de datos
    // Por ahora retornamos true como placeholder
    return true;
  },

  /**
   * Valida formato de número de WhatsApp argentino
   */
  validateArgentineWhatsApp: (phone: string): boolean => {
    const cleanPhone = phone.replace(/\s/g, '');
    const argentineRegex = /^\+54(9)?\d{8,10}$/;
    return argentineRegex.test(cleanPhone);
  },

  /**
   * Valida horarios de apertura y cierre
   */
  validateBusinessHours: (open: string, close: string): boolean => {
    try {
      const openTime = new Date(`1970-01-01T${open}:00`);
      const closeTime = new Date(`1970-01-01T${close}:00`);
      return openTime < closeTime;
    } catch {
      return false;
    }
  },
};

/**
 * Re-exportar funciones de validación centralizadas para compatibilidad
 */
export {
  validateInstagramUrl,
  validateFacebookUrl,
  validateWhatsApp,
  validateSlug,
  validateStoreName,
  validateDescription,
  validateHexColor,
  validateEmail,
  validateUrl,
  validateTime
};

/**
 * Mensajes de error personalizados por campo
 */
export const fieldErrorMessages = {
  name: {
    required: "El nombre de la tienda es obligatorio",
    minLength: "El nombre debe tener al menos 2 caracteres",
    maxLength: "El nombre no puede superar los 50 caracteres",
  },
  description: {
    required: "La descripción es obligatoria",
    minLength: "La descripción debe tener al menos 10 caracteres",
    invalid: "Ingrese una URL válida de Instagram",
  },
};