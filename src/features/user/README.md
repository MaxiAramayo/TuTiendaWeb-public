# User Module

Este módulo maneja todo lo relacionado con los datos del usuario y la gestión de tiendas.

## Responsabilidades

- Gestión de datos de usuario
- Gestión de tiendas del usuario
- Validación de disponibilidad de nombres de sitio
- Estado global del usuario
- Utilidades de validación y slug
- Hooks especializados para operaciones de usuario

## Estructura

```
user/
├── api/
│   └── userStore.ts          # Store de Zustand para estado del usuario
├── services/
│   └── userService.ts        # Servicios para operaciones de usuario
├── hooks/
│   ├── useUserOperations.ts  # Hook para operaciones de usuario
│   ├── useSlugValidation.ts  # Hook para validación de slugs
│   └── useStoreManagement.ts # Hook para gestión de tiendas
├── components/
│   └── UserProfile.tsx       # Componente de perfil de usuario
├── utils/
│   ├── slugUtils.ts          # Utilidades para manejo de slugs
│   └── validationUtils.ts    # Utilidades de validación
├── types/
│   └── user.types.ts         # Tipos TypeScript
└── README.md
```

## Tipos Principales

### `User`
- `id`: ID único del usuario
- `email`: Email del usuario
- `displayName`: Nombre para mostrar
- `role`: Rol del usuario ('owner')
- `storeIds`: Array de IDs de tiendas asociadas
- `preferences`: Preferencias del usuario (opcional)
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de última actualización

### `Store`
- Definido en `@/features/dashboard/modules/profile/store.type`
- Contiene toda la información de la tienda

### `UserState`
- `user`: Usuario actual (User | null)
- `stores`: Array de tiendas del usuario
- `isLoading`: Estado de carga
- `error`: Mensaje de error (si existe)

## Hooks Especializados

### `useUserOperations`
Hook centralizado para operaciones de usuario:
- `updateUserData`: Actualizar datos del usuario
- `loadUserData`: Cargar datos completos del usuario
- `checkStoreNameAvailability`: Verificar disponibilidad de nombres
- Estados de carga y error integrados

### `useSlugValidation`
Hook para validación de slugs con debouncing:
- `slug`: Slug actual
- `isAvailable`: Disponibilidad del slug
- `isChecking`: Estado de verificación
- `suggestions`: Sugerencias de slugs alternativos
- `validateSlug`: Función para validar slug
- `generateSlug`: Función para generar slug

### `useStoreManagement`
Hook para gestión completa de tiendas:
- `createStoreWithValidation`: Crear tienda con validación completa
- `validateStoreData`: Validar datos de tienda
- `normalizeStoreData`: Normalizar datos de entrada
- Estados de carga y error específicos

## Métodos del userService

- `getUserData(uid)`: Obtener datos del usuario
- `updateUser(uid, data)`: Actualizar datos del usuario
- `getUserStores(uid)`: Obtener tiendas del usuario
- `createStore(storeData)`: Crear nueva tienda
- `checkSiteNameAvailability(siteName)`: Verificar disponibilidad de nombre
- `createUserDocument(uid, userData)`: Crear documento de usuario en Firestore

## Utilidades

### `slugUtils`
- `generateSlug`: Generar slug desde texto
- `validateSlug`: Validar formato de slug
- `normalizeSlug`: Normalizar slug existente
- `generateSlugSuggestions`: Generar sugerencias alternativas

### `validationUtils`
- Schemas de Zod para validación:
  - `whatsappSchema`: Validación de números de WhatsApp
  - `storeNameSchema`: Validación de nombres de tienda
  - `storeDescriptionSchema`: Validación de descripciones
  - `storeTypeSchema`: Validación de tipos de tienda
- Funciones de utilidad:
  - `validateWhatsApp`: Validar y normalizar WhatsApp
  - `validateStoreName`: Validar nombre de tienda
  - `normalizeWhatsApp`: Normalizar formato de WhatsApp

## Componentes

### `UserProfile`
Componente completo para mostrar y editar perfil de usuario:
- Modo vista y edición
- Validación con Zod
- Integración con `useUserOperations`
- Manejo de estados de carga y error
- Interfaz responsive

## Store (Zustand)

### useUserStore
Maneja el estado global del usuario y sus tiendas:

```tsx
import { useUserStore } from '@/features/user/api/userStore';

const { user, stores, getUser, createStore } = useUserStore();
```

## Mejoras Implementadas

### ✅ Eliminación de Duplicación de Código
- Centralización de lógica de slugs en `slugUtils`
- Hooks reutilizables para operaciones comunes
- Validaciones centralizadas en `validationUtils`

### ✅ Consistencia de Tipos
- Estandarización a `User | null` en todos los stores
- Tipos consistentes en toda la aplicación

### ✅ Separación de Responsabilidades
- Hooks especializados por funcionalidad
- Utilidades reutilizables
- Componentes enfocados en UI

### ✅ Manejo de Errores Centralizado
- Integración con sistema de errores de `auth`
- Estados de error consistentes
- Logging estructurado

### ✅ Optimización de Performance
- Debouncing en validación de slugs
- Estados de carga optimizados
- Reducción de llamadas redundantes

## Separación de Responsabilidades

Este módulo se enfoca únicamente en:
- Datos del usuario y operaciones relacionadas
- Gestión completa de tiendas
- Validaciones de negocio
- Estado global del usuario
- Utilidades reutilizables

La autenticación se maneja en el módulo `auth`, lo que mejora:
- **Cohesión**: Cada módulo tiene una responsabilidad clara
- **Reutilización**: Los hooks y servicios son más específicos
- **Escalabilidad**: Fácil agregar nuevas funcionalidades sin afectar autenticación
- **Mantenibilidad**: Código más organizado y fácil de mantener