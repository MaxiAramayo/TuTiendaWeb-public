# Sistema de Suscripciones — Estado actual y guía para continuar

> **Para:** desarrollador que continúa la implementación
> **Actualizado:** marzo 2026
> **Estado general:** Flujo de pago funcional. Webhook operativo con validación de firma activa (secreto configurado, anti-replay de 5 min, sin bypass). Cancelación soft-cancel implementada. Reactivación sin nuevo pago implementada. UI del dashboard refleja todos los estados. Pendiente: deploy de functions actualizadas, test end-to-end con pago real.

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Plan disponible](#2-plan-disponible)
3. [Flujo completo de una suscripción](#3-flujo-completo-de-una-suscripción)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Código — Firebase Functions](#5-código--firebase-functions)
6. [Código — Frontend](#6-código--frontend)
7. [Estructura de datos en Firestore](#7-estructura-de-datos-en-firestore)
8. [Qué funciona hoy](#8-qué-funciona-hoy)
9. [Bugs conocidos y pendientes](#9-bugs-conocidos-y-pendientes)
10. [Pasos para llegar a producción](#10-pasos-para-llegar-a-producción)
11. [Cómo testear el flujo de vencimiento localmente](#11-cómo-testear-el-flujo-de-vencimiento-localmente)

---

## 1. Arquitectura general

```
[Usuario en dashboard]
        │
        ▼
[SubscriptionSection.tsx]  ← Client Component en /dashboard/profile
        │  llama Firebase Callable Function
        ▼
[createSubscription]  ← Firebase Function (southamerica-east1)
        │  crea PreApproval en MP y guarda subscriptionId en Firestore
        ▼
[MercadoPago checkout]  ← usuario paga en ventana nueva
        │  MP envía webhook POST
        ▼
[mpWebhook]  ← Firebase Function HTTP (southamerica-east1)
        │  actualiza subscription en Firestore
        ▼
[checkSubscriptions]  ← Firebase Function scheduler (cada hora)
        │  suspende suscripciones con endDate vencida
        ▼
[/suscripcion/confirmacion]  ← página pública Next.js (back_url de MP)
```

**Stack de funciones:**
- Firebase Functions v2 (Node 22, región `southamerica-east1`)
- MercadoPago SDK v2 (`mercadopago` npm package)
- Firebase Admin SDK para escrituras en Firestore

**Stack frontend:**
- Next.js 15 App Router — Server Components + Server Actions
- `SubscriptionSection.tsx` — Client Component que llama las Callable Functions directamente via `firebase/functions`

---

## 2. Plan disponible

Un único plan de pago implementado:

| Campo | Valor |
|-------|-------|
| ID interno | `pro` |
| Nombre | Profesional |
| Precio | ARS 4.999/mes |
| Frecuencia | Mensual, recurrente automático |
| Proveedor | MercadoPago PreApproval |

Los planes `basic` y `enterprise` están definidos en los tipos pero **no tienen precio ni UI implementados**. El plan `trial` (7 días) está en los tipos pero el flujo de activación de trial no está implementado en el frontend.

---

## 3. Flujo completo de una suscripción

### 3.1 Creación (happy path)

1. Usuario entra a `/dashboard/profile` → sección "Suscripción"
2. Hace click en "Activar plan Profesional"
3. El Client Component llama la Callable Function `createSubscription` con `{ storeId, userId, userEmail, plan: "pro" }`
4. `createSubscription` crea un PreApproval en MP y hace `update` en Firestore:
   ```
   subscription.billing.subscriptionId = preapproval.id
   subscription.billing.provider = "mercadopago"
   subscription.billing.payerEmail = userEmail
   subscription.billing.autoRenew = true
   subscription.paymentStatus = "pending"
   subscription.plan = "pro"
   subscription.startDate = now
   ```
5. La función devuelve `{ initPoint, subscriptionId }`
6. El frontend abre `initPoint` en `window.open(_blank)`
7. Usuario paga en la ventana de MP
8. MP llama al webhook `mpWebhook` con `type: "subscription_preapproval"` y `action: "updated"`
9. El webhook actualiza Firestore con `active: true`, `paymentStatus: "authorized"`, `endDate: next_payment_date`
10. MP redirige al usuario a `/suscripcion/confirmacion?preapproval_id=...`

### 3.2 Renovación mensual

1. MP cobra automáticamente cada mes
2. MP envía webhook `type: "subscription_authorized_payment"` con el ID del PreApproval
3. `mpWebhook` llama `handleAuthorizedPayment` que actualiza `active: true`, `endDate: +30 días`, `lastPaymentDate: now`
4. `checkSubscriptions` (scheduler diario) verifica que `endDate > now`. Si venció sin renovarse, aplica el flujo de suspensión (ver 3.5)

### 3.3 Cancelación por el usuario desde el dashboard

**Soft-cancel: NO cancela el PreApproval en MercadoPago.**

1. El usuario hace click en "Cancelar suscripción"
2. El Client Component llama la Callable Function `cancelSubscription` con `{ storeId, userId }`
3. `cancelSubscription` escribe **solo** `subscription.cancelAtPeriodEnd = true` en Firestore
4. El PreApproval en MP sigue intacto — MP no cobra nada extra
5. El `paymentStatus` **no cambia** (sigue `"authorized"`)
6. Se escribe notificación: "Cancelaste la renovación automática. Seguís teniendo acceso completo hasta el {fecha}"
7. `checkSubscriptions` (scheduler diario), cuando `endDate <= now` y `cancelAtPeriodEnd=true`:
   - Cancela el PreApproval en MP (`PUT /preapproval/{id}` con `status: "cancelled"`) para que no cobre el próximo ciclo
   - Suspende: `active=false`, `plan=free`, `paymentStatus=cancelled`, `cancelAtPeriodEnd=false`
   - Sin período de gracia

### 3.4 Reactivación desde el dashboard (sin nuevo pago)

Si el usuario cancela pero luego cambia de opinión **antes de que venza `endDate`**:

1. El usuario hace click en "Reactivar suscripción" (en la card naranja)
2. El Client Component llama la Callable Function `reactivateSubscription` con `{ storeId, userId }`
3. `reactivateSubscription` escribe **solo** `subscription.cancelAtPeriodEnd = false` en Firestore
4. El PreApproval en MP nunca fue cancelado → MP seguirá cobrando el próximo ciclo normalmente
5. No hay redirección a MP, no hay nuevo pago

### 3.5 Estado `isCancelledActive` (cancelado pero vigente)

```typescript
const isCancelledActive =
  subscription.plan === 'pro' &&
  subscription.active &&
  subscription.cancelAtPeriodEnd === true &&  // soft-cancel marcado
  endDateMs > Date.now();                      // aún tiene acceso
```

Estado de Firestore cuando el usuario canceló pero aún tiene acceso:
```
subscription.active = true              ← sigue activo hasta endDate
subscription.plan = "pro"               ← sigue en pro
subscription.paymentStatus = "authorized" ← NO cambia al cancelar desde el dashboard
subscription.cancelAtPeriodEnd = true   ← la única marca de cancelación
subscription.endDate = [fecha futura]
```

### 3.6 Cancelación por MP (webhook)

1. MP cancela el PreApproval (falta de pago u otra causa externa)
2. MP envía webhook `type: "subscription_preapproval"`, `status: "cancelled"`
3. El webhook actualiza: `active: false`, `paymentStatus: "cancelled"` (via `STATUS_MAP.cancelled`)
4. El acceso se corta inmediatamente — este path no usa `cancelAtPeriodEnd`
5. Para reactivar, el usuario debe iniciar un nuevo flujo de pago (nuevo PreApproval)

### 3.7 Suspensión por `checkSubscriptions` (tres caminos)

```
subscription.active=true && endDate<=now
         │
         ├─ plan=free/trial → skip
         │
         ├─ lastPaymentDate < 24hs → skip (buffer anti-race-condition)
         │
         ├─ cancelAtPeriodEnd=true (Camino A — cancelación voluntaria)
         │    ├─ PUT /preapproval/{id} status=cancelled en MP
         │    └─ suspender: active=false, plan=free, paymentStatus=cancelled, cancelAtPeriodEnd=false
         │
         ├─ graceUntil vigente → skip (Camino B — en período de gracia por pago fallido)
         │
         ├─ sin graceUntil (Camino B — pago fallido, Fase 1)
         │    └─ escribir graceUntil=now+3días, notificación "Tenés 3 días para renovar"
         │
          └─ graceUntil vencido (Camino C — pago fallido, Fase 2)
               └─ suspender: active=false, plan=free, paymentStatus=expired, graceUntil=null
```

---

## 4. Variables de entorno

### `functions/.env` (Firebase Functions — NO commitear)

```env
# ─── Producción ─────────────────────────────────────────────────────────────────

MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...   # Token de la cuenta vendedora REAL
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=<hex>       # Obtener en MP Panel → Webhooks → "Firma secreta"
MERCADO_PAGO_CLIENT_ID=...

# URL base de la app (para back_url del PreApproval)
APP_URL=https://tutiendaweb.com.ar
```

> **Nota:** `MERCADO_PAGO_TEST_PAYER_EMAIL` (usada en sandbox) NO debe estar en producción.
> Si está presente, `createSubscription` sobreescribe el email del pagador con ese valor.

### Variables de Next.js (`.env.local`)

No se agregaron variables nuevas para suscripciones. La comunicación con Firebase Functions se hace via el SDK de Firebase Client usando las variables `NEXT_PUBLIC_FIREBASE_*` existentes.

---

## 5. Código — Firebase Functions

### 5.1 `functions/src/types.ts`

Tipos compartidos entre todas las functions.

```typescript
export type SubscriptionPlan = "free" | "trial" | "basic" | "pro" | "enterprise";

export type PreapprovalStatus =
  | "authorized" | "paused" | "cancelled" | "pending" | "trial" | "expired";

export interface StoreSubscription {
  active: boolean;
  plan: SubscriptionPlan;
  startDate?: Timestamp;
  endDate?: Timestamp;
  graceUntil?: Timestamp;
  trialUsed?: boolean;
  paymentStatus?: PreapprovalStatus;
  cancelAtPeriodEnd?: boolean;
  lastPaymentDate?: Timestamp;
  billing?: SubscriptionBilling;
}

async function handlePayment(dataId: string): Promise<void> {
  const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
  const payment = (await new Payment(mp).get({ id: Number(dataId) })) as unknown as PaymentWithSubscription;

  if (payment.status !== "approved" || !payment.subscription_id) return;

  const db = getFirestore();
  const snap = await db.collection("stores")
    .where("subscription.billing.subscriptionId", "==", payment.subscription_id)
    .limit(1).get();

  if (snap.empty) return;

  await snap.docs[0].ref.update({
    "subscription.active": true,
    "subscription.paymentStatus": "authorized",
    "subscription.lastPaymentDate": Timestamp.now(),
    "subscription.endDate": Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await addNotification(snap.docs[0].id, "payment_success", "Tu pago mensual fue procesado.");
}

// ── Función principal ──────────────────────────────────────────────────────────

export const mpWebhook = onRequest(
  { region: "southamerica-east1", cors: false },
  async (req, res) => {
    if (req.method === "GET") { res.sendStatus(200); return; }
    if (req.method !== "POST") { res.sendStatus(405); return; }
    if (!validateMPSignature(req)) { res.sendStatus(401); return; }

    const body = req.body as MPWebhookBody;
    const dataId = body.data?.id;
    if (!dataId) { res.sendStatus(200); return; }

    try {
      if (body.type === "subscription_preapproval") await handlePreapproval(dataId);
      else if (body.type === "subscription_authorized_payment") await handleAuthorizedPayment(dataId);
      else if (body.type === "payment") await handlePayment(dataId);
    } catch (error) {
      logger.error("Error procesando webhook MP:", error);
      // Siempre 200 para evitar reintentos de MP
    }
    res.sendStatus(200);
  }
);
```

---

### 5.2 `functions/src/createSubscription.ts`

Callable Function que crea el PreApproval en MP y lo guarda en Firestore.

Puntos clave:
- Valida admin bypass (`/admins/{uid}`)
- En sandbox, `MERCADO_PAGO_TEST_PAYER_EMAIL` sobreescribe el email del pagador
- Escribe `paymentStatus: "pending"` hasta que el webhook confirme el pago

---

### 5.3 `functions/src/mpWebhook.ts`

HTTP Function que recibe notificaciones de MercadoPago.

Maneja tres tipos de eventos:
- `subscription_preapproval` — cambios de estado del PreApproval (`pending`, `authorized`, `paused`, `cancelled`)
- `subscription_authorized_payment` — confirmación de pago (activa la suscripción)
- `payment` — cobro recurrente mensual (renueva `endDate`)

**Seguridad implementada:**

| Check | Comportamiento |
|-------|---------------|
| `MERCADO_PAGO_WEBHOOK_SECRET` no configurado | Rechaza con 401 (sin bypass) |
| Falta `x-signature` o `x-request-id` | Rechaza con 401 |
| `x-signature` mal formado | Rechaza con 401 |
| Timestamp `ts` con más de 5 min de antigüedad | Rechaza con 401 (anti-replay) |
| HMAC-SHA256 inválido | Rechaza con 401 |
| Error en handler | Responde 200 (evita reintentos de MP que podrían duplicar eventos) |

**Cómo MP construye la firma:**
```
manifest = "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
firma    = HMAC-SHA256(secret, manifest) → hex
header   = "ts=<ts>,v1=<firma>"
```
donde `data.id` viene del **query param** `?data.id=` de la URL, no del body JSON.

---

### 5.4 `functions/src/checkSubscriptions.ts`

Scheduler **cada hora en punto** (`0 * * * *`) que suspende suscripciones con `endDate` vencida.
Máximo 59 minutos de desfasaje entre el vencimiento real y la suspensión efectiva.

Tres caminos de suspensión: ver diagrama en sección 3.7.

Protecciones:
- Buffer 24hs desde `lastPaymentDate` (anti-race-condition con webhook de pago)
- Respeta `graceUntil` si está vigente
- Cancela el PreApproval en MP antes de suspender (solo en Camino A)

---

### 5.5 `functions/src/cancelSubscription.ts`

Callable Function — soft-cancel.

- Solo escribe `subscription.cancelAtPeriodEnd = true` en Firestore
- No toca MercadoPago
- Solo opera si `plan=pro && active=true`
- Idempotente: si ya era `cancelAtPeriodEnd=true`, devuelve éxito sin re-escribir
- Admin bypass: `/admins/{uid}` puede operar sobre cualquier store

---

### 5.6 `functions/src/reactivateSubscription.ts`

Callable Function — revierte el soft-cancel.

- Solo escribe `subscription.cancelAtPeriodEnd = false` en Firestore
- Solo opera si `plan=pro && active=true`
- Idempotente: si ya era `false`, devuelve éxito sin re-escribir
- El PreApproval en MP nunca fue cancelado → la renovación automática continúa normalmente

---

## 6. Código — Frontend

### 6.1 `SubscriptionSection.tsx`

`src/features/dashboard/modules/store-settings/components/sections/SubscriptionSection.tsx`

Client Component que muestra el estado de la suscripción y maneja cancelación y reactivación.

**Estados de UI:**

| Condición | Card mostrada |
|-----------|--------------|
| `isPro` (activo, sin `cancelAtPeriodEnd`) | Card verde — plan activo + botón "Cancelar" |
| `isCancelledActive` (`cancelAtPeriodEnd=true`, `endDate` futura) | Card naranja — acceso hasta fecha + botón "Reactivar" |
| `isPendingConfirmation` (`paymentStatus=pending`) | Card naranja — "Confirmando tu suscripción" |
| Ninguno de los anteriores (free/trial) | Card purple — CTA "Activar plan Profesional" |

**Lectura de datos:**
```typescript
// CORRECTO: leer desde profile (viene de Firestore vía server)
const subscription = profile?.subscription || formData.subscription || { ... };

// Por qué: formData (React Hook Form) NO incluye subscription.
// El schema Zod del formulario no lo contempla. Solo profile tiene subscription real.
```

**Funciones Firebase llamadas:**
- `cancelSubscription({ storeId, userId })` → escribe `cancelAtPeriodEnd=true`
- `reactivateSubscription({ storeId, userId })` → escribe `cancelAtPeriodEnd=false`
- `createSubscription({ storeId, userId, userEmail, plan })` → devuelve `initPoint`

---

### 6.2 `src/app/suscripcion/confirmacion/page.tsx`

Página pública (sin auth) a la que MercadoPago redirige como `back_url` después del pago.

**Por qué existe:** `back_url` de MP redirige en la misma pestaña donde el usuario pagó (no en la del dashboard). Si se apuntaba directo a `/dashboard/profile`, el usuario llegaba sin cookie y era redirigido a `/sign-in`. Esta página no requiere auth y le muestra un mensaje antes de que vaya al dashboard.

---

### 6.3 Flujo de datos de `subscription` en el dashboard

```
Firestore
  └─ stores/{storeId}.subscription  (Timestamps de Firebase Admin)
       │
       ▼
profileServerService.getProfile()  [profile.server-service.ts]
  └─ serializeProfile()  → convierte todos los Timestamps a ISO strings
       │                   incluye cancelAtPeriodEnd
       ▼
page.tsx  (Server Component)
  └─ pasa initialProfile como prop a ProfileForm
       │
       ▼
useProfile hook
  └─ setProfile(initialProfile)  → Zustand store (profile.subscription ✅)
  └─ profileToFormData(initialProfile)  → React Hook Form (NO incluye subscription)
       │
       ├─► profile  (StoreProfile completo — tiene subscription)
       └─► formData  (watch() de RHF — NO tiene subscription)
            │
            ▼
       SubscriptionSection
         └─ lee profile?.subscription  ← CORRECTO
         └─ NO leer formData.subscription  ← siempre undefined
```

---

## 7. Estructura de datos en Firestore

Campo `subscription` dentro del documento `/stores/{storeId}`:

```typescript
subscription: {
  active: boolean;              // true = acceso habilitado
  plan: "free" | "trial" | "basic" | "pro" | "enterprise";
  paymentStatus: "pending" | "authorized" | "paused" | "cancelled" | "expired";
  cancelAtPeriodEnd: boolean;   // true = soft-cancel marcado; NO se toca paymentStatus
  startDate: Timestamp;
  endDate: Timestamp;           // próxima fecha de cobro / vencimiento
  lastPaymentDate?: Timestamp;
  trialUsed: boolean;
  graceUntil?: Timestamp;       // período de gracia por pago fallido
  billing: {
    provider: "mercadopago";
    subscriptionId: string;     // ID del PreApproval de MP
    payerEmail: string;
    autoRenew: boolean;
  };
}
```

Notificaciones en `/stores/{storeId}/notifications/{notifId}`:

```typescript
{
  type: "payment_success" | "payment_failed" | "subscription_cancelled"
      | "subscription_expired" | "subscription_reactivated"
      | "trial_started" | "trial_expired";
  message: string;
  read: boolean;
  createdAt: Timestamp;
}
```

---

## 8. Qué funciona hoy

| Feature | Estado | Notas |
|---------|--------|-------|
| Crear PreApproval en MP | ✅ | `createSubscription` deployada |
| Recibir webhook de MP | ✅ | `mpWebhook` deployada |
| Actualizar Firestore al autorizar pago | ✅ | `handlePreapproval` + `handleAuthorizedPayment` |
| Actualizar Firestore al cancelar (webhook MP) | ✅ | `STATUS_MAP.cancelled` |
| Renovación mensual por webhook `payment` | ✅ | `handlePayment` — usa `next_payment_date` del PreApproval |
- Scheduler **cada hora** de vencimientos | ✅ | Máximo 59 min de desfasaje desde el vencimiento real |
| Cancelación soft-cancel por el usuario | ✅ | `cancelSubscription` — solo Firestore, no toca MP |
| Reactivación sin nuevo pago | ✅ | `reactivateSubscription` — revierte `cancelAtPeriodEnd` |
| UI card de suscripción en dashboard | ✅ | Verde (activo), naranja (cancelado-vigente), naranja (pending) |
| Página de confirmación post-MP | ✅ | `/suscripcion/confirmacion` |
| Serialización de `cancelAtPeriodEnd` en server service | ✅ | `serializeProfile()` lo incluye |
| UI de notificaciones (campana) | ✅ | `NotificationBell.tsx` con `onSnapshot` |
| Reglas Firestore para `/notifications` | ✅ (pendiente deploy) | `firestore.rules` actualizado |

---

## 9. Bugs conocidos y pendientes

### BUG-02 — Pagos de prueba rechazados en sandbox

**Severidad:** Media — bloquea testing end-to-end, no afecta producción  
**Estado:** No resuelto

El PreApproval se crea correctamente, pero al intentar pagar MP cancela automáticamente (~15 seg) sin procesar el cobro.

**Hipótesis más probable:** el `ACCESS_TOKEN` corresponde a una cuenta real (no test user de MP). Para sandbox correcto, el collector también debe ser un test user con su propio Access Token de prueba.

**Para resolver:** obtener Access Token de un test user vendedor desde el panel de MP, o probar directamente en producción con un pago real de bajo monto.

---

### PENDIENTE-01 — Activación del trial

El tipo `trial` y el campo `trialUsed` están definidos pero no hay lógica que active el trial. No implementado en UI. Implementar si se decide ofrecer período de prueba.

---

### PENDIENTE-02 — Webhook URL configurada en MP

Verificar que la URL en el panel de MP apunte al endpoint correcto:
```bash
firebase functions:list --project tutiendaweb-dev
```

---

### PENDIENTE-03 — Período de gracia no tiene UI

✅ Resuelto. Se agrego un banner de gracia en `SubscriptionSection.tsx` cuando `graceUntil` existe y esta en el futuro.

---

## 10. Pasos para llegar a producción

En orden de prioridad:

1. **Deploy Firestore rules** (fix `NotificationBell` permission error):
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy functions actualizadas** (cancelSubscription reescrita + reactivateSubscription nueva + checkSubscriptions reescrito + mpWebhook corregido):
   ```bash
   firebase deploy --only functions:cancelSubscription,functions:reactivateSubscription,functions:checkSubscriptions,functions:mpWebhook
   ```

3. **Push código Next.js a Vercel** — incluye cambios en `SubscriptionSection.tsx`, `store.type.ts`, `profile.server-service.ts`, `NotificationBell.tsx`

4. **Corregir Firestore del usuario de prueba** (`maxiaramayolazo@hotmail.com`):
   ```
   subscription.active = true
   subscription.paymentStatus = "authorized"
   subscription.cancelAtPeriodEnd = false
   ```

5. **Verificar URL del webhook en panel de MP**

6. **Test en producción** — pagar con tarjeta real, verificar webhook, verificar Firestore, verificar UI del dashboard

---

## 11. Cómo testear el flujo de vencimiento localmente

El scheduler `checkSubscriptions` corre una vez al día, lo que hace difícil testear manualmente. La solución es manipular directamente Firestore para poner la suscripción en el estado correcto y luego disparar la function a mano.

### Script de setup: `scripts/test-subscription-expiry.ts`

Este script setea en Firestore:
- `endDate` = ahora + X minutos (configurable)
- `cancelAtPeriodEnd = true` (para testear el camino A — cancelación voluntaria)
- `active = true`, `plan = "pro"`, `paymentStatus = "authorized"`

```bash
# Instalar dependencias si no están
npm install --save-dev tsx

# Correr el script (reemplazar con tu storeId real)
STORE_ID=<tu-store-id> MINUTES=5 npx tsx scripts/test-subscription-expiry.ts
```

Ver `scripts/test-subscription-expiry.ts` para el código completo.

### Cómo disparar `checkSubscriptions` a mano (sin esperar el scheduler)

**Opción A — Firebase Console (más fácil):**
1. Ir a [Firebase Console](https://console.firebase.google.com) → Functions
2. Buscar `checkSubscriptions`
3. Click en los tres puntos → "Test function"
4. Enviar payload vacío `{}`

**Opción B — Firebase CLI:**
```bash
# Requiere tener las functions deployadas
firebase functions:call checkSubscriptions --project <tu-project-id>
```

**Opción C — Emuladores locales (más control):**
```bash
# Terminal 1: levantar emuladores
firebase emulators:start --only functions,firestore

# Terminal 2: llamar la function directamente
curl -X POST "http://localhost:5001/<project-id>/southamerica-east1/checkSubscriptions" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Flujo de test completo (Camino A — cancelación voluntaria)

```
1. Correr script con MINUTES=3 para tu storeId
   → endDate queda en 3 minutos, cancelAtPeriodEnd=true

2. Entrar al dashboard → /dashboard/profile → Suscripción
   → Debe mostrar card naranja "Renovación automática cancelada"
   → Debe mostrar "Acceso hasta [fecha en 3 minutos]"

3. (Opcional) Testear reactivación:
   → Click "Reactivar suscripción"
   → Firestore debe tener cancelAtPeriodEnd=false
   → UI debe volver a mostrar card verde

4. Si no reactivaste: esperar 3 minutos + disparar checkSubscriptions a mano
   → Firestore debe tener active=false, plan=free, paymentStatus=cancelled
   → UI debe mostrar CTA "Activar plan Profesional"
```

### Flujo de test completo (Camino C — pago fallido + gracia vencida)

```
1. Setear en Firestore manualmente:
   subscription.active = true
   subscription.plan = "pro"
   subscription.paymentStatus = "authorized"
   subscription.cancelAtPeriodEnd = false
   subscription.endDate = <timestamp pasado>
   subscription.graceUntil = <timestamp pasado>
   subscription.lastPaymentDate = <hace más de 24hs>

2. Disparar checkSubscriptions
   → Firestore debe tener active=false, plan=free, paymentStatus=expired
```

---

> **Archivos clave para entender el sistema de un vistazo:**
> - `functions/src/createSubscription.ts` — crea el PreApproval
> - `functions/src/mpWebhook.ts` — procesa eventos de MP
> - `functions/src/checkSubscriptions.ts` — scheduler de vencimientos (3 caminos)
> - `functions/src/cancelSubscription.ts` — soft-cancel (solo Firestore)
> - `functions/src/reactivateSubscription.ts` — revierte el soft-cancel
> - `src/features/dashboard/modules/store-settings/components/sections/SubscriptionSection.tsx` — UI del dashboard
> - `src/features/dashboard/modules/store-settings/services/server/profile.server-service.ts` — serialización de datos
> - `src/app/suscripcion/confirmacion/page.tsx` — página de retorno de MP
> - `scripts/test-subscription-expiry.ts` — setup de datos para testing
