/**
 * Hook para validación de slugs
 * 
 * Refactorizado para usar Server Actions en lugar de Zustand store
 * Sigue la arquitectura Server-First de Next.js 15
 * 
 * @module features/auth/hooks/use-slug-validation
 */

'use client';

import { useState, useCallback, useTransition } from 'react';
import { checkSlugAvailabilityAction } from '@/features/auth/actions/auth.actions';

// ============================================================================
// SLUG UTILITIES (inline para evitar dependencias)
// ============================================================================

/**
 * Genera un slug válido a partir de un texto
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Espacios a guiones
    .replace(/[^a-z0-9-]/g, '')     // Solo letras, números y guiones
    .replace(/-+/g, '-')            // Múltiples guiones a uno solo
    .replace(/^-|-$/g, '');         // Remover guiones al inicio y final
}

/**
 * Genera sugerencias de slug cuando el original no está disponible
 */
function generateSlugSuggestions(baseSlug: string, maxSuggestions: number = 5): string[] {
  const normalizedBase = generateSlug(baseSlug);
  const suggestions: string[] = [];
  
  for (let i = 1; i <= maxSuggestions; i++) {
    suggestions.push(`${normalizedBase}-${i}`);
  }
  
  return suggestions;
}

// ============================================================================
// TYPES
// ============================================================================

export interface UseSlugValidationOptions {
  /** Debounce delay en milisegundos */
  debounceMs?: number;
  /** Generar sugerencias automáticamente si no está disponible */
  autoSuggest?: boolean;
  /** Número máximo de sugerencias */
  maxSuggestions?: number;
}

export interface UseSlugValidationReturn {
  /** Slug actual */
  slug: string;
  /** Si el slug está disponible */
  isAvailable: boolean | null;
  /** Si está verificando disponibilidad */
  isChecking: boolean;
  /** Error de validación */
  error: string | null;
  /** Sugerencias de slug */
  suggestions: string[];
  /** Función para establecer el slug */
  setSlug: (slug: string) => void;
  /** Función para generar slug desde texto */
  generateFromText: (text: string) => void;
  /** Función para verificar disponibilidad manualmente */
  checkAvailability: (slug?: string) => Promise<boolean>;
  /** Función para limpiar el estado */
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para manejar validación y disponibilidad de slugs
 * 
 * Usa Server Actions para verificar disponibilidad en el servidor
 */
export const useSlugValidation = (options: UseSlugValidationOptions = {}): UseSlugValidationReturn => {
  const {
    debounceMs = 500,
    autoSuggest = true,
    maxSuggestions = 5
  } = options;

  const [slug, setSlugState] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPending, startTransition] = useTransition();

  /**
   * Verifica la disponibilidad de un slug usando Server Action
   */
  const checkAvailability = useCallback(async (slugToCheck?: string): Promise<boolean> => {
    const targetSlug = slugToCheck || slug;
    
    if (!targetSlug || targetSlug.length < 3) {
      setIsAvailable(null);
      setError('El slug debe tener al menos 3 caracteres');
      return false;
    }

    // Validar formato localmente primero
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(targetSlug)) {
      setIsAvailable(false);
      setError('Formato de slug inválido');
      return false;
    }

    try {
      setError(null);
      
      // Usar Server Action para verificar disponibilidad
      const result = await checkSlugAvailabilityAction(targetSlug);
      
      if (!result.success) {
        setError(result.errors._form?.[0] || 'Error al verificar');
        setIsAvailable(null);
        return false;
      }
      
      const available = result.data.isAvailable;
      setIsAvailable(available);
      
      if (!available && autoSuggest) {
        const newSuggestions = generateSlugSuggestions(targetSlug, maxSuggestions);
        setSuggestions(newSuggestions);
      } else {
        setSuggestions([]);
      }
      
      return available;
    } catch (err: any) {
      console.error('Error al verificar disponibilidad:', err);
      setError('Error al verificar disponibilidad');
      setIsAvailable(null);
      return false;
    }
  }, [slug, autoSuggest, maxSuggestions]);

  /**
   * Establece un nuevo slug con debounce
   */
  const setSlug = useCallback((newSlug: string) => {
    setSlugState(newSlug);
    setIsAvailable(null);
    setError(null);
    setSuggestions([]);

    // Limpiar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Validación inmediata de formato
    const slugRegex = /^[a-z0-9-]+$/;
    if (newSlug && !slugRegex.test(newSlug)) {
      setError('Formato de slug inválido');
      setIsAvailable(false);
      return;
    }

    // Verificar disponibilidad con debounce
    if (newSlug && newSlug.length >= 3) {
      const timer = setTimeout(() => {
        startTransition(() => {
          checkAvailability(newSlug);
        });
      }, debounceMs);
      setDebounceTimer(timer);
    }
  }, [debounceTimer, debounceMs, checkAvailability]);

  /**
   * Genera un slug a partir de texto
   */
  const generateFromText = useCallback((text: string) => {
    const generatedSlug = generateSlug(text);
    setSlug(generatedSlug);
  }, [setSlug]);

  /**
   * Resetea el estado del hook
   */
  const reset = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    setSlugState('');
    setIsAvailable(null);
    setError(null);
    setSuggestions([]);
    setDebounceTimer(null);
  }, [debounceTimer]);

  return {
    slug,
    isAvailable,
    isChecking: isPending,
    error,
    suggestions,
    setSlug,
    generateFromText,
    checkAvailability,
    reset
  };
};
