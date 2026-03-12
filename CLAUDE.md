# TuTiendaWeb – Contexto Global

## Propósito
TuTiendaWeb es una plataforma SaaS para comercios (restaurantes, pymes) que permite gestionar ventas, productos, clientes, reportes y un catálogo online compartible por WhatsApp. Cada tienda tiene configuración, catálogo y ventas independientes. El sistema combina un panel interno (dashboard) y un catálogo público y se ofrece por suscripción mensual.

## Stack tecnológico
- Frontend: Next.js 15 (App Router, Server Components, Server Actions), React 18, TypeScript, Tailwind CSS, Radix UI, shadcn/ui, Framer Motion, Sonner, react-hot-toast, Lucide, react-icons.
- Estado / formularios: Zustand (solo estado de UI, excepción carrito público), React Hook Form, Zod como fuente única de verdad para validación y tipos.
- Backend / servicios: Firebase (Firestore, Auth, Storage, Functions instalada pero sin uso), Firebase Admin SDK (server), Firebase Client SDK (cliente).
- Integraciones: WhatsApp activo para checkout; MercadoPago preparado en la UI y schemas Zod pero sin SDK ni webhooks aún; jsPDF, xlsx, QRCode, qrcode.react.

## Principios arquitectónicos (obligatorios)
- Server-first: lectura inicial en Server Components; mutaciones solo en Server Actions (`'use server'`).
- Zod como fuente única de tipos y validación; no duplicar tipos manualmente donde se pueda inferir.
- Estado de negocio en el servidor; Zustand se usa solo para estado de UI (sidebar, modals, filtros, etc.). Excepción actual: carrito del catálogo público documentado en su módulo.
- No fetch inicial en `useEffect` para datos principales; usar SSR y Server Actions.
- No barrels (`index.ts`) para evitar ciclos y bundles innecesarios.
- Usar `ActionResponse<T>` importado desde `src/features/auth/auth.types.ts` en todas las Server Actions.

## Estructura de carpetas (visión general)
- `src/app`: rutas y layouts (Server Components por defecto, App Router).
- `src/app/(dashboard)/...`: rutas del panel interno.
- `src/features`: dominios de negocio (auth, products, sells, store-settings, etc.).
- `src/components`: componentes de UI compartidos.
- `src/lib`: configuración de Firebase, `getServerSession`, utils.
- `src/stores`: stores de Zustand para estado de UI.
- `docs`: documentación funcional, técnica y modelos.

## Patrón por capas
- `app/**/page.tsx`: fetch inicial de datos y metadata (server).
- `features/**/actions/*.actions.ts`: mutaciones (AUTH → VALIDATE → MUTATE → REVALIDATE) y retorno `ActionResponse`.
- `features/**/services/*.service.ts`: acceso a Firestore / Admin SDK (solo lógica de datos).
- `features/**/components/*.tsx`: UI y UX (client components).
- `store/**.store.ts` o `src/stores/**.store.ts`: estado de UI global (Zustand).

## Buenas prácticas clave
- Server Components por defecto; marcar client components solo cuando haya interactividad real.
- Validar siempre entradas de usuario con Zod (tanto en formularios como en Server Actions).
- Centralizar servicios que tocan Firestore/Auth/Storage en `services/` con Admin SDK, no desde componentes cliente.
- Evitar duplicar lógica de negocio entre cliente y servidor.
- Skeletons reutilizables en `src/components/ui/skeletons` y `loading.tsx` en rutas con fetch server para estados de carga consistentes.
- Formularios con React Hook Form + Zod; no usar Zustand para estado de forms.
- Selectores específicos en Zustand para minimizar re-render.

## Variables de entorno
- Archivo: `.env.local` (no commitear; derivar de `env.example`).
- Variables públicas (`NEXT_PUBLIC_*`): accesibles en cliente y servidor, no guardar secretos.
- Variables privadas (Admin SDK): solo en servidor (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
- `FIREBASE_PRIVATE_KEY` con saltos de línea (`\n`); en Vercel definir directamente como variable, no en archivo.

## Roles y permisos
- Roles principales via custom claims de Firebase Auth: `owner` (dueño de la tienda, acceso completo al dashboard); `admin` y `employee` existen pero todavía sin reglas específicas en Firestore.
- Verificación de permisos en servidor usando `getServerSession()` (incluye `userId`, `storeId`, `role`, `email`); no confiar solo en lo que llega desde el cliente.
- Reglas Firestore: lectura pública de catálogo (`stores`, `products`, `categories`, `tags`); escritura restringida al owner según rules actuales.

## Almacenamiento (Firestore / Storage)
- Colecciones raíz:
  - `/users/{userId}`
  - `/stores/{storeId}`
- Subcolecciones por tienda:
  - `/stores/{storeId}/categories`
  - `/stores/{storeId}/tags`
  - `/stores/{storeId}/products`
  - `/stores/{storeId}/sells`
- Ventas públicas: se crean sin auth desde el catálogo; siempre validar y sanitizar datos en el servidor.
- Storage: archivos bajo `/stores/{storeId}/...` (logos, banners, productos); imágenes públicas en lectura, escritura solo owner, límite 5 MB y `contentType` `image/*`.

## Autenticación
- Cliente: Firebase Auth (login, registro, Google).
- Servidor: verificación de ID token con Admin SDK + cookie httpOnly; usar `getServerSession()` en Server Actions y Server Components protegidas.
- Custom claims: `storeId` y `role` para permisos por tienda.
- Evitar almacenar tokens en `localStorage` o manejar auth sensible solo en el cliente.

## WhatsApp y pagos
- WhatsApp: método principal para confirmar pedidos desde el catálogo público.
  - Mensaje de pedido generado en `checkout.actions.ts` (`formatWhatsAppMessage()`).
  - El número del comercio se almacena en `contactInfo.whatsapp`.
- MercadoPago:
  - Integración **activa en producción** (suscripción configurada, credenciales y webhooks).
  - Método de pago alternativo al flujo por WhatsApp.
  - Webhooks bajo `app/api/mercadopago/...` y service dedicado de pagos en `features/payments/...` (ajustar a la ruta real del repo).
  - Nunca exponer credenciales de MP al cliente; toda la lógica sensible vive en Server Actions y/o route handlers de `app/api`.

## Deploy y entorno
- Plataforma: Vercel (configuración por defecto de Next.js 15).
- Región Firestore: `southamerica-east1` (São Paulo).
- CI/CD:
  - `.github/workflows/ci.yml`: corre `npm run lint` y `npx tsc --noEmit` en PRs y pushes a `main`.
  - `.github/workflows/codeql.yml`: análisis estático recurrente.
- `next.config.js` relevante:
  - `serverExternalPackages: ['firebase-admin']`.
  - `serverActions.bodySizeLimit: '5mb'` para subida de imágenes.
  - Eliminar `console.*` en producción y cache configurada con `must-revalidate`.

## Convenciones y módulos nuevos
- Naming:
  - Actions: `{dominio}.actions.ts` en `features/{feature}/actions/`.
  - Services: `{dominio}.service.ts` (server), `{dominio}-client.service.ts` (client-only).
  - Schemas: `{dominio}.schema.ts` en `features/{feature}/schemas/`.
  - Types: `{dominio}.types.ts` en `features/{feature}/types/`.
  - Stores: `{dominio}.store.ts` en `features/{feature}/store/` o `src/stores/`.
  - Components: PascalCase `.tsx` (módulo de products del dashboard usa kebab-case, inconsistencia conocida que no debe replicarse).
- Checklist para módulo nuevo:
  1. Definir schema Zod en `schemas/` (fuente de verdad).
  2. Crear service con Admin SDK en `services/`.
  3. Crear actions en `actions/` con patrón AUTH → VALIDATE → MUTATE → REVALIDATE y `ActionResponse`.
  4. Crear componentes en `components/` (client) usando `useTransition` para estados `pending`.
  5. Crear `page.tsx` en `src/app/(dashboard)/{modulo}/` con fetch server.
  6. Agregar `loading.tsx` y skeleton apropiado.
  7. No crear barrels (`index.ts`).
  8. Documentar el módulo en `docs/` y actualizar archivos auxiliares si cambian patrones.

## Puntos de cuidado
- Mantener reglas de lectura pública del catálogo; si se cambian, revisar el flujo del catálogo público.
- Validar y sanitizar siempre las ventas públicas creadas desde el catálogo.
- Mantener la consistencia de custom claims (`storeId`, `role`) y su uso en reglas y lógica de permisos.
- No introducir nuevas fuentes de verdad para tipos fuera de Zod sin documentarlo.

---
Este archivo define el contexto global, la arquitectura y las reglas obligatorias del proyecto TuTiendaWeb. Detalles específicos de módulos, skills o flujos se documentan en archivos dedicados bajo `docs/` y `.claude/`.
