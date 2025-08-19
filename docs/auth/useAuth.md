# Hook useAuth

## Descripción

El hook `useAuth` es el punto central de toda la funcionalidad de autenticación en la aplicación. Proporciona una interfaz unificada para todas las operaciones de autenticación y maneja la sincronización de estados entre Firebase Auth, Firestore y los stores locales.

## Ubicación

```
src/features/auth/hooks/useAuth.ts
```

## Funcionalidades

### Métodos Principales

#### `signIn(credentials: AuthCredentials)`
Inicia sesión con email y contraseña.

**Parámetros:**
- `credentials.email`: Email del usuario
- `credentials.password`: Contraseña del usuario

**Flujo:**
1. Llama a `authService.signIn()`
2. Carga datos del usuario con `loadUserData()`
3. Sincroniza estados entre stores
4. Muestra toast de éxito
5. Redirige al dashboard

**Manejo de errores:**
- Usa `handleAuthError()` sin toast automático
- Preserva códigos de error originales
- Permite manejo específico en componentes

```typescript
try {
  await signIn({ email: 'user@example.com', password: 'password' });
} catch (error) {
  // Error ya manejado, código disponible en error.code
}
```

#### `signInWithGoogle(autoRedirect: boolean = true)`
Inicia sesión con Google OAuth.

**Parámetros:**
- `autoRedirect`: Si debe redirigir automáticamente después del login

**Retorna:**
```typescript
{
  userCredential: UserCredential,
  isNewUser: boolean,
  hasIncompleteProfile: boolean
}
```

**Flujo:**
1. Llama a `authService.signInWithGoogle()`
2. Carga datos del usuario
3. Determina el estado del usuario:
   - **Nuevo**: Redirige a complete-profile o llama callback
   - **Existente sin tienda**: Redirige a complete-profile
   - **Existente con tienda**: Redirige al dashboard

**Casos de uso:**
```typescript
// Con redirección automática (comportamiento por defecto)
const result = await signInWithGoogle();

// Sin redirección automática (para multi-step registration)
const result = await signInWithGoogle(false);
if (result.isNewUser) {
  // Manejar usuario nuevo manualmente
}
```

#### `signUp(values: RegisterFormValues)`
Registra un nuevo usuario con email y contraseña.

**Parámetros:**
- `values`: Datos del formulario de registro incluyendo información de usuario y tienda

**Flujo:**
1. Crea usuario en Firebase Auth
2. Crea tienda usando `createStore()`
3. Carga datos actualizados
4. Sincroniza estados
5. Redirige al dashboard

#### `completeGoogleProfile(uid: string, values: GoogleProfileSetupValues)`
Completa el perfil de un usuario de Google.

**Parámetros:**
- `uid`: ID del usuario de Firebase
- `values`: Datos de configuración de la tienda

**Flujo:**
1. Crea tienda para el usuario existente
2. Carga datos actualizados
3. Redirige al dashboard

#### `signOut()`
Cierra la sesión del usuario.

**Flujo:**
1. Llama a `authService.signOut()`
2. Muestra toast de confirmación
3. Redirige a la página principal

#### `handleResetPassword(email: string)`
Envía email de recuperación de contraseña.

**Parámetros:**
- `email`: Email del usuario

## Estados

### `isLoading: boolean`
Indica si hay una operación de autenticación en progreso.

### `error: string | null`
Contiene el mensaje de error de la última operación fallida.

## Dependencias

### Stores
- `useAuthStore`: Gestión del estado de autenticación global
- `useUserStore`: Gestión de datos del usuario

### Hooks Especializados
- `useUserOperations`: Operaciones de carga de datos de usuario
- `useStoreManagement`: Gestión de tiendas

### Servicios
- `authService`: Interfaz con Firebase Auth
- `handleAuthError`: Manejo centralizado de errores

## Patrones de Uso

### En Componentes de Formulario
```typescript
const LoginForm = () => {
  const { signIn, isLoading, error } = useAuth();
  
  const onSubmit = async (data) => {
    try {
      await signIn(data);
    } catch (error) {
      // Error ya manejado por useAuth
      console.error('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={onSubmit}>
      {/* Formulario */}
      {error && <div className="error">{error}</div>}
      <button disabled={isLoading}>Iniciar Sesión</button>
    </form>
  );
};
```

### En Componentes con Google Auth
```typescript
const GoogleButton = ({ onNewUser }) => {
  const { signInWithGoogle } = useAuth();
  
  const handleClick = async () => {
    try {
      const result = await signInWithGoogle(!onNewUser);
      
      if (result.isNewUser && onNewUser) {
        onNewUser({
          email: result.userCredential.user.email,
          displayName: result.userCredential.user.displayName,
          uid: result.userCredential.user.uid
        });
      }
    } catch (error) {
      // Manejar error específico
    }
  };
  
  return <button onClick={handleClick}>Continuar con Google</button>;
};
```

### En Páginas de Autenticación
```typescript
const SignInPage = () => {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return <LoginForm />;
};
```

## Sincronización de Estados

El hook maneja la sincronización entre múltiples fuentes de estado:

1. **Firebase Auth**: Estado de autenticación
2. **Firestore**: Datos del usuario y tiendas
3. **useAuthStore**: Estado global de autenticación
4. **useUserStore**: Datos del usuario en memoria

### Flujo de Sincronización
```typescript
// 1. Operación en Firebase Auth
const userCredential = await authService.signIn(credentials);

// 2. Cargar datos desde Firestore
await loadUserData(userCredential.user.uid);

// 3. Obtener estado actualizado
const userState = useUserStore.getState().user;

// 4. Sincronizar con store de auth
setUser(userState);
```

## Manejo de Errores

### Estrategia de Manejo
1. **Captura**: Todos los errores son capturados en try/catch
2. **Procesamiento**: Uso de `handleAuthError()` para normalizar
3. **Estado**: Actualización del estado `error`
4. **Propagación**: Re-throw para permitir manejo específico
5. **Preservación**: Códigos de error originales mantenidos

### Tipos de Errores Manejados
- **Credenciales inválidas**: `auth/invalid-credential`
- **Usuario no encontrado**: `auth/user-not-found`
- **Email ya en uso**: `auth/email-already-in-use`
- **Contraseña débil**: `auth/weak-password`
- **Popup cerrado**: `auth/popup-closed-by-user`
- **API key inválida**: `auth/api-key-not-valid`

## Optimizaciones

### useCallback
Todos los métodos usan `useCallback` para evitar re-renders innecesarios:

```typescript
const signIn = useCallback(async (credentials) => {
  // Implementación
}, [loadUserData, router, setUser]);
```

### Gestión de Loading
Estado de loading centralizado que se activa/desactiva automáticamente:

```typescript
try {
  setIsLoading(true);
  // Operación
} finally {
  setIsLoading(false);
}
```

## Testing

### Casos de Prueba

1. **Inicio de sesión exitoso**
   - Verificar llamada a authService
   - Verificar carga de datos
   - Verificar redirección
   - Verificar toast

2. **Inicio de sesión fallido**
   - Verificar manejo de error
   - Verificar estado de error
   - Verificar que no hay redirección

3. **Google Auth - Usuario nuevo**
   - Verificar detección de usuario nuevo
   - Verificar redirección correcta
   - Verificar callback si está presente

4. **Google Auth - Usuario existente**
   - Verificar detección de perfil incompleto
   - Verificar redirección según estado

5. **Registro completo**
   - Verificar creación de usuario
   - Verificar creación de tienda
   - Verificar sincronización de estados

### Mocks Recomendados

```typescript
// Mock de authService
jest.mock('../services/authService', () => ({
  authService: {
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
  }
}));

// Mock de hooks
jest.mock('../hooks/useUserOperations');
jest.mock('../hooks/useStoreManagement');

// Mock de router
jest.mock('next/navigation');
```

## Troubleshooting

### Problemas Comunes

#### Estados no sincronizados
**Síntoma**: Datos del usuario no actualizados después del login
**Solución**: Verificar que `loadUserData()` se ejecute correctamente

#### Redirecciones incorrectas
**Síntoma**: Usuario redirigido al lugar equivocado
**Solución**: Verificar lógica de detección de perfil incompleto

#### Errores no manejados
**Síntoma**: Errores sin mensaje localizado
**Solución**: Agregar códigos de error a `authErrors.ts`

#### Loading infinito
**Síntoma**: `isLoading` nunca se vuelve false
**Solución**: Verificar que `finally` blocks se ejecuten correctamente

## Mejoras Futuras

1. **Retry automático** para errores de red
2. **Cache de credenciales** para reconexión rápida
3. **Validación offline** de tokens
4. **Métricas de autenticación** para analytics
5. **Hooks especializados** para casos de uso específicos