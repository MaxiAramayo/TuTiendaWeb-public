/**
 * Servicio para gestión de temas dinámicos
 * 
 * @module features/store/api/themeService
 */

import { AdvancedThemeConfig } from '@/shared/types/store';

/**
 * Servicio para aplicación de temas dinámicos mediante CSS Variables
 */
export class ThemeService {
  private static readonly CSS_VAR_PREFIX = '--store';
  private static readonly STORAGE_KEY = 'store-theme-cache';

  /**
   * Aplica un tema dinámico al DOM
   * @param theme Configuración del tema
   * @param storeId ID de la tienda (para cache)
   */
  static applyTheme(theme: AdvancedThemeConfig, storeId?: string): void {
    try {
      const root = document.documentElement;
      const cssVariables = this.generateCSSVariables(theme);
      
      // Aplicar variables CSS
      Object.entries(cssVariables).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });
      
      // Aplicar clases CSS dinámicas
      this.applyDynamicClasses(theme);
      
      // Guardar en cache si se proporciona storeId
      if (storeId) {
        this.cacheTheme(storeId, theme);
      }
      
      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('themeApplied', { 
        detail: { theme, storeId } 
      }));
      
    } catch (error) {
      console.error('Error aplicando tema:', error);
      this.applyDefaultTheme();
    }
  }

  /**
   * Genera variables CSS desde la configuración del tema
   * @param theme Configuración del tema
   * @returns Objeto con variables CSS
   */
  static generateCSSVariables(theme: AdvancedThemeConfig): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Colores
    if (theme.colors) {
      variables[`${this.CSS_VAR_PREFIX}-color-primary`] = theme.colors.primary;
      variables[`${this.CSS_VAR_PREFIX}-color-secondary`] = theme.colors.secondary;
      variables[`${this.CSS_VAR_PREFIX}-color-accent`] = theme.colors.accent;
      variables[`${this.CSS_VAR_PREFIX}-color-text-primary`] = theme.colors.textPrimary;
      variables[`${this.CSS_VAR_PREFIX}-color-text-secondary`] = theme.colors.textSecondary;
      variables[`${this.CSS_VAR_PREFIX}-color-background`] = theme.colors.background;
      variables[`${this.CSS_VAR_PREFIX}-color-surface`] = theme.colors.surface;
    }
    
    // Tipografía
    if (theme.typography) {
      variables[`${this.CSS_VAR_PREFIX}-font-family`] = theme.typography.fontFamily;
      variables[`${this.CSS_VAR_PREFIX}-font-size-base`] = this.getFontSizeValue(theme.typography.fontSize);
      variables[`${this.CSS_VAR_PREFIX}-font-weight-heading`] = this.getFontWeightValue(theme.typography.headingWeight);
      variables[`${this.CSS_VAR_PREFIX}-font-weight-body`] = this.getFontWeightValue(theme.typography.bodyWeight);
    }
    
    // Botones
    if (theme.buttons) {
      variables[`${this.CSS_VAR_PREFIX}-button-radius`] = this.getButtonRadiusValue(theme.buttons.style);
      variables[`${this.CSS_VAR_PREFIX}-button-size`] = this.getButtonSizeValue(theme.buttons.defaultSize);
    }
    
    // Iconos
    if (theme.icons) {
      variables[`${this.CSS_VAR_PREFIX}-icon-size`] = `${theme.icons.defaultSize}px`;
      variables[`${this.CSS_VAR_PREFIX}-icon-color`] = theme.icons.defaultColor;
    }
    
    return variables;
  }

  /**
   * Aplica clases CSS dinámicas basadas en el tema
   * @param theme Configuración del tema
   */
  private static applyDynamicClasses(theme: AdvancedThemeConfig): void {
    const body = document.body;
    
    // Remover clases anteriores
    body.classList.remove(
      'theme-buttons-rounded', 'theme-buttons-square', 'theme-buttons-pill',
      'theme-icons-outline', 'theme-icons-filled', 'theme-icons-duotone',
      'theme-font-sm', 'theme-font-base', 'theme-font-lg'
    );
    
    // Aplicar nuevas clases
    if (theme.buttons?.style) {
      body.classList.add(`theme-buttons-${theme.buttons.style}`);
    }
    
    if (theme.icons?.style) {
      body.classList.add(`theme-icons-${theme.icons.style}`);
    }
    
    if (theme.typography?.fontSize) {
      body.classList.add(`theme-font-${theme.typography.fontSize}`);
    }
  }

  /**
   * Aplica el tema por defecto
   */
  static applyDefaultTheme(): void {
    const defaultTheme = this.getDefaultTheme();
    this.applyTheme(defaultTheme);
  }

  /**
   * Obtiene el tema por defecto
   * @returns Configuración del tema por defecto
   */
  static getDefaultTheme(): AdvancedThemeConfig {
    return {
      colors: {
        primary: '#6366f1',
        secondary: '#64748b',
        accent: '#f59e0b',
        textPrimary: '#1f2937',
        textSecondary: '#6b7280',
        background: '#ffffff',
        surface: '#f9fafb'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 'base',
        headingWeight: 'semibold',
        bodyWeight: 'normal'
      },
      buttons: {
        style: 'rounded',
        defaultSize: 'md',
        hoverEffect: 'scale'
      },
      icons: {
        style: 'outline',
        defaultSize: 20,
        defaultColor: '#6b7280'
      }
    };
  }

  /**
   * Guarda el tema en cache local
   * @param storeId ID de la tienda
   * @param theme Configuración del tema
   */
  private static cacheTheme(storeId: string, theme: AdvancedThemeConfig): void {
    try {
      const cache = this.getThemeCache();
      cache[storeId] = {
        theme,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('No se pudo guardar el tema en cache:', error);
    }
  }

  /**
   * Obtiene el tema desde cache
   * @param storeId ID de la tienda
   * @param maxAge Edad máxima del cache en milisegundos (default: 1 hora)
   * @returns Tema cacheado o null
   */
  static getCachedTheme(storeId: string, maxAge: number = 3600000): AdvancedThemeConfig | null {
    try {
      const cache = this.getThemeCache();
      const cached = cache[storeId];
      
      if (!cached) return null;
      
      const age = Date.now() - cached.timestamp;
      if (age > maxAge) {
        delete cache[storeId];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cache));
        return null;
      }
      
      return cached.theme;
    } catch (error) {
      console.warn('Error obteniendo tema desde cache:', error);
      return null;
    }
  }

  /**
   * Obtiene el cache completo de temas
   * @returns Cache de temas
   */
  private static getThemeCache(): Record<string, { theme: AdvancedThemeConfig; timestamp: number }> {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Limpia el cache de temas
   */
  static clearThemeCache(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Error limpiando cache de temas:', error);
    }
  }

  /**
   * Convierte el tamaño de fuente a valor CSS
   * @param size Tamaño de fuente
   * @returns Valor CSS
   */
  private static getFontSizeValue(size: 'sm' | 'base' | 'lg'): string {
    const sizes = {
      sm: '14px',
      base: '16px',
      lg: '18px'
    };
    return sizes[size];
  }

  /**
   * Convierte el peso de fuente a valor CSS
   * @param weight Peso de fuente
   * @returns Valor CSS
   */
  private static getFontWeightValue(weight: 'normal' | 'medium' | 'semibold' | 'bold'): string {
    const weights = {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    };
    return weights[weight];
  }

  /**
   * Convierte el estilo de botón a valor de border-radius
   * @param style Estilo de botón
   * @returns Valor CSS
   */
  private static getButtonRadiusValue(style: 'rounded' | 'square' | 'pill'): string {
    const radii = {
      rounded: '8px',
      square: '0px',
      pill: '9999px'
    };
    return radii[style];
  }

  /**
   * Convierte el tamaño de botón a valores CSS
   * @param size Tamaño de botón
   * @returns Valor CSS
   */
  private static getButtonSizeValue(size: 'sm' | 'md' | 'lg'): string {
    const sizes = {
      sm: '32px',
      md: '40px',
      lg: '48px'
    };
    return sizes[size];
  }

  /**
   * Valida una configuración de tema
   * @param theme Tema a validar
   * @returns true si es válido
   */
  static validateTheme(theme: AdvancedThemeConfig): boolean {
    try {
      // Validar colores
      if (theme.colors) {
        const colorKeys = ['primary', 'secondary', 'accent', 'textPrimary', 'textSecondary', 'background', 'surface'];
        for (const key of colorKeys) {
          const color = theme.colors[key as keyof typeof theme.colors];
          if (color && !this.isValidColor(color)) {
            console.warn(`Color inválido para ${key}: ${color}`);
            return false;
          }
        }
      }
      
      // Validar tipografía
      if (theme.typography) {
        const validFontSizes = ['sm', 'base', 'lg'];
        const validWeights = ['normal', 'medium', 'semibold', 'bold'];
        
        if (theme.typography.fontSize && !validFontSizes.includes(theme.typography.fontSize)) {
          return false;
        }
        
        if (theme.typography.headingWeight && !validWeights.includes(theme.typography.headingWeight)) {
          return false;
        }
        
        if (theme.typography.bodyWeight && !validWeights.includes(theme.typography.bodyWeight)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validando tema:', error);
      return false;
    }
  }

  /**
   * Valida si un color es válido
   * @param color Color a validar
   * @returns true si es válido
   */
  private static isValidColor(color: string): boolean {
    // Validar hex
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }
    
    // Validar rgb/rgba
    if (/^rgba?\(/.test(color)) {
      return true;
    }
    
    // Validar hsl/hsla
    if (/^hsla?\(/.test(color)) {
      return true;
    }
    
    // Validar nombres de colores CSS
    const tempDiv = document.createElement('div');
    tempDiv.style.color = color;
    return tempDiv.style.color !== '';
  }

  /**
   * Genera CSS personalizado para el tema
   * @param theme Configuración del tema
   * @returns String con CSS personalizado
   */
  static generateCustomCSS(theme: AdvancedThemeConfig): string {
    const variables = this.generateCSSVariables(theme);
    
    let css = ':root {\n';
    Object.entries(variables).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });
    css += '}\n';
    
    // Agregar estilos adicionales basados en el tema
    if (theme.buttons?.hoverEffect) {
      css += this.generateButtonHoverCSS(theme.buttons.hoverEffect);
    }
    
    return css;
  }

  /**
   * Genera CSS para efectos hover de botones
   * @param effect Tipo de efecto
   * @returns CSS para el efecto
   */
  private static generateButtonHoverCSS(effect: 'scale' | 'shadow' | 'brightness'): string {
    const effects = {
      scale: `
.btn:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}
`,
      shadow: `
.btn:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.2s ease;
}
`,
      brightness: `
.btn:hover {
  filter: brightness(1.1);
  transition: filter 0.2s ease;
}
`
    };
    
    return effects[effect];
  }
}