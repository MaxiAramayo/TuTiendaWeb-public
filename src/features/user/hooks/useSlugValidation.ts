/**
 * Hook para validación de slugs
 * 
 * @module features/user/hooks/useSlugValidation
 */

'use client';

import { useState, useCallback } from 'react';
import { useUserStore } from '@/features/user/api/userStore';
import { validateSlug } from '@shared/validations';
import { generateSlug, generateSlugSuggestions } from '@/features/user/utils/slugUtils';

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

/**
 * Hook para manejar validación y disponibilidad de slugs
 */
export const useSlugValidation = (options: UseSlugValidationOptions = {}): UseSlugValidationReturn => {
  const {
    debounceMs = 500,
    autoSuggest = true,
    maxSuggestions = 5
  } = options;

  const [slug, setSlugState] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const { checkStoreNameAvailability } = useUserStore();

  /**
   * Verifica la disponibilidad de un slug
   */
  const checkAvailability = useCallback(async (slugToCheck?: string): Promise<boolean> => {
    const targetSlug = slugToCheck || slug;
    
    if (!targetSlug || targetSlug.length < 3) {
      setIsAvailable(null);
      setError('El slug debe tener al menos 3 caracteres');
      return false;
    }

    if (!validateSlug(targetSlug).success) {
      setIsAvailable(false);
      setError('Formato de slug inválido');
      return false;
    }

    try {
      setIsChecking(true);
      setError(null);
      
      const available = await checkStoreNameAvailability(targetSlug);
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
    } finally {
      setIsChecking(false);
    }
  }, [slug, checkStoreNameAvailability, autoSuggest, maxSuggestions]);

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
    if (newSlug && !validateSlug(newSlug).success) {
      setError('Formato de slug inválido');
      setIsAvailable(false);
      return;
    }

    // Verificar disponibilidad con debounce
    if (newSlug && newSlug.length >= 3) {
      const timer = setTimeout(() => {
        checkAvailability(newSlug);
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
    setIsChecking(false);
    setError(null);
    setSuggestions([]);
    setDebounceTimer(null);
  }, [debounceTimer]);

  return {
    slug,
    isAvailable,
    isChecking,
    error,
    suggestions,
    setSlug,
    generateFromText,
    checkAvailability,
    reset
  };
};