# Plan de Refactorización: Módulo Auth

## 1. INVENTARIO DEL MÓDULO

### Estructura Actual:
```text
features/auth/
├── api/
│   └── authStore.ts
├── components/
│   ├── AuthLayout.tsx
│   ├── GoogleButton.tsx
│   ├── GoogleProfileSetup.tsx
│   ├── LoginForm.tsx
│   ├── MultiStepRegister.tsx
│   ├── RegisterForm.tsx
│   ├── ResetPasswordForm.tsx
│   ├── StoreSetupStep.tsx
│   └── UserRegistrationStep.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useAuthHydrated.ts
├── services/
│   └── authService.ts
├── validation/
│   ├── googleProfileSchema.ts
│   ├── index.ts
│   ├── loginSchema.ts
│   ├── registerSchema.ts
│   └── resetPasswordSchema.ts
└── auth.types.ts
```

### Clasificación por Tipo:

| Archivo | Tipo Actual | Función | Estado |
|---------|-------------|---------|--------|
| `api/authStore.ts` | Store (Zustand) | Manejo de estado de sesión y usuario | 🔴 Migrar (Eliminar) |
| `services/authService.ts` | Service (Client) | Wrapper de Firebase Auth Client SDK | 🔴 Migrar (Server Actions) |
| `hooks/useAuth.ts` | Hook | Lógica de negocio, redirección, toasts | 🔴 Migrar (Server Actions) |
| `hooks/useAuthHydrated.ts` | Hook | Utilidad de hidratación | ⚠️ Revisar |
| `components/*.tsx` | Components | Interfaz de usuario (Formularios) | ⚠️ Refactorizar (useActionState) |
| `validation/*.ts` | Schemas | Validaciones Zod | ✅ OK |
| `auth.types.ts` | Types | Definiciones de tipos | ✅ OK |

### Estadísticas:
- **Total archivos:** 19
- **API Routes a migrar:** 0 (Usa `lib/auth/actions.ts` parcialmente)
- **Stores con datos de negocio:** 1 (`authStore.ts`)
- **Componentes con fetch en useEffect:** 0 (Lógica en `useAuth`)
- **Archivos barrel (index.ts):** 1 (`validation/index.ts`)
- **Hooks personalizados con lógica de negocio:** 1 (`useAuth.ts`)

---

## 2. PROBLEMAS CRÍTICOS DETECTADOS

### 🔴 Prioridad Alta (Bloquean arquitectura)

#### 2.1. Firebase Client SDK en Lógica de Negocio
- **Archivo:** `services/authService.ts`
- **Problema:** Usa `signInWithEmailAndPassword`, `createUserWithEmailAndPassword` directamente en el cliente.
- **Impacto:** Expone lógica de base de datos y reglas de seguridad en el cliente.
- **Solución:** Mover autenticación a Server Actions usando `firebase-admin` para gestión de sesión y verificación.

#### 2.2. Store con Datos de Negocio
- **Archivo:** `api/authStore.ts`
- **Problema:** Persiste el objeto `User` completo en `localStorage`.
- **Impacto:** Problemas de sincronización, seguridad (datos sensibles en local storage), complejidad innecesaria.
- **Solución:** Usar cookies de sesión (`httpOnly`) y obtener datos del usuario en Server Components (`layout.tsx` o `page.tsx`).

#### 2.3. Lógica de Negocio en Hooks (Client Side)
- **Archivo:** `hooks/useAuth.ts`
- **Problema:** Orquesta el flujo de login, creación de usuario en Firestore, creación de tienda y redirección, todo en el cliente.
- **Impacto:** Lento (múltiples round-trips), difícil de mantener, propenso a errores de red intermedios.
- **Solución:** Encapsular todo el flujo transaccional en una única Server Action.

### ⚠️ Prioridad Media (Deuda técnica)

#### 2.4. Barrels Encontrados
- **Archivo:** `validation/index.ts`
- **Problema:** Re-exporta schemas.
- **Solución:** Eliminar y usar imports directos para mejorar tree-shaking.

#### 2.5. Dependencia de `userService` (Client SDK)
- **Archivo:** `hooks/useAuth.ts` importa `userService`
- **Problema:** `userService` usa `doc`, `setDoc` del Client SDK.
- **Solución:** Migrar operaciones de base de datos de usuario a `features/user/services/server/user.service.ts` (Admin SDK).

### 📋 Prioridad Baja (Mejoras)

#### 2.6. Formularios con `useForm` pero envío manual
- **Archivo:** `components/LoginForm.tsx`, `RegisterForm.tsx`
- **Problema:** Usan `handleSubmit` que llama a `signIn` del hook.
- **Mejora:** Usar `action` prop en el form o `useTransition` llamando directamente a la Server Action.

---

## 3. ANÁLISIS DE DEPENDENCIAS

### Flujo de Datos Actual:
```text
LoginForm (Client Component)
    ↓ llama
useAuth (Hook)
    ↓ llama
authService (Client Service) -> Firebase Auth (Client SDK)
    ↓ (si éxito)
createSession (Server Action) -> Cookie
    ↓
userService (Client Service) -> Firestore (Client SDK)
    ↓
authStore (Zustand) -> Actualiza UI
```

### Dependencias Críticas:
| Archivo | Depende de | Tipo de Dependencia | Bloquea |
|---------|------------|---------------------|---------|
| `useAuth.ts` | `authService.ts` | Lógica de Auth | Sí |
| `useAuth.ts` | `userService.ts` | Base de datos | Sí |
| `useAuth.ts` | `authStore.ts` | Estado global | Sí |
| `LoginForm.tsx` | `useAuth.ts` | Hook | Sí |

### Archivos que Bloquean Migración:
- `userService.ts`: Necesita versión de servidor antes de migrar el flujo de registro completo.
- `authService.ts`: Debe ser reemplazado por Server Actions.

---

## 4. PLAN DE MIGRACIÓN PASO A PASO

### Fase 1: Preparación de Servicios (Server Side)

1.  **Crear Servicio de Usuario (Admin SDK)**
    -   **Crear:** `src/features/user/services/user.server.service.ts`
    -   **Implementar:** Métodos `createUser`, `getUser`, `updateUser` usando `firebase-admin`.

2.  **Crear Servicio de Auth (Admin SDK)**
    -   **Crear:** `src/features/auth/services/auth.server.service.ts`
    -   **Implementar:** Verificación de tokens, gestión de cookies de sesión (expandir `lib/auth/actions.ts`).

### Fase 2: Implementación de Server Actions

3.  **Crear Actions de Autenticación**
    -   **Crear:** `src/features/auth/actions/auth.actions.ts`
    -   **Implementar:**
        -   `loginAction(prevState, formData)`: Valida credenciales, crea cookie.
        -   `registerAction(prevState, formData)`: Crea usuario en Auth y Firestore (transacción), crea cookie.
        -   `logoutAction()`: Elimina cookie.
        -   `googleLoginAction(token)`: Verifica token de Google, crea/actualiza usuario, crea cookie.

### Fase 3: Refactorización de Componentes

4.  **Refactorizar LoginForm**
    -   **Modificar:** `src/features/auth/components/LoginForm.tsx`
    -   **Acción:** Eliminar `useAuth`. Usar `useActionState` con `loginAction`.

5.  **Refactorizar RegisterForm**
    -   **Modificar:** `src/features/auth/components/RegisterForm.tsx`
    -   **Acción:** Eliminar `useAuth`. Usar `useActionState` con `registerAction`.

6.  **Refactorizar GoogleButton**
    -   **Modificar:** `src/features/auth/components/GoogleButton.tsx`
    -   **Acción:** Manejar el popup de Google en cliente, pero enviar el token resultante a una Server Action (`googleLoginAction`) para crear la sesión.

### Fase 4: Limpieza

7.  **Eliminar Código Muerto**
    -   **Eliminar:** `src/features/auth/hooks/useAuth.ts`
    -   **Eliminar:** `src/features/auth/api/authStore.ts`
    -   **Eliminar:** `src/features/auth/services/authService.ts` (Client version)
    -   **Eliminar:** `src/features/auth/validation/index.ts` (Corregir imports antes).

---

**Recomendación de Inicio:**
Comenzar por la **Fase 1 (Servicios Server Side)**, ya que son dependencias necesarias para las Server Actions. Específicamente, crear `user.server.service.ts` es prioritario para poder manejar la creación de usuarios en el servidor.
