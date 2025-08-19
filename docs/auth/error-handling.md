# Sistema de Manejo de Errores de Autenticación

## Descripción

El sistema de manejo de errores proporciona una capa centralizada para procesar, normalizar y presentar errores de autenticación de manera consistente en toda la aplicación. Convierte códigos de error técnicos de Firebase en mensajes comprensibles para el usuario.

## Ubicación

```
src/features/auth/utils/errorHandling.ts
src/features/auth/constants/authErrors.ts
```

## Arquitectura

### Componentes Principales

1. **handleAuthError**: Función principal de manejo de errores
2. **AUTH_ERROR_CODES**: Constantes de códigos de error categorizados
3. **AUTH_ERROR_MESSAGES**: Mapeo de códigos a mensajes localizados
4. **Funciones auxiliares**: Para clasificación y análisis de errores

### Flujo de Manejo de Errores

```
Error de Firebase → handleAuthError() → AuthErrorInfo → UI/Toast
```

## Función Principal: handleAuthError

### Signatura
```typescript
handleAuthError(error: any, showToast: boolean = true): AuthErrorInfo
```

### Parámetros
- `error`: Error original de Firebase o error genérico
- `showToast`: Si mostrar notificación toast automáticamente (default: true)

### Retorno
```typescript
interface AuthErrorInfo {
  code: string;                    // Código de error normalizado
  message: string;                 // Mensaje localizado para el usuario
  field?: 'email' | 'password' | 'general'; // Campo relacionado con el error
  shouldShowToast?: boolean;       // Si se debe mostrar toast
}
```

### Implementación
```typescript
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
```

## Funciones Auxiliares

### `getErrorMessage(errorCode: string): string`
Obtiene el mensaje de error localizado.

```typescript
export const getErrorMessage = (errorCode: string): string => {
  return AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES.default;
};
```

### `getErrorField(errorCode: string): 'email' | 'password' | 'general'`
Determina qué campo del formulario está relacionado con el error.

```typescript
export const getErrorField = (errorCode: string): 'email' | 'password' | 'general' => {
  if (AUTH_ERROR_CODES.EMAIL_ERRORS.includes(errorCode as any)) {
    return 'email';
  }
  
  if (AUTH_ERROR_CODES.PASSWORD_ERRORS.includes(errorCode as any)) {
    return 'password';
  }
  
  return 'general';
};
```

### `isRecoverableError(errorCode: string): boolean`
Verifica si un error es recuperable (el usuario puede intentar de nuevo).

```typescript
export const isRecoverableError = (errorCode: string): boolean => {
  const nonRecoverableErrors = [
    'auth/user-disabled',
    'auth/api-key-not-valid',
    'auth/operation-not-allowed'
  ];
  
  return !nonRecoverableErrors.includes(errorCode);
};
```

### `requiresUserAction(errorCode: string): boolean`
Verifica si un error requiere acción específica del usuario.

```typescript
export const requiresUserAction = (errorCode: string): boolean => {
  const actionRequiredErrors = [
    'auth/email-already-in-use',
    'auth/weak-password',
    'auth/invalid-email',
    'auth/user-not-found'
  ];
  
  return actionRequiredErrors.includes(errorCode);
};
```

### `getErrorSuggestions(errorCode: string): string[]`
Proporciona sugerencias de acción para errores específicos.

```typescript
export const getErrorSuggestions = (errorCode: string): string[] => {
  const suggestions: Record<string, string[]> = {
    'auth/weak-password': [
      'Use al menos 8 caracteres',
      'Incluya números y símbolos',
      'Combine mayúsculas y minúsculas'
    ],
    'auth/invalid-email': [
      'Verifique el formato del email',
      'Asegúrese de incluir @ y dominio'
    ],
    'auth/network-request-failed': [
      'Verifique su conexión a internet',
      'Intente nuevamente en unos momentos'
    ]
  };
  
  return suggestions[errorCode] || [];
};
```

### `handleValidationErrors(errors: Record<string, any>, showToast: boolean = true): string | null`
Maneja errores de validación de formularios.

```typescript
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
```

## Constantes de Error

### AUTH_ERROR_CODES
Categorización de códigos de error por tipo:

```typescript
export const AUTH_ERROR_CODES = {
  // Errores relacionados con email
  EMAIL_ERRORS: [
    'auth/invalid-email',
    'auth/user-not-found',
    'auth/email-already-in-use',
    'auth/invalid-credential'
  ] as const,
  
  // Errores relacionados con contraseña
  PASSWORD_ERRORS: [
    'auth/wrong-password',
    'auth/weak-password',
    'auth/invalid-credential'
  ] as const,
  
  // Errores de red
  NETWORK_ERRORS: [
    'auth/network-request-failed',
    'auth/timeout'
  ] as const,
  
  // Errores de configuración
  CONFIG_ERRORS: [
    'auth/api-key-not-valid',
    'auth/invalid-api-key',
    'auth/operation-not-allowed'
  ] as const,
  
  // Errores de Google OAuth
  GOOGLE_ERRORS: [
    'auth/popup-closed-by-user',
    'auth/popup-blocked',
    'auth/cancelled-popup-request'
  ] as const
};
```

### AUTH_ERROR_MESSAGES
Mapeo de códigos a mensajes localizados:

```typescript
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Errores de credenciales
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/user-not-found': 'No existe una cuenta con este email',
  'auth/wrong-password': 'Contraseña incorrecta',
  
  // Errores de email
  'auth/invalid-email': 'El formato del email no es válido',
  'auth/email-already-in-use': 'Este email ya está registrado',
  
  // Errores de contraseña
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  
  // Errores de red
  'auth/network-request-failed': 'Error de conexión. Verifique su internet',
  'auth/timeout': 'La operación tardó demasiado. Intente nuevamente',
  
  // Errores de Google
  'auth/popup-closed-by-user': 'Inicio de sesión cancelado',
  'auth/popup-blocked': 'Popup bloqueado. Permita popups para este sitio',
  
  // Errores de configuración
  'auth/api-key-not-valid': 'Error de configuración. Contacte al soporte',
  'auth/operation-not-allowed': 'Operación no permitida',
  
  // Errores de cuenta
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
  'auth/too-many-requests': 'Demasiados intentos. Intente más tarde',
  
  // Error por defecto
  'default': 'Ha ocurrido un error inesperado. Intente nuevamente'
};
```

## Patrones de Uso

### En Servicios (Con Toast)
```typescript
class AuthService {
  async signIn(credentials: AuthCredentials) {
    try {
      return await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } catch (error) {
      // Mostrar toast automáticamente
      const errorInfo = handleAuthError(error);
      throw new Error(errorInfo.message);
    }
  }
}
```

### En Hooks (Sin Toast)
```typescript
const useAuth = () => {
  const signIn = async (credentials) => {
    try {
      await authService.signIn(credentials);
    } catch (error) {
      // No mostrar toast aquí, manejar en componente
      const errorInfo = handleAuthError(error, false);
      setError(errorInfo.message);
      throw error;
    }
  };
};
```

### En Componentes (Manejo Específico)
```typescript
const LoginForm = () => {
  const { signIn } = useAuth();
  const [fieldErrors, setFieldErrors] = useState({});
  
  const onSubmit = async (data) => {
    try {
      await signIn(data);
    } catch (error) {
      const errorInfo = handleAuthError(error, false);
      
      // Mostrar error en campo específico
      if (errorInfo.field !== 'general') {
        setFieldErrors({ [errorInfo.field]: errorInfo.message });
      } else {
        toast.error(errorInfo.message);
      }
    }
  };
};
```

### Validación de Formularios
```typescript
const RegisterForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  useEffect(() => {
    // Manejar errores de validación
    handleValidationErrors(errors);
  }, [errors]);
};
```

## Integración con UI

### Toast Notifications
```typescript
// Configuración de toast
import { toast } from 'sonner';

// En handleAuthError
if (showToast) {
  toast.error(errorInfo.message, {
    duration: 4000,
    position: 'top-center'
  });
}
```

### Errores en Formularios
```typescript
const FormField = ({ name, error }) => (
  <div>
    <input name={name} />
    {error && (
      <span className="text-red-500 text-sm">
        {error}
      </span>
    )}
  </div>
);
```

### Estados de Error Globales
```typescript
const ErrorBoundary = ({ error, retry }) => {
  const errorInfo = handleAuthError(error, false);
  const suggestions = getErrorSuggestions(errorInfo.code);
  
  return (
    <div className="error-container">
      <h3>Error de Autenticación</h3>
      <p>{errorInfo.message}</p>
      
      {suggestions.length > 0 && (
        <ul>
          {suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      )}
      
      {isRecoverableError(errorInfo.code) && (
        <button onClick={retry}>Intentar Nuevamente</button>
      )}
    </div>
  );
};
```

## Testing

### Unit Tests
```typescript
describe('handleAuthError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle Firebase auth errors', () => {
    const firebaseError = {
      code: 'auth/invalid-credential',
      message: 'Firebase error message'
    };

    const result = handleAuthError(firebaseError, false);

    expect(result.code).toBe('auth/invalid-credential');
    expect(result.message).toBe('Email o contraseña incorrectos');
    expect(result.field).toBe('general');
  });

  it('should categorize email errors correctly', () => {
    const emailError = { code: 'auth/invalid-email' };
    const result = handleAuthError(emailError, false);
    
    expect(result.field).toBe('email');
  });

  it('should show toast when enabled', () => {
    const mockToast = jest.spyOn(toast, 'error');
    const error = { code: 'auth/invalid-credential' };
    
    handleAuthError(error, true);
    
    expect(mockToast).toHaveBeenCalledWith('Email o contraseña incorrectos');
  });
});
```

### Integration Tests
```typescript
describe('Error Handling Integration', () => {
  it('should handle complete auth flow with errors', async () => {
    const mockError = { code: 'auth/user-not-found' };
    jest.spyOn(authService, 'signIn').mockRejectedValue(mockError);
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      try {
        await result.current.signIn({ email: 'test@test.com', password: 'wrong' });
      } catch (error) {
        // Error manejado correctamente
      }
    });
    
    expect(result.current.error).toBe('No existe una cuenta con este email');
  });
});
```

## Monitoreo y Analytics

### Logging de Errores
```typescript
const logError = (errorInfo: AuthErrorInfo, context: string) => {
  console.error('Auth Error:', {
    code: errorInfo.code,
    message: errorInfo.message,
    field: errorInfo.field,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
};
```

### Métricas Recomendadas
- **Frecuencia de errores por código**
- **Tasa de errores por método de autenticación**
- **Errores más comunes por tiempo**
- **Tasa de recuperación de errores**

## Localización

### Soporte Multi-idioma
```typescript
// Estructura para múltiples idiomas
const ERROR_MESSAGES = {
  es: {
    'auth/invalid-credential': 'Email o contraseña incorrectos',
    // ... más mensajes en español
  },
  en: {
    'auth/invalid-credential': 'Invalid email or password',
    // ... más mensajes en inglés
  }
};

const getLocalizedMessage = (code: string, locale: string = 'es') => {
  return ERROR_MESSAGES[locale]?.[code] || ERROR_MESSAGES.es[code] || ERROR_MESSAGES.es.default;
};
```

## Mejores Prácticas

### 1. Consistencia
- Usar siempre `handleAuthError` para procesar errores
- Mantener mensajes consistentes en toda la aplicación
- Categorizar errores apropiadamente

### 2. User Experience
- Mensajes claros y accionables
- Sugerencias específicas cuando sea posible
- Evitar jerga técnica

### 3. Debugging
- Preservar información original del error
- Logging detallado para desarrollo
- Contexto suficiente para reproducir problemas

### 4. Performance
- Evitar operaciones costosas en manejo de errores
- Cache de mensajes cuando sea apropiado
- Lazy loading de sugerencias

## Troubleshooting

### Problemas Comunes

#### Mensajes no localizados
**Síntoma**: Aparecen códigos de error en lugar de mensajes
**Solución**: Verificar que el código esté en `AUTH_ERROR_MESSAGES`

#### Toasts duplicados
**Síntoma**: Múltiples notificaciones para el mismo error
**Solución**: Usar `showToast: false` en capas intermedias

#### Errores no categorizados
**Síntoma**: Todos los errores aparecen como 'general'
**Solución**: Añadir códigos a las categorías apropiadas

#### Logging excesivo
**Síntoma**: Demasiados logs en consola
**Solución**: Configurar niveles de log por ambiente

## Mejoras Futuras

1. **Retry automático** para errores de red
2. **Rate limiting** de notificaciones
3. **Contexto de error** más detallado
4. **Integración con analytics** para métricas
5. **Sugerencias dinámicas** basadas en contexto
6. **Recuperación automática** para ciertos errores
7. **Notificaciones offline** para errores de red
8. **Escalación automática** para errores críticos