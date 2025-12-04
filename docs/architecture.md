# Documento de Arquitectura de Software - Next.js 15 Server Actions First

**Stack:** Next.js 15, TypeScript, Firebase, Zustand, React Hook Form, Zod  
**Versión:** 2.0 | Diciembre 2025

***

## 1. Principios Fundamentales

### 1.1. Server-First Philosophy

**REGLAS OBLIGATORIAS:**
- ✅ Lectura inicial: Server Components (`async function page()`)
- ✅ Mutaciones: Server Actions (`'use server'`)
- ✅ Estado global: Solo UI state (tabs, modals, filters)
- ❌ NO API Routes tradicionales
- ❌ NO fetch en `useEffect` para datos iniciales
- ❌ NO datos de negocio en Zustand

### 1.2. Prohibición de Barrels

```typescript
// ❌ PROHIBIDO
export * from './components'

// ✅ CORRECTO
import { login } from '@/features/auth/actions/auth.actions'
```

**RAZÓN:** Rompe tree-shaking, crea ciclos, aumenta bundle size.

### 1.3. Tabla de Responsabilidades

| Capa | Responsabilidad | Ubicación | Entorno |
|------|----------------|-----------|---------|
| Server Pages | Fetch inicial + Metadatos | `app/**/page.tsx` | Servidor |
| Server Actions | Mutaciones + Validación | `features/**/actions/*.actions.ts` | Servidor |
| Client Components | UI + Interactividad | `features/**/components/*.tsx` | Cliente |
| Zustand | Estado UI global | `store/**/*.store.ts` | Cliente |
| Schemas | Validación Zod | `features/**/schemas/*.schema.ts` | Compartido |
| Services | DB/API logic | `features/**/services/*.service.ts` | Servidor |

***

## 2. Server Actions - Estructura Obligatoria

### 2.1. Template Estándar

```typescript
// features/products/actions/product.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { productSchema } from '../schemas/product.schema';
import { createProduct } from '../services/product.service';
import { getServerSession } from '@/lib/auth/server-session';

type ActionResponse<T = unknown> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export async function createProductAction(formData: FormData): Promise<ActionResponse<{ id: string }>> {
  // 1. AUTH (SIEMPRE PRIMERO)
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };
  if (session.role !== 'admin') return { success: false, errors: { _form: ['No autorizado'] } };

  // 2. PARSE
  const rawData = {
    name: formData.get('name'),
    price: formData.get('price'),
    image: formData.get('image'),
  };

  // 3. VALIDATE
  const validation = productSchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, errors: validation.error.flatten().fieldErrors };
  }

  // 4. MUTATE
  try {
    const product = await createProduct(validation.data, session.storeId);
    
    // 5. REVALIDATE
    revalidatePath('/dashboard/products');
    
    return { success: true, data: { id: product.id } };
  } catch (error) {
    return { success: false, errors: { _form: ['Error al crear'] } };
  }
}
```

### 2.2. Progressive Enhancement

```typescript
// components/product-form-progressive.tsx
'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { createProductAction } from '../actions/product.actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Guardando...' : 'Crear'}</button>;
}

export function ProductForm() {
  const [state, formAction] = useFormState(createProductAction, null);

  return (
    <form action={formAction}>
      <input name="name" required />
      {state?.errors?.name && <span>{state.errors.name[0]}</span>}
      <SubmitButton />
    </form>
  );
}
```

***

## 3. React Hook Form + Zod

### 3.1. Schema Pattern

```typescript
// features/products/schemas/product.schema.ts
import { z } from 'zod';

// Base (DB)
export const productSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.coerce.number().positive(),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
});

// Form (con File)
export const productFormSchema = productSchema.extend({
  image: z.instanceof(File).optional(),
});

// Update (parcial)
export const productUpdateSchema = productSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;
```

### 3.2. Form Component Pattern

```typescript
// features/products/components/product-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { productFormSchema, type ProductFormData } from '../schemas/product.schema';
import { createProductAction } from '../actions/product.actions';

export function ProductForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors }, setError } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
  });

  const onSubmit = handleSubmit(async (data) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value);
      });

      const result = await createProductAction(formData);
      
      if (result.success) {
        onSuccess?.();
      } else {
        Object.entries(result.errors).forEach(([field, messages]) => {
          setError(field as any, { message: messages[0] });
        });
      }
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      <button disabled={isPending}>{isPending ? 'Guardando...' : 'Crear'}</button>
    </form>
  );
}
```

***

## 4. Zustand - Solo UI State

### 4.1. Qué usar/no usar

**✅ USAR Zustand para:**
- Modal abierto/cerrado
- Sidebar collapsed
- Filtros activos
- Tab seleccionada
- Tema (dark/light)

**❌ NO usar Zustand para:**
- Datos del servidor (productos, usuarios)
- Estado de formularios (usar React Hook Form)
- Loading states (usar `useTransition`)

### 4.2. Store Pattern

```typescript
// store/ui.store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeFilters: string[];
  toggleSidebar: () => void;
  setFilters: (filters: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeFilters: [],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setFilters: (filters) => set({ activeFilters: filters }),
}));
```

### 4.3. Persist Middleware (Preferencias)

```typescript
// store/preferences.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'user-preferences' }
  )
);
```

***

## 5. Estructura de Directorios

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── products/
│   │   │   ├── page.tsx          # Server Component (async fetch)
│   │   │   ├── loading.tsx       # Skeleton
│   │   │   ├── error.tsx         # Error boundary
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── loading.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   ├── global-error.tsx          # Error boundary global
│   └── not-found.tsx
│
├── features/
│   ├── products/
│   │   ├── actions/
│   │   │   └── product.actions.ts     # 'use server'
│   │   ├── components/
│   │   │   ├── product-form.tsx       # 'use client'
│   │   │   ├── product-list.tsx
│   │   │   └── product-card.tsx
│   │   ├── schemas/
│   │   │   └── product.schema.ts      # Zod schemas
│   │   ├── services/
│   │   │   └── product.service.ts     # Firebase Admin SDK
│   │   └── types/
│   │       └── product.types.ts
│   │
│   ├── auth/
│   │   ├── actions/
│   │   ├── components/
│   │   ├── schemas/
│   │   └── services/
│   │
│   └── orders/
│       ├── actions/
│       ├── components/
│       └── schemas/
│
├── components/ui/
│   ├── skeletons/
│   │   ├── table-skeleton.tsx
│   │   └── card-skeleton.tsx
│   ├── button.tsx
│   └── input.tsx
│
├── store/
│   ├── ui.store.ts               # Solo UI state
│   └── preferences.store.ts
│
├── lib/
│   ├── auth/
│   │   └── server-session.ts
│   ├── firebase/
│   │   ├── admin.ts              # Firebase Admin SDK
│   │   └── client.ts             # Firebase Client SDK
│   └── utils/
│       └── firestore.ts
│
└── types/
    └── global.d.ts
```

***

## 6. Firebase Architecture

### 6.1. Dual SDK Strategy

| SDK | Uso | Entorno | Privilegios |
|-----|-----|---------|------------|
| **Admin** | Server Actions, Server Components | Node.js | Sin restricciones |
| **Client** | Auth UI, Listeners real-time | Browser | Con Security Rules |

### 6.2. Admin SDK Setup

```typescript
// lib/firebase/admin.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
    }),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
```

### 6.3. Client SDK Setup

```typescript
// lib/firebase/client.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const app = getApps().length === 0 ? initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}) : getApps()[0];

export const auth = getAuth(app);
```

### 6.4. Environment Variables

```bash
# .env.local

# Cliente (NEXT_PUBLIC_ = expuestas al browser)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx

# Servidor (SIN NEXT_PUBLIC_ = solo servidor)
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 6.5. Service Layer Pattern

```typescript
// features/products/services/product.service.ts
import { adminDb } from '@/lib/firebase/admin';
import { cleanForFirestore } from '@/lib/utils/firestore';
import type { Product } from '../schemas/product.schema';
import * as admin from 'firebase-admin';

const COLLECTION = 'products';

export async function getProducts(storeId: string): Promise<Product[]> {
  const snapshot = await adminDb
    .collection('stores').doc(storeId)
    .collection(COLLECTION)
    .where('active', '==', true)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
}

export async function createProduct(data: Omit<Product, 'id'>, storeId: string): Promise<Product> {
  const cleanData = cleanForFirestore({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const docRef = await adminDb
    .collection('stores').doc(storeId)
    .collection(COLLECTION)
    .add(cleanData);

  const doc = await docRef.get();
  return { id: docRef.id, ...doc.data() } as Product;
}

export async function updateProduct(id: string, data: Partial<Product>, storeId: string): Promise<void> {
  const cleanData = cleanForFirestore({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await adminDb
    .collection('stores').doc(storeId)
    .collection(COLLECTION)
    .doc(id)
    .update(cleanData);
}
```

### 6.6. Firestore Utils

```typescript
// lib/utils/firestore.ts
export function cleanForFirestore<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
}
```

***

## 7. Server Pages Pattern

### 7.1. Basic Server Page

```typescript
// app/(dashboard)/products/page.tsx
import { getServerSession } from '@/lib/auth/server-session';
import { getProducts } from '@/features/products/services/product.service';
import { ProductsMain } from '@/features/products/components/products-main';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Productos | Dashboard',
};

export default async function ProductsPage() {
  const session = await getServerSession();
  if (!session) redirect('/login');

  const products = await getProducts(session.storeId);

  return (
    <main>
      <h1>Productos</h1>
      <ProductsMain initialProducts={products} />
    </main>
  );
}
```

### 7.2. Loading State

```typescript
// app/(dashboard)/products/loading.tsx
import { TableSkeleton } from '@/components/ui/skeletons/table-skeleton';

export default function Loading() {
  return <TableSkeleton rows={10} />;
}
```

### 7.3. Error Boundary

```typescript
// app/(dashboard)/products/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Error al cargar productos</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Reintentar</button>
    </div>
  );
}
```

### 7.4. Global Error

```typescript
// app/global-error.tsx
'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <h1>Error Global</h1>
        <p>{error.message}</p>
        <button onClick={reset}>Reintentar</button>
      </body>
    </html>
  );
}
```

***

## 8. Client Components Pattern

### 8.1. Data Display (Props)

```typescript
// features/products/components/products-main.tsx
'use client';
import { useState } from 'react';
import type { Product } from '../schemas/product.schema';
import { ProductGrid } from './product-grid';

interface ProductsMainProps {
  initialProducts: Product[];
}

export function ProductsMain({ initialProducts }: ProductsMainProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');

  const filtered = initialProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." />
      <ProductGrid products={filtered} />
    </div>
  );
}
```

### 8.2. Mutations (Server Actions)

```typescript
// features/products/components/product-card.tsx
'use client';
import { useTransition } from 'react';
import { deleteProductAction } from '../actions/product.actions';
import type { Product } from '../schemas/product.schema';
import { toast } from 'sonner';

export function ProductCard({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm('¿Eliminar?')) return;

    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if (result.success) {
        toast.success('Eliminado');
      } else {
        toast.error(result.errors._form?.[0]);
      }
    });
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={handleDelete} disabled={isPending}>
        {isPending ? 'Eliminando...' : 'Eliminar'}
      </button>
    </div>
  );
}
```

***

## 9. Seguridad

### 9.1. Auth en Server Actions (OBLIGATORIO)

```typescript
'use server';

export async function deleteProductAction(productId: string) {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };
  
  // 2. AUTHORIZATION
  if (session.role !== 'admin') return { success: false, errors: { _form: ['No autorizado'] } };
  
  // 3. OWNERSHIP
  const product = await getProduct(productId);
  if (product.storeId !== session.storeId) return { success: false, errors: { _form: ['No encontrado'] } };
  
  // 4. MUTATE
  await deleteProduct(productId);
  revalidatePath('/dashboard/products');
  
  return { success: true };
}
```

### 9.2. Session Helper

```typescript
// lib/auth/server-session.ts
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export async function getServerSession() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get('idToken')?.value;

  if (!idToken) return null;

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);
    const user = await adminAuth.getUser(decodedToken.uid);

    return {
      userId: decodedToken.uid,
      email: user.email || '',
      storeId: user.customClaims?.storeId as string,
      role: user.customClaims?.role as string || 'user',
    };
  } catch {
    return null;
  }
}
```

### 9.3. Rate Limiting (Upstash)

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function checkRateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

***

## 10. Directrices de Desarrollo

### 10.1. Orden de Implementación

1. **Schemas** (Zod) → Define tipos y validaciones
2. **Services** (Firebase Admin) → Lógica de DB
3. **Server Actions** → Auth + Validación + Mutación
4. **Server Pages** → Fetch inicial + Metadata
5. **Client Components** → UI + Interactividad
6. **Loading/Error** → Estados de carga y errores

### 10.2. Checklist de Calidad

**Antes de commit:**
- [ ] No hay barrels (`index.ts`)
- [ ] Server Actions tienen auth check
- [ ] Schemas de Zod para todas las entidades
- [ ] `revalidatePath()` después de mutaciones
- [ ] `loading.tsx` en rutas con fetch
- [ ] `error.tsx` en rutas críticas
- [ ] No hay `useEffect` para fetch inicial
- [ ] Zustand solo para UI state
- [ ] Variables de entorno correctas (NEXT_PUBLIC_ solo si es necesario)
- [ ] `cleanForFirestore()` antes de `.add()` o `.update()`

### 10.3. Performance Checklist

- [ ] Server Components por defecto
- [ ] `'use client'` solo cuando sea necesario
- [ ] Suspense para componentes lentos
- [ ] Selectores específicos en Zustand (`useStore(s => s.specific)`)
- [ ] `useTransition` para mutaciones con UI feedback
- [ ] Images con `next/image`
- [ ] Fonts con `next/font`

### 10.4. Testing Strategy

```typescript
// __tests__/features/products/actions/product.actions.test.ts
import { createProductAction } from '@/features/products/actions/product.actions';

jest.mock('@/lib/auth/server-session');

describe('createProductAction', () => {
  it('debe rechazar sin auth', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const formData = new FormData();
    formData.append('name', 'Test');
    
    const result = await createProductAction(formData);
    
    expect(result.success).toBe(false);
    expect(result.errors._form).toContain('No autenticado');
  });
});
```

***

## 11. Referencias

**Next.js 15:**
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Project Structure](https://nextjs.org/docs/app/building-your-application/routing/colocation)

**Firebase:**
- [Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Admin Auth API](https://firebase.google.com/docs/auth/admin)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)

**Validation:**
- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)

**State Management:**
- [Zustand Documentation](https://docs.pmnd.rs/zustand)

***

**Fin del documento. Esta arquitectura es production-ready y sigue las mejores prácticas oficiales de Next.js 15, Firebase y la comunidad TypeScript.**