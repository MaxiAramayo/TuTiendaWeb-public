/**
 * Servicio centralizado de manejo de errores
 * 
 * Proporciona funcionalidades para:
 * - Clasificación de errores
 * - Formateo de mensajes de error
 * - Logging de errores
 * - Recuperación de errores
 * 
 * @module shared/services/error
 */

import { logger } from './logger.service';

/**
 * NOTA: Este servicio fue movido desde shared/services/
 * Es una utilidad de bajo nivel, no lógica compartida de features.
 */

/**
 * Tipos de errores del sistema
 */
export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  FIRESTORE = 'firestore',
  STORAGE = 'storage',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown'
}

/**
 * Severidad del error
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interfaz para errores estructurados
 */
export interface StructuredError {
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  context?: Record<string, any>;
  originalError?: Error;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
}

/**
 * Configuración de manejo de errores
 */
interface ErrorConfig {
  enableLogging: boolean;
  enableUserNotification: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Servicio de manejo de errores
 */
class ErrorService {
  private config: ErrorConfig = {
    enableLogging: true,
    enableUserNotification: true,
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000
  };

  /**
   * Crear un error estructurado
   */
  createError(
    type: ErrorType,
    code: string,
    message: string,
    userMessage: string,
    options: {
      severity?: ErrorSeverity;
      context?: Record<string, any>;
      originalError?: Error;
      recoverable?: boolean;
      retryable?: boolean;
    } = {}
  ): StructuredError {
    const {
      severity = ErrorSeverity.MEDIUM,
      context,
      originalError,
      recoverable = false,
      retryable = false
    } = options;

    return {
      type,
      severity,
      code,
      message,
      userMessage,
      context,
      originalError,
      timestamp: new Date(),
      recoverable,
      retryable
    };
  }

  /**
   * Manejar un error
   */
  handleError(error: StructuredError | Error, context?: Record<string, any>): StructuredError {
    let structuredError: StructuredError;

    if (this.isStructuredError(error)) {
      structuredError = error;
    } else {
      structuredError = this.classifyError(error, context);
    }

    // Logging del error
    if (this.config.enableLogging) {
      this.logError(structuredError);
    }

    return structuredError;
  }

  /**
   * Clasificar un error genérico
   */
  private classifyError(error: Error, context?: Record<string, any>): StructuredError {
    const message = error.message.toLowerCase();
    
    // Errores de Firebase/Firestore
    if (message.includes('firestore') || message.includes('firebase')) {
      return this.createFirestoreError(error, context);
    }
    
    // Errores de red
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return this.createNetworkError(error, context);
    }
    
    // Errores de validación
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return this.createValidationError(error, context);
    }
    
    // Errores de autenticación
    if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized')) {
      return this.createAuthError(error, context);
    }
    
    // Error desconocido
    return this.createError(
      ErrorType.UNKNOWN,
      'UNKNOWN_ERROR',
      error.message,
      'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
      {
        severity: ErrorSeverity.MEDIUM,
        context,
        originalError: error,
        recoverable: true,
        retryable: true
      }
    );
  }

  /**
   * Crear error de Firestore
   */
  private createFirestoreError(error: Error, context?: Record<string, any>): StructuredError {
    const message = error.message.toLowerCase();
    
    if (message.includes('permission-denied')) {
      return this.createError(
        ErrorType.AUTHORIZATION,
        'FIRESTORE_PERMISSION_DENIED',
        error.message,
        'No tienes permisos para realizar esta acción.',
        {
          severity: ErrorSeverity.HIGH,
          context,
          originalError: error,
          recoverable: false,
          retryable: false
        }
      );
    }
    
    if (message.includes('not-found')) {
      return this.createError(
        ErrorType.FIRESTORE,
        'FIRESTORE_DOCUMENT_NOT_FOUND',
        error.message,
        'El recurso solicitado no fue encontrado.',
        {
          severity: ErrorSeverity.MEDIUM,
          context,
          originalError: error,
          recoverable: true,
          retryable: false
        }
      );
    }
    
    return this.createError(
      ErrorType.FIRESTORE,
      'FIRESTORE_ERROR',
      error.message,
      'Error en la base de datos. Por favor, inténtalo de nuevo.',
      {
        severity: ErrorSeverity.HIGH,
        context,
        originalError: error,
        recoverable: true,
        retryable: true
      }
    );
  }

  /**
   * Crear error de red
   */
  private createNetworkError(error: Error, context?: Record<string, any>): StructuredError {
    return this.createError(
      ErrorType.NETWORK,
      'NETWORK_ERROR',
      error.message,
      'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.',
      {
        severity: ErrorSeverity.MEDIUM,
        context,
        originalError: error,
        recoverable: true,
        retryable: true
      }
    );
  }

  /**
   * Crear error de validación
   */
  private createValidationError(error: Error, context?: Record<string, any>): StructuredError {
    return this.createError(
      ErrorType.VALIDATION,
      'VALIDATION_ERROR',
      error.message,
      'Los datos ingresados no son válidos. Por favor, revisa la información.',
      {
        severity: ErrorSeverity.LOW,
        context,
        originalError: error,
        recoverable: true,
        retryable: false
      }
    );
  }

  /**
   * Crear error de autenticación
   */
  private createAuthError(error: Error, context?: Record<string, any>): StructuredError {
    return this.createError(
      ErrorType.AUTHENTICATION,
      'AUTH_ERROR',
      error.message,
      'Error de autenticación. Por favor, inicia sesión nuevamente.',
      {
        severity: ErrorSeverity.HIGH,
        context,
        originalError: error,
        recoverable: true,
        retryable: false
      }
    );
  }

  /**
   * Verificar si es un error estructurado
   */
  private isStructuredError(error: any): error is StructuredError {
    return error && typeof error === 'object' && 'type' in error && 'code' in error;
  }

  /**
   * Logging del error
   */
  private logError(error: StructuredError): void {
    const logContext = {
      module: 'ErrorService',
      function: 'logError',
      ...error.context
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        logger.warn(error.message, logContext, error);
        break;
      case ErrorSeverity.MEDIUM:
        logger.error(error.message, logContext, error.originalError || new Error(error.message));
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        logger.error(error.message, logContext, error.originalError || new Error(error.message));
        break;
    }
  }

  /**
   * Intentar recuperación automática
   */
  async attemptRecovery<T>(
    operation: () => Promise<T>,
    error: StructuredError,
    context?: Record<string, any>
  ): Promise<T> {
    if (!error.recoverable || !this.config.enableRetry) {
      throw error;
    }

    let attempts = 0;
    const maxAttempts = this.config.maxRetries;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        if (attempts > 1) {
          // Esperar antes del reintento
          await this.delay(this.config.retryDelay * attempts);
        }

        logger.info(`Intento de recuperación ${attempts}/${maxAttempts}`, {
          module: 'ErrorService',
          function: 'attemptRecovery',
          metadata: {
            errorCode: error.code,
            ...context
          }
        });

        return await operation();
      } catch (retryError) {
        if (attempts >= maxAttempts) {
          logger.error('Falló la recuperación automática', {
            module: 'ErrorService',
            function: 'attemptRecovery',
            metadata: {
              attempts,
              errorCode: error.code,
              ...context
            }
          }, retryError as Error);
          throw error;
        }
      }
    }

    throw error;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configurar el servicio
   */
  configure(config: Partial<ErrorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): ErrorConfig {
    return { ...this.config };
  }
}

// Instancia singleton
export const errorService = new ErrorService();

// Funciones de conveniencia
export const createValidationError = (message: string, userMessage?: string, context?: Record<string, any>) =>
  errorService.createError(
    ErrorType.VALIDATION,
    'VALIDATION_ERROR',
    message,
    userMessage || 'Los datos ingresados no son válidos.',
    { severity: ErrorSeverity.LOW, context, recoverable: true }
  );

export const createBusinessError = (code: string, message: string, userMessage: string, context?: Record<string, any>) =>
  errorService.createError(
    ErrorType.BUSINESS_LOGIC,
    code,
    message,
    userMessage,
    { severity: ErrorSeverity.MEDIUM, context, recoverable: true }
  );

export const handleError = (error: Error | StructuredError, context?: Record<string, any>) =>
  errorService.handleError(error, context);

export const withErrorRecovery = <T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
) => async (): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const structuredError = handleError(error as Error, context);
    if (structuredError.recoverable) {
      return await errorService.attemptRecovery(operation, structuredError, context);
    }
    throw structuredError;
  }
};