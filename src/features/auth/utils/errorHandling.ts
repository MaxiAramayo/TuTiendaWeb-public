/**
 * Utilidades para manejo de errores de autenticación
 * 
 * @module features/auth/utils/errorHandling
 */

import { toast } from 'sonner';
import { AUTH_ERROR_CODES, AUTH_ERROR_MESSAGES } from '../constants/authErrors';

export interface AuthErrorInfo {
  code: string;
  message: string;
  field?: 'email' | 'password' | 'general';
  shouldShowToast?: boolean;
}

/**
 * Maneja errores de autenticación de Firebase
 * 
 * @param error - Error de Firebase o error genérico
 * @param showToast - Si mostrar notificación toast automáticamente
 * @returns Información estructurada del error
 */
export const handleAuthError = (error: any, showToast: boolean = true): AuthErrorInfo => {
  const errorCode = error?.code || 'unknown';
  const errorInfo: AuthErrorInfo = {
    code: errorCode,
    message: getErrorMessage(errorCode),
    field: getErrorField(errorCode),
    shouldShowToast: showToast
  };

  // Mostrar toast si está habilitado
  if (showToast) {
    toast.error(errorInfo.message);
  }

  // Log del error para debugging
  console.error('Auth Error:', {
    code: errorCode,
    message: errorInfo.message,
    originalError: error
  });

  return errorInfo;
};

/**
 * Obtiene el mensaje de error localizado
 * 
 * @param errorCode - Código de error de Firebase
 * @returns Mensaje de error localizado
 */
export const getErrorMessage = (errorCode: string): string => {
  return AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES.default;
};

/**
 * Determina qué campo está relacionado con el error
 * 
 * @param errorCode - Código de error de Firebase
 * @returns Campo relacionado con el error
 */
export const getErrorField = (errorCode: string): 'email' | 'password' | 'general' => {
  if (AUTH_ERROR_CODES.EMAIL_ERRORS.includes(errorCode as any)) {
    return 'email';
  }
  
  if (AUTH_ERROR_CODES.PASSWORD_ERRORS.includes(errorCode as any)) {
    return 'password';
  }
  
  return 'general';
};

/**
 * Verifica si un error es recuperable (el usuario puede intentar de nuevo)
 * 
 * @param errorCode - Código de error de Firebase
 * @returns true si el error es recuperable
 */
export const isRecoverableError = (errorCode: string): boolean => {
  const nonRecoverableErrors = [
    'auth/user-disabled',
    'auth/api-key-not-valid',
    'auth/operation-not-allowed'
  ];
  
  return !nonRecoverableErrors.includes(errorCode);
};

/**
 * Verifica si un error requiere acción del usuario
 * 
 * @param errorCode - Código de error de Firebase
 * @returns true si requiere acción del usuario
 */
export const requiresUserAction = (errorCode: string): boolean => {
  const userActionErrors = [
    'auth/email-already-in-use',
    'auth/weak-password',
    'auth/invalid-email',
    'auth/user-not-found',
    'auth/wrong-password'
  ];
  
  return userActionErrors.includes(errorCode);
};

/**
 * Crea un error personalizado para la aplicación
 * 
 * @param message - Mensaje del error
 * @param code - Código del error (opcional)
 * @param field - Campo relacionado (opcional)
 * @returns Error personalizado
 */
export const createAppError = (
  message: string, 
  code: string = 'app/custom-error', 
  field?: 'email' | 'password' | 'general'
): Error & { code: string; field?: string } => {
  const error = new Error(message) as Error & { code: string; field?: string };
  error.code = code;
  if (field) {
    error.field = field;
  }
  return error;
};

/**
 * Maneja errores de validación de formularios
 * 
 * @param errors - Errores de validación
 * @param showToast - Si mostrar notificación toast
 * @returns Primer error encontrado
 */
export const handleValidationErrors = (
  errors: Record<string, any>, 
  showToast: boolean = true
): string | null => {
  const errorKeys = Object.keys(errors);
  
  if (errorKeys.length === 0) {
    return null;
  }
  
  const firstError = errors[errorKeys[0]];
  const message = firstError?.message || 'Error de validación';
  
  if (showToast) {
    toast.error(message);
  }
  
  return message;
};

/**
 * Wrapper para operaciones asíncronas con manejo de errores
 * 
 * @param operation - Operación asíncrona a ejecutar
 * @param errorHandler - Manejador de errores personalizado (opcional)
 * @returns Resultado de la operación o null si hay error
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorHandler?: (error: any) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      handleAuthError(error);
    }
    return null;
  }
};