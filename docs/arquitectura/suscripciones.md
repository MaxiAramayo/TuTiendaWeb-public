# Sistema de Suscripciones — Documentación técnica completa

> **Estado:** En producción con MercadoPago (PreApproval recurrente, webhook con firma validada).
> **Actualizado:** junio 2026
> **Alcance:** trial de 7 días → plan Profesional pago → renovación mensual → cancelación / reactivación / vencimiento.
> **Repos involucrados:**
> - **Functions:** `Funciones-google-tutiendaweb/src/*` (Firebase Functions v2, región `southamerica-east1`)
> - **App:** `TuTiendaWeb-public/src/*` (Next.js 15 App Router)

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Planes y precios](#2-planes-y-precios)
3. [Componentes del sistema](#3-componentes-del-sistema)
4. [Flujo 1 — Alta de cuenta y trial](#4-flujo-1--alta-de-cuenta-y-trial)
5. [Flujo 2 — Contratación del plan pago](#5-flujo-2--contratación-del-plan-pago)
6. [Flujo 3 — Renovación mensual](#6-flujo-3--renovación-mensual)
7. [Flujo 4 — Cancelación y reactivación](#7-flujo-4--cancelación-y-reactivación)
8. [Flujo 5 — Vencimiento y suspensión (scheduler)](#8-flujo-5--vencimiento-y-suspensión-scheduler)
9. [Control de acceso: dashboard vs. catálogo público](#9-control-de-acceso-dashboard-vs-catálogo-público)
10. [Estructura de datos en Firestore](#10-estructura-de-datos-en-firestore)
11. [Webhook de MercadoPago en detalle](#11-webhook-de-mercadopago-en-detalle)
12. [Variables de entorno](#12-variables-de-entorno)
13. [Bug crítico de trial — diagnóstico y fix (junio 2026)](#13-bug-crítico-de-trial--diagnóstico-y-fix-junio-2026)
14. [Hallazgos abiertos y riesgos de producción](#14-hallazgos-abiertos-y-riesgos-de-producción)
15. [Cómo testear localmente](#15-cómo-testear-localmente)
16. [Mapa de archivos](#16-mapa-de-archivos)

---

## 1. Resumen ejecutivo

TuTiendaWeb cobra una suscripción mensual por comercio. El ciclo de vida es:

```
Registro → Trial 7 días (gratis) → Contrata "Pro" en MercadoPago → Renovación mensual automática
                  │                                                        │
                  └── si no contrata: trial vence → acceso al dashboard bloqueado
                                                                           │
                                            Cancela ──► sigue activo hasta fin de período ──► free
                                            Falla pago ──► 3 días de gracia ──► free/expired
```

- **Modelo de planes:** solo `trial` (7 días, gratis) → `pro` (ARS 15.000/mes). **No existe `free`**: suspender = `active:false` manteniendo el plan.
- **Plan pago:** `pro`, cobrado vía **PreApproval recurrente de MercadoPago** (suscripción sin plan asociado).
- **Trial:** lo inicializa `createStore` al crear la tienda (Timestamps reales); `initTrial` es solo red de seguridad.
- **Webhook:** `mpWebhook` recibe los eventos de MP, valida la firma HMAC-SHA256 y promueve el plan al confirmarse el pago.
- **Scheduler:** `checkSubscriptions` corre **cada hora** y suspende suscripciones pagas vencidas (con buffer anti–race-condition y período de gracia).
- **Acceso:** lo decide el **dashboard layout** (server component) y el **catálogo público** por separado — leen `subscription` de Firestore (no hay middleware central).

---

## 2. Planes y precios

Definidos en `Funciones-google-tutiendaweb/src/types.ts`:

```typescript
export type SubscriptionPlan = "trial" | "pro";   // NO existe "free"

export const PAID_PLAN: SubscriptionPlan = "pro";
export const PRO_PRICE_ARS = 15000;
export const TRIAL_DAYS = 7;

export const PLAN_PRICES = { trial: 0, pro: 15000 };
export const PLAN_NAMES  = { trial: "Prueba gratuita", pro: "Profesional" };
```

| Plan | Cobra | Origen | `paymentStatus` típico |
|------|-------|--------|------------------------|
| `trial` | No | `createStore` al crear la tienda (7 días) | `trial` |
| `pro` | ARS 15.000/mes | Webhook MP al autorizar pago | `authorized` |

> **No existe el plan `free`** (ni `basic`/`enterprise`). El modelo es **trial → pro**, nada más.
> Cuando una cuenta se suspende (trial vencido, pro cancelado/vencido/pago fallido), **se mantiene el `plan`** y solo se setea `subscription.active = false` con el `paymentStatus` correspondiente (`expired` / `cancelled`). El `active` es la única señal de "habilitado / suspendido".

---

## 3. Componentes del sistema

### Firebase Functions (`Funciones-google-tutiendaweb/src/`)

| Función | Tipo | Trigger | Responsabilidad |
|---------|------|---------|-----------------|
| `initTrial` | Firestore `onDocumentCreated` | Se crea `/stores/{id}` | Red de seguridad: inicializa el trial solo si el store se creó sin `subscription` |
| `createSubscription` | Callable `onCall` | Frontend (owner/admin) | Crea el PreApproval en MP, guarda `billing.pendingPlan` |
| `mpWebhook` | HTTP `onRequest` | MercadoPago | Procesa eventos de pago, promueve el plan, renueva `endDate` |
| `checkSubscriptions` | Scheduler `onSchedule` (`0 * * * *`) | Cada hora | Suspende suscripciones pagas vencidas |
| `cancelSubscription` | Callable `onCall` | Frontend (owner/admin) | Soft-cancel: `cancelAtPeriodEnd = true` |
| `reactivateSubscription` | Callable `onCall` | Frontend (owner/admin) | Revierte el soft-cancel |

Todas se exportan desde `index.ts` y corren en `southamerica-east1`.

### App Next.js (`TuTiendaWeb-public/src/`)

| Archivo | Rol |
|---------|-----|
| `features/auth/actions/auth.actions.ts` → `completeRegistrationAction` | Crea la tienda al terminar el onboarding |
| `features/store/services/store.service.ts` → `createStore` | Escribe el documento inicial del store |
| `app/dashboard/layout.tsx` | **Gate de acceso al dashboard** (evalúa `hasValidAccess`) |
| `app/dashboard/subscription/page.tsx` + `SubscriptionPageClient.tsx` | UI de suscripción (contratar / cancelar / reactivar) |
| `features/dashboard/.../services/server/profile.server-service.ts` | Lee `subscription` de Firestore y serializa Timestamps → ISO |
| `app/[url]/page.tsx` + `features/store/services/public-store.service.ts` | **Gate del catálogo público** (evalúa `subscription.active`) |
| `app/suscripcion/confirmacion/page.tsx` | `back_url` de MP tras el checkout |

---

## 4. Flujo 1 — Alta de cuenta y trial

```
completeRegistrationAction (auth.actions.ts)
   │ AUTH → VALIDATE
   ▼
createStore (store.service.ts)  ◄── FUENTE DE VERDAD del trial
   │ escribe el doc con el trial completo (Timestamps de Admin SDK):
   │   subscription.active        = true
   │   subscription.plan          = "trial"
   │   subscription.paymentStatus = "trial"
   │   subscription.startDate     = Timestamp.now()
   │   subscription.endDate       = Timestamp.now() + 7 días
   │   subscription.trialUsed     = false
   │   subscription.billing       = { provider: "none", autoRenew: false }
   │ + crea notificación "trial_started" en la subcolección
   ▼
[Firestore crea /stores/{storeId}]
   │ dispara onDocumentCreated
   ▼
initTrial (Cloud Function — RED DE SEGURIDAD)
   │ ve que subscription.plan ya existe ("trial") → no hace nada (no-op)
   ▼
[Usuario tiene 7 días de acceso completo]
```

**Punto clave:** `createStore` inicializa el trial **completo con Timestamps reales** (no ISO strings) y es la **única** fuente de inicialización en el flujo normal. Esto elimina la ventana de tiempo y la dependencia del trigger que causaban el bug histórico (ver [sección 13](#13-bug-crítico-de-trial--diagnóstico-y-fix-junio-2026)).

**`initTrial` como red de seguridad** (`initTrial.ts`): solo inicializa el trial si el store se creó **sin** `subscription.plan` (ej: importación, panel admin, scripts). Si ya hay un plan asignado, retorna sin tocar nada — así no duplica la notificación ni pisa datos:

```typescript
const existingPlan = data.subscription?.plan;
if (existingPlan) return;   // createStore ya lo inicializó → no-op
// ...si no hay plan, inicializa trial completo + notificación (respaldo)
```

---

## 5. Flujo 2 — Contratación del plan pago

### 5.1 Generación del link (happy path)

```
[/dashboard/subscription] SubscriptionPageClient
   │ usuario ingresa email comprador + click "Suscribirme con MercadoPago"
   │ httpsCallable("createSubscription")  { storeId, userId, userEmail, plan: "pro" }
   ▼
createSubscription (Cloud Function)
   │ 1. valida auth (owner por uid, o admin vía /admins/{uid})
   │ 2. valida plan === "pro" y email
   │ 3. rechaza si ya hay un PreApproval "pending" para el mismo plan
   │ 4. crea PreApproval en MP:
   │       external_reference = "{storeId}:pro"
   │       auto_recurring     = { frequency: 1, frequency_type: "months", amount: 15000, ARS }
   │       status             = "pending"
   │       back_url           = {APP_URL}/suscripcion/confirmacion
   │ 5. guarda en Firestore (SIN tocar plan/active/endDate del trial vigente):
   │       subscription.billing.subscriptionId = preapproval.id
   │       subscription.billing.provider       = "mercadopago"
   │       subscription.billing.payerEmail     = userEmail
   │       subscription.billing.autoRenew      = true
   │       subscription.billing.pendingPlan    = "pro"   ◄── plan contratado, aún no confirmado
   │       subscription.paymentStatus          = "pending"
   │       subscription.cancelAtPeriodEnd      = false
   │       subscription.graceUntil             = null
   │ 6. devuelve { initPoint, subscriptionId }
   ▼
[Frontend redirige a initPoint — usuario paga en MercadoPago]
   ▼
MP envía webhook  →  mpWebhook  →  handlePreapproval / handleAuthorizedPayment
   │ promueve pendingPlan → plan:
   │       subscription.plan          = "pro"
   │       subscription.active        = true
   │       subscription.paymentStatus = "authorized"
   │       subscription.endDate       = next_payment_date (de MP)
   │       subscription.lastPaymentDate = now
   │       subscription.billing.pendingPlan = null
   │ + notificación "payment_success"
   ▼
MP redirige a  /suscripcion/confirmacion?preapproval_id=...
   │ AutoRedirect → /dashboard/subscription (router.refresh para releer estado)
```

**Diseño importante — `pendingPlan`:** mientras el pago no se confirma, el plan **real** sigue siendo `trial` (o el que estuviera). El plan contratado vive en `billing.pendingPlan`. Así, si el usuario abandona el checkout, **no pierde el acceso del trial** y no queda con un `plan: "pro"` sin pagar. El plan se promueve recién cuando llega el evento `authorized`.

### 5.2 Estado intermedio: pago pendiente

Mientras `paymentStatus === "pending"` y existe `billing.pendingPlan`, la UI muestra la card naranja "Pago en proceso" y el dashboard **mantiene el acceso** (`isPendingPayment` en el layout). El usuario puede:
- "Verificar estado ahora" (refresca el server component).
- "Cancelar intento" (llama `cancelSubscription`).

---

## 6. Flujo 3 — Renovación mensual

MercadoPago cobra automáticamente cada mes y envía notificaciones. `mpWebhook` las procesa por dos vías redundantes:

1. **`subscription_authorized_payment`** → `handleAuthorizedPayment`: re-confirma plan `pro`, `active: true`, renueva `endDate = next_payment_date`, `lastPaymentDate = now`.
2. **`payment`** (con `subscription_id`) → `handlePayment`: busca el store por `billing.subscriptionId`, y si el pago está `approved`, renueva `endDate` (consultando el `next_payment_date` real del PreApproval; fallback +30 días).

Ambos escriben `paymentStatus: "authorized"` y notificación de éxito. El `endDate` actualizado evita que `checkSubscriptions` suspenda la cuenta.

---

## 7. Flujo 4 — Cancelación y reactivación

### 7.1 Cancelación (soft-cancel) — `cancelSubscription`

**NO toca MercadoPago.** Solo escribe en Firestore:

```typescript
subscription.cancelAtPeriodEnd = true
```

- Requisito: `plan === "pro" && active === true`.
- `paymentStatus` **no cambia** (sigue `"authorized"`).
- Idempotente: si ya estaba `true`, devuelve éxito sin reescribir.
- El usuario conserva acceso completo hasta `endDate`.
- El PreApproval en MP sigue vivo; lo cancela `checkSubscriptions` recién el día del vencimiento (para que no cobre el próximo ciclo).

### 7.2 Reactivación — `reactivateSubscription`

Antes de que venza `endDate`, el usuario puede revertir:

```typescript
subscription.cancelAtPeriodEnd = false
```

- Requisito: `plan === "pro" && active === true`.
- Como el PreApproval nunca se canceló en MP, la renovación automática continúa. **No hay nuevo pago ni redirección.**

### 7.3 Estado `isCancelledActive` (cancelado pero vigente)

```typescript
const isCancelledActive =
  subscription.plan === 'pro' &&
  subscription.active === true &&
  subscription.cancelAtPeriodEnd === true &&
  endDateMs > Date.now();
```

UI: card naranja "Suscripción Cancelada — acceso hasta {fecha}" + botón "Volver a activar".

### 7.4 Cancelación por MP (externa)

Si MP cancela el PreApproval (ej: falta de pago persistente), envía `subscription_preapproval` con `status: "cancelled"`. El webhook aplica `STATUS_MAP.cancelled`: `active: false`, `plan: "free"`, `paymentStatus: "cancelled"`. Este camino **no** usa `cancelAtPeriodEnd`; para volver, el usuario debe iniciar un nuevo PreApproval.

---

## 8. Flujo 5 — Vencimiento y suspensión (scheduler)

`checkSubscriptions` corre **cada hora en punto** (`0 * * * *`, zona `America/Argentina/Buenos_Aires`). Consulta:

```typescript
.where("subscription.active", "==", true)
.where("subscription.endDate", "<=", now)
```

y para cada store aplica (recordar: **no existe `plan: "free"`** — suspender = `active: false` manteniendo el plan):

```
┌─ paymentStatus="pending" + pendingPlan  → SKIP (pago en proceso) ───┐
│     No suspender aunque el trial/período haya vencido: el pago MP    │
│     puede tardar (Rapipago/Pago Fácil quedan "pending" por días).    │
│                                                                      │
├─ plan === "trial"  ── Camino TRIAL (prueba agotada sin contratar) ──┤
│     • active=false, paymentStatus=expired                            │
│     • notificación "trial_expired"  · SIN gracia, SIN tocar MP       │
│     → corta acceso al dashboard Y al catálogo público               │
│                                                                      │
│  (de acá en adelante, plan === "pro")                               │
│                                                                      │
├─ lastPaymentDate < hace 24hs        → SKIP (buffer anti race-cond.) ─┤
│                                                                      │
├─ cancelAtPeriodEnd === true   ── Camino A (cancelación voluntaria) ──┤
│     • cancela el PreApproval en MP (PUT status=cancelled)            │
│     • active=false, paymentStatus=cancelled, cancelAtPeriodEnd=false │
│     • notificación "subscription_expired"  · SIN período de gracia   │
│                                                                      │
├─ graceUntil vigente (> now)         → SKIP (en período de gracia) ───┤
│                                                                      │
├─ sin graceUntil ── Camino B (pago fallido, fase 1) ─────────────────┤
│     • graceUntil = now + 3 días                                      │
│     • notificación "payment_failed" ("tenés 3 días para renovar")    │
│                                                                      │
└─ graceUntil vencido ── Camino C (pago fallido, fase 2) ─────────────┘
      • active=false, paymentStatus=expired, graceUntil=null
      • notificación "subscription_expired"
```

> **Trials vencidos:** desde junio 2026 el scheduler **sí** procesa los trials vencidos (Camino TRIAL) y les setea `active: false`, lo que apaga también el catálogo público. El desfasaje máximo es de ~1 hora (cadencia del scheduler). El dashboard, además, bloquea el trial vencido de inmediato por `endDate` sin esperar al scheduler.

---

## 9. Control de acceso: dashboard vs. catálogo público

No hay un middleware único. **Dos gates independientes** leen `subscription`:

### 9.1 Dashboard — `app/dashboard/layout.tsx` (Server Component)

```typescript
const isPro            = subscription?.plan === 'pro'   && subscription?.active;
const isOnTrial        = subscription?.plan === 'trial' && subscription?.active;
const isPendingPayment = subscription?.paymentStatus === 'pending' && !!subscription?.billing?.pendingPlan;

const hasValidAccess =
  isPro ||
  (isOnTrial && endDateMs > now) ||
  isPendingPayment ||
  (graceUntilMs > now);

if (!hasValidAccess) return <AccessDeniedView ... />;   // ← pantalla "Acceso Suspendido"
```

El acceso requiere `active: true` en todos los casos (más `endDate` vigente para el trial). Como **no existe `plan: "free"`**, una cuenta suspendida (`active: false`) nunca recupera acceso por downgrade: queda en "Acceso Suspendido" hasta que contrate/renueve.

### 9.2 Catálogo público — `app/[url]/page.tsx` + `public-store.service.ts`

```typescript
const isActive = storeData.subscription?.active !== false && storeData.suscripcion !== false;
if (!isActive) return <ErrorNotAvailable />;
```

Solo mira `active`. **No** considera `endDate` ni `plan`.

### 9.3 Matriz de acceso resultante

| Estado en Firestore | Dashboard | Catálogo público | Notas |
|---------------------|-----------|------------------|-------|
| `trial`, `active:true`, `endDate` futura | ✅ | ✅ | Trial vigente |
| `trial`, `active:false`, `endDate` pasada | ❌ **AccessDenied** | ❌ | Trial vencido (lo suspende el scheduler) |
| `pro`, `active:true` | ✅ | ✅ | Pago al día |
| `pro`, `active:true`, `cancelAtPeriodEnd:true`, `endDate` futura | ✅ | ✅ | Cancelado pero vigente |
| `pro`, `active:false` (paused/cancelled/expired) | ❌ **AccessDenied** | ❌ | Suspendido (mantiene `plan:"pro"`) |
| `pending` + `pendingPlan` | ✅ | depende de `active` | Pago en proceso |
| en gracia (`graceUntil` futura) | ✅ | ✅ | 3 días para renovar |

> Tras los cambios de junio 2026, **dashboard y catálogo quedan consistentes**: una cuenta suspendida (`active:false`) está bloqueada en ambos lados, sin importar si el plan es `trial` o `pro`. La pantalla "Acceso Suspendido" cubre todos los casos de suspensión.

---

## 10. Estructura de datos en Firestore

Campo `subscription` en `/stores/{storeId}`:

```typescript
subscription: {
  active: boolean;              // true = habilitado; false = suspendido (dashboard + catálogo)
  plan: "trial" | "pro";        // NO existe "free"; se mantiene el plan al suspender
  paymentStatus?: "trial" | "pending" | "authorized" | "paused" | "cancelled" | "expired";
  cancelAtPeriodEnd?: boolean;  // true = soft-cancel marcado (no cambia paymentStatus)
  trialUsed?: boolean;          // marca histórica del trial
  startDate?: Timestamp;
  endDate?: Timestamp;          // próxima fecha de cobro / vencimiento
  lastPaymentDate?: Timestamp;  // último pago confirmado (buffer anti race-condition)
  graceUntil?: Timestamp;       // fin del período de gracia por pago fallido
  billing?: {
    provider: "mercadopago" | "none";
    subscriptionId?: string;    // ID del PreApproval de MP
    pendingPlan?: "pro";        // plan contratado aún no confirmado por pago
    payerEmail?: string;
    autoRenew: boolean;
  };
}
```

> **Timestamps:** las Functions escriben siempre `Timestamp` de Firestore. El servicio del frontend (`profile.server-service.ts → serializeTimestamp`) los convierte a ISO string para los Client Components. Desde junio 2026 `serializeTimestamp` **también** acepta strings ISO (compatibilidad con tiendas legacy creadas con `new Date().toISOString()`).

Notificaciones en `/stores/{storeId}/notifications/{id}`:

```typescript
{
  type: "trial_started" | "trial_expired" | "payment_success" | "payment_failed"
      | "subscription_cancelled" | "subscription_expired" | "subscription_reactivated";
  message: string;
  read: boolean;
  createdAt: Timestamp;
}
```

Idempotencia del webhook en `/_mpWebhookEvents/{eventId}`: cada evento se registra con `create()` (falla si ya existe → se ignora el duplicado).

---

## 11. Webhook de MercadoPago en detalle

### 11.1 Topics (validados contra la doc oficial MLA)

Esta integración usa **suscripción sin plan asociado** (PreApproval creado directo, sin `preapproval_plan_id`). Según MP, los topics correctos son:

| Topic | Cuándo | Handler |
|-------|--------|---------|
| `subscription_preapproval` | Alta/cambio de estado de la suscripción (pending/authorized/paused/cancelled) | `handlePreapproval` |
| `subscription_authorized_payment` | Pago recurrente autorizado | `handleAuthorizedPayment` |
| `payment` | Pago individual aprobado (cobro mensual) | `handlePayment` |

> No se usa `subscription_preapproval_plan` (ese topic es solo para integraciones **con** plan asociado).

### 11.2 Seguridad

| Check | Si falla |
|-------|----------|
| `MERCADO_PAGO_WEBHOOK_SECRET` configurado | 401 (sin bypass en producción) |
| Headers `x-signature` + `x-request-id` presentes | 401 |
| `x-signature` bien formado (`ts=...,v1=...`) | 401 |
| `ts` con < 5 min de antigüedad (anti-replay) | 401 |
| HMAC-SHA256 del manifest coincide (`timingSafeEqual`) | 401 |
| Error en el handler | **200** (evita reintentos que dupliquen eventos) |

**Manifest firmado por MP** (el `data.id` viene del **query param** `?data.id=`, no del body):

```
manifest = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
firma    = HMAC-SHA256(MERCADO_PAGO_WEBHOOK_SECRET, manifest)  → hex
header   = "ts=<ts>,v1=<firma>"
```

### 11.3 Idempotencia

Antes de procesar, `shouldProcessWebhookEvent` hace `create()` en `/_mpWebhookEvents/{eventId}`. Si el doc ya existe (`ALREADY_EXISTS`), el evento es duplicado y se ignora. El `eventId` es `body.id` o, como fallback, `{type}:{dataId}:{action}`.

---

## 12. Variables de entorno

### Functions (`Funciones-google-tutiendaweb/.env` o secrets — NO commitear)

```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...    # credenciales de PRODUCCIÓN (cuenta vendedora real)
MERCADO_PAGO_WEBHOOK_SECRET=<hex>        # MP Panel → Webhooks → "Clave secreta"
APP_URL=https://tutiendaweb.com.ar       # base para back_url del PreApproval
```

> El access token debe ser el de **Credenciales de producción** de MP. `createSubscription` usa siempre el email real enviado desde el frontend como `payer_email`; payer (comprador) y collector (vendedor) deben ser ambos cuentas reales de producción.

### App Next.js (`.env.local`)

No hay variables nuevas para suscripciones (se usa el SDK de Firebase Client con las `NEXT_PUBLIC_FIREBASE_*` existentes). Para la pantalla de acceso suspendido y soporte: `NEXT_PUBLIC_SUPPORT_NUMBER`.

---

## 13. Bug crítico de trial — diagnóstico y fix (junio 2026)

### Síntoma
Al crear una cuenta nueva, la suscripción aparecía con `trialUsed: true` y el dashboard mostraba **"Acceso Suspendido" de inmediato**, sin dejar usar los 7 días de prueba.

### Causa raíz (cadena de 3 fallos)

1. **`createStore` creaba el store con `plan: "trial"` y fechas como ISO string** (`new Date().toISOString()`).
2. **`initTrial` se salteaba:** su guard era `if (existingPlan && existingPlan !== "free") return;`. Como el plan ya venía como `"trial"`, la función retornaba sin inicializar nada → nunca escribía el `endDate` correcto ni corregía `trialUsed`.
3. **`serializeTimestamp` no sabía leer el ISO string:** esperaba un `Timestamp` o un objeto `{_seconds}`. Al recibir un string caía en el fallback `return new Date().toISOString()`, devolviendo la **hora actual** en vez de "ahora + 7 días". En el dashboard, `endDateMs > now` daba `false` → `hasValidAccess: false` → bloqueo inmediato.

### Fix aplicado

| Archivo | Cambio |
|---------|--------|
| `store.service.ts` | `createStore` ahora inicializa el **trial completo con Timestamps reales** (Admin SDK): `active:true, plan:"trial", paymentStatus:"trial", endDate:now+7d`, y crea la notificación `trial_started`. Es la fuente de verdad del trial. |
| `initTrial.ts` | Reconvertido en **red de seguridad**: si el store ya tiene `subscription.plan`, no hace nada. Solo inicializa stores creados sin `subscription` (import/admin/scripts). |
| `profile.server-service.ts` | `serializeTimestamp` ahora acepta `string` ISO (compatibilidad con tiendas legacy). |

> **Por qué este diseño:** tener una sola fuente de inicialización (`createStore`) con Timestamps reales elimina de raíz la causa del bug (duplicación de lógica + ISO strings + dependencia del timing del trigger). `initTrial` queda solo como respaldo idempotente.

### Importante: aclaración sobre "credenciales inválidas"
La autenticación (`getServerSession`) y la suscripción son **capas separadas**. Un trial vencido **no** invalida credenciales: el usuario **debe poder loguearse** y recién después ver "Acceso Suspendido". Si en algún caso aparecen "credenciales inválidas", es un problema **de auth** (cookie/claims/sesión), no de suscripción.

### Migración de tiendas ya afectadas
`initTrial` solo corre en `onDocumentCreated`, así que **no repara** stores ya creados con el bug. Para esos:
- Si tienen `endDate` como string ISO con fecha futura válida → el fix de `serializeTimestamp` ya los lee bien.
- Si tienen `endDate` corrupto → correr un script de migración que recalcule `endDate` y ponga `trialUsed: false`, `paymentStatus: "trial"`.

---

## 14. Hallazgos y estado

> Detectados en la auditoría de junio 2026.

### H-1 (Alta) — ✅ RESUELTO — Trial vencido dejaba el catálogo público ONLINE
Antes, `checkSubscriptions` salteaba los planes `trial`, por lo que su `active` nunca pasaba a `false` y el catálogo seguía visible indefinidamente. **Fix:** el scheduler ahora procesa los trials vencidos (Camino TRIAL) seteando `active: false` y `paymentStatus: "expired"`, lo que apaga dashboard y catálogo de forma consistente.

### H-2 (Media) — ✅ RESUELTO — `isFree` habilitaba el dashboard completo
Se **eliminó el plan `free`** del modelo. Las suspensiones ya no setean `plan: "free"` (mantienen el plan + `active: false`), y el gate del dashboard ya no tiene la rama `isFree`. Una cuenta suspendida no recupera acceso por downgrade.

### H-3 (Baja) — ✅ RESUELTO — La notificación `trial_expired` ahora se emite
El Camino TRIAL del scheduler escribe la notificación `trial_expired` ("tu prueba de 7 días terminó") al suspender el trial.

### H-4 (Baja) — ⚠️ ABIERTO — Componente de UI legacy `SubscriptionSection.tsx`
La página real `/dashboard/subscription` usa `SubscriptionPageClient.tsx`. `SubscriptionSection.tsx` **no lo importa nadie** (código muerto). Se mantuvo compilando con el modelo nuevo, pero conviene **eliminarlo** en una limpieza posterior.

### H-5 (Baja) — ✅ RESUELTO — `MERCADO_PAGO_TEST_PAYER_EMAIL`
Se **eliminó por completo** del código (`createSubscription`), de los `.env.example` y de la documentación. `createSubscription` usa siempre el email real del frontend como `payer_email`. Ya no existe forma de forzar un pagador de prueba que provoque el error `Both payer and collector must be real or test users`.

### Nota de migración — tiendas legacy con `plan: "free"`
Stores antiguos suspendidos quedaron con `plan: "free"` + `active: false`. Con el modelo nuevo siguen **sin acceso** (no son `pro` ni `trial` activos), así que el comportamiento es correcto sin migración. Si existiera algún `plan: "free"` con `active: true` (caso improbable), debe migrarse a `trial`/`pro` o quedará bloqueado. Recomendado: un script que liste `where("subscription.plan","==","free")` para auditarlos.

---

## 15. Cómo testear localmente

### 15.1 Setup de una suscripción próxima a vencer

Script `scripts/test-subscription-expiry.ts` (en el repo de la app) que setea en Firestore:
- `endDate` = ahora + X minutos
- `active = true`, `plan = "pro"`, `paymentStatus = "authorized"`
- `cancelAtPeriodEnd = true` (para el Camino A)

```bash
STORE_ID=<tu-store-id> MINUTES=5 npx tsx scripts/test-subscription-expiry.ts
```

### 15.2 Disparar `checkSubscriptions` a mano

```bash
# CLI (functions deployadas)
firebase functions:call checkSubscriptions --project <project-id>

# Emuladores
firebase emulators:start --only functions,firestore
curl -X POST "http://localhost:5001/<project-id>/southamerica-east1/checkSubscriptions" \
  -H "Content-Type: application/json" -d '{}'
```

### 15.3 Test del trial (regresión del bug de junio 2026)

```
1. Emuladores con functions + firestore.
2. Completar el onboarding para crear una tienda nueva.
3. Verificar en Firestore que el doc quedó con:
     plan = "trial", active = true, paymentStatus = "trial",
     endDate = ~7 días en el futuro (Timestamp), trialUsed = false
4. Entrar al dashboard → NO debe mostrar "Acceso Suspendido".
5. (Opcional) forzar endDate al pasado → recargar → debe mostrar "Acceso Suspendido".
```

### 15.4 Test del webhook (firma)

El webhook rechaza con 401 todo lo que no tenga firma válida. Para probar localmente conviene usar la herramienta de simulación del panel de MP (envía firma real) apuntando a la URL del emulador expuesta con un túnel, o testear `validateMPSignature` unitariamente con un manifest y secret conocidos.

---

## 16. Mapa de archivos

**Functions** (`Funciones-google-tutiendaweb/src/`)
- `types.ts` — tipos, planes, precios, constantes (`PAID_PLAN`, `TRIAL_DAYS`, `PLAN_PRICES`)
- `initTrial.ts` — inicializa el trial al crear el store
- `createSubscription.ts` — crea el PreApproval en MP
- `mpWebhook.ts` — procesa eventos de MP (firma + idempotencia + 3 handlers)
- `checkSubscriptions.ts` — scheduler horario de vencimientos (3 caminos)
- `cancelSubscription.ts` / `reactivateSubscription.ts` — soft-cancel y reversión
- `index.ts` — exporta todas las functions

**App** (`TuTiendaWeb-public/src/`)
- `features/auth/actions/auth.actions.ts` — `completeRegistrationAction`
- `features/store/services/store.service.ts` — `createStore`
- `app/dashboard/layout.tsx` — gate de acceso al dashboard
- `app/dashboard/subscription/page.tsx` + `features/dashboard/modules/store-settings/components/SubscriptionPageClient.tsx` — UI de suscripción
- `features/dashboard/modules/store-settings/services/server/profile.server-service.ts` — lectura + serialización de `subscription`
- `app/[url]/page.tsx` + `features/store/services/public-store.service.ts` — gate del catálogo público
- `app/suscripcion/confirmacion/page.tsx` — retorno de MP post-checkout
