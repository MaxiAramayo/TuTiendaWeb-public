/**
 * Esquemas de validación centralizados usando Zod
 * 
 * Este archivo contiene todos los esquemas de validación reutilizables
 * para mantener consistencia en toda la aplicación.
 * 
 * @module shared/validations
 */

import { z } from 'zod';

/**
 * Mensajes de error centralizados en español
 */
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
  price: 'El precio debe ser mayor a 0',
  fileSize: 'El archivo es muy grande',
  fileType: 'Tipo de archivo no permitido',
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
    // Normalizar número removiendo caracteres no numéricos excepto +
    const cleaned = val.replace(/[^\d+]/g, '');
    // Si no tiene código de país, agregar +54 para Argentina
    if (!cleaned.startsWith('+')) {
      return `+54${cleaned}`;
    }
    return cleaned;
  });

/**
 * Esquema para validar URLs de Instagram
 */
export const instagramUrlSchema = z
  .string()
  .optional()
  .refine(
    (url) => {
      if (!url) return true; // URL vacía es válida
      const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/;
      return instagramPattern.test(url);
    },
    { message: 'URL de Instagram inválida' }
  );

/**
 * Esquema para validar URLs de Facebook
 */
export const facebookUrlSchema = z
  .string()
  .optional()
  .refine(
    (url) => {
      if (!url) return true; // URL vacía es válida
      const facebookPattern = /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9_.]+\/?$/;
      return facebookPattern.test(url);
    },
    { message: 'URL de Facebook inválida' }
  );

/**
 * Esquema para validar slugs
 */
export const slugSchema = z
  .string()
  .min(3, errorMessages.minLength(3))
  .max(30, errorMessages.maxLength(30))
  .regex(/^[a-z0-9-]+$/, errorMessages.slug)
  .refine(
    (val) => !val.includes('--'),
    'No puede contener guiones dobles'
  )
  .refine(
    (val) => !val.startsWith('-') && !val.endsWith('-'),
    'No puede empezar o terminar con guión'
  );

/**
 * Esquema para validar nombres de tienda
 */
export const storeNameSchema = z
  .string()
  .min(2, errorMessages.minLength(2))
  .max(50, errorMessages.maxLength(50))
  .regex(
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    'El nombre solo puede contener letras y espacios'
  )
  .transform((val) => val.trim());

/**
 * Esquema para validar descripciones
 */
export const descriptionSchema = z
  .string()
  .min(10, errorMessages.minLength(10))
  .max(500, errorMessages.maxLength(500))
  .transform((val) => val.trim());

/**
 * Esquema para validar colores hexadecimales
 */
export const hexColorSchema = z
  .string()
  .regex(
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    errorMessages.color
  );

/**
 * Esquema para validar emails
 */
export const emailSchema = z
  .string()
  .min(1, errorMessages.required)
  .email(errorMessages.email)
  .transform((val) => val.toLowerCase().trim());

/**
 * Esquema para validar URLs generales
 */
export const urlSchema = z
  .string()
  .url(errorMessages.url)
  .optional();

/**
 * Esquema para validar horarios (formato HH:MM)
 */
export const timeSchema = z
  .string()
  .regex(
    /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    errorMessages.time
  );

/**
 * Esquema para validar días de la semana
 */
export const dayOfWeekSchema = z.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 
  'friday', 'saturday', 'sunday'
], {
  errorMap: () => ({ message: 'Día de la semana inválido' })
});

/**
 * Esquema para validar horarios de apertura
 */
export const scheduleSchema = z.object({
  day: dayOfWeekSchema,
  isOpen: z.boolean(),
  openTime: timeSchema.optional(),
  closeTime: timeSchema.optional()
}).refine(
  (data) => {
    if (data.isOpen) {
      return data.openTime && data.closeTime;
    }
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

/**
 * Esquema para validar direcciones
 */
export const addressSchema = z.object({
  street: z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(200, 'La dirección no puede exceder 200 caracteres'),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').max(100, 'La ciudad no puede exceder 100 caracteres'),
  state: z.string().min(2, 'La provincia debe tener al menos 2 caracteres').max(100, 'La provincia no puede exceder 100 caracteres'),
  zipCode: z.string().regex(/^[0-9]{4,8}$/, 'Código postal inválido').optional(),
  country: z.string().min(2, 'El país debe tener al menos 2 caracteres').max(100, 'El país no puede exceder 100 caracteres').default('Argentina')
});

/**
 * Esquema para validar coordenadas geográficas
 */
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90, 'Latitud debe estar entre -90 y 90').max(90, 'Latitud debe estar entre -90 y 90'),
  longitude: z.number().min(-180, 'Longitud debe estar entre -180 y 180').max(180, 'Longitud debe estar entre -180 y 180')
});

/**
 * Esquema para validar dimensiones de imagen
 */
export const imageDimensionsSchema = z.object({
  width: z.number().min(300, 'Ancho mínimo: 300px').max(4000, 'Ancho máximo: 4000px'),
  height: z.number().min(300, 'Alto mínimo: 300px').max(4000, 'Alto máximo: 4000px')
});

/**
 * Esquema para validar archivos de imagen
 */
export const imageFileSchema = z.object({
  file: z.instanceof(File, { message: 'Archivo requerido' }),
  type: z.enum(['avatar', 'cover'], { message: 'Tipo de imagen inválido' })
}).refine(
  (data) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return allowedTypes.includes(data.file.type);
  },
  { message: errorMessages.fileType }
).refine(
  (data) => {
    const maxSizes = {
      avatar: 2 * 1024 * 1024, // 2MB
      cover: 5 * 1024 * 1024   // 5MB
    };
    return data.file.size <= maxSizes[data.type];
  },
  { message: errorMessages.fileSize }
);

/**
 * Esquema para validar datos básicos de productos
 */
export const productDataSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre del plato es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(2000, 'La descripción no puede exceder 2000 caracteres'),
  price: z
    .number()
    .min(0.01, errorMessages.price)
    .max(999999.99, 'El precio no puede exceder 999,999.99'),
  categoryId: z
    .string()
    .min(1, 'La categoría es requerida'),
  status: z
    .enum(['active', 'inactive', 'draft'], {
      errorMap: () => ({ message: 'Estado inválido' })
    })
    .default('active')
});

/**
 * Esquema para validar datos de QR de usuario (legacy)
 */
export const qrUserDataSchema = z.object({
  displayName: z.string().min(1, 'Nombre de la tienda no configurado'),
  email: z.string().email('Email no configurado')
});

/**
 * Esquema para validar datos de QR de tienda
 */
export const qrStoreDataSchema = z.object({
  basicInfo: z.object({
    name: z.string().min(1, 'Nombre de la tienda no configurado'),
    slug: z.string().min(1, 'Slug de la tienda no configurado')
  })
});

/**
 * Esquema para validar configuración de tema
 */
export const themeConfigSchema = z.object({
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema.optional(),
  backgroundColor: hexColorSchema.optional(),
  textColor: hexColorSchema.optional(),
  fontFamily: z.enum(['inter', 'roboto', 'poppins', 'montserrat'], {
    errorMap: () => ({ message: 'Fuente no válida' })
  }).default('inter')
});

/**
 * Esquema para validar información básica de tienda
 */
export const storeBasicInfoSchema = z.object({
  name: storeNameSchema,
  slug: slugSchema,
  description: descriptionSchema.optional(),
  email: emailSchema.optional(),
  phone: whatsappSchema.optional(),
  website: urlSchema.optional()
});

/**
 * Esquema para validar redes sociales
 */
export const socialMediaSchema = z.object({
  instagram: instagramUrlSchema.optional(),
  facebook: facebookUrlSchema.optional(),
  twitter: urlSchema.optional(),
  youtube: urlSchema.optional(),
  tiktok: urlSchema.optional()
});

/**
 * Esquema para validar perfil completo de tienda
 */
export const storeProfileSchema = z.object({
  basicInfo: storeBasicInfoSchema,
  address: addressSchema.optional(),
  coordinates: coordinatesSchema.optional(),
  schedule: z.array(scheduleSchema).length(7, 'Debe incluir horarios para todos los días').optional(),
  socialMedia: socialMediaSchema.optional(),
  theme: themeConfigSchema.optional()
});

/**
 * Esquema para validar nombres de sitio
 */
export const siteNameSchema = z
  .string()
  .min(3, errorMessages.minLength(3))
  .max(30, errorMessages.maxLength(30))
  .regex(
    /^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$/,
    'Solo letras minúsculas, números y guiones. No puede empezar o terminar con guión'
  );

/**
 * Esquema para validar totales de ventas
 */
export const sellTotalsSchema = z.object({
  subtotal: z.number().min(0, 'El subtotal debe ser mayor o igual a 0'),
  total: z.number().min(0, 'El total debe ser mayor o igual a 0'),
  discount: z.object({
    type: z.enum(['fixed', 'percentage']),
    value: z.number().min(0)
  }).optional(),
  tax: z.object({
    amount: z.number().min(0)
  }).optional()
}).refine(
  (data) => {
    // Validar que el total sea coherente con subtotal, descuentos e impuestos
    let calculatedTotal = data.subtotal;
    
    if (data.discount) {
      const discountAmount = data.discount.type === 'percentage'
        ? (data.subtotal * data.discount.value) / 100
        : data.discount.value;
      calculatedTotal -= discountAmount;
    }
    
    if (data.tax) {
      calculatedTotal += data.tax.amount;
    }
    
    return Math.abs(data.total - Math.max(0, calculatedTotal)) < 0.01;
  },
  { message: 'Los totales no son coherentes' }
);

/**
 * Tipos derivados de los esquemas
 */
export type WhatsappInput = z.infer<typeof whatsappSchema>;
export type InstagramUrlInput = z.infer<typeof instagramUrlSchema>;
export type FacebookUrlInput = z.infer<typeof facebookUrlSchema>;
export type SlugInput = z.infer<typeof slugSchema>;
export type StoreNameInput = z.infer<typeof storeNameSchema>;
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
export type ImageDimensionsInput = z.infer<typeof imageDimensionsSchema>;
export type ImageFileInput = z.infer<typeof imageFileSchema>;
export type ProductDataInput = z.infer<typeof productDataSchema>;
export type QrUserDataInput = z.infer<typeof qrUserDataSchema>;
export type QrStoreDataInput = z.infer<typeof qrStoreDataSchema>;
export type SiteNameInput = z.infer<typeof siteNameSchema>;
export type SellTotalsInput = z.infer<typeof sellTotalsSchema>;

/**
 * Funciones de validación rápida
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

/**
 * Valida un nombre de tienda
 */
export const validateStoreName = (name: string) => {
  return storeNameSchema.safeParse(name);
};

/**
 * Valida una descripción
 */
export const validateDescription = (description: string) => {
  return descriptionSchema.safeParse(description);
};

/**
 * Valida un color hexadecimal
 */
export const validateHexColor = (color: string) => {
  return hexColorSchema.safeParse(color);
};

/**
 * Valida un email
 */
export const validateEmail = (email: string) => {
  return emailSchema.safeParse(email);
};

/**
 * Valida una URL general
 */
export const validateUrl = (url: string) => {
  return urlSchema.safeParse(url);
};

/**
 * Valida un horario
 */
export const validateTime = (time: string) => {
  return timeSchema.safeParse(time);
};

/**
 * Valida un día de la semana
 */
export const validateDayOfWeek = (day: string) => {
  return dayOfWeekSchema.safeParse(day);
};

/**
 * Valida un horario de apertura
 */
export const validateSchedule = (schedule: unknown) => {
  return scheduleSchema.safeParse(schedule);
};

/**
 * Valida una dirección
 */
export const validateAddress = (address: unknown) => {
  return addressSchema.safeParse(address);
};

/**
 * Valida coordenadas geográficas
 */
export const validateCoordinates = (coordinates: unknown) => {
  return coordinatesSchema.safeParse(coordinates);
};

/**
 * Valida configuración de tema
 */
export const validateThemeConfig = (theme: unknown) => {
  return themeConfigSchema.safeParse(theme);
};

/**
 * Valida información básica de tienda
 */
export const validateStoreBasicInfo = (basicInfo: unknown) => {
  return storeBasicInfoSchema.safeParse(basicInfo);
};

/**
 * Valida redes sociales
 */
export const validateSocialMedia = (socialMedia: unknown) => {
  return socialMediaSchema.safeParse(socialMedia);
};

/**
 * Valida perfil completo de tienda
 */
export const validateStoreProfile = (profile: unknown) => {
  return storeProfileSchema.safeParse(profile);
};

/**
 * Valida dimensiones de imagen
 */
export const validateImageDimensions = (width: number, height: number) => {
  return imageDimensionsSchema.safeParse({ width, height });
};

/**
 * Valida un archivo de imagen
 */
export const validateImageFile = (file: File, type: 'avatar' | 'cover') => {
  return imageFileSchema.safeParse({ file, type });
};

/**
 * Valida datos de producto
 */
export const validateProductData = (data: unknown) => {
  return productDataSchema.safeParse(data);
};

/**
 * Valida datos de QR de usuario (legacy)
 */
export const validateQrUserData = (data: unknown) => {
  return qrUserDataSchema.safeParse(data);
};

/**
 * Valida datos de QR de tienda
 */
export const validateQrStoreData = (data: unknown) => {
  return qrStoreDataSchema.safeParse(data);
};

/**
 * Valida un nombre de sitio
 */
export const validateSiteName = (siteName: string) => {
  return siteNameSchema.safeParse(siteName);
};

/**
 * Valida totales de venta
 */
export const validateSellTotals = (data: unknown) => {
  return sellTotalsSchema.safeParse(data);
};

/**
 * Constantes de validación
 */
export const VALIDATION_CONSTRAINTS = {
  STORE_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500
  },
  WHATSAPP: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15
  },
  SLUG: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30
  },
  SITE_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30
  },
  PRODUCT_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  PRODUCT_DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000
  },
  ADDRESS: {
    STREET_MIN_LENGTH: 5,
    STREET_MAX_LENGTH: 200,
    CITY_MIN_LENGTH: 2,
    CITY_MAX_LENGTH: 100,
    STATE_MIN_LENGTH: 2,
    STATE_MAX_LENGTH: 100,
    COUNTRY_MIN_LENGTH: 2,
    COUNTRY_MAX_LENGTH: 100
  },
  COORDINATES: {
    LATITUDE_MIN: -90,
    LATITUDE_MAX: 90,
    LONGITUDE_MIN: -180,
    LONGITUDE_MAX: 180
  },
  IMAGE_DIMENSIONS: {
    MIN_WIDTH: 300,
    MIN_HEIGHT: 300,
    MAX_WIDTH: 4000,
    MAX_HEIGHT: 4000
  },
  IMAGE_SIZE: {
    AVATAR_MAX: 2 * 1024 * 1024, // 2MB
    COVER_MAX: 5 * 1024 * 1024   // 5MB
  }
} as const;

/**
 * Tipos de tienda permitidos
 */
export const STORE_TYPES = ['restaurant', 'retail', 'service', 'other'] as const;
export type StoreType = typeof STORE_TYPES[number];

/**
 * Esquema para validar tipo de tienda
 */
export const storeTypeSchema = z.enum(STORE_TYPES, {
  errorMap: () => ({ message: 'Tipo de tienda inválido' })
});

/**
 * Valida un tipo de tienda
 */
export const validateStoreType = (type: string) => {
  return storeTypeSchema.safeParse(type);
};