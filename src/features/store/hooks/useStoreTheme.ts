/**
 * Hook y utilidades para tema de tienda
 * 
 * Versión refactorizada que no depende de stores globales
 * Los datos del tema se pasan desde Server Components
 * 
 * @module features/store/hooks/useStoreTheme
 */

'use client';

import { useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuración de colores del tema
 */
export interface StoreThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  info: string;
}

/**
 * Configuración completa del tema
 */
export interface StoreTheme {
  colors: StoreThemeColors;
  fontFamily: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  cssVariables: Record<string, string>;
}

/**
 * Datos del tema desde el servidor
 */
export interface StoreThemeData {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  buttonStyle?: string;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Utilidades para manipulación de colores
 */
export class ColorUtils {
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

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

  static isLightColor(hex: string): boolean {
    return this.getLuminance(hex) > 0.5;
  }

  static getContrastColor(backgroundColor: string): string {
    return this.isLightColor(backgroundColor) ? '#000000' : '#ffffff';
  }

  static darkenColor(hex: string, amount: number = 0.2): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const { r, g, b } = rgb;
    const newR = Math.max(0, Math.round(r * (1 - amount)));
    const newG = Math.max(0, Math.round(g * (1 - amount)));
    const newB = Math.max(0, Math.round(b * (1 - amount)));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

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

// ============================================================================
// DEFAULT THEME
// ============================================================================

const DEFAULT_PRIMARY = '#3B82F6';
const DEFAULT_SECONDARY = '#64748B';
const DEFAULT_ACCENT = '#1F2937';

/**
 * Genera un tema basado en los datos proporcionados
 */
export function generateTheme(themeData?: StoreThemeData): StoreTheme {
  const primaryColor = themeData?.primaryColor || DEFAULT_PRIMARY;
  const secondaryColor = themeData?.secondaryColor || DEFAULT_SECONDARY;
  const accentColor = themeData?.accentColor || DEFAULT_ACCENT;
  const fontFamily = themeData?.fontFamily || 'inter';
  const buttonStyle = (themeData?.buttonStyle as 'rounded' | 'square' | 'pill') || 'rounded';

  const colors: StoreThemeColors = {
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  };

  const cssVariables = {
    '--store-primary': primaryColor,
    '--store-primary-dark': ColorUtils.darkenColor(primaryColor, 0.1),
    '--store-primary-light': ColorUtils.lightenColor(primaryColor, 0.1),
    '--store-primary-contrast': ColorUtils.getContrastColor(primaryColor),
    '--store-secondary': secondaryColor,
    '--store-secondary-dark': ColorUtils.darkenColor(secondaryColor, 0.1),
    '--store-secondary-light': ColorUtils.lightenColor(secondaryColor, 0.1),
    '--store-secondary-contrast': ColorUtils.getContrastColor(secondaryColor),
    '--store-accent': accentColor,
    '--store-accent-light': ColorUtils.lightenColor(accentColor, 0.3),
    '--store-success': colors.success,
    '--store-error': colors.error,
    '--store-warning': colors.warning,
    '--store-info': colors.info,
    '--store-font-family': fontFamily
  };

  return {
    colors,
    fontFamily,
    buttonStyle,
    cssVariables
  };
}

/**
 * Hook para obtener el tema por defecto (cuando no hay datos del servidor)
 */
export const useStoreTheme = (): StoreTheme => {
  return useMemo(() => generateTheme(), []);
};

/**
 * Hook para obtener clases CSS dinámicas basadas en el tema
 */
export const useThemeClasses = () => {
  return useMemo(() => ({
    price: {
      primary: 'text-[var(--store-primary)]',
      secondary: 'text-[var(--store-secondary)]'
    },
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
    status: {
      success: 'text-[var(--store-success)] bg-green-50 border-green-300',
      error: 'text-[var(--store-error)] bg-red-50 border-red-300',
      warning: 'text-[var(--store-warning)] bg-yellow-50 border-yellow-300',
      info: 'text-[var(--store-info)] bg-blue-50 border-blue-300'
    },
    accent: {
      primary: 'border-[var(--store-primary)]',
      secondary: 'border-[var(--store-secondary)]'
    },
    border: {
      primary: 'border-[var(--store-primary)]',
      secondary: 'border-[var(--store-secondary)]'
    },
    background: {
      primary: 'bg-[var(--store-primary)]',
      primaryLight: 'bg-[var(--store-primary-light)]',
      secondary: 'bg-[var(--store-secondary)]',
      secondaryLight: 'bg-[var(--store-secondary-light)]'
    }
  }), []);
};

/**
 * Hook para aplicar estilos inline con colores del tema
 */
export const useThemeStyles = () => {
  const theme = useStoreTheme();

  return useMemo(() => ({
    price: {
      primary: { color: theme.colors.primary },
      secondary: { color: theme.colors.secondary }
    },
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
    border: {
      primary: { borderColor: theme.colors.primary },
      secondary: { borderColor: theme.colors.secondary }
    },
    background: {
      primary: { backgroundColor: theme.colors.primary },
      primaryLight: { backgroundColor: ColorUtils.lightenColor(theme.colors.primary, 0.1) },
      secondary: { backgroundColor: theme.colors.secondary }
    }
  }), [theme]);
};
