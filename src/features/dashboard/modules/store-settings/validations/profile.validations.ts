/**
 * Esquemas de validación para el módulo de perfil de tienda
 * 
 * Define todas las validaciones usando Zod de forma centralizada
 * para garantizar la integridad de los datos
 * 
 * @module features/dashboard/modules/store-settings/validations
 */

import { z } from "zod";
import { PROVINCES } from '../data/geographic.data';

/**
 * Mensajes de error centralizados en español
 */
export const errorMessages = {
  required: 'Este campo es obligatorio',
  minLength: (min: number) => `Debe contener al menos ${min} caracteres`,
  maxLength: (max: number) => `No puede exceder ${max} caracteres`,
  email: 'Formato de email inválido',
  url: 'Formato de URL inválido',
  slug: 'Solo letras minúsculas, números y guiones',
  slugTaken: 'Este nombre ya está en uso',
} as const;

/**
 * Tipos de tienda permitidos
 */
export const STORE_TYPES = [
  'retail', 'restaurant', 'service', 'digital', 'fashion',
  'beauty', 'health', 'sports', 'electronics', 'home',
  'automotive', 'other'
] as const;

export type StoreType = typeof STORE_TYPES[number];

// ============================================================================
// ESQUEMAS BASE
// ============================================================================

/**
 * Esquema para validar nombres de tienda
 */
export const storeNameSchema = z
  .string()
  .min(2, errorMessages.minLength(2))
  .max(50, errorMessages.maxLength(50))
  .regex(
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9]+$/,
    'El nombre solo puede contener letras, números y espacios'
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
 * Esquema para validar tipo de tienda
 */
export const storeTypeSchema = z.enum(STORE_TYPES, {
  errorMap: () => ({ message: 'Tipo de tienda inválido' })
});

/**
 * Esquema para validar números de WhatsApp
 */
export const whatsappSchema = z
  .string()
  .min(1, errorMessages.required)
  .regex(
    /^\+?[1-9]\d{8,14}$/,
    'Número de WhatsApp inválido. Formato: +543851234567'
  )
  .transform((val) => {
    const cleaned = val.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      return `+54${cleaned}`;
    }
    return cleaned;
  });

/**
 * Esquema para validar direcciones
 */
export const addressSchema = z.object({
  street: z
    .string()
    .min(5, errorMessages.minLength(5))
    .max(200, errorMessages.maxLength(200))
    .optional()
    .or(z.literal('')),
  
  city: z
    .string()
    .min(2, errorMessages.minLength(2))
    .max(100, errorMessages.maxLength(100))
    .optional()
    .or(z.literal('')),
  
  province: z
    .string()
    .refine(
      (val) => !val || PROVINCES.includes(val as any),
      'Provincia no válida'
    )
    .optional()
    .or(z.literal('')),
  
  country: z
    .string()
    .min(2, errorMessages.minLength(2))
    .max(100, errorMessages.maxLength(100))
    .default('Argentina'),
  
  zipCode: z
    .string()
    .regex(/^[0-9]{4,8}$/, 'Código postal inválido')
    .optional()
    .or(z.literal('')),
});

// ============================================================================
// FUNCIONES DE VALIDACIÓN INDIVIDUAL
// ============================================================================

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
 * Valida un slug
 */
export const validateSlug = (slug: string) => {
  return slugSchema.safeParse(slug);
};

/**
 * Valida un tipo de tienda
 */
export const validateStoreType = (type: string) => {
  return storeTypeSchema.safeParse(type);
};

/**
 * Valida un número de WhatsApp
 */
export const validateWhatsApp = (phone: string) => {
  return whatsappSchema.safeParse(phone);
};

/**
 * Valida una dirección completa
 */
export const validateAddress = (address: unknown) => {
  return addressSchema.safeParse(address);
};

// ============================================================================
// VALIDACIÓN DE CAMPOS INDIVIDUALES (TIEMPO REAL)
// ============================================================================

/**
 * Valida un solo campo en tiempo real
 */
export const validateSingleField = (field: string, value: string) => {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'El nombre es obligatorio';
      const nameResult = validateStoreName(value);
      return nameResult.success ? null : nameResult.error.errors[0]?.message || 'Nombre inválido';
      
    case 'description':
      if (!value.trim()) return null; // Opcional
      const descResult = validateDescription(value);
      return descResult.success ? null : descResult.error.errors[0]?.message || 'Descripción inválida';
      
    case 'siteName':
      if (!value.trim()) return 'El nombre del sitio es obligatorio';
      const slugResult = validateSlug(value);
      return slugResult.success ? null : slugResult.error.errors[0]?.message || 'Formato inválido';
      
    case 'storeType':
      if (!value.trim()) return 'El tipo de tienda es obligatorio';
      const typeResult = validateStoreType(value);
      return typeResult.success ? null : typeResult.error.errors[0]?.message || 'Tipo inválido';
      
    case 'whatsapp':
      if (!value.trim()) return 'El WhatsApp es obligatorio';
      const whatsappResult = validateWhatsApp(value);
      return whatsappResult.success ? null : whatsappResult.error.errors[0]?.message || 'WhatsApp inválido';
      
    case 'street':
      if (!value.trim()) return null; // Opcional
      if (value.length < 5) return 'La dirección debe tener al menos 5 caracteres';
      if (value.length > 200) return 'La dirección no puede superar los 200 caracteres';
      return null;
      
    case 'city':
      if (!value.trim()) return null; // Opcional
      if (value.length < 2) return 'La ciudad debe tener al menos 2 caracteres';
      if (value.length > 100) return 'La ciudad no puede superar los 100 caracteres';
      return null;
      
    case 'province':
      if (!value.trim()) return null; // Opcional
      if (!PROVINCES.includes(value as any)) return 'Provincia no válida';
      return null;
      
    case 'zipCode':
      if (!value.trim()) return null; // Opcional
      if (!/^[0-9]{4,8}$/.test(value)) return 'Código postal inválido';
      return null;
      
    /**
     * Valida un URL de Instagram
     */
    case 'instagram':
      if (!value.trim()) return null; // Opcional
      const instaResult = validateInstagram(value);
      return instaResult.success ? null : instaResult.error.errors[0]?.message || 'Instagram inválido';
      
    /**
     * Valida un URL de Facebook
     */
    case 'facebook':
      if (!value.trim()) return null; // Opcional
      const fbResult = validateFacebook(value);
      return fbResult.success ? null : fbResult.error.errors[0]?.message || 'Facebook inválido';
      
    default:
      return null;
  }
};

// ============================================================================
// VALIDACIÓN COMPLETA (AL GUARDAR)
// ============================================================================

/**
 * Valida todos los campos de información básica (CON VERIFICACIÓN DE SLUG ÚNICO)
 */
export const validateBasicInfoFields = async (
  data: {
    name?: string;
    description?: string;
    siteName?: string;
    storeType?: string;
    whatsapp?: string;
  },
  slugCheckFn?: (slug: string, excludeStoreId?: string) => Promise<boolean>,
  excludeStoreId?: string
) => {
  const errors: Record<string, string> = {};

  // Validar nombre (requerido)
  if (!data.name?.trim()) {
    errors.name = 'El nombre es obligatorio';
  } else {
    const nameResult = validateStoreName(data.name);
    if (!nameResult.success) {
      errors.name = nameResult.error.errors[0]?.message || 'Nombre inválido';
    }
  }

  // Validar WhatsApp (requerido)
  if (!data.whatsapp?.trim()) {
    errors.whatsapp = 'El WhatsApp es obligatorio';
  } else {
    const whatsappResult = validateWhatsApp(data.whatsapp);
    if (!whatsappResult.success) {
      errors.whatsapp = whatsappResult.error.errors[0]?.message || 'WhatsApp inválido';
    }
  }

  // Validar slug (requerido)
  if (!data.siteName?.trim()) {
    errors.siteName = 'El nombre del sitio es obligatorio';
  } else {
    const slugResult = validateSlug(data.siteName);
    if (!slugResult.success) {
      errors.siteName = slugResult.error.errors[0]?.message || 'Formato inválido';
    } else if (slugCheckFn) {
      const isUnique = await slugCheckFn(data.siteName, excludeStoreId);
      if (!isUnique) {
        errors.siteName = errorMessages.slugTaken;
      }
    }
  }

  // Validar tipo de tienda (requerido)
  if (!data.storeType?.trim()) {
    errors.storeType = 'El tipo de tienda es obligatorio';
  } else {
    const typeResult = validateStoreType(data.storeType);
    if (!typeResult.success) {
      errors.storeType = typeResult.error.errors[0]?.message || 'Tipo inválido';
    }
  }

  // Validar descripción (opcional)
  if (data.description && data.description.trim()) {
    const descResult = validateDescription(data.description);
    if (!descResult.success) {
      errors.description = descResult.error.errors[0]?.message || 'Descripción inválida';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      name: data.name?.trim(),
      description: data.description?.trim() || '',
      siteName: data.siteName?.trim(),
      storeType: data.storeType?.trim(),
      whatsapp: data.whatsapp?.trim(),
    }
  };
};

/**
 * Valida todos los campos de dirección
 */
export const validateAddressFields = (data: {
  street?: string;
  city?: string;
  province?: string;
  country?: string;
  zipCode?: string;
}) => {
  const errors: Record<string, string> = {};

  // Validar cada campo solo si tiene contenido
  if (data.street && data.street.trim()) {
    const streetError = validateSingleField('street', data.street);
    if (streetError) errors.street = streetError;
  }

  if (data.city && data.city.trim()) {
    const cityError = validateSingleField('city', data.city);
    if (cityError) errors.city = cityError;
  }

  if (data.province && data.province.trim()) {
    const provinceError = validateSingleField('province', data.province);
    if (provinceError) errors.province = provinceError;
  }

  if (data.zipCode && data.zipCode.trim()) {
    const zipError = validateSingleField('zipCode', data.zipCode);
    if (zipError) errors.zipCode = zipError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      street: data.street?.trim() || '',
      city: data.city?.trim() || '',
      province: data.province?.trim() || '',
      country: data.country?.trim() || 'Argentina',
      zipCode: data.zipCode?.trim() || '',
    }
  };
};

// ============================================================================
// CONSTANTES
// ============================================================================

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
  SLUG: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30
  },
  WHATSAPP: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 15
  },
  ADDRESS: {
    STREET_MIN: 5,
    STREET_MAX: 200,
    CITY_MIN: 2,
    CITY_MAX: 100,
    ZIP_MIN: 4,
    ZIP_MAX: 8
  }
} as const;

/**
 * Esquemas para validar URLs de redes sociales
 */
export const instagramSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (val) => !val || /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/.+/i.test(val),
    'URL de Instagram inválida. Ejemplo: https://instagram.com/usuario'
  );

export const facebookSchema = z
  .string()
  .optional()
  .or(z.literal(''))
  .refine(
    (val) => !val || /^https?:\/\/(www\.)?facebook\.com\/.+/i.test(val),
    'URL de Facebook inválida. Ejemplo: https://facebook.com/pagina'
  );

/**
 * Validaciones individuales para redes sociales
 */
export const validateInstagram = (url: string) => {
  return instagramSchema.safeParse(url);
};

export const validateFacebook = (url: string) => {
  return facebookSchema.safeParse(url);
};

/**
 * Validar campo social individual
 */
export const validateSocialField = (field: string, value: string) => {
  switch (field) {
    case 'instagram':
      if (!value.trim()) return null; // Opcional
      const instaResult = validateInstagram(value);
      return instaResult.success ? null : instaResult.error.errors[0]?.message || 'Instagram inválido';
      
    case 'facebook':
      if (!value.trim()) return null; // Opcional
      const fbResult = validateFacebook(value);
      return fbResult.success ? null : fbResult.error.errors[0]?.message || 'Facebook inválido';
      
    default:
      return null;
  }
};

/**
 * Validar todos los campos sociales
 */
export const validateSocialFields = (data: {
  instagram?: string;
  facebook?: string;
}) => {
  const errors: Record<string, string> = {};

  // Validar Instagram (opcional)
  if (data.instagram && data.instagram.trim()) {
    const instaResult = validateInstagram(data.instagram);
    if (!instaResult.success) {
      errors.instagram = instaResult.error.errors[0]?.message || 'Instagram inválido';
    }
  }

  // Validar Facebook (opcional)
  if (data.facebook && data.facebook.trim()) {
    const fbResult = validateFacebook(data.facebook);
    if (!fbResult.success) {
      errors.facebook = fbResult.error.errors[0]?.message || 'Facebook inválido';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      instagram: data.instagram?.trim() || '',
      facebook: data.facebook?.trim() || '',
    }
  };
};