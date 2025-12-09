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
export function StoreThemeProvider({ 
  children, 
  themeData 
}: StoreThemeProviderProps) {
  const theme = useMemo(() => generateTheme(themeData), [themeData]);

  // Inyectar CSS variables en el documento
  useEffect(() => {
    const root = document.documentElement;
    
    Object.entries(theme.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Cleanup al desmontar
    return () => {
      Object.keys(theme.cssVariables).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [theme.cssVariables]);

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
