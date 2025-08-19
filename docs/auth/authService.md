# Servicio authService

## Descripción

El `authService` es la capa de abstracción que maneja todas las operaciones directas con Firebase Authentication. Proporciona una interfaz limpia y consistente para las operaciones de autenticación, ocultando la complejidad de Firebase y añadiendo lógica de negocio específica.

## Ubicación

```
src/features/auth/services/authService.ts
```

## Arquitectura

### Patrón Singleton
El servicio se implementa como una clase singleton para garantizar una única instancia:

```typescript
class AuthService {
  // Métodos de la clase
}

export const authService = new AuthService();
```

### Dependencias
- **Firebase Auth**: SDK de autenticación de Firebase
- **Firestore**: Para gestión de documentos de usuario
- **userService**: Para operaciones de usuario en Firestore
- **handleAuthError**: Para manejo centralizado de errores

## Métodos Principales

### `signIn(credentials: AuthCredentials)`
Inicia sesión con email y contraseña.

**Parámetros:**
```typescript
interface AuthCredentials {
  email: string;
  password: string;
}
```

**Retorna:**
```typescript
Promise<UserCredential>
```

**Implementación:**
```typescript
async signIn({ email, password }: AuthCredentials): Promise<UserCredential> {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    throw this.handleAuthError(error);
  }
}
```

**Características:**
- Validación automática de credenciales por Firebase
- Manejo de errores centralizado
- Retorno directo de UserCredential para flexibilidad

### `signInWithGoogle()`
Inicia sesión con Google OAuth.

**Retorna:**
```typescript
interface GoogleAuthResult {
  userCredential: UserCredential;
  isNewUser: boolean;
}
```

**Flujo detallado:**
1. **Configuración del provider**:
   ```typescript
   const provider = new GoogleAuthProvider();
   ```

2. **Autenticación con popup**:
   ```typescript
   const userCredential = await signInWithPopup(auth, provider);
   ```

3. **Detección de usuario nuevo**:
   ```typescript
   const additionalInfo = getAdditionalUserInfo(userCredential);
   let isNewUser = additionalInfo?.isNewUser || false;
   ```

4. **Verificación en Firestore** (prevención de duplicados):
   ```typescript
   const existingUser = await userService.getUserData(userCredential.user.uid);
   if (existingUser) {
     isNewUser = false;
   }
   ```

5. **Creación de documento de usuario** (solo para nuevos):
   ```typescript
   if (isNewUser && !existingUser) {
     await userService.createUserDocument(uid, userData);
   }
   ```

**Prevención de duplicados:**
El servicio implementa una verificación doble para evitar usuarios duplicados:
- Primera verificación: `getAdditionalUserInfo().isNewUser`
- Segunda verificación: Consulta directa a Firestore
- Creación condicional: Solo si ambas verificaciones confirman usuario nuevo

### `signUp(userData: CreateUserData)`
Registra un nuevo usuario con email y contraseña.

**Parámetros:**
```typescript
interface CreateUserData {
  email: string;
  password: string;
  userData: {
    displayName?: string;
    preferences?: UserPreferences;
  };
}
```

**Retorna:**
```typescript
Promise<string> // UID del usuario creado
```

**Flujo:**
1. **Creación en Firebase Auth**:
   ```typescript
   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
   ```

2. **Construcción del documento de usuario**:
   ```typescript
   const user: User = {
     id: uid,
     email,
     displayName: userData.displayName || email.split('@')[0],
     role: 'owner',
     storeIds: [],
     createdAt: Timestamp.now(),
     updatedAt: Timestamp.now()
   };
   ```

3. **Creación en Firestore**:
   ```typescript
   await userService.createUserDocument(uid, user);
   ```

### `signOut()`
Cierra la sesión del usuario.

**Implementación:**
```typescript
async signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw this.handleAuthError(error);
  }
}
```

### `resetPassword(email: string)`
Envía email de recuperación de contraseña.

**Implementación:**
```typescript
async resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw this.handleAuthError(error);
  }
}
```

## Manejo de Errores

### Método Privado `handleAuthError`
```typescript
private handleAuthError(error: any): Error {
  const errorInfo = handleAuthError(error, false); // No mostrar toast aquí
  const enhancedError = new Error(errorInfo.message);
  // Preservar el código de error original
  (enhancedError as any).code = error?.code || 'unknown';
  (enhancedError as any).field = errorInfo.field;
  return enhancedError;
}
```

**Características:**
- **No muestra toasts**: Los toasts se manejan en capas superiores
- **Preserva códigos**: Mantiene códigos de error originales de Firebase
- **Enriquece errores**: Añade información de campo afectado
- **Normaliza mensajes**: Convierte errores de Firebase a mensajes localizados

### Estrategia de Propagación
1. **Captura**: Todos los métodos capturan errores de Firebase
2. **Procesamiento**: Uso del método privado `handleAuthError`
3. **Enriquecimiento**: Añadir información adicional (campo, código)
4. **Propagación**: Re-throw para manejo en capas superiores
5. **Preservación**: Mantener información original para debugging

## Integración con Firebase

### Configuración
```typescript
import { auth } from '@/lib/firebase/client';
```

### Métodos de Firebase Utilizados
- `signInWithEmailAndPassword`: Autenticación con email/password
- `signInWithPopup`: Autenticación con Google OAuth
- `createUserWithEmailAndPassword`: Registro de nuevos usuarios
- `signOut`: Cierre de sesión
- `sendPasswordResetEmail`: Recuperación de contraseña
- `getAdditionalUserInfo`: Información adicional del usuario

### Providers Configurados
- **GoogleAuthProvider**: Para autenticación con Google

## Integración con Firestore

### Operaciones de Usuario
El servicio coordina operaciones entre Firebase Auth y Firestore:

```typescript
// 1. Crear en Firebase Auth
const userCredential = await createUserWithEmailAndPassword(auth, email, password);

// 2. Crear documento en Firestore
await userService.createUserDocument(uid, userData);
```

### Estructura de Documentos
```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'owner';
  storeIds: string[];
  preferences?: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Tipos TypeScript

### Interfaces Principales
```typescript
// Credenciales de autenticación
interface AuthCredentials {
  email: string;
  password: string;
}

// Datos para crear usuario
interface CreateUserData {
  email: string;
  password: string;
  userData: {
    displayName?: string;
    preferences?: UserPreferences;
  };
}

// Resultado de autenticación con Google
interface GoogleAuthResult {
  userCredential: UserCredential;
  isNewUser: boolean;
}
```

## Patrones de Uso

### En Hooks
```typescript
const useAuth = () => {
  const signIn = async (credentials) => {
    try {
      const userCredential = await authService.signIn(credentials);
      // Lógica adicional (cargar datos, redireccionar, etc.)
    } catch (error) {
      // Manejo de errores específico
    }
  };
};
```

### En Componentes (No Recomendado)
```typescript
// ❌ No usar directamente en componentes
const LoginForm = () => {
  const handleSubmit = async (data) => {
    await authService.signIn(data); // Evitar uso directo
  };
};

// ✅ Usar a través de hooks
const LoginForm = () => {
  const { signIn } = useAuth();
  const handleSubmit = async (data) => {
    await signIn(data); // Usar hook
  };
};
```

## Seguridad

### Validaciones
- **Firebase nativo**: Validación automática de credenciales
- **Sanitización**: Limpieza de datos antes de almacenar en Firestore
- **Verificación de duplicados**: Prevención de usuarios duplicados

### Mejores Prácticas Implementadas
1. **No almacenar contraseñas**: Solo Firebase Auth maneja contraseñas
2. **Tokens seguros**: Firebase maneja tokens automáticamente
3. **Validación server-side**: Firestore Security Rules
4. **Logging seguro**: No loggear información sensible

## Testing

### Estrategias de Testing

#### Unit Tests
```typescript
describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      const mockCredential = { user: { uid: 'test-uid' } };
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockCredential);

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password'
      });

      expect(result).toBe(mockCredential);
    });

    it('should handle authentication errors', async () => {
      const mockError = { code: 'auth/invalid-credential' };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      await expect(authService.signIn({
        email: 'test@example.com',
        password: 'wrong-password'
      })).rejects.toThrow();
    });
  });
});
```

#### Integration Tests
```typescript
describe('AuthService Integration', () => {
  it('should create user in both Auth and Firestore', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      userData: { displayName: 'Test User' }
    };

    const uid = await authService.signUp(userData);
    
    // Verificar creación en Auth
    expect(uid).toBeDefined();
    
    // Verificar creación en Firestore
    const userDoc = await userService.getUserData(uid);
    expect(userDoc).toBeDefined();
    expect(userDoc.email).toBe(userData.email);
  });
});
```

### Mocks Recomendados
```typescript
// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  getAdditionalUserInfo: jest.fn(),
  GoogleAuthProvider: jest.fn()
}));

// Mock userService
jest.mock('@/features/user/services/userService', () => ({
  userService: {
    getUserData: jest.fn(),
    createUserDocument: jest.fn()
  }
}));
```

## Monitoreo y Debugging

### Logging
```typescript
console.error('Auth Error:', {
  code: errorCode,
  message: errorInfo.message,
  originalError: error
});
```

### Métricas Recomendadas
- **Tasa de éxito de login**
- **Tiempo de respuesta de autenticación**
- **Errores más comunes**
- **Uso de métodos de autenticación**

## Troubleshooting

### Problemas Comunes

#### Error: "Firebase API key not valid"
**Causa**: Configuración incorrecta de Firebase
**Solución**: Verificar variables de entorno y configuración

#### Usuarios duplicados en Firestore
**Causa**: Fallo en verificación de duplicados
**Solución**: Verificar lógica de `signInWithGoogle`

#### Errores de CORS en desarrollo
**Causa**: Configuración de dominio en Firebase Console
**Solución**: Añadir localhost a dominios autorizados

#### Popup bloqueado en Google Auth
**Causa**: Bloqueador de popups del navegador
**Solución**: Manejar error gracefully y mostrar instrucciones

## Mejoras Futuras

1. **Retry automático** para errores de red
2. **Rate limiting** para prevenir ataques
3. **Métricas detalladas** de uso
4. **Cache de resultados** para operaciones frecuentes
5. **Validación adicional** de datos de entrada
6. **Soporte para más providers** (Facebook, Apple, etc.)
7. **Autenticación multifactor** (2FA)
8. **Auditoría de sesiones** para seguridad

## Referencias

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Auth Error Codes](https://firebase.google.com/docs/auth/admin/errors)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)