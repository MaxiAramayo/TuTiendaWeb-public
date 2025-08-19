# Auth Feature

Este módulo maneja toda la funcionalidad de autenticación de la aplicación.

## Estructura

```
auth/
├── api/
│   └── authStore.ts          # Zustand store para estado de autenticación
├── components/
│   ├── LoginForm.tsx         # Formulario de inicio de sesión
│   ├── RegisterForm.tsx      # Formulario de registro
│   ├── GoogleButton.tsx      # Botón de autenticación con Google
│   └── GoogleProfileSetup.tsx # Configuración de perfil para usuarios de Google
├── hooks/
│   ├── useAuth.ts           # Hook principal de autenticación (refactorizado)
│   └── useAuthHydrated.ts   # Hook para hidratación del estado
├── services/
│   └── authService.ts       # Servicios de Firebase Auth (refactorizado)
├── utils/
│   └── errorHandling.ts     # Utilidades de manejo de errores
├── constants/
│   └── authErrors.ts        # Constantes y mensajes de error
├── validation/
│   ├── schemas/
│   │   ├── loginSchema.ts
│   │   ├── registerSchema.ts
│   │   ├── resetPasswordSchema.ts
│   │   └── googleProfileSchema.ts
│   └── index.ts
├── auth.types.ts           # Tipos de autenticación
└── README.md
```

## Uso

### Componentes

```tsx
import { LoginForm } from '@/features/auth/components/LoginForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
```

### Hooks

```tsx
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuthHydrated } from '@/features/auth/hooks/useAuthHydrated';

function MyComponent() {
  const { signIn, signUp, signOut, isLoading } = useAuth();
  const { user, isAuthenticated, isHydrated } = useAuthHydrated();
}
```

### Stores

```tsx
import { useAuthStore } from '@/features/auth/api/authStore';
import { useUserStore } from '@/features/user/api/userStore';
```

## Utilidades de Manejo de Errores

### `errorHandling.ts`
Sistema centralizado para manejo de errores de autenticación:

```typescript
// Manejar errores con toast automático
const errorInfo = handleAuthError(error);

// Manejar errores sin toast
const errorInfo = handleAuthError(error, false);

// Verificar si un error es recuperable
const canRetry = isRecoverableError(errorCode);

// Obtener sugerencias para el usuario
const suggestions = getErrorSuggestions(errorCode);
```

### `authErrors.ts`
Constantes centralizadas para todos los mensajes de error:
- Mensajes localizados en español
- Categorización por tipo de error
- Mapeo de códigos de Firebase a tipos
- Sugerencias automáticas de resolución

## Configuración de Firebase

Asegúrate de tener las siguientes variables de entorno configuradas:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Rutas

- `/sign-in` - Inicio de sesión
- `/sign-up` - Registro
- `/reset-password` - Recuperación de contraseña
- `/complete-profile` - Completar perfil (Google)

## Mejoras Implementadas

### ✅ Eliminación de Barrels
- Removidos exports masivos que causaban problemas de dependencias circulares
- Imports directos para mejor tree-shaking

### ✅ Validación de Variables de Entorno
- Verificación automática de configuración de Firebase
- Mensajes de error claros para configuración faltante

### ✅ Manejo de Errores Centralizado
- Sistema unificado de manejo de errores en `utils/errorHandling.ts`
- Constantes centralizadas en `constants/authErrors.ts`
- Mensajes de error localizados y categorizados
- Logging estructurado para debugging
- Sugerencias automáticas para resolución de errores

### ✅ Refactorización del AuthService
- Eliminación de delegaciones a userService
- Responsabilidad única: solo autenticación
- Integración con sistema de errores centralizado
- Código más limpio y mantenible

### ✅ Refactorización del Hook useAuth
- Eliminación de operaciones de usuario
- Integración con hooks especializados del módulo user
- Manejo de errores consistente
- Reducción de duplicación de código

### ✅ Consistencia de Tipos
- Estandarización a `User | null` en lugar de `User | undefined`
- Tipos consistentes entre authStore y userStore
- Mejor integración entre módulos

### ✅ Eliminación de Código Duplicado
- Centralización de lógica de autenticación en authService
- Reutilización de componentes y validaciones
- Hooks especializados para operaciones específicas

### ✅ Documentación
- README completo con ejemplos de uso
- Comentarios JSDoc en funciones principales
- Guías de troubleshooting
- Documentación de nuevas utilidades

## Integración con Módulo User

El módulo auth ahora se integra perfectamente con el módulo user:

```typescript
// En useAuth - delegación a hooks especializados
const { loadUserData } = useUserOperations();
const { createStoreWithValidation } = useStoreManagement();

// Operaciones de usuario manejadas por módulo user
await loadUserData(userId);
await createStoreWithValidation(storeData);
```

## Separación de Responsabilidades

Este módulo se enfoca únicamente en:
- Autenticación con Firebase Auth
- Gestión de sesiones
- Validación de credenciales
- Estados de autenticación
- Manejo centralizado de errores de auth

Las operaciones de usuario (perfil, tiendas) se manejan en el módulo `user`, lo que mejora:
- **Cohesión**: Cada módulo tiene una responsabilidad clara
- **Reutilización**: La autenticación es independiente de los datos de usuario
- **Escalabilidad**: Fácil agregar nuevos métodos de autenticación
- **Mantenibilidad**: Código más organizado y fácil de debuggear

## Solución al Error de Google

Si ves el error `auth/api-key-not-valid`, verifica:

1. Que todas las variables de entorno estén configuradas
2. Que la API key sea válida en la consola de Firebase
3. Que el dominio esté autorizado en Firebase Auth
4. Que el método de Google esté habilitado en Firebase Auth