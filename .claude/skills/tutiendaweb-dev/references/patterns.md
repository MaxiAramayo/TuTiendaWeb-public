# Plantillas de codigo — TuTiendaWeb

Patrones completos para cada capa. La Server Action canonica esta en `SKILL.md`; aca van el resto.

## Contenido
- [Schema Zod (fuente unica)](#schema-zod-fuente-unica)
- [Service con Firebase Admin](#service-con-firebase-admin)
- [Server Component (page.tsx)](#server-component-pagetsx)
- [Client Component con mutacion](#client-component-con-mutacion)
- [Form con React Hook Form + Zod](#form-con-react-hook-form--zod)
- [loading.tsx y skeletons](#loadingtsx-y-skeletons)
- [Checklist de refactor](#checklist-de-refactor)

---

## Schema Zod (fuente unica)

Los tipos SIEMPRE se infieren del schema, nunca se definen aparte.

```typescript
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(3).max(100),
  price: z.coerce.number().positive(),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive']).default('active'),
});

// Variantes derivadas del base
export const productUpdateSchema = productSchema.partial();
export const productFormSchema = productSchema.extend({
  image: z.instanceof(File).optional(), // solo en el form
});

export type Product = z.infer<typeof productSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;
```

## Service con Firebase Admin

Solo logica de datos. Recibe `storeId` (nunca lo toma del cliente). Limpiar `undefined` antes de escribir.

```typescript
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cleanForFirestore } from '@/lib/utils/firestore';
import type { Product } from '../schemas/product.schema';

class ProductService {
  private readonly ROOT = 'stores';
  private readonly SUB = 'products';

  async getAll(storeId: string): Promise<Product[]> {
    const snap = await adminDb
      .collection(this.ROOT).doc(storeId)
      .collection(this.SUB)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
  }

  async create(storeId: string, data: Product): Promise<string> {
    const ref = await adminDb
      .collection(this.ROOT).doc(storeId)
      .collection(this.SUB)
      .add(cleanForFirestore({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }));
    return ref.id;
  }

  async update(storeId: string, id: string, data: Partial<Product>): Promise<void> {
    await adminDb
      .collection(this.ROOT).doc(storeId)
      .collection(this.SUB).doc(id)
      .update(cleanForFirestore({ ...data, updatedAt: FieldValue.serverTimestamp() }));
  }
}

export const productService = new ProductService();
```

## Server Component (page.tsx)

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-session';
import { productService } from '@/features/products/services/product.service';
import { ProductsMain } from '@/features/products/components/products-main';

export const metadata = { title: 'Productos | Dashboard' };

export default async function ProductsPage() {
  const session = await getServerSession();
  if (!session?.storeId) redirect('/sign-in');

  const products = await productService.getAll(session.storeId);
  return <ProductsMain initialProducts={products} />;
}
```

## Client Component con mutacion

`useTransition` para feedback de pending. Deshabilitar el boton mientras `isPending` — esto previene el doble-submit (hallazgo conocido en el import de Excel).

```typescript
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { deleteProductAction } from '../actions/product.actions';

export function ProductCard({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (isPending) return;            // guard sincronico contra doble click
    if (!confirm('¿Eliminar?')) return;
    startTransition(async () => {
      const result = await deleteProductAction(product.id);
      if (result.success) toast.success('Eliminado');
      else toast.error(result.errors._form?.[0] ?? 'Error');
    });
  };

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? 'Eliminando…' : 'Eliminar'}
    </button>
  );
}
```

## Form con React Hook Form + Zod

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTransition } from 'react';
import { productFormSchema, type ProductFormData } from '../schemas/product.schema';
import { createProductAction } from '../actions/product.actions';

export function ProductForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors }, setError } =
    useForm<ProductFormData>({ resolver: zodResolver(productFormSchema) });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await createProductAction(data);
      if (result.success) onSuccess?.();
      else Object.entries(result.errors).forEach(([field, msgs]) =>
        setError(field as keyof ProductFormData, { message: msgs[0] }));
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      <button disabled={isPending}>{isPending ? 'Guardando…' : 'Crear'}</button>
    </form>
  );
}
```

## loading.tsx y skeletons

Existen `loading.tsx` en `app/dashboard/`, `app/dashboard/products/`, `app/dashboard/categories/`, `app/onboarding/`. Agregar uno por cada ruta nueva que haga fetch server (p. ej. faltan en `sells`, `qr`, `profile`).

```typescript
// src/app/dashboard/sells/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function SellsLoading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
```

Skeletons reutilizables van en `src/components/ui/` (base `skeleton.tsx` de shadcn). Skeletons especificos existentes: `ProductSkeleton`, `QRModuleSkeleton`.

## Checklist de refactor

1. Identificar o crear el schema Zod (una sola fuente de tipos y validacion).
2. Mover validaciones duplicadas al schema.
3. Consolidar acceso Firestore en un service server con Admin SDK.
4. Reemplazar fetch client (`useEffect`) por fetch en Server Component + Server Actions.
5. Pasar `initialData` por props al componente client.
6. Agregar `revalidatePath` en todas las mutaciones.
7. Quitar cualquier store Zustand con datos de negocio.
8. Reemplazar `ActionResponse` redeclarado por el import de `@/features/auth/auth.types`.
9. Agregar `loading.tsx` si la ruta hace fetch server.
10. Correr `npm run tsc` y `npm run build`.
