/**
 * Hook para gestión de temas dinámicos
 * 
 * @module features/store/hooks/useTheme
 */

import { useState, useEffect, useCallback } from 'react';
import { AdvancedThemeConfig } from '@/shared/types/store';
import { ThemeService } from '../api/themeService';

/**
 * Opciones para el hook useTheme
 */
interface UseThemeOptions {
  storeId?: string;
  enableCache?: boolean;
  autoApply?: boolean;
  onThemeChange?: (theme: AdvancedThemeConfig) => void;
  onError?: (error: string) => void;
}

/**
 * Resultado del hook useTheme
 */
interface UseThemeResult {
  theme: AdvancedThemeConfig;
  setTheme: (theme: AdvancedThemeConfig) => Promise<void>;
  applyTheme: (theme: AdvancedThemeConfig, storeId?: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  getCachedTheme: (storeId: string) => AdvancedThemeConfig | null;
  clearCache: () => void;
  generateCSS: (theme?: AdvancedThemeConfig) => string;
  validateTheme: (theme: AdvancedThemeConfig) => boolean;
}

/**
 * Hook para gestión de temas dinámicos
 */
export const useTheme = (options: UseThemeOptions = {}): UseThemeResult => {
  const {
    storeId,
    enableCache = true,
    autoApply = true,
    onThemeChange,
    onError
  } = options;

  const [theme, setThemeState] = useState<AdvancedThemeConfig>(
    ThemeService.getDefaultTheme()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Maneja errores y notifica
   */
  const handleError = useCallback((err: unknown, context: string) => {
    const errorMessage = err instanceof Error ? err.message : `Error en ${context}`;
    setError(errorMessage);
    onError?.(errorMessage);
    console.error(`Error en useTheme - ${context}:`, err);
  }, [onError]);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Aplica un tema al DOM
   */
  const applyTheme = useCallback(async (
    newTheme: AdvancedThemeConfig, 
    targetStoreId?: string
  ) => {
    try {
      setIsLoading(true);
      clearError();

      // Validar tema
      if (!ThemeService.validateTheme(newTheme)) {
        throw new Error('Configuración de tema inválida');
      }

      // Aplicar tema
      ThemeService.applyTheme(newTheme, targetStoreId || storeId);
      
      // Actualizar estado
      setThemeState(newTheme);
      
      // Notificar cambio
      onThemeChange?.(newTheme);
      
    } catch (err) {
      handleError(err, 'applyTheme');
      
      // Aplicar tema por defecto en caso de error
      const defaultTheme = ThemeService.getDefaultTheme();
      ThemeService.applyTheme(defaultTheme);
      setThemeState(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  }, [storeId, onThemeChange, handleError, clearError]);

  /**
   * Establece un nuevo tema
   */
  const setTheme = useCallback(async (newTheme: AdvancedThemeConfig) => {
    if (autoApply) {
      await applyTheme(newTheme);
    } else {
      setThemeState(newTheme);
      onThemeChange?.(newTheme);
    }
  }, [autoApply, applyTheme, onThemeChange]);

  /**
   * Resetea al tema por defecto
   */
  const resetToDefault = useCallback(async () => {
    const defaultTheme = ThemeService.getDefaultTheme();
    await applyTheme(defaultTheme);
  }, [applyTheme]);

  /**
   * Obtiene tema desde cache
   */
  const getCachedTheme = useCallback((targetStoreId: string) => {
    try {
      return ThemeService.getCachedTheme(targetStoreId);
    } catch (err) {
      handleError(err, 'getCachedTheme');
      return null;
    }
  }, [handleError]);

  /**
   * Limpia el cache de temas
   */
  const clearCache = useCallback(() => {
    try {
      ThemeService.clearThemeCache();
    } catch (err) {
      handleError(err, 'clearCache');
    }
  }, [handleError]);

  /**
   * Genera CSS personalizado
   */
  const generateCSS = useCallback((targetTheme?: AdvancedThemeConfig) => {
    try {
      return ThemeService.generateCustomCSS(targetTheme || theme);
    } catch (err) {
      handleError(err, 'generateCSS');
      return '';
    }
  }, [theme, handleError]);

  /**
   * Valida un tema
   */
  const validateTheme = useCallback((targetTheme: AdvancedThemeConfig) => {
    try {
      return ThemeService.validateTheme(targetTheme);
    } catch (err) {
      handleError(err, 'validateTheme');
      return false;
    }
  }, [handleError]);

  /**
   * Efecto para cargar tema inicial
   */
  useEffect(() => {
    const loadInitialTheme = async () => {
      try {
        setIsLoading(true);
        
        let themeToLoad = ThemeService.getDefaultTheme();
        
        // Intentar cargar desde cache si está habilitado
        if (enableCache && storeId) {
          const cachedTheme = ThemeService.getCachedTheme(storeId);
          if (cachedTheme) {
            themeToLoad = cachedTheme;
          }
        }
        
        // Aplicar tema si autoApply está habilitado
        if (autoApply) {
          await applyTheme(themeToLoad);
        } else {
          setThemeState(themeToLoad);
        }
        
      } catch (err) {
        handleError(err, 'loadInitialTheme');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialTheme();
  }, [storeId, enableCache]); // No incluir autoApply y applyTheme para evitar loops

  /**
   * Efecto para escuchar eventos de tema
   */
  useEffect(() => {
    const handleThemeApplied = (event: CustomEvent) => {
      const { theme: appliedTheme } = event.detail;
      if (appliedTheme) {
        setThemeState(appliedTheme);
        onThemeChange?.(appliedTheme);
      }
    };

    window.addEventListener('themeApplied', handleThemeApplied as EventListener);
    
    return () => {
      window.removeEventListener('themeApplied', handleThemeApplied as EventListener);
    };
  }, [onThemeChange]);

  return {
    theme,
    setTheme,
    applyTheme,
    resetToDefault,
    isLoading,
    error,
    clearError,
    getCachedTheme,
    clearCache,
    generateCSS,
    validateTheme
  };
};

/**
 * Hook simplificado para obtener valores del tema actual
 */
export const useThemeValues = () => {
  const [themeValues, setThemeValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateThemeValues = () => {
      if (typeof window === 'undefined') return;
      
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      const values: Record<string, string> = {};
      
      // Obtener todas las variables CSS del tema
      Array.from(computedStyle).forEach(property => {
        if (property.startsWith('--store')) {
          const key = property.replace('--store-', '');
          values[key] = computedStyle.getPropertyValue(property).trim();
        }
      });
      
      setThemeValues(values);
    };

    // Actualizar valores iniciales
    updateThemeValues();

    // Escuchar cambios de tema
    const handleThemeChange = () => {
      setTimeout(updateThemeValues, 100); // Pequeño delay para asegurar que las variables se han aplicado
    };

    window.addEventListener('themeApplied', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeApplied', handleThemeChange);
    };
  }, []);

  const getCSSVariable = useCallback((variable: string): string => {
    return themeValues[variable] || '';
  }, [themeValues]);

  const getColor = useCallback((colorKey: string): string => {
    return themeValues[`color-${colorKey}`] || '';
  }, [themeValues]);

  return {
    themeValues,
    getCSSVariable,
    getColor
  };
};

/**
 * Hook para detectar cambios de tema
 */
export const useThemeDetection = () => {
  const [currentTheme, setCurrentTheme] = useState<AdvancedThemeConfig | null>(null);
  const [themeHistory, setThemeHistory] = useState<AdvancedThemeConfig[]>([]);

  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const { theme } = event.detail;
      if (theme) {
        setCurrentTheme(theme);
        setThemeHistory(prev => {
          const newHistory = [theme, ...prev.slice(0, 9)]; // Mantener últimos 10 temas
          return newHistory;
        });
      }
    };

    window.addEventListener('themeApplied', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('themeApplied', handleThemeChange as EventListener);
    };
  }, []);

  const revertToPrevious = useCallback(() => {
    if (themeHistory.length > 1) {
      const previousTheme = themeHistory[1];
      ThemeService.applyTheme(previousTheme);
    }
  }, [themeHistory]);

  return {
    currentTheme,
    themeHistory,
    revertToPrevious,
    hasHistory: themeHistory.length > 1
  };
};

export default useTheme;