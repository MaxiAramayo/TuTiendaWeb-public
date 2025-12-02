# Documento de Diseño y Arquitectura de Software (Server Actions First)

**Proyecto:** E-commerce / Delivery App  
**Stack:** Next.js 15, TypeScript, Firebase, Zustand, React Hook Form, Zod  
**Enfoque:** Feature-Based Architecture, Server Actions Obligatorias, State Mínimo en Cliente

***

## 1. Principios Fundamentales

### 1.1. Server-First Philosophy

Todo el flujo de datos y mutaciones **debe** pasar por el servidor. No existen API Routes tradicionales: las mutaciones se manejan exclusivamente con **Server Actions**.[1][2]

**Regla de Oro:**
- **Lectura inicial:** Server Components (async fetch en `page.tsx`)
- **Mutaciones:** Server Actions (`'use server'`)
- **Estado global:** Solo si es estrictamente necesario (UI state, no data fetching)[3][4]

### 1.2. Prohibición Estricta de Barrels

Los archivos barrel (`index.ts` con `export *`) están **prohibidos** porque rompen el tree-shaking y causan ciclos en Server Components.[5]

```typescript
// ❌ PROHIBIDO
export * from './components'

// ✅ CORRECTO
import { login } from '@/features/auth/actions/auth.actions'
```

### 1.3. Separación de Responsabilidades

| Capa | Responsabilidad | Ubicación |
|------|----------------|-----------|
| **Server Pages** | Fetch inicial + Metadatos | `app/**/page.tsx` |
| **Server Actions** | Mutaciones + Validación | `features/**/actions/*.actions.ts` |
| **Client Components** | UI + Interactividad | `features/**/components/*.tsx` |
| **Zustand Store** | Estado UI global (tabs, modals, filters) | `store/**/*.store.ts` |
| **Schemas** | Validación con Zod | `features/**/schemas/*.schema.ts` |

***

## 2. Arquitectura de Server Actions

### 2.1. ¿Qué son las Server Actions?

Son funciones asíncronas que **siempre** se ejecutan en el servidor, proporcionando un entorno seguro para mutaciones. Reemplazan completamente las API Routes tradicionales.[6][7][1]

**Características:**
- Ejecutan en el servidor incluso cuando se llaman desde Client Components
- Protección CSRF automática (validación de `Origin` vs `Host`)[8][6]
- Soporte nativo para Progressive Enhancement (funcionan sin JavaScript)[9]
- Integración directa con formularios HTML

### 2.2. Estructura de una Server Action

```typescript
// src/features/products/actions/product.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { productSchema } from '../schemas/product.schema';
import { createProduct as createProductDB } from '../services/product.service';
import { auth } from '@/lib/auth'; // Tu sistema de autenticación

export async function createProductAction(formData: FormData) {
  // 1. AUTENTICACIÓN Y AUTORIZACIÓN (OBLIGATORIO)
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return { 
      success: false, 
      errors: { _form: 'No autorizado' } 
    };
  }

  // 2. EXTRACCIÓN Y PARSEO
  const rawData = {
    name: formData.get('name'),
    price: formData.get('price'),
    image: formData.get('image'), // File object
  };

  // 3. VALIDACIÓN CON ZOD
  const validation = productSchema.safeParse(rawData);
  
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  // 4. MUTACIÓN EN BASE DE DATOS
  try {
    const product = await createProductDB(validation.data);
    
    // 5. REVALIDACIÓN DE CACHE
    revalidatePath('/dashboard/products');
    
    return { success: true, data: product };
  } catch (error) {
    return { 
      success: false, 
      errors: { _form: 'Error al crear producto' } 
    };
  }
}
```

**Aspectos clave validados por documentación:**
- Siempre verificar autorización en la Server Action (no confiar solo en UI)[10][11]
- Validar en servidor con Zod (la validación cliente puede ser bypasseada)[12][13]
- Usar `revalidatePath()` para invalidar cache después de mutaciones[14]

***

## 3. Integración con React Hook Form + Zod

### 3.1. Schema de Validación

```typescript
// src/features/products/schemas/product.schema.ts
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  price: z.coerce.number().positive('Debe ser positivo'),
  image: z.instanceof(File).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
```

### 3.2. Client Component con React Hook Form

```typescript
// src/features/products/components/product-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '../schemas/product.schema';
import { createProductAction } from '../actions/product.actions';
import { useTransition } from 'react';

export function ProductForm() {
  const [isPending, startTransition] = useTransition();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setError 
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    startTransition(async () => {
      // Convertir a FormData para enviar al Server Action
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const result = await createProductAction(formData);
      
      if (!result.success && result.errors) {
        // Mapear errores del servidor al formulario
        Object.entries(result.errors).forEach(([field, messages]) => {
          setError(field as any, { 
            message: messages[0] 
          });
        });
      }
      
      // Si es exitoso, Next.js revalida automáticamente
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input type="number" {...register('price')} />
      {errors.price && <span>{errors.price.message}</span>}
      
      <input type="file" {...register('image')} />
      
      <button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Crear Producto'}
      </button>
    </form>
  );
}
```

**Validación según documentación:**
- Validación doble: cliente (UX) + servidor (seguridad)[15][13]
- `useTransition` para manejar pending state durante mutaciones[2]
- Mapeo de errores del servidor al formulario[15]

***

## 4. Uso de Zustand (Solo Estado UI Global)

### 4.1. Cuándo usar Zustand vs Props

**Usa Zustand SOLO para:**[4][16][3]
- Estado UI que necesitan **múltiples componentes no relacionados** (modal abierto/cerrado, filtros activos, tabs seleccionadas)
- Preferencias de usuario (tema, idioma)
- Estado temporal de UI (sidebar collapsed, panel de búsqueda)

**NO uses Zustand para:**
- Datos fetched del servidor (usa props desde Server Components)[17]
- Estado local de un formulario (usa React Hook Form)
- Datos que solo usa un componente (usa `useState`)

### 4.2. Ejemplo de Store Válido

```typescript
// src/store/ui.store.ts
import { create } from 'zustand';

interface UIState {
  // Estado UI que múltiples componentes necesitan
  sidebarOpen: boolean;
  activeFilters: string[];
  
  // Acciones
  toggleSidebar: () => void;
  setFilters: (filters: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeFilters: [],
  
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
  
  setFilters: (filters) => set({ activeFilters: filters }),
}));
```

**Uso en componente:**
```typescript
'use client';

import { useUIStore } from '@/store/ui.store';

export function FilterPanel() {
  // Solo suscribirse a la parte del state que necesitas
  const filters = useUIStore(s => s.activeFilters);
  const setFilters = useUIStore(s => s.setFilters);
  
  return (
    <div>
      {/* UI de filtros */}
    </div>
  );
}
```

**Validación según documentación:**
- Zustand para evitar prop drilling de estado UI[18][19]
- Selectores específicos para evitar re-renders innecesarios[18]
- NO para datos del servidor (eso va por props)[3]

***

## 5. Estructura de Directorios Definitiva

```
src/
├── app/                                    # App Router de Next.js
│   ├── (dashboard)/                        # Grupo de rutas con layout
│   │   ├── products/
│   │   │   ├── page.tsx                    # ✅ SERVER: Fetch inicial
│   │   │   ├── loading.tsx                 # ✅ Skeleton automático
│   │   │   ├── error.tsx                   # ✅ Error boundary
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── loading.tsx
│   │   └── layout.tsx
│   ├── layout.tsx                          # Root layout
│   └── globals.css
│
├── features/                               # Feature-based organization
│   ├── products/
│   │   ├── actions/                        # ✅ SERVER ACTIONS
│   │   │   └── product.actions.ts          # 'use server' - Mutaciones
│   │   ├── components/                     # Client Components
│   │   │   ├── product-form.tsx            # 'use client'
│   │   │   └── product-list.tsx
│   │   ├── schemas/                        # Zod schemas
│   │   │   └── product.schema.ts
│   │   ├── services/                       # DB/API logic (usado por actions)
│   │   │   └── product.service.ts
│   │   └── types/
│   │       └── product.types.ts
│   │
│   ├── auth/
│   │   ├── actions/
│   │   │   └── auth.actions.ts             # login, logout, register
│   │   ├── components/
│   │   └── schemas/
│   │
│   └── orders/
│       ├── actions/
│       ├── components/
│       └── schemas/
│
├── components/
│   └── ui/
│       ├── skeletons/                      # Skeletons reutilizables
│       │   ├── table-skeleton.tsx
│       │   └── card-skeleton.tsx
│       ├── button.tsx
│       └── input.tsx
│
├── store/                                  # ⚠️ SOLO ESTADO UI
│   ├── ui.store.ts                         # Sidebar, modals, etc.
│   └── filters.store.ts                    # Filtros temporales
│
├── lib/
│   ├── auth.ts                             # Lógica de autenticación
│   ├── firebase.ts                         # Inicialización Firebase
│   └── utils.ts
│
└── types/
    └── global.d.ts                         # Tipos globales
```

***

## 6. Flujo Completo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│  1. SERVER PAGE (page.tsx)                                  │
│     - Async fetch de datos iniciales                        │
│     - Ejecuta en servidor, renderiza HTML                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  2. CLIENT COMPONENT recibe initialData via props           │
│     - Renderiza UI                                          │
│     - NO hace fetch (ya tiene los datos)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼ (Usuario interactúa)
┌─────────────────────────────────────────────────────────────┐
│  3. REACT HOOK FORM + ZOD                                   │
│     - Validación cliente (UX)                               │
│     - onSubmit llama a Server Action                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  4. SERVER ACTION ('use server')                            │
│     - Verifica auth/autorización                            │
│     - Valida con Zod (seguridad)                            │
│     - Ejecuta mutación en DB                                │
│     - revalidatePath() para invalidar cache                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  5. NEXT.JS REVALIDACIÓN                                    │
│     - Automáticamente re-fetcha page.tsx                    │
│     - UI se actualiza con datos frescos                     │
└─────────────────────────────────────────────────────────────┘
```

***

## 7. Patterns y Loading States

### 7.1. Loading Pattern con loading.tsx

```typescript
// app/(dashboard)/products/page.tsx
import { getProducts } from '@/features/products/services/product.service';
import { ProductList } from '@/features/products/components/product-list';

export default async function ProductsPage() {
  // Este fetch BLOQUEA el renderizado hasta resolverse
  // Mientras tanto, Next.js muestra loading.tsx
  const products = await getProducts();
  
  return (
    <main>
      <h1>Productos</h1>
      <ProductList initialData={products} />
    </main>
  );
}

// app/(dashboard)/products/loading.tsx
import { TableSkeleton } from '@/components/ui/skeletons/table-skeleton';

export default function Loading() {
  return <TableSkeleton rows={10} />;
}
```

**Validación según documentación:**
- `loading.tsx` se muestra automáticamente durante fetch[20]
- Aprovecha Suspense de React bajo el hood[20]

### 7.2. Suspense para Componentes Específicos

```typescript
import { Suspense } from 'react';
import { WidgetSkeleton } from '@/components/ui/skeletons';

export default async function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      
      {/* Widget que carga rápido */}
      <QuickStats />
      
      {/* Widget que tarda más - lo envolvemos en Suspense */}
      <Suspense fallback={<WidgetSkeleton />}>
        <RecommendedProducts />
      </Suspense>
    </main>
  );
}
```

**Validación según documentación:**
- Las Server Actions son endpoints públicos HTTP[6][10]
- NUNCA confiar solo en que el UI oculta un botón[10]
- Protección CSRF automática por Next.js[8][6]

***

## 10. Referencias Oficiales

Toda esta arquitectura está respaldada por:

- **Server Actions:**[1][2][6]
- **Data Fetching:**[21][22]
- **Loading & Suspense:**[23][20]
- **Revalidación:**[14]
- **Seguridad:**[11][8][10]
- **Forms + Zod:**[13][12][15]
- **State Management:**[24][17][4][3]
- **Tree Shaking:**[5]
- **Project Structure:**[25][26]




Esta es la arquitectura **oficial y recomendada** para Next.js 15 según la documentación de Vercel.[2][21][1]

[1](https://nextjs.org/docs/14/app/building-your-application/data-fetching/server-actions-and-mutations)
[2](https://nextjs.org/docs/app/getting-started/updating-data)
[3](https://www.yoseph.tech/posts/nextjs/nextjs-foot-guns-over-reliance-on-client-side-state)
[4](https://blog.logrocket.com/guide-state-management-next-js/)
[5](https://github.com/vercel/next.js/issues/12557)
[6](https://nextjs.org/docs/app/guides/data-security)
[7](https://reliasoftware.com/blog/nextjs-15-new-features)
[8](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions)
[9](https://www.youtube.com/watch?v=Qc8_y9irMP4)
[10](https://nextjs.org/docs/app/guides/authentication)
[11](https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router)
[12](https://www.freecodecamp.org/news/handling-forms-nextjs-server-actions-zod/)
[13](https://leapcell.io/blog/streamlined-form-handling-and-validation-in-next-js-server-actions)
[14](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
[15](https://monique-mcintyre.com/blogs/form-validation-with-zod-rhf-nextjs-server-actions)
[16](https://vercel.com/kb/guide/react-context-state-management-nextjs)
[17](https://www.reddit.com/r/nextjs/comments/1hp01vg/how_do_you_store_state_on_the_server_components/)
[18](https://www.linkedin.com/pulse/simplifying-state-management-nextjs-zustand-guide-aakarshit-giri-ch4nc)
[19](https://dev.to/mrsupercraft/mastering-state-management-with-zustand-in-nextjs-and-react-1g26)
[20](https://rishibakshi.hashnode.dev/mastering-loading-states-in-nextjs-effective-use-of-suspense-and-loadingtsx)
[21](https://nextjs.org/docs/app/getting-started/fetching-data)
[22](https://dev.to/sudiip__17/how-data-fetching-works-in-nextjs-server-vs-client-components-3779)
[23](https://github.com/vercel/next.js/issues/73474)
[24](https://nextjs.org/docs/app/getting-started/server-and-client-components)
[25](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)
[26](https://www.reddit.com/r/nextjs/comments/1kkpqtm/sharing_my_goto_project_structure_for_nextjs/)
[27](https://nextjs.org/docs/13/app/building-your-application/data-fetching/forms-and-mutations)
[28](https://nextjs.org/docs/13/app/api-reference/functions/server-actions)
[29](https://www.reddit.com/r/nextjs/comments/18mwflc/how_to_revalidate_the_current_path_using_server/)
[30](https://www.youtube.com/watch?v=R_Pj593TH_Q)
[31](https://www.developerway.com/posts/react-state-management-2025)
[32](https://stackoverflow.com/questions/78916619/how-to-use-global-props-in-nextjs-strategy)
[33](https://github.com/vercel/next.js/discussions/61326)
[34](https://nextjs.org/docs/pages/guides/authentication)