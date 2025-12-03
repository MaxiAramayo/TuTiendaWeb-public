# Arquitectura del Módulo Store-Settings

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Patrones de Diseño](#patrones-de-diseño)
4. [Flujo de Datos](#flujo-de-datos)
5. [Server Actions](#server-actions)
6. [Servicios](#servicios)
7. [Schemas y Validaciones](#schemas-y-validaciones)
8. [Hooks](#hooks)
9. [Tipos](#tipos)
10. [Componentes](#componentes)
11. [Utilidades](#utilidades)
12. [Migración desde Legacy](#migración-desde-legacy)
13. [Guía de Uso](#guía-de-uso)

---

## Resumen Ejecutivo

El módulo `store-settings` gestiona toda la configuración del perfil de tienda en TuTiendaWeb. Fue refactorizado siguiendo el patrón **Server-First** de Next.js 15, reemplazando:

- ❌ Zustand stores con lógica de negocio (699 líneas)
- ❌ Servicios cliente-side con Firebase SDK
- ❌ Validaciones duplicadas

Por:

- ✅ Server Actions para mutaciones
- ✅ Firebase Admin SDK para operaciones servidor
- ✅ Zod schemas centralizados
- ✅ Hooks cliente ligeros

### Beneficios Obtenidos

| Aspecto       | Antes                      | Después                    |
| ------------- | -------------------------- | -------------------------- |
| Seguridad     | Credenciales en cliente    | Firebase Admin en servidor |
| Bundle Size   | ~50KB (Zustand + lógica)   | ~5KB (hooks ligeros)       |
| Validación    | Duplicada cliente/servidor | Zod schemas únicos         |
| Autenticación | Token cliente              | Server Session (cookies)   |
| Cacheo        | Manual                     | Next.js automático         |

---

## Estructura de Carpetas

```
src/features/dashboard/modules/store-settings/
├── actions/                    # Server Actions (mutaciones)
│   └── profile.actions.ts      # Todas las acciones del perfil
│
├── components/                 # Componentes UI
│   ├── ProfileForm.tsx         # Wrapper principal del formulario
│   └── sections/               # Secciones del formulario
│       ├── AddressSection.tsx
│       ├── BasicInfoSection.tsx
│       ├── ContactInfoSection.tsx
│       ├── ProfileNavigation.tsx
│       ├── ScheduleSection.tsx
│       └── ThemeSection.tsx
│
├── forms/                      # Formularios y lógica de form
│   └── profile/
│       └── ProfileForm.tsx     # Formulario con react-hook-form
│
├── hooks/                      # Hooks cliente
│   └── useProfile.ts           # Hook principal del perfil
│
├── schemas/                    # Zod schemas (validación)
│   └── profile.schema.ts       # Schemas de validación
│
├── services/                   # Servicios
│   ├── profile-client.service.ts  # Operaciones cliente (Storage)
│   └── server/
│       └── profile.server-service.ts  # Firebase Admin SDK
│
├── types/                      # Tipos TypeScript
│   └── store.type.ts           # Tipos del módulo
│
├── ui/                         # Componentes UI específicos
│   └── ...
│
├── utils/                      # Utilidades
│   └── profile.utils.ts        # Funciones helper
│
└── README.md                   # Documentación del módulo
```

---

## Patrones de Diseño

### 1. Server-First Pattern

El patrón principal seguido es **Server-First**, donde:

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER COMPONENT                          │
│  (page.tsx - async)                                         │
│                                                             │
│  1. Autenticación via getServerSession()                    │
│  2. Fetch inicial via profileServerService.getProfile()    │
│  3. Pasa datos como props a componentes cliente            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT COMPONENT                          │
│  (ProfileForm.tsx - 'use client')                           │
│                                                             │
│  1. Recibe initialProfile como prop                         │
│  2. Usa useProfile() hook para estado local                │
│  3. Mutaciones via Server Actions                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER ACTION                             │
│  (profile.actions.ts - 'use server')                        │
│                                                             │
│  1. Re-autentica via getServerSession()                    │
│  2. Valida con Zod schemas                                 │
│  3. Muta via profileServerService                          │
│  4. Revalida rutas con revalidatePath()                    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Action Pattern (AUTH → VALIDATE → MUTATE → REVALIDATE)

Cada Server Action sigue este patrón estricto:

```typescript
export async function updateBasicInfoAction(data: BasicInfoFormData) {
  // 1. AUTH - Verificar sesión
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  // 2. VALIDATE - Validar datos con Zod
  const validation = basicInfoSchema.safeParse(data);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value;
    }
    return { success: false, errors };
  }

  try {
    // 3. MUTATE - Ejecutar operación con Firebase Admin
    await profileServerService.updateBasicInfo(
      session.storeId,
      validation.data
    );

    // 4. REVALIDATE - Invalidar cache de Next.js
    revalidatePath('/dashboard/profile');

    return { success: true, data: { updated: true } };
  } catch (error) {
    return { success: false, errors: { _form: ['Error al actualizar'] } };
  }
}
```

### 3. Response Type Pattern

Todas las acciones retornan un tipo consistente:

```typescript
type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };
```

### 4. Schema-First Validation

Los schemas Zod son la fuente de verdad para validación Y tipos:

```typescript
// Schema define validación
export const basicInfoSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  type: z.enum(['retail', 'restaurant', 'service', ...]),
});

// Tipo se infiere del schema
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
```

---

## Flujo de Datos

### Flujo de Lectura (GET)

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   page.tsx   │────▶│ getServerSession │────▶│ profileServerService│
│  (Server)    │     │                  │     │    .getProfile()    │
└──────────────┘     └──────────────────┘     └─────────────────────┘
       │                                                │
       │ initialProfile                                 │
       ▼                                                │
┌──────────────┐                                        │
│ ProfileForm  │◀───────────────────────────────────────┘
│  (Client)    │
└──────────────┘
       │
       │ useProfile(initialProfile)
       ▼
┌──────────────┐
│   Estado     │
│   Local      │
└──────────────┘
```

### Flujo de Escritura (MUTATE)

```
┌──────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  Component   │────▶│ updateBasicInfo    │────▶│ getServerSession │
│  (Client)    │     │     Action()       │     │                  │
└──────────────┘     └────────────────────┘     └──────────────────┘
                              │                          │
                              │                          │ session
                              ▼                          ▼
                     ┌────────────────────┐     ┌──────────────────┐
                     │  Zod Validation    │────▶│profileServerSvc  │
                     │  basicInfoSchema   │     │ .updateBasicInfo │
                     └────────────────────┘     └──────────────────┘
                                                         │
                                                         │
                              ┌───────────────────────────┘
                              │
                              ▼
                     ┌────────────────────┐
                     │  revalidatePath()  │
                     │ '/dashboard/profile'│
                     └────────────────────┘
```

---

## Server Actions

### Archivo: `actions/profile.actions.ts`

#### Acciones Disponibles

| Acción                        | Descripción                   | Input                      | Output                   |
| ----------------------------- | ----------------------------- | -------------------------- | ------------------------ |
| `getProfileAction`            | Obtiene perfil completo       | -                          | `StoreProfile \| null`   |
| `updateProfileAction`         | Actualiza perfil completo     | `Partial<ProfileFormData>` | `{ updated: boolean }`   |
| `updateBasicInfoAction`       | Actualiza info básica         | `BasicInfoFormData`        | `{ updated: boolean }`   |
| `updateContactInfoAction`     | Actualiza contacto            | `ContactInfoFormData`      | `{ updated: boolean }`   |
| `updateAddressAction`         | Actualiza dirección           | `AddressFormData`          | `{ updated: boolean }`   |
| `updateSocialLinksAction`     | Actualiza redes sociales      | `SocialLinksFormData`      | `{ updated: boolean }`   |
| `updateThemeAction`           | Actualiza tema visual         | `ThemeConfigFormData`      | `{ updated: boolean }`   |
| `validateSlugAction`          | Valida disponibilidad de slug | `string`                   | `{ available: boolean }` |
| `updatePaymentMethodsAction`  | Actualiza métodos de pago     | `PaymentMethod[]`          | `{ updated: boolean }`   |
| `updateDeliveryMethodsAction` | Actualiza métodos de entrega  | `DeliveryMethod[]`         | `{ updated: boolean }`   |
| `updateScheduleAction`        | Actualiza horarios            | `WeeklySchedule`           | `{ updated: boolean }`   |

#### Ejemplo de Implementación Completa

```typescript
// actions/profile.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/server-session';
import { profileServerService } from '../services/server/profile.server-service';
import { basicInfoSchema } from '../schemas/profile.schema';
import type { BasicInfoFormData } from '../schemas/profile.schema';

type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export async function updateBasicInfoAction(
  data: BasicInfoFormData
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  // 2. VALIDATE
  const validation = basicInfoSchema.safeParse(data);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value;
    }
    return { success: false, errors };
  }

  try {
    // 3. CHECK SLUG UNIQUENESS (regla de negocio)
    if (data.slug) {
      const isUnique = await profileServerService.isSlugUnique(
        data.slug,
        session.storeId
      );
      if (!isUnique) {
        return {
          success: false,
          errors: { slug: ['Este nombre ya está en uso'] },
        };
      }
    }

    // 4. MUTATE
    await profileServerService.updateBasicInfo(
      session.storeId,
      validation.data
    );

    // 5. REVALIDATE
    revalidatePath('/dashboard/profile');

    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating basic info:', error);
    return {
      success: false,
      errors: { _form: ['Error al actualizar la información'] },
    };
  }
}
```

---

## Servicios

### Servicio Servidor: `services/server/profile.server-service.ts`

Este servicio usa **Firebase Admin SDK** y solo se ejecuta en el servidor.

#### Métodos Disponibles

```typescript
class ProfileServerService {
  // Lectura
  async getProfile(storeId: string): Promise<StoreProfile | null>;
  async isSlugUnique(slug: string, currentStoreId?: string): Promise<boolean>;

  // Escritura
  async updateProfile(
    storeId: string,
    data: Partial<ProfileFormData>
  ): Promise<void>;
  async updateBasicInfo(
    storeId: string,
    data: BasicInfoFormData
  ): Promise<void>;
  async updateContactInfo(
    storeId: string,
    data: ContactInfoFormData
  ): Promise<void>;
  async updateAddress(storeId: string, data: AddressFormData): Promise<void>;
  async updateSocialLinks(
    storeId: string,
    data: SocialLinksFormData
  ): Promise<void>;
  async updateTheme(storeId: string, data: ThemeConfigFormData): Promise<void>;
  async updateSettings(
    storeId: string,
    settings: Partial<StoreSettings>
  ): Promise<void>;
  async updateSchedule(
    storeId: string,
    schedule: Record<string, any>
  ): Promise<void>;
}

export const profileServerService = new ProfileServerService();
```

#### Implementación de Ejemplo

```typescript
// services/server/profile.server-service.ts
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

class ProfileServerService {
  private readonly COLLECTION = 'stores';

  async getProfile(storeId: string): Promise<StoreProfile | null> {
    const doc = await adminDb.collection(this.COLLECTION).doc(storeId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as StoreProfile;
  }

  async updateBasicInfo(
    storeId: string,
    data: BasicInfoFormData
  ): Promise<void> {
    await adminDb
      .collection(this.COLLECTION)
      .doc(storeId)
      .update({
        'basicInfo.name': data.name,
        'basicInfo.description': data.description,
        'basicInfo.slug': data.slug,
        'basicInfo.type': data.type,
        'metadata.updatedAt': FieldValue.serverTimestamp(),
        'metadata.version': FieldValue.increment(1),
      });
  }

  async isSlugUnique(slug: string, currentStoreId?: string): Promise<boolean> {
    const query = adminDb
      .collection(this.COLLECTION)
      .where('basicInfo.slug', '==', slug)
      .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
      return true;
    }

    // Si el único resultado es la tienda actual, el slug es "único"
    if (currentStoreId && snapshot.docs[0].id === currentStoreId) {
      return true;
    }

    return false;
  }
}
```

### Servicio Cliente: `services/profile-client.service.ts`

Para operaciones que **requieren el client SDK** (Storage para imágenes).

```typescript
// services/profile-client.service.ts
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase/client';

class ProfileClientService {
  async uploadImage(
    storeId: string,
    file: File,
    type: 'logo' | 'banner' | 'profile'
  ): Promise<string> {
    if (!storage) {
      throw new Error('Storage no inicializado');
    }

    // Validaciones
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen debe ser menor a 5MB');
    }
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${type}-${Date.now()}.${extension}`;
    const path = `stores/${storeId}/${type}/${fileName}`;

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    return await getDownloadURL(snapshot.ref);
  }

  async deleteImage(
    storeId: string,
    imageUrl: string,
    type: 'logo' | 'banner'
  ): Promise<void> {
    if (!storage) {
      throw new Error('Storage no inicializado');
    }

    try {
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      if (!pathMatch) return;

      const path = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn('Error al eliminar imagen:', error);
    }
  }
}

export const profileClientService = new ProfileClientService();
```

---

## Schemas y Validaciones

### Archivo: `schemas/profile.schema.ts`

Los schemas Zod son la **fuente única de verdad** para validación.

#### Schemas Principales

```typescript
import { z } from 'zod';

// Tipos de tienda permitidos
const storeTypeEnum = z.enum([
  'retail',
  'restaurant',
  'service',
  'digital',
  'fashion',
  'beauty',
  'health',
  'sports',
  'electronics',
  'home',
  'automotive',
  'other',
]);

// Información básica
export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .default(''),
  slug: z
    .string()
    .min(3, 'El slug debe tener al menos 3 caracteres')
    .max(50, 'El slug no puede exceder 50 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  type: storeTypeEnum,
});

// Información de contacto
export const contactInfoSchema = z.object({
  whatsapp: z
    .string()
    .min(10, 'El WhatsApp debe tener al menos 10 dígitos')
    .regex(/^\+?[\d\s-]+$/, 'Formato de teléfono inválido'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

// Dirección
export const addressSchema = z.object({
  street: z.string().optional().default(''),
  city: z.string().optional().default(''),
  province: z.string().optional().default(''),
  country: z.string().optional().default('Argentina'),
  zipCode: z.string().optional().default(''),
});

// Redes sociales
export const socialLinksSchema = z.object({
  instagram: z.string().optional().default(''),
  facebook: z.string().optional().default(''),
  twitter: z.string().optional().default(''),
  tiktok: z.string().optional().default(''),
});

// Configuración de tema
export const themeConfigSchema = z.object({
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido')
    .default('#6366f1'),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#8b5cf6'),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#8B5CF6'),
  fontFamily: z.string().default('Inter, sans-serif'),
  style: z.enum(['modern', 'classic', 'minimal']).default('modern'),
  buttonStyle: z.enum(['rounded', 'square', 'pill']).default('rounded'),
});

// Schema de validación de slug
export const slugValidationSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});

// Schema completo del formulario
export const profileFormSchema = z.object({
  // Basic Info
  name: basicInfoSchema.shape.name,
  description: basicInfoSchema.shape.description,
  siteName: basicInfoSchema.shape.slug, // Alias para compatibilidad UI
  storeType: basicInfoSchema.shape.type,

  // Contact
  whatsapp: contactInfoSchema.shape.whatsapp,
  instagram: z.string().optional().default(''),

  // Address
  street: addressSchema.shape.street,
  city: addressSchema.shape.city,
  province: addressSchema.shape.province,
  country: addressSchema.shape.country,
  zipCode: addressSchema.shape.zipCode,

  // Theme
  theme: themeConfigSchema.optional(),

  // Schedule
  schedule: z
    .record(
      z.object({
        closed: z.boolean().optional(),
        periods: z
          .array(
            z.object({
              open: z.string(),
              close: z.string(),
              nextDay: z.boolean().optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),

  // Settings
  currency: z.string().default('ARS'),
  language: z.string().default('es'),
});

// Tipos inferidos de los schemas
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type ContactInfoFormData = z.infer<typeof contactInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type SocialLinksFormData = z.infer<typeof socialLinksSchema>;
export type ThemeConfigFormData = z.infer<typeof themeConfigSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
```

---

## Hooks

### Hook Principal: `hooks/useProfile.ts`

Hook cliente que gestiona el estado del perfil y expone las acciones.

```typescript
// hooks/useProfile.ts
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuthClient } from '@/features/auth/hooks/use-auth-client';
import { profileFormSchema } from '../schemas/profile.schema';
import type { ProfileFormData } from '../schemas/profile.schema';
import type {
  StoreProfile,
  FormState,
  ProfileSection,
} from '../types/store.type';
import {
  getProfileAction,
  updateProfileAction,
  validateSlugAction,
} from '../actions/profile.actions';
import {
  calculateProfileCompleteness,
  profileToFormData,
} from '../utils/profile.utils';

interface UseProfileOptions {
  realTimeValidation?: boolean;
  initialProfile?: StoreProfile | null;
}

interface UseProfileState {
  profile: StoreProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  stats: {
    missingFields: string[];
    lastUpdated: Date | null;
  };
  formState: FormState;
}

export const useProfile = (options: UseProfileOptions = {}) => {
  const { realTimeValidation = false, initialProfile = null } = options;
  const { user } = useAuthClient();

  // Estado local
  const [state, setState] = useState<UseProfileState>({
    profile: initialProfile,
    isLoading: !initialProfile,
    isSaving: false,
    error: null,
    stats: { missingFields: [], lastUpdated: null },
    formState: {
      isEditing: false,
      isSaving: false,
      isDirty: false,
      errors: {},
      activeSection: 'basic',
    },
  });

  // Configuración de react-hook-form con Zod
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    mode: realTimeValidation ? 'onChange' : 'onSubmit',
    defaultValues: {
      name: '',
      description: '',
      siteName: '',
      storeType: 'other',
      whatsapp: '',
      country: 'Argentina',
      currency: 'ARS',
      language: 'es',
    },
  });

  // Cargar perfil usando Server Action
  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await getProfileAction();

      if (!result.success) {
        const errorMsg = result.errors._form?.[0] || 'Error al cargar';
        setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
        return;
      }

      const profile = result.data as StoreProfile | null;
      setState(prev => ({ ...prev, profile, isLoading: false }));

      if (profile) {
        const formData = profileToFormData(profile);
        form.reset(formData);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar el perfil',
      }));
    }
  }, [user?.uid, form]);

  // Guardar perfil usando Server Action
  const saveProfile = useCallback(
    async (data: Partial<ProfileFormData>): Promise<boolean> => {
      setState(prev => ({
        ...prev,
        isSaving: true,
        formState: { ...prev.formState, isSaving: true },
      }));

      try {
        const result = await updateProfileAction(data);

        if (!result.success) {
          // Mapear errores a los campos del formulario
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (field !== '_form') {
              form.setError(field as keyof ProfileFormData, {
                message: messages[0],
              });
            }
          });

          setState(prev => ({
            ...prev,
            isSaving: false,
            formState: { ...prev.formState, isSaving: false },
          }));
          return false;
        }

        toast.success('Perfil actualizado');
        await loadProfile(); // Recargar datos actualizados

        setState(prev => ({
          ...prev,
          isSaving: false,
          formState: { ...prev.formState, isSaving: false, isDirty: false },
        }));

        return true;
      } catch (error) {
        toast.error('Error al guardar');
        setState(prev => ({
          ...prev,
          isSaving: false,
          formState: { ...prev.formState, isSaving: false },
        }));
        return false;
      }
    },
    [form, loadProfile]
  );

  // Validar slug usando Server Action
  const validateSlug = useCallback(async (slug: string): Promise<boolean> => {
    try {
      const result = await validateSlugAction(slug);
      return result.success && result.data.available;
    } catch {
      return false;
    }
  }, []);

  // Actualizar campo específico
  const updateField = useCallback(
    (field: keyof ProfileFormData | string, value: any) => {
      form.setValue(field as keyof ProfileFormData, value, {
        shouldDirty: true,
        shouldValidate: realTimeValidation,
      });
      setState(prev => ({
        ...prev,
        formState: { ...prev.formState, isDirty: true },
      }));
    },
    [form, realTimeValidation]
  );

  // Cargar perfil inicial
  useEffect(() => {
    if (user?.uid && !initialProfile) {
      loadProfile();
    } else if (initialProfile) {
      const formData = profileToFormData(initialProfile);
      form.reset(formData);
    }
  }, [user?.uid, initialProfile, form, loadProfile]);

  // Valores computados
  const computedValues = useMemo(() => {
    const completeness = state.profile
      ? calculateProfileCompleteness(state.profile)
      : 0;
    return {
      isComplete: completeness >= 90,
      hasChanges: form.formState.isDirty,
      canSave:
        form.formState.isDirty &&
        Object.keys(form.formState.errors).length === 0,
    };
  }, [state.profile, form.formState.isDirty, form.formState.errors]);

  return {
    // Estado
    ...state,
    ...computedValues,

    // Formulario
    form,
    formData: form.watch(),

    // Acciones
    loadProfile,
    saveProfile,
    updateField,
    validateSlug,
    refresh: loadProfile,
  };
};
```

---

## Tipos

### Archivo: `types/store.type.ts`

```typescript
// types/store.type.ts

/**
 * Tipo de tienda
 */
export type StoreType =
  | 'restaurant'
  | 'retail'
  | 'services'
  | 'service' // Alias normalizado
  | 'digital'
  | 'fashion'
  | 'beauty'
  | 'health'
  | 'sports'
  | 'electronics'
  | 'home'
  | 'automotive'
  | 'other';

/**
 * Secciones del perfil
 */
export type ProfileSection =
  | 'basic'
  | 'contact'
  | 'address'
  | 'social'
  | 'theme'
  | 'schedule'
  | 'payment'
  | 'delivery';

/**
 * Período de tiempo para horarios
 */
export interface TimePeriod {
  open: string;
  close: string;
  nextDay?: boolean;
}

/**
 * Horario diario
 */
export interface DailySchedule {
  closed: boolean;
  periods: TimePeriod[];
}

/**
 * Horario semanal
 */
export interface WeeklySchedule {
  monday: DailySchedule;
  tuesday: DailySchedule;
  wednesday: DailySchedule;
  thursday: DailySchedule;
  friday: DailySchedule;
  saturday: DailySchedule;
  sunday: DailySchedule;
}

/**
 * Configuración de tema
 */
export interface ThemeConfig {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  style: 'modern' | 'classic' | 'minimal';
  buttonStyle: 'rounded' | 'square' | 'pill';
}

/**
 * Perfil completo de la tienda
 */
export interface StoreProfile {
  id: string;
  ownerId: string;

  basicInfo: {
    name: string;
    description: string;
    slug: string;
    type: StoreType;
    category?: string;
  };

  contactInfo: {
    whatsapp: string;
    website?: string;
    email?: string;
  };

  address?: {
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    zipCode?: string;
  };

  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };

  theme?: ThemeConfig;

  schedule?: WeeklySchedule;

  settings?: {
    currency?: string;
    language?: string;
    paymentMethods?: PaymentMethod[];
    deliveryMethods?: DeliveryMethod[];
  };

  subscription?: {
    active: boolean;
    plan: string;
    startDate: FirebaseTimestamp;
    endDate: FirebaseTimestamp;
    trialUsed: boolean;
  };

  metadata: {
    createdAt: FirebaseTimestamp;
    updatedAt: FirebaseTimestamp;
    version: number;
    status: 'active' | 'inactive' | 'suspended';
  };
}

/**
 * Estado del formulario
 */
export interface FormState {
  isEditing: boolean;
  isSaving: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
  activeSection: ProfileSection;
}

/**
 * Datos para el formulario del perfil
 */
export interface ProfileFormData {
  // Basic Info
  name: string;
  description: string;
  siteName: string; // slug
  storeType: StoreType;

  // Contact
  whatsapp: string;
  instagram: string;

  // Address
  street: string;
  city: string;
  province: string;
  country: string;
  zipCode: string;

  // Theme
  theme?: ThemeConfig;

  // Schedule
  schedule?: WeeklySchedule;

  // Settings
  currency: string;
  language: string;
}

/**
 * Método de pago
 */
export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  instructions?: string;
}

/**
 * Método de entrega
 */
export interface DeliveryMethod {
  id: string;
  name: string;
  enabled: boolean;
  price?: number;
  instructions?: string;
}
```

---

## Componentes

### Estructura de Componentes

```
ProfileForm (wrapper)
├── ProfileNavigation (navegación lateral)
└── Secciones (renderizado condicional)
    ├── BasicInfoSection
    ├── ContactInfoSection
    ├── AddressSection
    ├── ThemeSection
    └── ScheduleSection
```

### Ejemplo: BasicInfoSection

```typescript
// components/sections/BasicInfoSection.tsx
'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { updateBasicInfoAction } from '../../actions/profile.actions';
import type {
  ProfileFormData,
  FormState,
  StoreProfile,
} from '../../types/store.type';

interface BasicInfoSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  validateSlug: (slug: string) => Promise<boolean>;
  profile: StoreProfile | null;
}

export function BasicInfoSection({
  formData,
  formState,
  updateField,
  validateSlug,
  profile,
}: BasicInfoSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [isBasicSaving, setIsBasicSaving] = useState(false);

  // Guardar usando Server Action
  const handleSectionSave = useCallback(async () => {
    if (!profile?.id) {
      toast.error('No se encontró el perfil');
      return;
    }

    setIsBasicSaving(true);
    try {
      // Mapear tipos legacy
      const storeTypeMap: Record<string, string> = {
        services: 'service',
      };
      const mappedType = storeTypeMap[formData.storeType] || formData.storeType;

      const basicData = {
        name: formData.name,
        description: formData.description,
        slug: formData.siteName,
        type: mappedType as 'retail' | 'restaurant' | 'service' | 'other',
      };

      const result = await updateBasicInfoAction(basicData);

      if (result.success) {
        toast.success('Información guardada');
      } else {
        const errorMsg = result.errors._form?.[0] || 'Error al guardar';
        toast.error(errorMsg);
      }
    } catch (err) {
      toast.error('Error al guardar');
    } finally {
      setIsBasicSaving(false);
    }
  }, [formData, profile?.id]);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>Información básica</h2>
          <p className='text-sm text-gray-500'>
            Configura los datos principales de tu tienda
          </p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={isBasicSaving || !formState.isDirty}
        >
          {isBasicSaving ? (
            <Loader2 className='w-4 h-4 animate-spin' />
          ) : (
            <Save className='w-4 h-4' />
          )}
          <span className='ml-2'>Guardar</span>
        </Button>
      </div>

      {/* Campos del formulario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='space-y-4'
      >
        <div>
          <Label htmlFor='name'>Nombre de la tienda *</Label>
          <Input
            id='name'
            value={formData.name}
            onChange={e => updateField('name', e.target.value)}
            placeholder='Mi Tienda Online'
          />
        </div>

        <div>
          <Label htmlFor='description'>Descripción</Label>
          <Textarea
            id='description'
            value={formData.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder='Describe tu tienda...'
            rows={4}
          />
        </div>

        {/* ... más campos */}
      </motion.div>
    </div>
  );
}
```

---

## Utilidades

### Archivo: `utils/profile.utils.ts`

```typescript
// utils/profile.utils.ts

import type {
  StoreProfile,
  ProfileFormData,
  StoreType,
} from '../types/store.type';

/**
 * Genera un slug desde un texto
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar no-alfanuméricos
    .replace(/^-+|-+$/g, '') // Quitar guiones al inicio/final
    .substring(0, 50); // Limitar longitud
}

/**
 * Mapea tipos de tienda legacy a los nuevos tipos
 */
export function mapStoreTypeToFormType(type: string): StoreType {
  const typeMap: Record<string, StoreType> = {
    services: 'service',
  };
  return (typeMap[type] || type) as StoreType;
}

/**
 * Convierte StoreProfile a datos de formulario
 */
export function profileToFormData(
  profile: StoreProfile
): Partial<ProfileFormData> {
  return {
    // Basic Info
    name: profile.basicInfo.name || '',
    description: profile.basicInfo.description || '',
    siteName: profile.basicInfo.slug || '',
    storeType: mapStoreTypeToFormType(profile.basicInfo.type),

    // Contact
    whatsapp: profile.contactInfo?.whatsapp || '',
    instagram: profile.socialLinks?.instagram || '',

    // Address
    street: profile.address?.street || '',
    city: profile.address?.city || '',
    province: profile.address?.province || '',
    country: profile.address?.country || 'Argentina',
    zipCode: profile.address?.zipCode || '',

    // Theme
    theme: profile.theme,

    // Schedule
    schedule: profile.schedule,

    // Settings
    currency: profile.settings?.currency || 'ARS',
    language: profile.settings?.language || 'es',
  };
}

/**
 * Calcula el porcentaje de completitud del perfil
 */
export function calculateProfileCompleteness(profile: StoreProfile): number {
  const fields = [
    { value: profile.basicInfo?.name, weight: 15 },
    { value: profile.basicInfo?.description, weight: 10 },
    { value: profile.basicInfo?.slug, weight: 15 },
    { value: profile.contactInfo?.whatsapp, weight: 20 },
    { value: profile.address?.street, weight: 10 },
    { value: profile.address?.city, weight: 5 },
    { value: profile.address?.province, weight: 5 },
    { value: profile.theme?.logoUrl, weight: 10 },
    { value: profile.socialLinks?.instagram, weight: 5 },
    { value: profile.schedule, weight: 5 },
  ];

  const totalWeight = fields.reduce((sum, f) => sum + f.weight, 0);
  const completedWeight = fields
    .filter(f => f.value && String(f.value).trim() !== '')
    .reduce((sum, f) => sum + f.weight, 0);

  return Math.round((completedWeight / totalWeight) * 100);
}

/**
 * Formatea número de WhatsApp
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remover todo excepto números y +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Si no tiene código de país, agregar +54 (Argentina)
  if (!cleaned.startsWith('+')) {
    return `+54${cleaned}`;
  }

  return cleaned;
}

/**
 * Valida formato de color hexadecimal
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Obtiene campos faltantes del perfil
 */
export function getMissingFields(profile: StoreProfile): string[] {
  const required = [
    { field: 'basicInfo.name', label: 'Nombre de la tienda' },
    { field: 'basicInfo.slug', label: 'URL de la tienda' },
    { field: 'contactInfo.whatsapp', label: 'WhatsApp' },
  ];

  return required
    .filter(({ field }) => {
      const value = field
        .split('.')
        .reduce((obj, key) => obj?.[key], profile as any);
      return !value || String(value).trim() === '';
    })
    .map(({ label }) => label);
}
```

---

## Migración desde Legacy

### Archivos Eliminados

| Archivo                              | Líneas | Razón                         |
| ------------------------------------ | ------ | ----------------------------- |
| `api/profileStore.ts`                | 699    | Zustand con lógica de negocio |
| `services/profile.service.ts`        | ~200   | Firebase client SDK           |
| `validations/profile.validations.ts` | ~150   | Validaciones duplicadas       |
| `hooks/useProfile.ts` (old)          | ~100   | Depende de profileStore       |

### Reemplazos

| Antes                              | Después                     |
| ---------------------------------- | --------------------------- |
| `useProfileStore()`                | Server Actions              |
| `profileService.getProfile()`      | `getProfileAction()`        |
| `profileService.updateBasicInfo()` | `updateBasicInfoAction()`   |
| `profileValidations.ts`            | `schemas/profile.schema.ts` |
| Firebase client SDK                | Firebase Admin SDK          |

### Compatibilidad con Componentes Legacy

Los componentes existentes fueron actualizados para usar Server Actions:

```typescript
// Antes (con Zustand)
const { updateBasicInfo, sections } = useProfileStore();
await updateBasicInfo(profile.id, data);

// Después (con Server Actions)
const result = await updateBasicInfoAction(data);
if (result.success) {
  toast.success('Guardado');
}
```

---

## Guía de Uso

### Uso en Server Components

```typescript
// app/dashboard/profile/page.tsx
import { getServerSession } from '@/lib/auth/server-session';
import { profileServerService } from '@/features/dashboard/modules/store-settings/services/server/profile.server-service';
import { ProfileForm } from '@/features/dashboard/modules/store-settings/components/ProfileForm';

export default async function ProfilePage() {
  // 1. Autenticación
  const session = await getServerSession();
  if (!session?.storeId) {
    redirect('/sign-in');
  }

  // 2. Fetch inicial (servidor)
  const initialProfile = await profileServerService.getProfile(session.storeId);

  // 3. Pasar a componente cliente
  return (
    <div>
      <h1>Configuración de tienda</h1>
      <ProfileForm initialProfile={initialProfile} />
    </div>
  );
}
```

### Uso en Client Components

```typescript
// Usando el hook
'use client';

import { useProfile } from '../hooks/useProfile';

function MyComponent({ initialProfile }) {
  const {
    profile,
    formData,
    isLoading,
    isSaving,
    updateField,
    saveProfile,
    validateSlug,
  } = useProfile({ initialProfile });

  const handleSave = async () => {
    const success = await saveProfile(formData);
    if (success) {
      // Éxito
    }
  };

  return (
    <div>
      <input
        value={formData.name}
        onChange={e => updateField('name', e.target.value)}
      />
      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
}
```

### Llamar Server Actions directamente

```typescript
'use client';

import { updateBasicInfoAction } from '../actions/profile.actions';

async function handleSubmit(data) {
  const result = await updateBasicInfoAction({
    name: data.name,
    description: data.description,
    slug: data.slug,
    type: data.type,
  });

  if (result.success) {
    toast.success('Guardado');
  } else {
    // Manejar errores por campo
    Object.entries(result.errors).forEach(([field, messages]) => {
      console.error(`Error en ${field}:`, messages);
    });
  }
}
```

---

## Conclusión

La arquitectura del módulo `store-settings` sigue los principios de:

1. **Server-First**: Mutaciones en el servidor, UI en el cliente
2. **Type-Safety**: Zod schemas como fuente de verdad
3. **Seguridad**: Firebase Admin SDK, sin credenciales en cliente
4. **Mantenibilidad**: Separación clara de responsabilidades
5. **Performance**: Bundle reducido, cacheo automático de Next.js

Esta arquitectura es escalable y puede ser replicada en otros módulos del proyecto.
