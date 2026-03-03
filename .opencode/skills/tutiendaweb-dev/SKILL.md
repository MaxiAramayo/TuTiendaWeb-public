---
name: tutiendaweb-dev
description: Guia completa para desarrollar, refactorizar y agregar features en TuTiendaWeb respetando arquitectura server-first, Server Actions, Zod, Firebase Admin/Client y estructura de modulos por feature.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: feature-development
---

## Que soy

Soy la guia de desarrollo para TuTiendaWeb. Usame cuando tengas que:
- Crear una nueva feature o modulo
- Refactorizar codigo existente
- Agregar Server Actions
- Definir schemas Zod o tipos de datos
- Trabajar con Firebase (Firestore, Storage, Admin SDK)
- Implementar loading states y skeletons

---

## El proyecto

TuTiendaWeb es una plataforma SaaS para que comercios (principalmente restaurantes y pymes) gestionen ventas, productos, clientes, reportes y un catalogo online compartible por WhatsApp.

Panel interno (dashboard) + catalogo publico por tienda.

---

## Stack completo

**Frontend**
- Next.js 15 (App Router, Server Components, Server Actions)
- React 18 + TypeScript (strict)
- Tailwind CSS + tailwindcss-animate
- Radix UI + shadcn/ui (componentes base en `src/components/ui/`)
- Framer Motion (animaciones)
- Sonner (toasts en dashboard) + react-hot-toast (algunos modulos legacy)
- Lucide + react-icons (iconos)

**Estado y formularios**
- Zustand (solo estado UI: modales, tabs, filtros, sidebar)
- React Hook Form + Zod (formularios y validacion)

**Backend y persistencia**
- Firebase Firestore (base de datos)
- Firebase Auth (autenticacion)
- Firebase Storage (imagenes)
- Firebase Admin SDK (server-side: Server Actions y Server Components)
- Firebase Client SDK (browser: auth UI y listeners)

**Export / documentos**
- jsPDF (exportar PDFs)
- xlsx (exportar Excel)
- QRCode + qrcode.react (menu QR)

**Config clave (`next.config.js`)**
- `serverExternalPackages: ['firebase-admin']`
- `serverActions.bodySizeLimit: '5mb'`
- `optimizePackageImports: ['@firebase/app', '@firebase/auth', '@firebase/firestore']`
- `remotePatterns` para `firebasestorage.googleapis.com`

---

## Arquitectura obligatoria (server-first)

### Principios
1. Lectura inicial en Server Components (nunca useEffect para fetch)
2. Mutaciones SOLO en Server Actions (`'use server'`)
3. No API Routes para CRUD interno (solo para integraciones externas como MercadoPago)
4. Zod como fuente unica de validacion y tipos
5. Firebase Admin SDK en el server, Client SDK solo en browser
6. Zustand solo para estado UI (no datos de negocio)
7. No barrels (`index.ts`) — imports directos siempre

### Responsabilidades por capa

| Capa | Ubicacion | Rol |
|------|-----------|-----|
| Rutas | `src/app/**/page.tsx` | Fetch inicial + metadata (server) |
| Actions | `src/features/**/actions/*.actions.ts` | Mutaciones + validacion + revalidatePath |
| Services | `src/features/**/services/*.service.ts` | Acceso Firestore con Admin SDK |
| Componentes | `src/features/**/components/*.tsx` | UI interactiva (client) |
| Stores | `src/stores/*.store.ts` | Estado UI global (Zustand) |
| Schemas | `src/features/**/schemas/*.schema.ts` | Zod: tipos + validacion |

---

## Estructura de un modulo nuevo

Ubicacion: `src/features/<nombre-modulo>/`

```
<nombre-modulo>/
├── actions/
│   └── <modulo>.actions.ts       # Server Actions ('use server')
├── schemas/
│   └── <modulo>.schema.ts        # Zod schema + tipos inferidos
├── services/
│   └── <modulo>.service.ts       # Firebase Admin SDK (server only)
├── components/
│   └── <ModuloMain>.tsx          # Componente principal ('use client')
├── ui/
│   └── *.tsx                     # Piezas de UI auxiliares
├── utils/
│   └── <modulo>.utils.ts         # Helpers y mapeos
└── types/
    └── components.ts             # Tipos de props (solo si hace falta)
```

---

## Patron de Server Action (AUTH → VALIDATE → MUTATE → REVALIDATE)

Plantilla obligatoria para toda accion de mutacion:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/server-session';
import { mySchema } from '../schemas/my.schema';
import { myService } from '../services/my.service';

type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export async function createSomethingAction(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session?.storeId) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }

  // 2. VALIDATE
  const validation = mySchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // 3. MUTATE
    const id = await myService.create(session.storeId, validation.data);

    // 4. REVALIDATE
    revalidatePath('/dashboard/<ruta>');

    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, errors: { _form: ['Error al guardar'] } };
  }
}
```

---

## Patron de Zod Schema (fuente unica de verdad)

```typescript
import { z } from 'zod';

export const mySchema = z.object({
  name: z.string().min(2).max(100),
  price: z.number().min(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

// Los tipos SIEMPRE se infieren del schema, nunca se definen aparte
export type MyFormData = z.infer<typeof mySchema>;
export type MyCreateData = z.infer<typeof mySchema>;
```

---

## Patron de Service con Firebase Admin

```typescript
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

class MyService {
  private readonly COLLECTION = 'stores';

  async getAll(storeId: string) {
    const snap = await adminDb
      .collection(this.COLLECTION)
      .doc(storeId)
      .collection('my-subcollection')
      .get();

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async create(storeId: string, data: MyFormData): Promise<string> {
    const ref = await adminDb
      .collection(this.COLLECTION)
      .doc(storeId)
      .collection('my-subcollection')
      .add({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    return ref.id;
  }
}

export const myService = new MyService();
```

---

## Patron de Server Component (page.tsx)

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-session';
import { myService } from '@/features/my-module/services/my.service';
import { MyModuleClient } from '@/features/my-module/components/MyModuleClient';

export default async function MyPage() {
  const session = await getServerSession();
  if (!session?.storeId) redirect('/sign-in');

  const initialData = await myService.getAll(session.storeId);

  return <MyModuleClient initialData={initialData} />;
}
```

---

## Patron de Client Component

```typescript
'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { createSomethingAction } from '../actions/my.actions';

interface Props {
  initialData: MyData[];
}

export function MyModuleClient({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleCreate = (data: MyFormData) => {
    startTransition(async () => {
      const result = await createSomethingAction(data);
      if (result.success) {
        toast.success('Creado correctamente');
      } else {
        toast.error(result.errors._form?.[0] ?? 'Error');
      }
    });
  };

  return (
    // UI aqui
  );
}
```

---

## Estructura de datos Firebase (colecciones)

```
/stores/{storeId}
  basicInfo:    { name, description, slug, type }
  contactInfo:  { whatsapp, website, email }
  address:      { street, city, province, country, zipCode }
  socialLinks:  { instagram, facebook, twitter, tiktok }
  theme:        { logoUrl, bannerUrl, primaryColor, secondaryColor, accentColor, fontFamily, style, buttonStyle }
  schedule:     { monday..sunday: { closed, periods: [{ open, close, nextDay }] } }
  settings:     { currency, language, paymentMethods[], deliveryMethods[] }
  subscription: { active, plan, startDate, endDate, trialUsed }
  metadata:     { createdAt, updatedAt, version, status }

/stores/{storeId}/products/{productId}
  name, price, categoryId, tags[], variants[], status, imageUrls[], storeId, createdAt, updatedAt

/stores/{storeId}/categories/{categoryId}
  name, slug, parentId, storeId, isActive, createdAt, updatedAt

/stores/{storeId}/tags/{tagId}
  name, storeId, createdAt, updatedAt

/stores/{storeId}/sells/{sellId}
  orderNumber, storeId, source
  customer:  { name, phone, email }
  items:     [{ productName, quantity, unitPrice, subtotal, extras? }]
  delivery:  { method, address, notes }
  payment:   { method, total }
  totals:    { subtotal, discount, total }
  notes, metadata: { createdAt, updatedAt, createdBy }

/users/{userId}
  uid, email, displayName, storeId, role, createdAt
```

---

## Tipos compartidos importantes

```typescript
// Respuesta de toda Server Action
type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

// Metodo de pago
interface PaymentMethod { id: string; name: string; enabled: boolean; instructions?: string; }

// Metodo de entrega
interface DeliveryMethod { id: string; name: string; enabled: boolean; price?: number; instructions?: string; }

// Venta (nueva estructura)
interface Sale {
  id: string;
  orderNumber: string;
  storeId: string;
  source: 'local' | 'web' | 'whatsapp';
  customer: { name: string; phone?: string; email?: string };
  items: SaleItem[];
  delivery: { method: 'retiro' | 'delivery'; address?: string; notes?: string };
  payment: { method: 'efectivo' | 'transferencia' | 'mercadopago'; total: number };
  totals: { subtotal: number; discount: number; total: number };
  notes?: string;
  metadata: { createdAt: Date; updatedAt: Date; createdBy?: string };
}

// Reglas de Firebase Storage
// Limite: 5MB, solo image/*
// Ruta: stores/{storeId}/[logo|banner|products/...]
```

---

## Reglas de Firestore (permisos clave)

- `stores/*`: lectura publica, escritura solo owner
- `stores/*/products`: lectura publica, escritura solo owner
- `stores/*/categories`: lectura publica, escritura solo owner
- `stores/*/tags`: lectura publica, escritura solo owner
- `stores/*/sells`: escritura publica (pedidos catalogo), lectura/update/delete solo owner
- `users/*`: solo el propio usuario

No romper lectura publica del catalogo sin revisar el front del catalogo publico.

---

## Loading states y Skeletons

**Que hay implementado:**
- `src/app/dashboard/products/loading.tsx` (unico loading.tsx existente)
- `src/features/store/modules/products/components/ProductSkeleton.tsx`
- `src/features/dashboard/modules/qr/components/QRModuleSkeleton.tsx`
- `src/components/ui/skeleton.tsx` (componente base Skeleton de shadcn)

**Que falta (agregar en este orden de prioridad):**
- `src/app/dashboard/sells/loading.tsx`
- `src/app/dashboard/profile/loading.tsx`
- `src/app/dashboard/qr/loading.tsx`

**Como implementar correctamente:**
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

Para botones de mutacion en Client Components: usar `useTransition` y deshabilitar el boton mientras `isPending`.

---

## Checklist de refactor correcto

1. Identificar schema Zod actual o crear uno nuevo
2. Mover validaciones duplicadas al schema (una sola fuente)
3. Consolidar acceso Firestore en service server con Admin SDK
4. Reemplazar fetch client (useEffect) por Server Actions
5. Actualizar UI para recibir `initialData` como prop (server)
6. Agregar `revalidatePath` en todas las mutaciones
7. Quitar cualquier Zustand store con datos de negocio
8. Agregar `loading.tsx` si la ruta hace fetch server

---

## Lo que NO se debe hacer

- No usar `useEffect` para fetch inicial de datos
- No usar Firebase Client SDK para leer/escribir datos de negocio
- No crear barrels (`index.ts`) en ningun nivel
- No poner logica de negocio en componentes client
- No poner credenciales Firebase en el cliente (solo vars `NEXT_PUBLIC_`)
- No duplicar validaciones (solo en Zod schema)
- No usar Zustand para datos de productos, ventas o configuracion de tienda
