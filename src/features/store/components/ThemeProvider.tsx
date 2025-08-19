/**
 * Proveedor de tema dinámico para la tienda
 * 
 * Inyecta CSS variables basadas en la configuración del tema
 * y proporciona contexto para componentes hijos
 * 
 * @module features/store/components/ThemeProvider
 */

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useStoreTheme, StoreTheme } from '../hooks/useStoreTheme';

/**
 * Contexto del tema de la tienda
 */
const StoreThemeContext = createContext<StoreTheme | null>(null);

/**
 * Props del ThemeProvider
 */
interface ThemeProviderProps {
  /** Componentes hijos */
  children: ReactNode;
  /** Elemento raíz donde aplicar las CSS variables (opcional) */
  rootElement?: HTMLElement;
}

/**
 * Proveedor de tema que inyecta CSS variables dinámicas
 */
export const StoreThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  rootElement 
}) => {
  const theme = useStoreTheme();

  useEffect(() => {
    // Determinar el elemento donde aplicar las CSS variables
    const targetElement = rootElement || document.documentElement;
    
    // Aplicar CSS variables al elemento
    Object.entries(theme.cssVariables).forEach(([property, value]) => {
      targetElement.style.setProperty(property, value);
    });

    // Cleanup: remover variables cuando el componente se desmonte
    return () => {
      Object.keys(theme.cssVariables).forEach((property) => {
        targetElement.style.removeProperty(property);
      });
    };
  }, [theme.cssVariables, rootElement]);

  return (
    <StoreThemeContext.Provider value={theme}>
      {children}
    </StoreThemeContext.Provider>
  );
};

/**
 * Hook para acceder al contexto del tema
 */
export const useStoreThemeContext = (): StoreTheme => {
  const context = useContext(StoreThemeContext);
  
  if (!context) {
    throw new Error('useStoreThemeContext debe ser usado dentro de StoreThemeProvider');
  }
  
  return context;
};

/**
 * Componente wrapper que aplica estilos de fuente del tema
 */
interface ThemeWrapperProps {
  children: ReactNode;
  className?: string;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ 
  children, 
  className = '' 
}) => {
  const theme = useStoreThemeContext();
  
  const fontFamilyClass = {
    'inter': 'font-inter',
    'roboto': 'font-roboto',
    'poppins': 'font-poppins',
    'montserrat': 'font-montserrat',
    'open-sans': 'font-open-sans',
    'lato': 'font-lato',
    'nunito': 'font-nunito',
    'source-sans-pro': 'font-source-sans-pro'
  }[theme.fontFamily] || 'font-inter';
  
  return (
    <div className={`${fontFamilyClass} ${className}`}>
      {children}
    </div>
  );
};

/**
 * HOC para envolver componentes con el tema
 */
export function withStoreTheme<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => (
    <StoreThemeProvider>
      <Component {...props} />
    </StoreThemeProvider>
  );
  
  WrappedComponent.displayName = `withStoreTheme(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Utilidad para aplicar CSS variables directamente a un elemento
 */
export const applyThemeVariables = (element: HTMLElement, theme: StoreTheme): void => {
  Object.entries(theme.cssVariables).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });
};

/**
 * Utilidad para remover CSS variables de un elemento
 */
export const removeThemeVariables = (element: HTMLElement, theme: StoreTheme): void => {
  Object.keys(theme.cssVariables).forEach((property) => {
    element.style.removeProperty(property);
  });
};

export default StoreThemeProvider;