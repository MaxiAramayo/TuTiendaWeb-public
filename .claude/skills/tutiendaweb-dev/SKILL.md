---
name: tutiendaweb-dev
description: Guia de desarrollo para TuTiendaWeb (SaaS Next.js 15 + Firebase). Usar al crear features o modulos, refactorizar, escribir Server Actions, schemas Zod, services con Firebase Admin/Client, componentes server/client, loading states, o al planear tests y code review de cambios fuertes. Cubre arquitectura server-first, el patron AUTH/VALIDATE/MUTATE/REVALIDATE para Server Actions, estructura de carpetas por feature, modelo de datos Firestore, integraciones (WhatsApp, MercadoPago) y reglas obligatorias del repo.
license: MIT
---

# TuTiendaWeb — Guia de desarrollo

## Cuando usarme

Usame para cualquier trabajo de codigo en este repo: crear o refactorizar features, escribir Server Actions, definir schemas Zod, tocar Firebase (Firestore/Storage/Admin/Client), armar componentes server/client, loading states, o planear tests y code review.

**Fuente de verdad del repo:** [`AGENTS.md`](../../../AGENTS.md) y [`CLAUDE.md`](../../../CLAUDE.md) en la raiz, y [`docs/`](../../../docs/) (indice en [`docs/README.md`](../../../docs/README.md)). Si algo en esta skill contradice esos archivos, ellos ganan — avisar para corregir la skill.

## El proyecto

SaaS para comercios (restaurantes, pymes): gestionan ventas, productos, clientes, reportes y un **catalogo online** compartible por WhatsApp. Dos superficies: **dashboard** interno (protegido) y **catalogo publico** por tienda. Modelo por suscripcion (trial 7 dias → plan `pro` por MercadoPago).

Stack: Next.js 15 (App Router, Server Components, Server Actions), React 18, TypeScript, Tailwind + Radix/shadcn, Zustand (solo UI), React Hook Form + Zod, Firebase (Firestore/Auth/Storage, Admin + Client SDK). Detalle completo en [`AGENTS.md`](../../../AGENTS.md).

## Comandos obligatorios

```bash
npm run dev              # desarrollo
npm run lint             # ESLint
npm run tsc              # type-check (tsc --noEmit)
npm run build            # build de produccion
npm run emulators        # Firebase local (Auth/Firestore/Storage) — ver references/testing-and-review.md
npm run seed:emulator    # siembra datos demo en el emulador
```

**Regla critica:** despues de cualquier cambio de codigo correr `npm run tsc` y `npm run build`. No entregar codigo que no buildea. CI (`.github/workflows/ci.yml`) corre `lint` + `tsc` en PRs y push a `main`; **no hay build ni tests en CI**.

## Arquitectura server-first (obligatoria)

1. Lectura inicial en **Server Components** (`async function page()`). Nunca `useEffect` para fetch inicial de datos.
2. Mutaciones SOLO en **Server Actions** (`'use server'`). No API Routes para CRUD interno (solo integraciones externas).
3. **Zod** es la fuente unica de validacion y tipos (`z.infer`). No duplicar tipos a mano.
4. **Firebase Admin SDK** solo en server; **Client SDK** solo en browser (auth UI, listeners).
5. **Zustand** solo para estado de UI (modals, tabs, filtros, sidebar). No para datos de negocio. *Excepcion documentada:* el carrito del catalogo publico (`src/features/store/store/cart.store.ts`).
6. **No barrels** (`index.ts`) en ningun nivel — imports directos siempre.
7. Toda Server Action retorna `ActionResponse<T>` **importado** de `@/features/auth/auth.types` (`src/features/auth/auth.types.ts:144`). Nunca redeclararlo localmente.

### Responsabilidades por capa

| Capa | Ubicacion | Rol | Entorno |
|------|-----------|-----|---------|
| Rutas | `src/app/**/page.tsx` | Fetch inicial + metadata | Server |
| Actions | `features/**/actions/*.actions.ts` | AUTH → VALIDATE → MUTATE → REVALIDATE | Server |
| Services | `features/**/services/*.service.ts` | Acceso Firestore via Admin SDK | Server |
| Schemas | `features/**/schemas/*.schema.ts` | Zod: tipos + validacion | Compartido |
| Componentes | `features/**/components/*.tsx` | UI interactiva | Client |
| Stores | `features/**/store/*.store.ts` o `src/stores/*.store.ts` | Estado UI (Zustand) | Client |

## Donde vive cada cosa

- **Features top-level:** `src/features/{auth,products,store,user,onboarding,landing}/`
- **Modulos del dashboard:** `src/features/dashboard/modules/{sells,store-settings,qr,overview}/`
- `src/app` rutas/layouts · `src/lib` (firebase, `auth/server-session.ts`, utils) · `src/stores` Zustand UI · `src/components/ui` shadcn + skeletons · `src/shared/validations` schemas comunes.

Naming: `{dominio}.actions.ts`, `{dominio}.service.ts`, `{dominio}.schema.ts`, `{dominio}.types.ts`, `{dominio}.store.ts`. Componentes en PascalCase `.tsx` (el modulo `products` usa kebab-case: inconsistencia conocida, **no replicar**).

## Patron de Server Action (canonico)

Plantilla para toda mutacion. Notar que `ActionResponse` se **importa**, no se redeclara:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/server-session';
import type { ActionResponse } from '@/features/auth/auth.types';
import { mySchema } from '../schemas/my.schema';
import { myService } from '../services/my.service';

export async function createSomethingAction(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session?.storeId) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }

  // 2. VALIDATE (siempre, incluso para ventas publicas del catalogo)
  const validation = mySchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    // 3. MUTATE — el service usa session.storeId, nunca un storeId del cliente
    const id = await myService.create(session.storeId, validation.data);

    // 4. REVALIDATE
    revalidatePath('/dashboard/<ruta>');

    return { success: true, data: { id } };
  } catch (error) {
    return { success: false, errors: { _form: ['Error al guardar'] } };
  }
}
```

Plantillas completas (schema Zod, service Admin, Server Component, Client Component con `useTransition`, form con React Hook Form, `loading.tsx`/skeleton) en **[references/patterns.md](references/patterns.md)**.

## Flujo para crear o refactorizar un modulo

Orden de implementacion: **schema → service → action → page → componentes → loading**.

1. Definir el schema Zod en `schemas/` — fuente de verdad de tipos y validacion.
2. Crear el service con Firebase Admin en `services/` — solo acceso a datos, recibe `storeId`.
3. Crear las actions en `actions/` con el patron AUTH → VALIDATE → MUTATE → REVALIDATE, retornando `ActionResponse` importado.
4. Crear `page.tsx` server que fetchea datos y pasa `initialData` por props.
5. Crear los componentes client (`'use client'`) que llaman actions con `useTransition`; deshabilitar el boton mientras `isPending` (evita doble-submit).
6. Agregar `loading.tsx` con skeleton apropiado en rutas con fetch server.
7. No crear barrels. Importar `ActionResponse` de `auth.types`. Documentar el modulo en `docs/`.

Al refactorizar: ver el checklist de refactor en [references/patterns.md](references/patterns.md).

## Modelo de datos, roles e integraciones

Colecciones Firestore, estructura `Sale`, `ActionResponse`, roles/ownership, WhatsApp, MercadoPago, Storage y variables de entorno: ver **[references/architecture.md](references/architecture.md)**.

Resumen minimo:
- Raiz: `/users/{userId}`, `/stores/{storeId}`. Subcolecciones: `categories`, `tags`, `products`, `sells`.
- Permisos: lectura publica de catalogo (`stores/products/categories/tags`); escritura solo owner via `isStoreOwner(storeId)` (compara `request.auth.uid` con `metadata.ownerId`). Ventas: `create` publico (catalogo), resto solo owner.
- Rol real: `owner` (asignado en `completeRegistrationAction`). `admin`/`employee` existen como concepto pero sin reglas propias.

## Tests y code review de cambios fuertes

Para planear tests, validar cambios localmente con el emulador, o hacer code review de un cambio fuerte (auth, ventas/checkout, import masivo, suscripcion, reglas Firestore), leer **[references/testing-and-review.md](references/testing-and-review.md)**.

Lo esencial: **no hay runner de tests configurado todavia** (CI solo corre lint + tsc). Ese archivo explica como montar Vitest, que testear (schemas Zod y Server Actions), como verificar con el emulador, cuando correr `/code-review` y `/security-review`, y la checklist de revision con los riesgos abiertos conocidos del repo.

## Lo que NO se debe hacer

- `useEffect` para fetch inicial de datos.
- Firebase Client SDK para leer/escribir datos de negocio (solo Admin SDK en server).
- Barrels (`index.ts`) en cualquier nivel.
- Logica de negocio en componentes client.
- Redeclarar `ActionResponse` localmente (importarlo de `auth.types`).
- Duplicar validaciones fuera del schema Zod.
- Zustand para datos de productos, ventas o configuracion de tienda.
- Confiar en `storeId`/`role` que vengan del cliente — usar siempre `getServerSession()`.
- Persistir ventas publicas sin validar y recalcular precios en el servidor.
