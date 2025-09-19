/**
 * Esquemas de validación centralizados usando Zod
 * 
 * Este archivo contiene validaciones generales reutilizables
 * para toda la aplicación, excluyendo las específicas de módulos.
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
 * Esquema para validar emails (GENERAL)
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
 * Esquema para validar nombres de sitio (GENERAL)
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
 * Tipos derivados de los esquemas GENERALES
 */
export type EmailInput = z.infer<typeof emailSchema>;
export type UrlInput = z.infer<typeof urlSchema>;
export type CoordinatesInput = z.infer<typeof coordinatesSchema>;
export type ImageDimensionsInput = z.infer<typeof imageDimensionsSchema>;
export type ImageFileInput = z.infer<typeof imageFileSchema>;
export type ProductDataInput = z.infer<typeof productDataSchema>;
export type QrUserDataInput = z.infer<typeof qrUserDataSchema>;
export type QrStoreDataInput = z.infer<typeof qrStoreDataSchema>;
export type SiteNameInput = z.infer<typeof siteNameSchema>;
export type SellTotalsInput = z.infer<typeof sellTotalsSchema>;

/**
 * Funciones de validación GENERALES
 */
export const validateEmail = (email: string) => {
  return emailSchema.safeParse(email);
};

export const validateUrl = (url: string) => {
  return urlSchema.safeParse(url);
};

export const validateCoordinates = (coordinates: unknown) => {
  return coordinatesSchema.safeParse(coordinates);
};

export const validateImageDimensions = (width: number, height: number) => {
  return imageDimensionsSchema.safeParse({ width, height });
};

export const validateImageFile = (file: File, type: 'avatar' | 'cover') => {
  return imageFileSchema.safeParse({ file, type });
};

export const validateProductData = (data: unknown) => {
  return productDataSchema.safeParse(data);
};

export const validateQrUserData = (data: unknown) => {
  return qrUserDataSchema.safeParse(data);
};

export const validateQrStoreData = (data: unknown) => {
  return qrStoreDataSchema.safeParse(data);
};

export const validateSiteName = (siteName: string) => {
  return siteNameSchema.safeParse(siteName);
};

export const validateSellTotals = (data: unknown) => {
  return sellTotalsSchema.safeParse(data);
};

/**
 * Constantes de validación GENERALES
 */
export const VALIDATION_CONSTRAINTS = {
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