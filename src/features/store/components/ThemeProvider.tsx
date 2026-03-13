/**
 * Proveedor de tema para tienda pública
 * 
 * Versión refactorizada que recibe datos del tema desde Server Components
 * No depende de stores globales ni hace fetch en cliente
 * 
 * @module features/store/components/ThemeProvider
 */

'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { 
  StoreTheme, 
  StoreThemeData, 
  generateTheme 
} from '../hooks/useStoreTheme';

// ============================================================================
// CONTEXT
// ============================================================================

interface StoreThemeContextValue {
  theme: StoreTheme;
  themeData?: StoreThemeData;
}

const StoreThemeContext = createContext<StoreThemeContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface StoreThemeProviderProps {
  children: React.ReactNode;
  /**
   * Datos del tema desde el servidor
   * Se pasan desde un Server Component
   */
  themeData?: StoreThemeData;
}

/**
 * Proveedor de tema para tienda pública
 * 
 * Recibe los datos del tema desde un Server Component y los proporciona
 * a todos los componentes hijos a través del contexto.
 * También inyecta las CSS variables necesarias.
 * 
 * @example
 * ```tsx
 * // En un Server Component
 * const storeSettings = await getStoreSettings(storeId);
 * 
 * return (
 *   <StoreThemeProvider themeData={storeSettings.theme}>
 *     <StoreLayout />
 *   </StoreThemeProvider>
 * );
 * ```
 */
// Mapa de fuentes a especificaciones de Google Fonts
const GOOGLE_FONTS_MAP: Record<string, string> = {
  'inter': 'Inter:wght@300;400;500;600;700',
  'roboto': 'Roboto:wght@300;400;500;700',
  'open sans': 'Open+Sans:wght@300;400;500;600;700',
  'lato': 'Lato:wght@300;400;700',
  'montserrat': 'Montserrat:wght@300;400;500;600;700',
  'poppins': 'Poppins:wght@300;400;500;600;700',
  'playfair display': 'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400',
  'merriweather': 'Merriweather:ital,wght@0,300;0,400;0,700;1,300',
};

function loadGoogleFont(fontFamily: string) {
  if (!fontFamily) return;
  // Extrae el primer nombre de fuente (ej: '"Playfair Display", serif' → 'playfair display')
  const match = fontFamily.match(/^["']?([^"',]+)["']?/);
  const fontName = match ? match[1].trim().toLowerCase() : '';
  const googleFontSpec = GOOGLE_FONTS_MAP[fontName];
  if (!googleFontSpec) return;

  const linkId = `gfont-${fontName.replace(/\s+/g, '-')}`;
  if (document.getElementById(linkId)) return; // ya cargada

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${googleFontSpec}&display=swap`;
  document.head.appendChild(link);
}

export function StoreThemeProvider({
  children,
  themeData
}: StoreThemeProviderProps) {
  const theme = useMemo(() => generateTheme(themeData), [themeData]);

  // Inyectar CSS variables en el documento y cargar Google Font si es necesario
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Cargar la fuente de Google Fonts dinámicamente
    if (theme.fontFamily) {
      loadGoogleFont(theme.fontFamily);
    }

    // Cleanup al desmontar
    return () => {
      Object.keys(theme.cssVariables).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [theme.cssVariables, theme.fontFamily]);

  const contextValue = useMemo(() => ({
    theme,
    themeData
  }), [theme, themeData]);

  return (
    <StoreThemeContext.Provider value={contextValue}>
      {children}
    </StoreThemeContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook para acceder al tema de la tienda desde el contexto
 * 
 * @throws {Error} Si se usa fuera de StoreThemeProvider
 */
export function useStoreThemeContext(): StoreThemeContextValue {
  const context = useContext(StoreThemeContext);
  
  if (!context) {
    throw new Error(
      'useStoreThemeContext debe usarse dentro de un StoreThemeProvider'
    );
  }
  
  return context;
}

/**
 * Hook opcional que no lanza error si no hay provider
 * Útil para componentes que pueden usarse tanto dentro como fuera del provider
 */
export function useStoreThemeOptional(): StoreThemeContextValue | null {
  return useContext(StoreThemeContext);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { StoreThemeContext };
export type { StoreThemeProviderProps, StoreThemeContextValue };
