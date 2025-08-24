/**
 * Exportaciones centralizadas de hooks compartidos
 * 
 * Este archivo centraliza todos los hooks personalizados para facilitar
 * las importaciones y mantener una API consistente.
 * 
 * @module shared/hooks
 */

// Nota: Los hooks personalizados han sido removidos para simplificar el código
// Solo se mantienen las utilidades básicas

/**
 * Utilidades para hooks
 */
export const hookUtils = {
  /**
   * Generar ID único para hooks
   */
  generateHookId: (): string => {
    return `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Debounce para hooks
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  /**
   * Throttle para hooks
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  },

  /**
   * Crear función de cleanup para hooks
   */
  createCleanup: (...cleanupFunctions: (() => void)[]): (() => void) => {
    return () => {
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Error during cleanup:', error);
        }
      });
    };
  },

  /**
   * Verificar si estamos en el cliente
   */
  isClient: (): boolean => {
    return typeof window !== 'undefined';
  },

  /**
   * Verificar si un valor ha cambiado
   */
  hasChanged: <T>(prev: T, current: T): boolean => {
    if (prev === current) return false;
    
    if (typeof prev === 'object' && typeof current === 'object') {
      return JSON.stringify(prev) !== JSON.stringify(current);
    }
    
    return true;
  },

  /**
   * Crear key estable para dependencias
   */
  createStableKey: (deps: any[]): string => {
    return deps.map(dep => {
      if (typeof dep === 'object') {
        return JSON.stringify(dep);
      }
      return String(dep);
    }).join('|');
  }
};