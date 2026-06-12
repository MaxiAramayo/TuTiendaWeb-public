# 📚 Documentación de TuTiendaWeb

Índice de la documentación del proyecto. **Verificado contra el código el 2026-06-12.**

> Para el contexto global y las reglas de arquitectura obligatorias, ver
> [`CLAUDE.md`](../CLAUDE.md) y [`AGENTS.md`](../AGENTS.md) en la raíz del repo.

---

## 🧭 Negocio y producto (`negocio/`)

| Documento | Descripción |
|---|---|
| [contexto-producto.md](negocio/contexto-producto.md) | **Fuente de verdad del alcance del producto.** Qué es, qué hace y qué NO hace. Pensado para alimentar IAs y material de marketing. |
| [analisis-general.md](negocio/analisis-general.md) | Análisis funcional de alto nivel: objetivo, actores, alcance y stack. |
| [requerimientos.md](negocio/requerimientos.md) | Requerimientos funcionales (RF) y no funcionales (RNF). |
| [casos-de-uso.md](negocio/casos-de-uso.md) | Casos de uso por módulo (auth, productos, ventas, pedidos, tienda, reportes). |

## 🏗️ Arquitectura y módulos (`arquitectura/`)

| Documento | Descripción |
|---|---|
| [arquitectura-general.md](arquitectura/arquitectura-general.md) | Patrones server-first de Next.js 15: Server Actions, Zod, Zustand, Firebase dual-SDK. |
| [auth.md](arquitectura/auth.md) | Módulo de autenticación (patrón híbrido Client/Admin SDK, cookie de sesión, custom claims). |
| [suscripciones.md](arquitectura/suscripciones.md) | **Sistema de suscripciones con MercadoPago** (trial → pro, webhook, scheduler). Autoridad sobre el tema. |
| [store-settings.md](arquitectura/store-settings.md) | Arquitectura del módulo de configuración de tienda (perfil). |
| [sells.md](arquitectura/sells.md) | Estructura de datos `Sale` y refactor del módulo de ventas. |
| [data-models.md](arquitectura/data-models.md) | Modelos de datos de Firestore (store, categories, products) con ejemplos. |
| [firestore-paths.md](arquitectura/firestore-paths.md) | Árbol de colecciones/subcolecciones y diseño de paths. |

## 🚀 Onboarding (`onboarding/`)

| Documento | Descripción |
|---|---|
| [onboarding-architecture.md](onboarding/onboarding-architecture.md) | Arquitectura del wizard de onboarding (schema flat, server actions). |
| [onboarding-functionality.md](onboarding/onboarding-functionality.md) | Funcionalidad y pasos del onboarding. |
| [onboarding-design-ux.md](onboarding/onboarding-design-ux.md) | Decisiones de diseño y UX. |

## 🐞 Hallazgos / errores encontrados (`hallazgos/`)

| Documento | Descripción |
|---|---|
| [auditoria-actions-2026-06-12.md](hallazgos/auditoria-actions-2026-06-12.md) | Auditoría de Server Actions: hallazgos abiertos (validación de ventas públicas, suscripción, deuda técnica). |

## 🧰 Guías (`guias/`)

| Documento | Descripción |
|---|---|
| [emulador-local.md](guias/emulador-local.md) | Cómo correr la app contra los emuladores de Firebase (Auth/Firestore/Storage). |

## 📣 Marketing (`marketing/`)

Material comercial (salidas de skills de marketing). No es documentación técnica del producto.

| Documento | Descripción |
|---|---|
| [landing-page.md](marketing/landing-page.md) | Guía de reescritura de la landing. |
| [launch-playbook.md](marketing/launch-playbook.md) | Plan de lanzamiento de 90 días. |
| [marketing-audit.md](marketing/marketing-audit.md) | Auditoría de marketing. |
| [meta-ads-playbook.md](marketing/meta-ads-playbook.md) | Playbook de Meta Ads + redes. |
| [guia-contenido-comercial.md](marketing/guia-contenido-comercial.md) | Guía de contenido para Instagram/Facebook/WhatsApp. |
| [plan-accion-seo-marketing.md](marketing/plan-accion-seo-marketing.md) | Plan de acción de SEO y marketing. |

---

## 🧹 Cambios de esta limpieza (2026-06-12)

**Reorganización:** la documentación pasó de un solo nivel plano a subcarpetas por
tema (`negocio/`, `arquitectura/`, `guias/`, `marketing/`, `onboarding/`). Los archivos
de marketing que estaban en la raíz del repo se movieron a `docs/marketing/`. Nombres
normalizados a kebab-case.

**Eliminados (obsoletos, superados por su reemplazo):**

- `docs/auth-arquitecture.md` → describía una migración ya hecha, una ruta
  `api/auth/sync-token` y una cookie `idToken` que no existen. Reemplazado por
  [arquitectura/auth.md](arquitectura/auth.md).
- `docs/FIREBASE_FUNCTIONS_MP.md` → describía planes `basic/pro/enterprise`, un
  scheduler diario y las functions dentro de este repo. La integración real (planes
  `trial`/`pro`, scheduler horario, repo `Funciones-google-tutiendaweb`) está en
  [arquitectura/suscripciones.md](arquitectura/suscripciones.md).
- `src/features/dashboard/modules/store-settings/README.md` → documentaba un store
  Zustand (`api/profileStore.ts`) ya borrado. Reemplazado por un puntero a
  [arquitectura/store-settings.md](arquitectura/store-settings.md).
