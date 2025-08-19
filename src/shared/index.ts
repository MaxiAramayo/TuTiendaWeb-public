/**
 * Exportaciones centralizadas del módulo shared
 * 
 * Este archivo centraliza todas las exportaciones de servicios, hooks,
 * tipos y utilidades compartidas para facilitar las importaciones
 * y mantener una API consistente en toda la aplicación.
 * 
 * @module shared
 */

// Importaciones internas para uso en funciones de inicialización
import { 
  logger, 
  initializeServices, 
  cleanupServices 
} from './services';

// Servicios
export {
  // Servicios principales
  validationService,
  logger,
  errorService,
  
  // Funciones de inicialización
  initializeServices,
  getServicesStatus,
  cleanupServices,
  
  // Tipos de logging
  LogLevel,
  type LogContext,
  type LogEntry,
  
  // Tipos de error
  ErrorType,
  ErrorSeverity,
  type StructuredError,
  
  // Funciones de conveniencia para errores
  createValidationError,
  createBusinessError,
  handleError,
  withErrorRecovery
} from './services';

// Hooks
export {
  // Utilidades básicas de hooks
  hookUtils
} from './hooks';

/**
 * Utilidades compartidas
 */
export const sharedUtils = {
  /**
   * Formatear fecha de manera consistente
   */
  formatDate: (date: Date | string | number, format: 'short' | 'long' | 'iso' = 'short'): string => {
    const d = new Date(date);
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString();
      case 'long':
        return d.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'iso':
        return d.toISOString();
      default:
        return d.toLocaleDateString();
    }
  },
  
  /**
   * Formatear moneda
   */
  formatCurrency: (amount: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency
    }).format(amount);
  },
  
  /**
   * Generar slug desde texto
   */
  generateSlug: (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-'); // Remover guiones múltiples
  },
  
  /**
   * Truncar texto
   */
  truncateText: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },
  
  /**
   * Capitalizar primera letra
   */
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
  
  /**
   * Capitalizar cada palabra
   */
  capitalizeWords: (text: string): string => {
    return text.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  },
  
  /**
   * Validar email
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * Validar URL
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Generar ID único
   */
  generateId: (prefix: string = 'id'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  /**
   * Deep clone de objeto
   */
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (obj instanceof Array) return obj.map(item => sharedUtils.deepClone(item)) as unknown as T;
    if (typeof obj === 'object') {
      const cloned = {} as T;
      Object.keys(obj).forEach(key => {
        (cloned as any)[key] = sharedUtils.deepClone((obj as any)[key]);
      });
      return cloned;
    }
    return obj;
  },
  
  /**
   * Comparar objetos profundamente
   */
  deepEqual: (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => 
        keysB.includes(key) && sharedUtils.deepEqual(a[key], b[key])
      );
    }
    
    return false;
  },
  
  /**
   * Obtener valor anidado de objeto
   */
  getNestedValue: (obj: any, path: string, defaultValue: any = undefined): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  },
  
  /**
   * Establecer valor anidado en objeto
   */
  setNestedValue: (obj: any, path: string, value: any): void => {
    const keys = path.split('.');
    const lastKey = keys.pop();
    
    if (!lastKey) return;
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  },
  
  /**
   * Remover propiedades undefined/null
   */
  cleanObject: <T extends Record<string, any>>(obj: T): Partial<T> => {
    const cleaned: Partial<T> = {};
    
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined && value !== null) {
        cleaned[key as keyof T] = value;
      }
    });
    
    return cleaned;
  },
  
  /**
   * Agrupar array por propiedad
   */
  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },
  
  /**
   * Ordenar array por múltiples criterios
   */
  sortBy: <T>(array: T[], ...criteria: ((item: T) => any)[]): T[] => {
    return [...array].sort((a, b) => {
      for (const criterion of criteria) {
        const aValue = criterion(a);
        const bValue = criterion(b);
        
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
      }
      return 0;
    });
  },
  
  /**
   * Remover duplicados de array
   */
  unique: <T>(array: T[], keyFn?: (item: T) => any): T[] => {
    if (!keyFn) {
      return Array.from(new Set(array));
    }
    
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },
  
  /**
   * Chunk array en grupos
   */
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },
  
  /**
   * Retry función con backoff
   */
  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError!;
  }
};

/**
 * Constantes compartidas
 */
export const sharedConstants = {
  // Límites
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_TEXT_LENGTH: 10000,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  
  // Timeouts
  DEFAULT_TIMEOUT: 30000, // 30 segundos
  QUICK_TIMEOUT: 5000, // 5 segundos
  LONG_TIMEOUT: 60000, // 1 minuto
  
  // Cache TTL
  CACHE_TTL_SHORT: 5 * 60 * 1000, // 5 minutos
  CACHE_TTL_MEDIUM: 30 * 60 * 1000, // 30 minutos
  CACHE_TTL_LONG: 24 * 60 * 60 * 1000, // 24 horas
  
  // Regex patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[+]?[1-9]?[0-9]{7,15}$/,
    URL: /^https?:\/\/.+/,
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  },
  
  // Tipos de archivo permitidos
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
  
  // Códigos de estado HTTP
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
  } as const
};

/**
 * Tipos compartidos comunes
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

/**
 * Inicialización del módulo shared
 */
export const initializeShared = async (): Promise<void> => {
  try {
    // Inicializar servicios
    await initializeServices();
    
    logger.info('Shared module initialized successfully', {
      module: 'shared',
      function: 'initializeShared'
    });
    
  } catch (error) {
    console.error('Failed to initialize shared module:', error);
    throw error;
  }
};

/**
 * Cleanup del módulo shared
 */
export const cleanupShared = async (): Promise<void> => {
  try {
    await cleanupServices();
    
    logger.info('Shared module cleaned up successfully', {
      module: 'shared',
      function: 'cleanupShared'
    });
    
  } catch (error) {
    console.error('Failed to cleanup shared module:', error);
  }
};