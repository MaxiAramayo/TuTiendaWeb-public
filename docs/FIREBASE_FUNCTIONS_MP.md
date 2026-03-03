# Firebase Functions — Suscripciones con MercadoPago

Documentación de las Cloud Functions implementadas para gestionar suscripciones de TuTiendaWeb usando MercadoPago PreApproval (pagos recurrentes).

---

## Arquitectura general

```
MercadoPago
    │
    │  POST webhook (x-signature validado)
    ▼
mpWebhook (HTTP Function)
    ├── subscription_preapproval → actualiza subscription.* + escribe /notifications
    └── payment (cobro mensual)  → renueva endDate + escribe /notifications

─────────────────────────────────────────────────────────────

Frontend / Admin Dashboard
    │
    │  onCall (Firebase Auth requerido)
    ▼
createSubscription (Callable Function)
    │
    │  crea PreApproval en MP
    ▼
MercadoPago API → devuelve init_point (URL de pago)
    │
    │  guarda billing.subscriptionId en Firestore
    ▼
/stores/{storeId}

─────────────────────────────────────────────────────────────

Firestore trigger: /stores/{storeId} creado
    ▼
initTrial (Firestore Function)
    │
    │  plan = "trial", endDate = now + 7 días
    ▼
/stores/{storeId} + /stores/{storeId}/notifications

─────────────────────────────────────────────────────────────

Cloud Scheduler (diario 09:00 ART)
    ▼
checkSubscriptions (Scheduled Function)
    │
    │  busca active=true && endDate <= now
    │  con buffer 24hs y respeto de graceUntil
    ▼
/stores/{storeId} active=false + /notifications
```

---

## Funciones implementadas

### 1. `mpWebhook`

**Archivo:** `functions/src/mpWebhook.ts`
**Tipo:** HTTP trigger (`onRequest`)
**Región:** `southamerica-east1`

Recibe notificaciones de MercadoPago. Soporta GET (ping) y POST (eventos).

**Seguridad — validación de firma `x-signature`:**

Antes de procesar cualquier POST, valida la firma HMAC-SHA256:
```
manifest = "id:{dataId};request-id:{x-request-id};ts:{ts};"
hmac = HMAC-SHA256(MERCADO_PAGO_WEBHOOK_SECRET, manifest)
```
Si no coincide con `v1` del header, responde 401 y descarta el evento.

**Importante:** mientras `MERCADO_PAGO_WEBHOOK_SECRET` sea `"REEMPLAZAR_CON_FIRMA_SECRETA_DE_MP"` (valor placeholder), la validación está desactivada con un log de advertencia. Configurar el valor real antes de ir a producción.

**Eventos manejados:**

| Tipo | Qué hace |
|------|---------|
| `subscription_preapproval` | Consulta estado del PreApproval, actualiza `subscription.*`, escribe notificación |
| `payment` | Detecta cobros recurrentes aprobados, renueva `endDate`, escribe notificación |
| otros | Log informativo, responde 200 sin procesar |

**Mapeo de estados (`subscription_preapproval`):**

| Estado MP    | `active` | `paymentStatus` | Notificación              |
|-------------|---------|----------------|---------------------------|
| `authorized` | `true`  | `authorized`   | `payment_success`         |
| `paused`     | `false` | `paused`       | `payment_failed`          |
| `cancelled`  | `false` | `cancelled`    | `subscription_cancelled`  |

**`endDate` para `authorized`:**
Usa `preapproval.next_payment_date` de la respuesta de MP (fecha real del próximo cobro). Fallback a `now + 30 días` si MP no lo devuelve.

**Notificaciones:**
Se guardan en la subcolección `/stores/{storeId}/notifications` (no en el documento raíz). Esto permite paginar, filtrar no leídas y marcar como leídas sin tocar el documento del store.

**URL del webhook (post-deploy):**
```
https://southamerica-east1-tutiendaweb-dev.cloudfunctions.net/mpWebhook
```
Registrar en: MP Panel → tu app → Webhooks → eventos `subscription_preapproval` + `payment`.

---

### 2. `createSubscription`

**Archivo:** `functions/src/createSubscription.ts`
**Tipo:** Callable (`onCall`) — requiere Firebase Auth
**Región:** `southamerica-east1`

Genera un link de pago PreApproval para iniciar una suscripción recurrente.

**Input:**
```typescript
{
  storeId: string;    // ID del store en Firestore
  userId: string;     // UID del owner
  userEmail: string;  // Email del pagador
  plan: "basic" | "pro" | "enterprise";
}
```

**Output:**
```typescript
{
  initPoint: string;      // URL de pago de MercadoPago
  subscriptionId: string; // ID del PreApproval en MP
}
```

**Autorización:**
- `request.auth.uid === userId` (owner gestionando su propia tienda), **O**
- El UID del caller existe en `/admins/{uid}` (admin bypass)

**Precios:**

| Plan         | ARS/mes |
|-------------|---------|
| `basic`      | 2.999   |
| `pro`        | 4.999   |
| `enterprise` | 9.999   |

**Cómo llamarla desde el frontend:**
```typescript
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(app, "southamerica-east1");
const createSub = httpsCallable(functions, "createSubscription");

const result = await createSub({
  storeId: session.storeId,
  userId: currentUser.uid,
  userEmail: currentUser.email,
  plan: "basic",
});

// Redirigir al usuario al link de pago de MP
window.open(result.data.initPoint, "_blank");
```

---

### 3. `checkSubscriptions`

**Archivo:** `functions/src/checkSubscriptions.ts`
**Tipo:** Scheduled (`onSchedule`)
**Schedule:** `0 12 * * *` (12:00 UTC = 09:00 ART)
**Región:** `southamerica-east1`

Corre diariamente y suspende suscripciones de pago vencidas.

**Lógica de decisión por store:**
1. Si `plan === "free"` o `plan === "trial"` → skip (no aplica)
2. Si `lastPaymentDate` fue hace menos de 24hs → skip (buffer anti-race-condition con webhook)
3. Si `graceUntil` está vigente → skip (período de gracia)
4. Resto → suspender: `active=false`, `plan="free"`, `paymentStatus="expired"` + notificación

---

### 4. `initTrial`

**Archivo:** `functions/src/initTrial.ts`
**Tipo:** Firestore trigger (`onDocumentCreated`)
**Trigger:** `/stores/{storeId}` — al crear un store nuevo
**Región:** `southamerica-east1`

Inicializa el período de prueba gratuita de 7 días cuando se crea un store.

**Qué escribe:**
```
subscription.active = true
subscription.plan = "trial"
subscription.paymentStatus = "trial"
subscription.startDate = now
subscription.endDate = now + 7 días
subscription.trialUsed = false
subscription.billing = { provider: "none", autoRenew: false }
```

También agrega una notificación de bienvenida en la subcolección `notifications`.

**Guard:** Si el store ya fue creado con un plan distinto de `"free"` (ej: creado por admin con plan asignado), la función no sobreescribe.

---

## Estructura de archivos

```
functions/
├── .env                      ← credenciales MP + webhook secret (NO commitear)
├── .gitignore
├── package.json              ← mercadopago@2.8.0 + firebase-functions@5
├── tsconfig.json
├── src/
│   ├── index.ts              ← entry point, inicia Admin SDK, exporta las 4 functions
│   ├── types.ts              ← tipos compartidos + PLAN_PRICES + TRIAL_DAYS
│   ├── mpWebhook.ts          ← HTTP webhook con validación de firma
│   ├── createSubscription.ts ← Callable con admin bypass
│   ├── checkSubscriptions.ts ← Scheduler con buffer de 24hs
│   └── initTrial.ts          ← Firestore trigger en /stores
└── lib/                      ← JS compilado por tsc (no commitear)
```

---

## Variables de entorno (`functions/.env`)

```env
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx   # Access token de producción
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx     # Public key (para frontend si es necesario)
MERCADO_PAGO_WEBHOOK_SECRET=xxx         # Firma secreta del webhook (MP Panel → Webhooks)
APP_URL=https://tutiendaweb.com.ar      # Para el back_url del PreApproval
```

**Cómo obtener `MERCADO_PAGO_WEBHOOK_SECRET`:**
MP Panel → tu aplicación → Webhooks → "Firma secreta" (se genera al crear el webhook).

---

## Modelo de datos en Firestore

### `/stores/{storeId}.subscription`

```typescript
subscription: {
  active: boolean;
  plan: "free" | "trial" | "basic" | "pro" | "enterprise";
  paymentStatus: "authorized" | "paused" | "cancelled" | "pending" | "trial" | "expired";
  startDate?: Timestamp;
  endDate?: Timestamp;
  graceUntil?: Timestamp;
  trialUsed?: boolean;
  lastPaymentDate?: Timestamp;
  billing?: {
    provider: "mercadopago" | "none";
    subscriptionId?: string;
    payerEmail?: string;
    autoRenew: boolean;
  };
}
```

### `/stores/{storeId}/notifications/{notificationId}`

```typescript
{
  type: "payment_success" | "payment_failed" | "subscription_cancelled"
      | "subscription_expired" | "trial_expired" | "trial_started";
  message: string;
  read: boolean;
  createdAt: Timestamp;
}
```

---

## Deploy

```bash
# Build + deploy de todas las functions
firebase deploy --only functions

# Solo una función
firebase deploy --only functions:mpWebhook
```

**Prerequisitos:**
- `firebase login` y `firebase use tutiendaweb-dev`
- Plan Blaze habilitado en Firebase (necesario para HTTP outbound hacia MP API)
- `MERCADO_PAGO_WEBHOOK_SECRET` configurado en `functions/.env` antes de deploy

---

## Checklist para ir a producción

| Item | Estado |
|------|--------|
| `MERCADO_PAGO_WEBHOOK_SECRET` configurado | Pendiente — obtener de MP Panel |
| URL del webhook registrada en MP (prod) | Pendiente — post-deploy |
| Eventos `subscription_preapproval` + `payment` activados en MP | Pendiente |
| Plan Blaze habilitado en Firebase | Verificar en Console |
| Índice Firestore para `subscription.billing.subscriptionId` | Agregar en `firestore.indexes.json` si hay errores |

---

## Testing

**Simulador de webhooks de MP:**
1. MP Panel → tu app → Webhooks → "Simular"
2. Seleccionar evento `subscription_preapproval` o `payment`
3. Pegar la URL del webhook deployado

**Con emuladores locales + ngrok:**
```bash
firebase emulators:start --only functions,firestore
# En otra terminal:
ngrok http 5001
# Registrar URL de ngrok en MP como webhook de prueba
```
