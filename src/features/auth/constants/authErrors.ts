/**
 * Constantes de errores de autenticación
 * 
 * @module features/auth/constants/authErrors
 */

/**
 * Códigos de error de Firebase Auth organizados por categoría
 */
export const AUTH_ERROR_CODES = {
  // Errores relacionados con email
  EMAIL_ERRORS: [
    'auth/email-already-in-use',
    'auth/invalid-email',
    'auth/user-not-found'
  ],
  
  // Errores relacionados con contraseña
  PASSWORD_ERRORS: [
    'auth/wrong-password',
    'auth/weak-password'
  ],
  
  // Errores de configuración
  CONFIG_ERRORS: [
    'auth/api-key-not-valid',
    'auth/operation-not-allowed'
  ],
  
  // Errores de red
  NETWORK_ERRORS: [
    'auth/network-request-failed',
    'auth/timeout'
  ],
  
  // Errores de usuario
  USER_ERRORS: [
    'auth/user-disabled',
    'auth/too-many-requests'
  ],
  
  // Errores de popup/UI
  UI_ERRORS: [
    'auth/popup-closed-by-user',
    'auth/popup-blocked'
  ]
} as const;

/**
 * Mensajes de error localizados para cada código de Firebase Auth
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Errores de email
  'auth/email-already-in-use': 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.',
  'auth/invalid-email': 'El formato del email no es válido.',
  'auth/user-not-found': 'No existe una cuenta con este email.',
  
  // Errores de contraseña
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/weak-password': 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.',
  
  // Errores de usuario
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada. Contacta al soporte.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Espera unos minutos antes de intentar de nuevo.',
  
  // Errores de configuración
  'auth/api-key-not-valid': 'Error de configuración. Contacta al administrador.',
  'auth/operation-not-allowed': 'Esta operación no está permitida. Contacta al administrador.',
  
  // Errores de red
  'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a internet.',
  'auth/timeout': 'La operación tardó demasiado. Inténtalo de nuevo.',
  
  // Errores de popup
  'auth/popup-closed-by-user': 'Inicio de sesión cancelado.',
  'auth/popup-blocked': 'El popup fue bloqueado por el navegador. Permite popups para este sitio.',
  
  // Errores de credenciales
  'auth/invalid-credential': 'Las credenciales proporcionadas son inválidas.',
  'auth/credential-already-in-use': 'Esta cuenta ya está vinculada a otro usuario.',
  
  // Errores de verificación
  'auth/invalid-verification-code': 'El código de verificación es inválido.',
  'auth/invalid-verification-id': 'El ID de verificación es inválido.',
  
  // Error por defecto
  'default': 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.',
  'unknown': 'Error desconocido. Por favor, inténtalo de nuevo.'
};

/**
 * Tipos de error para categorización
 */
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NETWORK: 'network',
  CONFIGURATION: 'configuration',
  USER_ACTION: 'user_action'
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

/**
 * Mapeo de códigos de error a tipos
 */
export const ERROR_TYPE_MAPPING: Record<string, ErrorType> = {
  // Errores de validación
  'auth/invalid-email': ERROR_TYPES.VALIDATION,
  'auth/weak-password': ERROR_TYPES.VALIDATION,
  
  // Errores de autenticación
  'auth/user-not-found': ERROR_TYPES.AUTHENTICATION,
  'auth/wrong-password': ERROR_TYPES.AUTHENTICATION,
  'auth/invalid-credential': ERROR_TYPES.AUTHENTICATION,
  
  // Errores de autorización
  'auth/user-disabled': ERROR_TYPES.AUTHORIZATION,
  'auth/operation-not-allowed': ERROR_TYPES.AUTHORIZATION,
  
  // Errores de red
  'auth/network-request-failed': ERROR_TYPES.NETWORK,
  'auth/timeout': ERROR_TYPES.NETWORK,
  
  // Errores de configuración
  'auth/api-key-not-valid': ERROR_TYPES.CONFIGURATION,
  
  // Errores que requieren acción del usuario
  'auth/email-already-in-use': ERROR_TYPES.USER_ACTION,
  'auth/too-many-requests': ERROR_TYPES.USER_ACTION,
  'auth/popup-closed-by-user': ERROR_TYPES.USER_ACTION
};

/**
 * Obtiene el tipo de error basado en el código
 * 
 * @param errorCode - Código de error de Firebase
 * @returns Tipo de error
 */
export const getErrorType = (errorCode: string): ErrorType => {
  return ERROR_TYPE_MAPPING[errorCode] || ERROR_TYPES.AUTHENTICATION;
};

/**
 * Verifica si un error es crítico (requiere intervención técnica)
 * 
 * @param errorCode - Código de error de Firebase
 * @returns true si es un error crítico
 */
export const isCriticalError = (errorCode: string): boolean => {
  const criticalErrors = [
    'auth/api-key-not-valid',
    'auth/operation-not-allowed'
  ];
  
  return criticalErrors.includes(errorCode);
};

/**
 * Obtiene sugerencias de acción para el usuario basadas en el error
 * 
 * @param errorCode - Código de error de Firebase
 * @returns Array de sugerencias
 */
export const getErrorSuggestions = (errorCode: string): string[] => {
  const suggestions: Record<string, string[]> = {
    'auth/email-already-in-use': [
      'Intenta iniciar sesión en lugar de registrarte',
      'Usa un email diferente',
      'Recupera tu contraseña si la olvidaste'
    ],
    'auth/weak-password': [
      'Usa al menos 6 caracteres',
      'Incluye letras mayúsculas y minúsculas',
      'Agrega números y símbolos'
    ],
    'auth/network-request-failed': [
      'Verifica tu conexión a internet',
      'Intenta de nuevo en unos momentos',
      'Desactiva VPN si estás usando una'
    ],
    'auth/too-many-requests': [
      'Espera unos minutos antes de intentar de nuevo',
      'Verifica que estés usando las credenciales correctas'
    ]
  };
  
  return suggestions[errorCode] || ['Inténtalo de nuevo en unos momentos'];
};