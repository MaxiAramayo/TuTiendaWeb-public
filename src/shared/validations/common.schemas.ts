/**
 * Schemas de validación compartidos - Solo primitivos básicos
 * 
 * REGLA: Solo incluir schemas que se usan en MÚLTIPLES features
 * Schemas específicos de un feature → feature/schemas/
 * 
 * @module shared/validations/common
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
} as const;

// ============================================================================
// PRIMITIVOS BÁSICOS (usados en múltiples features)
// ============================================================================

/**
 * Validar emails
 */
export const emailSchema = z
  .string()
  .min(1, errorMessages.required)
  .email(errorMessages.email)
  .transform((val) => val.toLowerCase().trim());

/**
 * Validar URLs generales
 */
export const urlSchema = z
  .string()
  .url(errorMessages.url)
  .optional();

/**
 * Validar colores hexadecimales
 */
export const hexColorSchema = z
  .string()
  .regex(
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    errorMessages.color
  );

/**
 * Validar horarios (formato HH:MM)
 */
export const timeSchema = z
  .string()
  .regex(
    /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    errorMessages.time
  );

/**
 * Validar slugs (URLs amigables)
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
 * Validar números de WhatsApp
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
      return `+54${cleaned}`; // Argentina por defecto
    }
    return cleaned;
  });

// ============================================================================
// TIPOS DERIVADOS
// ============================================================================

export type EmailInput = z.infer<typeof emailSchema>;
export type UrlInput = z.infer<typeof urlSchema>;
export type HexColorInput = z.infer<typeof hexColorSchema>;
export type TimeInput = z.infer<typeof timeSchema>;
export type SlugInput = z.infer<typeof slugSchema>;
export type WhatsappInput = z.infer<typeof whatsappSchema>;
