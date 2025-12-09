/**
 * Servicio de logging estructurado
 * 
 * Proporciona logging consistente y estructurado para toda la aplicación
 * 
 * @module shared/services/logger
 */

/**
 * Niveles de log disponibles
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Contexto del log
 */
export interface LogContext {
  /** Módulo o servicio que genera el log */
  module: string;
  /** Función o método específico */
  function?: string;
  /** ID de usuario (si aplica) */
  userId?: string;
  /** ID de tienda (si aplica) */
  storeId?: string;
  /** Datos adicionales */
  metadata?: Record<string, any>;
}

/**
 * Entrada de log estructurada
 */
export interface LogEntry {
  /** Timestamp del log */
  timestamp: string;
  /** Nivel del log */
  level: LogLevel;
  /** Mensaje principal */
  message: string;
  /** Contexto del log */
  context: LogContext;
  /** Error asociado (si aplica) */
  error?: Error;
  /** Datos adicionales */
  data?: any;
}

/**
 * Configuración del logger
 */
interface LoggerConfig {
  /** Nivel mínimo de log */
  minLevel: LogLevel;
  /** Habilitar logs en consola */
  enableConsole: boolean;
  /** Habilitar logs remotos */
  enableRemote: boolean;
  /** URL del servicio de logs remoto */
  remoteUrl?: string;
  /** Formato de timestamp */
  timestampFormat: 'iso' | 'locale';
}

/**
 * Clase principal del servicio de logging
 */
class LoggerService {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
      enableConsole: true,
      enableRemote: false,
      timestampFormat: 'iso',
      ...config,
    };
  }

  /**
   * Log de debug
   */
  debug(message: string, context: LogContext, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log de información
   */
  info(message: string, context: LogContext, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log de advertencia
   */
  warn(message: string, context: LogContext, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log de error
   */
  error(message: string, context: LogContext, error?: Error, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data, error);
  }

  /**
   * Log principal
   */
  private log(
    level: LogLevel,
    message: string,
    context: LogContext,
    data?: any,
    error?: Error
  ): void {
    if (level < this.config.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      error,
      data,
    };

    // Agregar al buffer
    this.addToBuffer(entry);

    // Log en consola
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Log remoto (si está habilitado)
    if (this.config.enableRemote) {
      this.logToRemote(entry);
    }
  }

  /**
   * Formatear timestamp
   */
  private formatTimestamp(): string {
    const now = new Date();
    return this.config.timestampFormat === 'iso'
      ? now.toISOString()
      : now.toLocaleString();
  }

  /**
   * Agregar entrada al buffer
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Mantener tamaño del buffer
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }
  }

  /**
   * Log en consola con formato
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, context, data, error } = entry;
    const emoji = this.getLevelEmoji(level);
    const levelName = LogLevel[level];
    
    const prefix = `${emoji} [${context.module}${context.function ? `::${context.function}` : ''}]`;
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage, data);
        break;
      case LogLevel.INFO:
        console.info(fullMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(fullMessage, error || data);
        if (error && error.stack) {
          console.error('Stack trace:', error.stack);
        }
        break;
    }
  }

  /**
   * Obtener emoji para el nivel de log
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  /**
   * Enviar log a servicio remoto
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteUrl) {
      return;
    }

    try {
      await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Evitar loops infinitos de logging
      console.error('Failed to send log to remote service:', error);
    }
  }

  /**
   * Obtener logs del buffer
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logBuffer.filter(entry => entry.level >= level);
    }
    return [...this.logBuffer];
  }

  /**
   * Limpiar buffer de logs
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Actualizar configuración
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Crear logger con contexto específico
   */
  createContextLogger(baseContext: Partial<LogContext>) {
    return {
      debug: (message: string, additionalContext?: Partial<LogContext>, data?: any) =>
        this.debug(message, { ...baseContext, ...additionalContext } as LogContext, data),
      
      info: (message: string, additionalContext?: Partial<LogContext>, data?: any) =>
        this.info(message, { ...baseContext, ...additionalContext } as LogContext, data),
      
      warn: (message: string, additionalContext?: Partial<LogContext>, data?: any) =>
        this.warn(message, { ...baseContext, ...additionalContext } as LogContext, data),
      
      error: (message: string, additionalContext?: Partial<LogContext>, error?: Error, data?: any) =>
        this.error(message, { ...baseContext, ...additionalContext } as LogContext, error, data),
    };
  }
}

// Instancia singleton del logger
export const logger = new LoggerService();

// Loggers con contexto predefinido para módulos comunes
export const profileLogger = logger.createContextLogger({ module: 'ProfileService' });
export const userLogger = logger.createContextLogger({ module: 'UserService' });
export const validationLogger = logger.createContextLogger({ module: 'ValidationService' });
export const authLogger = logger.createContextLogger({ module: 'AuthService' });

// Tipos ya exportados en sus definiciones