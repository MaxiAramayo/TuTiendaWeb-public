/**
 * Hook para gestión de temas dinámicos de la tienda
 * 
 * Proporciona acceso a los colores y configuración del tema personalizable
 * 
 * @module features/store/hooks/useStoreTheme
 */

'use client';

import { useMemo } from 'react';
import { useStoreClient } from '../api/storeclient';

/**
 * Configuración de colores del tema
 */
export interface StoreThemeColors {
  /** Color primario */
  primary: string;
  /** Color secundario */
  secondary: string;
  /** Color de éxito */
  success: string;
  /** Color de error */
  error: string;
  /** Color de advertencia */
  warning: string;
  /** Color de información */
  info: string;
}

/**
 * Configuración completa del tema
 */
export interface StoreTheme {
  /** Colores del tema */
  colors: StoreThemeColors;
  /** Fuente tipográfica */
  fontFamily: string;
  /** Estilo de botones */
  buttonStyle: 'rounded' | 'square' | 'pill';
  /** CSS variables para aplicar dinámicamente */
  cssVariables: Record<string, string>;
}

/**
 * Utilidades para manipulación de colores
 */
class ColorUtils {
  /**
   * Convierte hex a RGB
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Calcula la luminancia de un color
   */
  static getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Determina si un color es claro u oscuro
   */
  static isLightColor(hex: string): boolean {
    return this.getLuminance(hex) > 0.5;
  }

  /**
   * Obtiene el color de texto apropiado para un fondo
   */
  static getContrastColor(backgroundColor: string): string {
    return this.isLightColor(backgroundColor) ? '#000000' : '#ffffff';
  }

  /**
   * Oscurece un color hex
   */
  static darkenColor(hex: string, amount: number = 0.2): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    
    const { r, g, b } = rgb;
    const newR = Math.max(0, Math.round(r * (1 - amount)));
    const newG = Math.max(0, Math.round(g * (1 - amount)));
    const newB = Math.max(0, Math.round(b * (1 - amount)));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Aclara un color hex
   */
  static lightenColor(hex: string, amount: number = 0.2): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    
    const { r, g, b } = rgb;
    const newR = Math.min(255, Math.round(r + (255 - r) * amount));
    const newG = Math.min(255, Math.round(g + (255 - g) * amount));
    const newB = Math.min(255, Math.round(b + (255 - b) * amount));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

/**
 * Hook principal para el tema de la tienda
 */
export const useStoreTheme = (): StoreTheme => {
  const { store } = useStoreClient();
  
  const theme = useMemo(() => {
    // Colores por defecto
    const defaultPrimary = '#3B82F6';
    const defaultSecondary = '#64748B';
    
    // Acceso seguro a las propiedades del tema
    const storeAny = store as any;
    const primaryColor = storeAny?.theme?.primaryColor || defaultPrimary;
    const secondaryColor = storeAny?.theme?.secondaryColor || defaultSecondary;
    const fontFamily = storeAny?.theme?.fontFamily || 'inter';
    const buttonStyle = storeAny?.theme?.style || 'rounded';
    
    // Generar variaciones de colores
    const colors: StoreThemeColors = {
      primary: primaryColor,
      secondary: secondaryColor,
      success: '#10B981', // Verde
      error: '#EF4444',   // Rojo
      warning: '#F59E0B', // Amarillo
      info: '#3B82F6'     // Azul
    };
    
    // Generar CSS variables
    const cssVariables = {
      '--store-primary': primaryColor,
      '--store-primary-dark': ColorUtils.darkenColor(primaryColor, 0.1),
      '--store-primary-light': ColorUtils.lightenColor(primaryColor, 0.1),
      '--store-primary-contrast': ColorUtils.getContrastColor(primaryColor),
      '--store-secondary': secondaryColor,
      '--store-secondary-dark': ColorUtils.darkenColor(secondaryColor, 0.1),
      '--store-secondary-light': ColorUtils.lightenColor(secondaryColor, 0.1),
      '--store-secondary-contrast': ColorUtils.getContrastColor(secondaryColor),
      '--store-success': colors.success,
      '--store-error': colors.error,
      '--store-warning': colors.warning,
      '--store-info': colors.info,
      '--store-font-family': fontFamily
    };
    
    return {
      colors,
      fontFamily,
      buttonStyle: buttonStyle as 'rounded' | 'square' | 'pill',
      cssVariables
    };
  }, [store]);
  
  return theme;
};

/**
 * Hook para obtener clases CSS dinámicas basadas en el tema
 */
export const useThemeClasses = () => {
  const theme = useStoreTheme();
  
  return useMemo(() => ({
    // Clases para precios
    price: {
      primary: 'text-[var(--store-primary)]',
      secondary: 'text-[var(--store-secondary)]'
    },
    
    // Clases para botones
    button: {
      primary: {
        base: 'bg-[var(--store-primary)] text-[var(--store-primary-contrast)] hover:bg-[var(--store-primary-dark)]',
        outline: 'border-[var(--store-primary)] text-[var(--store-primary)] hover:bg-[var(--store-primary)] hover:text-[var(--store-primary-contrast)]'
      },
      secondary: {
        base: 'bg-[var(--store-secondary)] text-[var(--store-secondary-contrast)] hover:bg-[var(--store-secondary-dark)]',
        outline: 'border-[var(--store-secondary)] text-[var(--store-secondary)] hover:bg-[var(--store-secondary)] hover:text-[var(--store-secondary-contrast)]'
      }
    },
    
    // Clases para estados
    status: {
      success: 'text-[var(--store-success)] bg-green-50 border-green-300',
      error: 'text-[var(--store-error)] bg-red-50 border-red-300',
      warning: 'text-[var(--store-warning)] bg-yellow-50 border-yellow-300',
      info: 'text-[var(--store-info)] bg-blue-50 border-blue-300'
    },
    
    // Clases para bordes y acentos
    accent: {
      primary: 'border-[var(--store-primary)]',
      secondary: 'border-[var(--store-secondary)]'
    },
    
    // Clases adicionales para bordes
    border: {
      primary: 'border-[var(--store-primary)]',
      secondary: 'border-[var(--store-secondary)]'
    },
    
    // Clases para fondos
    background: {
      primary: 'bg-[var(--store-primary)]',
      primaryLight: 'bg-[var(--store-primary-light)]',
      secondary: 'bg-[var(--store-secondary)]',
      secondaryLight: 'bg-[var(--store-secondary-light)]'
    }
  }), [theme]);
};

/**
 * Hook para aplicar estilos inline con colores del tema
 */
export const useThemeStyles = () => {
  const theme = useStoreTheme();
  
  return useMemo(() => ({
    // Estilos para precios
    price: {
      primary: { color: theme.colors.primary },
      secondary: { color: theme.colors.secondary }
    },
    
    // Estilos para botones
    button: {
      primary: {
        backgroundColor: theme.colors.primary,
        color: ColorUtils.getContrastColor(theme.colors.primary)
      },
      primaryHover: {
        backgroundColor: ColorUtils.darkenColor(theme.colors.primary, 0.1)
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        color: ColorUtils.getContrastColor(theme.colors.secondary)
      }
    },
    
    // Estilos para bordes
    border: {
      primary: { borderColor: theme.colors.primary },
      secondary: { borderColor: theme.colors.secondary }
    },
    
    // Estilos para fondos
    background: {
      primary: { backgroundColor: theme.colors.primary },
      primaryLight: { backgroundColor: ColorUtils.lightenColor(theme.colors.primary, 0.1) },
      secondary: { backgroundColor: theme.colors.secondary }
    }
  }), [theme]);
};

export { ColorUtils };