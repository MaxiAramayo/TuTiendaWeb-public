/**
 * Utilidades para manejo de slugs
 * 
 * @module features/user/utils/slugUtils
 */

/**
 * Genera un slug válido a partir de un texto
 * 
 * @param text - Texto a convertir en slug
 * @returns Slug válido
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Espacios a guiones
    .replace(/[^a-z0-9-]/g, '')     // Solo letras, números y guiones
    .replace(/-+/g, '-')            // Múltiples guiones a uno solo
    .replace(/^-|-$/g, '');         // Remover guiones al inicio y final
};



/**
 * Normaliza un slug para asegurar que sea válido
 * 
 * @param slug - Slug a normalizar
 * @returns Slug normalizado
 */
export const normalizeSlug = (slug: string): string => {
  return generateSlug(slug);
};

/**
 * Genera sugerencias de slug cuando el original no está disponible
 * 
 * @param baseSlug - Slug base
 * @param maxSuggestions - Número máximo de sugerencias (default: 5)
 * @returns Array de sugerencias de slug
 */
export const generateSlugSuggestions = (baseSlug: string, maxSuggestions: number = 5): string[] => {
  const normalizedBase = normalizeSlug(baseSlug);
  const suggestions: string[] = [];
  
  for (let i = 1; i <= maxSuggestions; i++) {
    suggestions.push(`${normalizedBase}-${i}`);
  }
  
  return suggestions;
};

/**
 * Constantes para validación de slugs
 */
export const SLUG_CONSTRAINTS = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  REGEX: /^[a-z0-9-]+$/,
  FORBIDDEN_PATTERNS: ['--', /^-/, /-$/]
} as const;