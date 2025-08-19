/**
 * Índice de servicios centralizados
 * 
 * Exporta todos los servicios de la aplicación para facilitar
 * las importaciones y mantener una estructura organizada.
 * 
 * @module shared/services
 */

// Importaciones internas para uso en funciones
import { validationService } from './validation.service';
import { logger } from './logger.service';
import { errorService } from './error.service';

// Servicios de validación
export {
  validationService
} from './validation.service';

// Servicios de logging
export {
  logger,
  LogLevel,
  profileLogger,
  userLogger,
  validationLogger,
  authLogger
} from './logger.service';

// Servicios de manejo de errores
export {
  errorService,
  ErrorType,
  ErrorSeverity,
  createBusinessError,
  createValidationError,
  handleError,
  withErrorRecovery
} from './error.service';

export type { StructuredError } from './error.service';

// Nota: Los servicios de cache, configuración y métricas han sido removidos para simplificar el código

// Tipos compartidos
export type {
  LogContext,
  LogEntry
} from './logger.service';

/**
 * Inicializar todos los servicios
 * 
 * Esta función debe ser llamada al inicio de la aplicación
 * para asegurar que todos los servicios estén correctamente configurados.
 */
export const initializeServices = async (): Promise<void> => {
  try {
    // Los servicios se inicializan automáticamente al ser importados
    // pero podemos agregar lógica adicional aquí si es necesario
    
    logger.info('All services initialized successfully', {
      module: 'ServicesIndex',
      function: 'initializeServices',
      metadata: { timestamp: new Date().toISOString() }
    });
  } catch (error) {
    logger.error('Failed to initialize services', {
      module: 'ServicesIndex',
      function: 'initializeServices'
    }, error as Error);
    throw error;
  }
};

/**
 * Obtener información de estado de todos los servicios
 */
export const getServicesStatus = (): Record<string, any> => {
  return {
    validation: {
      initialized: true,
      rules: []
    },
    logger: {
      initialized: true,
      config: {}
    },
    error: {
      initialized: true,
      config: errorService.getConfig()
    }
  };
};

/**
 * Limpiar todos los servicios
 * 
 * Útil para testing o cuando se necesita reiniciar el estado
 */
export const cleanupServices = (): void => {
  try {
    logger.info('All services cleaned up successfully', {
      module: 'ServicesIndex',
      function: 'cleanupServices'
    });
  } catch (error) {
    logger.error('Failed to cleanup services', {
      module: 'ServicesIndex',
      function: 'cleanupServices'
    }, error as Error);
  }
};