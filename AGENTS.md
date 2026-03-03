# TuTiendaWeb - Guia para agentes

## Proposito del proyecto
TuTiendaWeb es una plataforma SaaS para que comercios (principalmente restaurantes y pymes) gestionen ventas, productos, clientes, reportes y un catalogo online compartible por WhatsApp. Cada tienda tiene su configuracion, catalogo y ventas. El sistema combina panel interno (dashboard) y catalogo publico.

## Comandos principales

```bash
npm run dev        # servidor de desarrollo (Next.js)
npm run build      # build de produccion — SIEMPRE correr antes de considerar una tarea terminada
npm run lint       # ESLint
npm run tsc        # TypeScript sin emitir (type-check)
firebase emulators:start  # emuladores locales (Auth, Firestore, Storage)
```

Regla critica: despues de cualquier cambio de codigo, correr `npm run build` y `npm run tsc`. Si hay errores, corregirlos antes de terminar. No entregar codigo que no buildea.

## Stack y tecnologias (todas las relevantes)

Frontend y plataforma
- Next.js 15 (App Router, Server Components, Server Actions)
- React 18 + TypeScript
- Tailwind CSS + tailwindcss-animate
- Radix UI + shadcn/ui (componentes base)
- Framer Motion (animaciones)
- Sonner + react-hot-toast (toasts)
- Lucide + react-icons (iconos)

Estado y formularios
- Zustand (UI state por defecto; ver excepcion abajo)
- React Hook Form + Zod (formularios y validacion)

Backend y servicios
- Firebase: Firestore, Auth, Storage, Functions
- Firebase Admin SDK (operaciones server-side)
- Firebase Client SDK (auth en cliente, listeners)

Otros
- jsPDF (PDF)
- xlsx (exportaciones)
- QRCode + qrcode.react (menu QR)

Config
- next.config.js: remotePatterns para Storage, serverExternalPackages para firebase-admin, serverActions bodySizeLimit 5mb, optimizePackageImports para Firebase

## Arquitectura del software (server-first)

Principios obligatorios
- Server Components para lectura inicial (fetch en el servidor)
- Mutaciones solo en Server Actions ('use server')
- No API Routes tradicionales para CRUD interno (salvo integraciones puntuales)
- No fetch inicial en useEffect
- Zustand solo para estado de UI (no datos de negocio)
- Zod como fuente unica de verdad para tipos y validacion
- No barrels (index.ts) para evitar ciclos y bundle extra

Responsabilidades por capa
- app/**/page.tsx: fetch inicial + metadata (server)
- features/**/actions/*.actions.ts: mutaciones + validacion + revalidatePath (server)
- features/**/services/*.service.ts: acceso Firestore/Admin (server)
- features/**/components/*.tsx: UI y UX (client)
- store/**.store.ts: estado UI global (client)

Patron de accion (AUTH -> VALIDATE -> MUTATE -> REVALIDATE)
1) getServerSession (auth y permisos)
2) Zod safeParse
3) Service con Firebase Admin
4) revalidatePath
5) Respuesta tipada ActionResponse

## Estructura general de carpetas

- src/app: rutas y layouts (Server Components por defecto)
- src/features: dominios (auth, products, sells, store-settings, etc.)
- src/components: UI compartida (skeletons, botones, inputs)
- src/lib: firebase, auth server-session, utils
- src/stores: Zustand (UI state)
- docs: documentacion funcional, tecnica y modelos

## Almacenamiento de informacion (Firebase)

Estrategia dual SDK
- Admin SDK en server (Server Actions, Server Components)
- Client SDK en browser (auth UI y listeners)

Colecciones raiz
- /users/{userId}
- /stores/{storeId}

Subcolecciones por tienda
- /stores/{storeId}/categories
- /stores/{storeId}/tags
- /stores/{storeId}/products
- /stores/{storeId}/sells

Claves de datos (resumen)
- stores: basicInfo, contactInfo, address, socialLinks, theme, schedule, settings, subscription, metadata
- products: name, price, categoryId, tags, variants, status, imageUrls
- sells: snapshot de items, totales, metodos de pago/entrega, estado, cliente

Reglas importantes
- Lecturas publicas de catalogo (products, categories, tags)
- Escrituras solo para owner (segun rules actuales)
- Ventas publicas: allow create si data valida (para pedidos desde catalogo)

Storage
- Archivos bajo /stores/{storeId}/... (logos, banners, productos)
- Regla: imagenes publicas, escritura solo owner
- Limite 5MB y contentType image/*

## Autenticacion

Patron hibrido
- Cliente: Firebase Auth (login/register/google)
- Servidor: verificacion con Admin SDK + cookie httpOnly
- Custom claims: storeId, role
- getServerSession() siempre que se necesite permiso en server

Evitar
- Tokens en localStorage
- Logica auth en client components (solo UI)

## Buenas practicas (Next.js, SSR, Actions)

Server Components
- Default: server components en rutas
- Client Components solo donde hay interactividad real
- Fetch de datos inicial en el servidor

Server Actions
- Definir en features/**/actions
- Tipar ActionResponse
- Validar con Zod
- Revalidar rutas afectadas

SSR y cache
- Usar revalidatePath despues de mutaciones
- No usar useEffect para fetch inicial

## Buenas practicas de Zustand (UI state por defecto)

Usar para
- Sidebar, tabs, modals, filtros, preferencias

No usar para
- Datos de negocio (productos, ventas, usuarios)
- Estado de forms (usar React Hook Form)
- Loading de fetch inicial (usar server + Suspense/loading.tsx)

Excepcion actual
- El carrito del catalogo publico usa Zustand para datos de negocio (ver `src/features/store/store/cart.store.ts`). Si se mantiene esta regla, documentar el motivo o migrar a server state.

Patrones recomendados
- Selectores especificos para evitar re-renders
- Store factory para SSR en auth (crear store por request)
- persist solo para preferencias de usuario

## Skeletons y estados de carga (faltantes, implementar)

Contexto
Existe `loading.tsx` en productos, pero faltan estados de carga consistentes en otras rutas con fetch server. Se recomienda agregar loading.tsx por ruta y skeletons compartidos.

Lineamientos
- Crear skeletons reutilizables en src/components/ui/skeletons
- Usar loading.tsx en rutas que consulten Firestore
- En componentes client con acciones, usar useTransition y estados "pending" para botones

Ejemplos de implementacion
- app/(dashboard)/products/loading.tsx con TableSkeleton
- app/(dashboard)/sells/loading.tsx con CardSkeleton
- app/(dashboard)/profile/loading.tsx con FormSkeleton

## Variables de entorno

Archivo: `.env.local` (no commitear, derivar de `env.example`).

Variables publicas (cliente + servidor):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Variables privadas (solo servidor — Admin SDK, NO estan en env.example):
```
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Reglas
- Variables `NEXT_PUBLIC_*` quedan expuestas al browser; no poner secretos ahi.
- `FIREBASE_PRIVATE_KEY` contiene saltos de linea (`\n`). En Vercel configurar como variable de entorno directamente (no en archivo).
- No agregar variables de entorno sin actualizar `env.example`.

## Tipo ActionResponse

Definicion canonica en `src/features/auth/auth.types.ts:144`:

```ts
export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };
```

Reglas de uso
- Importar SIEMPRE desde `auth.types.ts`. No redeclarar localmente (hay copias locales en varios action files — es deuda tecnica conocida, no replicar).
- Toda Server Action debe retornar `Promise<ActionResponse<T>>`.
- En el cliente, discriminar por `result.success` antes de acceder a `result.data` o `result.errors`.

## Convenciones de naming

Archivos
- Actions: `{dominio}.actions.ts` en `features/{feature}/actions/`
- Services: `{dominio}.service.ts` (server) o `{dominio}.server-service.ts` (server-only) o `{dominio}-client.service.ts` (client-only)
- Schemas (Zod): `{dominio}.schema.ts` en `features/{feature}/schemas/`
- Types: `{dominio}.types.ts` en `features/{feature}/` o `features/{feature}/types/`
- Stores (Zustand): `{dominio}.store.ts` en `features/{feature}/store/` o `src/stores/`
- Components: PascalCase `.tsx`. Excepcion: modulo products del dashboard usa kebab-case (inconsistencia, no replicar en modulos nuevos)

Rutas de features anidadas
- Modulos del dashboard viven bajo `src/features/dashboard/modules/{modulo}/`
- Cada modulo tiene: `actions/`, `services/`, `schemas/`, `types/`, `stores/`, `components/`

Nota: existe inconsistencia en el sufijo de types (`store.types.ts` vs `store.type.ts`). Usar el plural `{dominio}.types.ts` en modulos nuevos.

## Roles y permisos

Roles definidos (custom claims de Firebase Auth)
- `owner`: dueno de la tienda. Tiene acceso completo al dashboard. Se asigna en `completeRegistrationAction()`.
- `admin`: definido en el sistema pero sin reglas Firestore activas todavia.
- `employee`: definido en el sistema pero sin reglas Firestore activas todavia.
- `user`: valor transitorio en Firestore, asignado al registrarse antes de crear la tienda. No es un rol operativo.

Verificacion en servidor
- Usar `getServerSession()` de `src/lib/auth/server-session.ts` en toda Server Action y Server Component que requiera permisos.
- El session object incluye: `userId`, `storeId`, `role`, `email`.
- Firestore rules usan `isStoreOwner(storeId)` que compara `request.auth.uid` con el campo `ownerId` del store document. No hay middleware de Next.js.

Evitar
- Confiar en el rol solo desde el cliente.
- Escribir en Firestore directamente desde client components (usar Server Actions).

## Integraciones externas

WhatsApp (activa)
- Integracion principal para entrega de pedidos del catalogo publico.
- `checkout.actions.ts`: `formatWhatsAppMessage()` construye el mensaje de orden, `processCheckoutAction()` devuelve `whatsappMessage` y `whatsappNumber`.
- El cliente abre `https://wa.me/{numero}?text={mensaje}` al confirmar el pedido.
- El numero de WhatsApp del comercio se almacena en `contactInfo.whatsapp` del documento de la tienda.
- Schema de validacion: `whatsappSchema` en `src/shared/validations/common.schemas.ts`.

MercadoPago (scaffolding, no activa)
- Aparece como opcion de pago en la UI y en los schemas Zod, pero esta deshabilitada (`enabled: false`).
- No hay SDK de MercadoPago instalado ni webhooks. Es UI preparatoria para integracion futura.
- Cuando se implemente: crear `app/api/mercadopago/` para webhooks y un service dedicado.

Firebase Functions (dependencia instalada, sin uso activo)
- `firebase-functions` v5 esta en `package.json` pero no hay funciones definidas ni deployadas.
- `firebase.json` no tiene clave `"functions"`. No usar hasta que se defina la necesidad.

Cloudinary (dependencia instalada, sin uso activo)
- `cloudinary` v2 esta en `package.json` pero no hay uso en `src/`. Sin integracion activa.

## Guia para crear un nuevo modulo

Checklist minimo para un modulo nuevo en `src/features/dashboard/modules/{modulo}/`:

```
{modulo}/
  actions/{modulo}.actions.ts     # 'use server', patron AUTH->VALIDATE->MUTATE->REVALIDATE
  services/{modulo}.service.ts    # acceso Firestore via Admin SDK
  schemas/{modulo}.schema.ts      # Zod schema + tipos derivados con z.infer
  types/{modulo}.types.ts         # tipos adicionales si es necesario
  components/                     # Client Components ('use client')
```

Pasos
1. Definir el schema Zod en `schemas/` — es la fuente de verdad de tipos y validacion.
2. Crear el service con Firebase Admin en `services/` — solo logica de acceso a datos.
3. Crear las actions en `actions/` con el patron: `getServerSession` -> `safeParse` -> service -> `revalidatePath` -> `ActionResponse`.
4. Crear los componentes en `components/` — llamar actions con `useTransition` para estados pending.
5. Crear `page.tsx` en `src/app/(dashboard)/{modulo}/` que fetchee datos en el servidor y pase props.
6. Agregar `loading.tsx` en la misma ruta con un skeleton apropiado.
7. Importar `ActionResponse` desde `src/features/auth/auth.types.ts`.
8. No crear barrels (`index.ts`).

## Deploy y entorno

Plataforma: Vercel (sin `vercel.json`; usa defaults de Next.js 15).
Region Firestore: `southamerica-east1` (Sao Paulo).

CI/CD (GitHub Actions)
- `.github/workflows/ci.yml`: corre en PRs y pushes a `main`. Pasos: `npm install`, `npm run lint`, `npx tsc --noEmit`. No hace build ni deploy automatico.
- `.github/workflows/codeql.yml`: analisis estatico semanal.

Configuracion de produccion relevante (`next.config.js`)
- `compiler.removeConsole`: elimina `console.*` en produccion.
- `Cache-Control: public, max-age=0, must-revalidate` en todas las rutas.
- `serverExternalPackages: ['firebase-admin']`: firebase-admin no se bundlea en el cliente.
- `serverActions.bodySizeLimit: '5mb'`: necesario para subida de imagenes via Server Actions.

## Modulos relevantes documentados

- Auth: docs/auth/AUTH_MODULE.md
- Arquitectura general: docs/architecture.md
- Store settings: docs/STORE_SETTINGS_ARCHITECTURE.md
- Sells: docs/SELLS_MODULE_REFACTORING.md
- Data models: docs/data-models.md
- Firestore paths: docs/fireStorePath.md

## Recomendaciones de mantenimiento

- No introducir barrels (index.ts)
- Mantener Zod schema como fuente unica
- Centralizar services con Admin SDK
- Aislar integraciones externas (MercadoPago) en app/api o services dedicados
- Documentar nuevos modulos en docs/ y actualizar agent.md si cambia el stack

## Puntos de cuidado

- Reglas Firestore actuales permiten lectura publica de stores/products/categories/tags. No romper este contrato sin revisar el catalogo publico.
- Ventas publicas se crean sin auth (catalogo). Validar y sanitizar.
- Mantener consistencia de custom claims (storeId/role) para permisos.
