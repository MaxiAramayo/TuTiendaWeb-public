# Sistema de Suscripciones — Estado actual y guía para continuar

> **Para:** desarrollador que continúa la implementación
> **Actualizado:** marzo 2026
> **Estado general:** Flujo de pago funcional en producción. Webhook operativo. UI del dashboard corregida. Pendiente: validar firma del webhook, resolver bug de sandbox desconocido, y completar features de gestión post-suscripción.

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
[checkSubscriptions]  ← Firebase Function scheduler (diario 09:00 ART)
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
- `SubscriptionSection.tsx` — Client Component que llama la Callable Function directamente via `firebase/functions`

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
4. `checkSubscriptions` (scheduler diario) verifica que `endDate > now`. Si venció sin renovarse, pone `active: false`, `plan: free`, `paymentStatus: expired`

### 3.3 Cancelación

1. MP cancela el PreApproval (por el usuario o por falta de pago)
2. MP envía webhook `type: "subscription_preapproval"`, `status: "cancelled"`
3. El webhook actualiza: `active: false`, `paymentStatus: "cancelled"`
4. Si el usuario quiere reactivar, debe iniciar un nuevo flujo de pago (crear un nuevo PreApproval)

---

## 4. Variables de entorno

### `functions/.env` (Firebase Functions — NO commitear)

```env
# Token de acceso a la API de MercadoPago
# PRODUCCIÓN: usar el token real de la cuenta vendedora
# SANDBOX: usar el token de un test user de tipo "vendedor"
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...

# Public key (no usada actualmente en functions, reservada para futuro)
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...

# Firma secreta del webhook
# Obtener en: MP Panel → Tus integraciones → tu app → Webhooks → "Firma secreta"
# IMPORTANTE: actualmente está VACÍO — la validación de firma está bypasseada
# Configurar ANTES de ir a producción
MERCADO_PAGO_WEBHOOK_SECRET=

# Client ID de la app MP (no usado en lógica, solo referencia)
MERCADO_PAGO_CLIENT_ID=...

# URL base de la app (para back_url del PreApproval)
APP_URL=https://tutiendaweb.com.ar

# Solo para sandbox: email del test user comprador
# En producción esta variable NO debe existir (se usa el email real del usuario)
MERCADO_PAGO_TEST_PAYER_EMAIL=test_user_...@testuser.com
```

### Variables de Next.js (`.env.local`)

No se agregaron variables nuevas para suscripciones. La comunicación con Firebase Functions se hace via el SDK de Firebase Client usando las variables `NEXT_PUBLIC_FIREBASE_*` existentes.

---

## 5. Código — Firebase Functions

### 5.1 `functions/src/types.ts`

Tipos compartidos entre todas las functions.

```typescript
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export type FirestoreTimestamp = Timestamp | FieldValue;

export type SubscriptionPlan = "free" | "trial" | "basic" | "pro" | "enterprise";

export type PreapprovalStatus =
  | "authorized"
  | "paused"
  | "cancelled"
  | "pending"
  | "trial"
  | "expired";

export interface SubscriptionBilling {
  provider: "mercadopago" | "none";
  subscriptionId?: string;
  payerEmail?: string;
  autoRenew: boolean;
}

export interface StoreSubscription {
  active: boolean;
  plan: SubscriptionPlan;
  startDate?: Timestamp;
  endDate?: Timestamp;
  graceUntil?: Timestamp;
  trialUsed?: boolean;
  paymentStatus?: PreapprovalStatus;
  lastPaymentDate?: Timestamp;
  billing?: SubscriptionBilling;
}

export type NotificationType =
  | "payment_failed"
  | "payment_success"
  | "subscription_cancelled"
  | "subscription_expired"
  | "trial_expired"
  | "trial_started";

export interface SubscriptionNotification {
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface MPWebhookBody {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: { id: string };
}

export interface CreateSubscriptionResult {
  initPoint: string;
  subscriptionId: string;
}

export interface CreateSubscriptionInput {
  storeId: string;
  userId: string;
  userEmail: string;
  plan: SubscriptionPlan;
}

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  free: 0,
  trial: 0,
  basic: 2999,
  pro: 4999,
  enterprise: 9999,
};

export const PLAN_NAMES: Record<SubscriptionPlan, string> = {
  free: "Gratuito",
  trial: "Prueba gratuita",
  basic: "Básico",
  pro: "Profesional",
  enterprise: "Empresarial",
};

export const TRIAL_DAYS = 7;
```

---

### 5.2 `functions/src/createSubscription.ts`

Callable Function que crea el PreApproval en MP y lo guarda en Firestore.

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import {
  PLAN_PRICES, PLAN_NAMES,
  type CreateSubscriptionInput, type CreateSubscriptionResult, type SubscriptionPlan,
} from "./types";

function getMPClient(): MercadoPagoConfig {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new HttpsError("internal", "MERCADO_PAGO_ACCESS_TOKEN no está configurado");
  return new MercadoPagoConfig({ accessToken: token });
}

const VALID_PAID_PLANS: SubscriptionPlan[] = ["basic", "pro", "enterprise"];

function validatePlan(plan: string): SubscriptionPlan {
  if (!VALID_PAID_PLANS.includes(plan as SubscriptionPlan)) {
    throw new HttpsError("invalid-argument", `Plan inválido: ${plan}`);
  }
  return plan as SubscriptionPlan;
}

export const createSubscription = onCall<CreateSubscriptionInput, Promise<CreateSubscriptionResult>>(
  { region: "southamerica-east1" },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Debe estar autenticado");

    const { storeId, userId, userEmail, plan } = request.data;
    if (!storeId || !userId || !userEmail || !plan) {
      throw new HttpsError("invalid-argument", "Faltan campos requeridos");
    }

    // El owner puede gestionar su propia tienda.
    // Los admins (documento en /admins/{uid}) pueden gestionar cualquier tienda.
    if (request.auth.uid !== userId) {
      const db = getFirestore();
      const adminDoc = await db.doc(`admins/${request.auth.uid}`).get();
      if (!adminDoc.exists) {
        throw new HttpsError("permission-denied", "Solo el owner o un admin puede gestionar la suscripción");
      }
    }

    const validatedPlan = validatePlan(plan);
    const amount = PLAN_PRICES[validatedPlan];
    if (amount === 0) throw new HttpsError("invalid-argument", "El plan gratuito no requiere pago");

    const appUrl = process.env.APP_URL || "https://tutiendaweb.com.ar";

    // En sandbox, MERCADO_PAGO_TEST_PAYER_EMAIL sobreescribe el email del usuario.
    // En producción esta variable NO debe existir.
    const testPayerEmail = process.env.MERCADO_PAGO_TEST_PAYER_EMAIL;
    const resolvedPayerEmail = testPayerEmail || userEmail;

    const mp = getMPClient();
    const preapprovalClient = new PreApproval(mp);

    let preapproval: Awaited<ReturnType<typeof preapprovalClient.create>>;
    try {
      preapproval = await preapprovalClient.create({
        body: {
          reason: `TuTiendaWeb - Plan ${PLAN_NAMES[validatedPlan]}`,
          back_url: `${appUrl}/suscripcion/confirmacion`,
          payer_email: resolvedPayerEmail,
          external_reference: `${storeId}:${validatedPlan}`,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: amount,
            currency_id: "ARS",
          },
          status: "pending",
        },
      });
    } catch (mpError: any) {
      logger.error("Error de MercadoPago al crear PreApproval", {
        storeId, plan: validatedPlan,
        errorMessage: mpError?.cause?.message ?? mpError?.message,
      });
      throw new HttpsError("internal", `Error al crear el link de pago: ${mpError?.cause?.message ?? mpError?.message ?? "error desconocido"}`);
    }

    if (!preapproval.id || !preapproval.init_point) {
      throw new HttpsError("internal", "Error al crear el link de pago en MercadoPago");
    }

    // Guardar en Firestore
    const db = getFirestore();
    await db.doc(`stores/${storeId}`).update({
      "subscription.billing.subscriptionId": preapproval.id,
      "subscription.billing.provider": "mercadopago",
      "subscription.billing.payerEmail": userEmail,
      "subscription.billing.autoRenew": true,
      "subscription.paymentStatus": "pending",
      "subscription.plan": validatedPlan,
      "subscription.startDate": Timestamp.now(),
    });

    return { initPoint: preapproval.init_point, subscriptionId: preapproval.id };
  }
);
```

---

### 5.3 `functions/src/mpWebhook.ts`

HTTP Function que recibe notificaciones de MercadoPago. Deployada como Cloud Run en `southamerica-east1`.

Maneja tres tipos de eventos:
- `subscription_preapproval` — cambios de estado del PreApproval (`pending`, `authorized`, `paused`, `cancelled`)
- `subscription_authorized_payment` — confirmación de pago (activa la suscripción)
- `payment` — cobro recurrente mensual (renueva `endDate`)

```typescript
import * as crypto from "crypto";
import { onRequest, Request } from "firebase-functions/v2/https";
import { MercadoPagoConfig, PreApproval, Payment } from "mercadopago";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import type { MPWebhookBody, PreapprovalStatus, NotificationType } from "./types";

// ── Validación de firma ────────────────────────────────────────────────────────
// ATENCIÓN: actualmente MERCADO_PAGO_WEBHOOK_SECRET está vacío → bypass activado.
// Configurar el secreto antes de producción.

function validateMPSignature(req: Request): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret || secret === "REEMPLAZAR_CON_FIRMA_SECRETA_DE_MP") {
    logger.warn("MERCADO_PAGO_WEBHOOK_SECRET no configurado — firma DESACTIVADA.");
    return true; // bypass
  }

  const signatureHeader = req.headers["x-signature"] as string | undefined;
  const requestId = req.headers["x-request-id"] as string | undefined;
  if (!signatureHeader || !requestId) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx !== -1) parts[part.slice(0, eqIdx).trim()] = part.slice(eqIdx + 1).trim();
  }
  if (!parts.ts || !parts.v1) return false;

  // MP construye el manifest con el data.id del query param (más confiable que el body)
  const dataId = (req.query["data.id"] as string) ?? String((req.body as MPWebhookBody)?.data?.id ?? "");
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expectedHash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return expectedHash === parts.v1;
}

// ── Mapeo de estados ───────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, {
  active: boolean;
  paymentStatus: PreapprovalStatus;
  notificationType: NotificationType;
  notificationMessage: string;
}> = {
  pending: {
    active: false, paymentStatus: "pending",
    notificationType: "payment_failed",
    notificationMessage: "Tu suscripción está pendiente de confirmación de pago.",
  },
  authorized: {
    active: true, paymentStatus: "authorized",
    notificationType: "payment_success",
    notificationMessage: "Tu pago fue acreditado. Tu cuenta está activa.",
  },
  paused: {
    active: false, paymentStatus: "paused",
    notificationType: "payment_failed",
    notificationMessage: "Hubo un problema con tu pago. Contactanos por WhatsApp.",
  },
  cancelled: {
    active: false, paymentStatus: "cancelled",
    notificationType: "subscription_cancelled",
    notificationMessage: "Tu suscripción fue cancelada. Podés reactivarla cuando quieras.",
  },
};

// ── Handlers ───────────────────────────────────────────────────────────────────

async function addNotification(storeId: string, type: NotificationType, message: string) {
  const db = getFirestore();
  await db.collection("stores").doc(storeId).collection("notifications").add({
    type, message, read: false, createdAt: Timestamp.now(),
  });
}

async function handlePreapproval(dataId: string): Promise<void> {
  const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
  const preapproval = await new PreApproval(mp).get({ id: dataId });

  const externalRef = preapproval.external_reference;
  if (!externalRef) return;

  const [storeId, planFromRef] = externalRef.split(":");
  if (!storeId) return;

  const status = preapproval.status as string;
  const mapping = STATUS_MAP[status];
  if (!mapping) return;

  const db = getFirestore();
  const update: Record<string, unknown> = {
    "subscription.active": mapping.active,
    "subscription.plan": planFromRef || "basic",
    "subscription.paymentStatus": mapping.paymentStatus,
    "subscription.lastPaymentDate": Timestamp.now(),
    "subscription.billing.subscriptionId": preapproval.id,
    "subscription.billing.provider": "mercadopago",
  };

  if (status === "authorized") {
    update["subscription.endDate"] = preapproval.next_payment_date
      ? Timestamp.fromDate(new Date(preapproval.next_payment_date))
      : Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  await db.doc(`stores/${storeId}`).update(update);
  await addNotification(storeId, mapping.notificationType, mapping.notificationMessage);
}

async function handleAuthorizedPayment(dataId: string): Promise<void> {
  const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
  const preapproval = await new PreApproval(mp).get({ id: dataId });

  const externalRef = preapproval.external_reference;
  if (!externalRef) return;

  const [storeId, planFromRef] = externalRef.split(":");
  if (!storeId) return;

  const db = getFirestore();
  await db.doc(`stores/${storeId}`).update({
    "subscription.active": true,
    "subscription.plan": planFromRef || "pro",
    "subscription.paymentStatus": "authorized",
    "subscription.lastPaymentDate": Timestamp.now(),
    "subscription.billing.subscriptionId": preapproval.id,
    "subscription.billing.provider": "mercadopago",
    "subscription.endDate": preapproval.next_payment_date
      ? Timestamp.fromDate(new Date(preapproval.next_payment_date))
      : Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  await addNotification(storeId, "payment_success", "Tu pago fue acreditado. Tu cuenta Pro está activa.");
}

interface PaymentWithSubscription {
  id?: number; status?: string; subscription_id?: string;
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

### 5.4 `functions/src/checkSubscriptions.ts`

Scheduler diario que suspende suscripciones con `endDate` vencida.

```typescript
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";

export const checkSubscriptions = onSchedule(
  {
    schedule: "0 12 * * *", // 12:00 UTC = 09:00 ART
    timeZone: "America/Argentina/Buenos_Aires",
    region: "southamerica-east1",
  },
  async () => {
    const db = getFirestore();
    const now = Timestamp.now();
    const oneDayAgoMs = Date.now() - 24 * 60 * 60 * 1000;

    const storesSnap = await db
      .collection("stores")
      .where("subscription.active", "==", true)
      .where("subscription.endDate", "<=", now)
      .get();

    if (storesSnap.empty) return;

    for (const doc of storesSnap.docs) {
      const subscription = doc.data().subscription as {
        graceUntil?: Timestamp; lastPaymentDate?: Timestamp; plan?: string;
      };

      const plan = subscription?.plan ?? "free";
      if (plan === "free" || plan === "trial") continue;

      // Buffer 24hs: protege contra race condition con el webhook de pago
      const lastPaymentMs = subscription?.lastPaymentDate?.toMillis() ?? 0;
      if (lastPaymentMs > oneDayAgoMs) continue;

      // Período de gracia vigente
      if (subscription?.graceUntil && subscription.graceUntil.toMillis() > now.toMillis()) continue;

      await doc.ref.update({
        "subscription.active": false,
        "subscription.plan": "free",
        "subscription.paymentStatus": "expired",
      });

      await db.collection("stores").doc(doc.id).collection("notifications").add({
        type: "subscription_expired",
        message: "Tu suscripción venció. Renovála para seguir usando todas las funciones.",
        read: false,
        createdAt: now,
      });
    }
  }
);
```

---

## 6. Código — Frontend

### 6.1 `src/features/dashboard/modules/store-settings/components/sections/SubscriptionSection.tsx`

Client Component que muestra el estado de la suscripción y maneja el botón de pago.

**Puntos clave:**
- Lee `subscription` desde `profile?.subscription` (viene del Zustand store, que tiene los datos reales de Firestore). **No** desde `formData.subscription` (que siempre es `undefined` porque el schema Zod no incluye `subscription`).
- Abre MercadoPago en `window.open(_blank)` — el usuario paga en una pestaña nueva.
- Detecta `?preapproval_id` en la URL para mostrar banners de estado al volver de MP.

```typescript
'use client';

import React, { useCallback, useTransition, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/lib/firebase/client';
import { useAuth } from '@/features/auth/providers/auth-store-provider';
import { ProfileFormData, FormState, SubscriptionInfo } from '../../types/store.type';
// ... (imports de UI omitidos por brevedad)

interface SubscriptionSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
  userEmail?: string;
  profile?: {
    id?: string;
    basicInfo?: { name?: string };
    contactInfo?: { whatsapp?: string };
    subscription?: SubscriptionInfo;  // ← campo clave
  } | null;
}

export function SubscriptionSection({ formData, userEmail, profile, ... }) {
  const [processingPayment, setProcessingPayment] = useState(false);
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // IMPORTANTE: leer desde profile, no desde formData
  const subscription = profile?.subscription || formData.subscription || {
    active: false,
    plan: 'free' as const,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    trialUsed: false,
  };

  const isPro = subscription.plan === 'pro' && subscription.active;
  const isPendingConfirmation = subscription.plan === 'pro' && subscription.paymentStatus === 'pending';

  const handleSubscribe = async () => {
    setProcessingPayment(true);
    try {
      const functions = getFunctions(app, 'southamerica-east1');
      const createSubscription = httpsCallable<
        { storeId: string; userId: string; userEmail: string; plan: string },
        { initPoint: string }
      >(functions, 'createSubscription');

      const result = await createSubscription({
        storeId: profile?.id ?? '',
        userId: user?.uid ?? '',
        userEmail: user?.email ?? userEmail ?? '',
        plan: 'pro',
      });

      window.open(result.data.initPoint, '_blank');
    } catch (error: any) {
      toast.error(error?.message ?? 'No se pudo generar el link de pago.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Render: muestra card de estado actual + card del plan Pro si no es Pro
  // ...
}
```

---

### 6.2 `src/app/suscripcion/confirmacion/page.tsx`

Página pública (sin auth) a la que MercadoPago redirige como `back_url` después del pago.

```typescript
import Link from 'next/link';
import { CheckCircle2, Clock, ArrowRight, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PageProps {
  searchParams: Promise<{ preapproval_id?: string; status?: string }>;
}

export default async function SubscriptionConfirmationPage({ searchParams }: PageProps) {
  const { preapproval_id: preapprovalId, status } = await searchParams;
  const likelyApproved = status === 'authorized';

  return (
    // Muestra CheckCircle verde si status=authorized, Clock azul si no
    // Botones: "Ver estado de mi suscripción" → /dashboard/profile?section=subscription
    //          "Ir al panel" → /dashboard
  );
}
```

**Por qué existe esta página:** `back_url` de MP redirige en la misma pestaña donde el usuario pagó (no en la pestaña del dashboard). Si se apuntaba a `/dashboard/profile`, el usuario llegaba sin cookie de sesión activa y era redirigido a `/sign-in`. Esta página no requiere auth y le muestra un mensaje apropiado antes de que vaya al dashboard.

---

### 6.3 Flujo de datos de `subscription` en el dashboard

Este es el punto más importante para entender por qué los datos se leen como se leen:

```
Firestore
  └─ stores/{storeId}.subscription  (Timestamps de Firebase Admin)
       │
       ▼
profileServerService.getProfile()  [server-service.ts]
  └─ serializeProfile()  → convierte todos los Timestamps a ISO strings
       │
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
  active: boolean;           // true = acceso completo habilitado
  plan: "free" | "trial" | "basic" | "pro" | "enterprise";
  paymentStatus: "pending" | "authorized" | "paused" | "cancelled" | "expired";
  startDate: Timestamp;      // fecha de inicio del plan
  endDate: Timestamp;        // próxima fecha de cobro (= fecha de vencimiento)
  lastPaymentDate: Timestamp;
  trialUsed: boolean;
  graceUntil?: Timestamp;    // período de gracia (no implementado en UI todavía)
  billing: {
    provider: "mercadopago";
    subscriptionId: string;  // ID del PreApproval de MP
    payerEmail: string;      // email con el que se creó el PreApproval
    autoRenew: boolean;
  };
}
```

Notificaciones en subcolección `/stores/{storeId}/notifications/{notifId}`:

```typescript
{
  type: "payment_success" | "payment_failed" | "subscription_cancelled" | "subscription_expired" | "trial_started" | "trial_expired";
  message: string;
  read: boolean;
  createdAt: Timestamp;
}
```

**Importante:** las notificaciones se escriben pero **no tienen UI implementada** en el dashboard todavía.

---

## 8. Qué funciona hoy

| Feature | Estado | Notas |
|---------|--------|-------|
| Crear PreApproval en MP | ✅ | `createSubscription` function deployada |
| Recibir webhook de MP | ✅ | `mpWebhook` function deployada |
| Actualizar Firestore al autorizar pago | ✅ | `handlePreapproval` + `handleAuthorizedPayment` |
| Actualizar Firestore al cancelar | ✅ | `STATUS_MAP.cancelled` |
| Renovación mensual por webhook `payment` | ✅ | `handlePayment` implementado |
| Scheduler diario de vencimientos | ✅ | `checkSubscriptions` deployado |
| UI card de suscripción en dashboard | ✅ | Muestra plan Pro verde si `active: true` |
| Página de confirmación post-MP | ✅ | `/suscripcion/confirmacion` |
| Redirect al dashboard tras registro | ✅ | `MultiStepRegister` corregido |
| Serialización de Timestamps en el server service | ✅ | Todos los campos de `subscription` serializados |

---

## 9. Bugs conocidos y pendientes

### BUG-01 — Validación de firma de webhook desactivada

**Severidad:** Alta — debe resolverse antes de producción  
**Archivo:** `functions/src/mpWebhook.ts` línea 30  
**Estado:** `MERCADO_PAGO_WEBHOOK_SECRET` está vacío en `functions/.env`

La función `validateMPSignature` bypasea la validación si el secreto no está configurado. Esto significa que cualquiera puede enviar un POST al endpoint del webhook y modificar datos en Firestore.

**Para resolver:**
1. Ir al panel de MP → Tus integraciones → tu app → Webhooks
2. Copiar el valor de "Firma secreta"
3. Pegarlo en `functions/.env` como `MERCADO_PAGO_WEBHOOK_SECRET=<valor>`
4. Hacer deploy: `firebase deploy --only functions:mpWebhook`

**Nota:** durante el desarrollo se intentó configurar este secreto pero ninguno de los valores obtenidos del panel producía un hash válido. La causa puede ser que MP use un secreto distinto por ambiente (sandbox vs producción) o que el manifest que se construye en el código no coincida con lo que MP espera. Verificar la documentación oficial: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks

---

### BUG-02 — Pagos de prueba rechazados en sandbox (causa desconocida)

**Severidad:** Media — bloquea testing, no afecta producción  
**Estado:** No resuelto

Al intentar pagar con tarjetas de prueba en el sandbox de MercadoPago, la UI de MP muestra:

> "Algo salió mal... No pudimos procesar tu pago. Usa un medio de pago distinto."

**Lo que se descartó como causa:**
- Cuenta del comprador incorrecta — se probó con múltiples test users distintos
- Tarjetas de prueba incorrectas — se usaron solo las tarjetas oficiales de MP (Mastercard `5031 7557 3453 0604`, Visa `4509 9535 6623 3704`)
- Historial de cancelaciones acumuladas en el `external_reference` — se probó con stores nuevos sin historial
- Preapprovals activos del mismo payer — se cancelaron todos antes de cada intento

**Lo que se observó:**
- El PreApproval se crea correctamente en MP (status `pending`, `init_point` válido)
- El usuario puede acceder al checkout de MP
- Al intentar pagar, MP cancela el PreApproval automáticamente en ~15 segundos sin procesar el pago (`charged_quantity: null`, `payment_method_id: null`)
- El webhook recibe el evento `cancelled` y Firestore se actualiza correctamente

**Datos del collector:**
- `collector_id: 3234523583`
- `test_user: false` según la API de MP (`GET /users/me`)
- El nickname es `TESTUSER738670832445418264` pero la cuenta no está marcada como test user en la API

**Hipótesis más probable:** el `ACCESS_TOKEN` configurado corresponde a una cuenta real (no un test user de MP), lo que hace que MP rechace los pagos de sandbox. Para testear en sandbox correctamente, el collector también debe ser un test user con su propio Access Token de prueba.

**Blocker para obtener el Access Token de test:** el panel de MP no muestra la opción de obtener credenciales desde las cuentas de prueba creadas en "Cuentas de prueba". Esta limitación puede ser del plan o del tipo de cuenta.

**Para resolver:**
- Investigar si hay una forma de obtener el Access Token de un test user vendedor desde el panel de MP (puede estar en una sección diferente de "Credenciales")
- Alternativamente, probar el flujo completo directamente en producción con pagos reales de bajo monto y cancelar inmediatamente

---

### PENDIENTE-01 — UI de notificaciones no implementada

Las notificaciones se escriben en `/stores/{storeId}/notifications` pero no hay ningún componente en el dashboard que las muestre al usuario. Implementar un badge o panel de notificaciones.

---

### PENDIENTE-02 — Flujo de cancelación por parte del usuario

No hay UI para que el usuario cancele su suscripción. El flujo de cancelación de MP (llamar `PUT /preapproval/{id}` con `status: cancelled`) no está expuesto en el frontend. Implementar en `SubscriptionSection` un botón "Cancelar suscripción" que llame a una nueva Firebase Function `cancelSubscription`.

---

### PENDIENTE-03 — Activación del trial

El tipo `trial` está definido y `trialUsed` se trackea en Firestore, pero no hay lógica que active el trial. El botón "Iniciar prueba gratuita" no existe en la UI. Implementar si se decide ofrecer un período de prueba.

---

### PENDIENTE-04 — Webhook URL configurada en MP

Verificar que la URL del webhook en el panel de MP apunte a la URL correcta de la Cloud Run:

```
https://mpwebhook-<hash>-uc.a.run.app
```

o la URL de Firebase Functions si se usa el dominio de Firebase. La URL exacta se puede ver en:
```
firebase functions:list --project tutiendaweb-dev
```

---

### PENDIENTE-05 — Período de gracia no tiene UI

El campo `graceUntil` en Firestore está definido en los tipos pero `checkSubscriptions` solo lo respeta como protección — nunca lo escribe. No hay lógica que asigne un período de gracia cuando un pago falla. Implementar si se quiere dar días de gracia antes de suspender.

---

## 10. Pasos para llegar a producción

En orden de prioridad:

1. **Resolver BUG-02 (sandbox)** — confirmar que el flujo de pago funciona end-to-end antes de ir a producción

2. **Configurar `MERCADO_PAGO_WEBHOOK_SECRET` (BUG-01)** — obtener la firma secreta real del panel de MP y hacer deploy de `mpWebhook`

3. **Eliminar `MERCADO_PAGO_TEST_PAYER_EMAIL`** de `functions/.env` para que los pagos reales usen el email del usuario

4. **Verificar URL del webhook en MP** — que apunte al endpoint correcto de producción

5. **Deploy de todas las functions:**
   ```bash
   firebase deploy --only functions:createSubscription,functions:mpWebhook,functions:checkSubscriptions
   ```

6. **Push del código Next.js a Vercel** — incluye los fixes de esta sesión:
   - `SubscriptionSection.tsx` — lee `subscription` desde `profile`, no `formData`
   - `MultiStepRegister.tsx` — redirect al dashboard tras registro
   - `src/app/suscripcion/confirmacion/page.tsx` — página nueva
   - `profile.server-service.ts` — serialización de todos los Timestamps de `subscription`

7. **Implementar cancelación de suscripción** — nueva Firebase Function + botón en UI

8. **Implementar UI de notificaciones** — mostrar las notificaciones de `/stores/{storeId}/notifications`

9. **Test en producción** — pagar con tarjeta real, verificar webhook, verificar Firestore, verificar UI del dashboard

---

> **Archivos clave para entender el sistema de un vistazo:**
> - `functions/src/createSubscription.ts` — crea el PreApproval
> - `functions/src/mpWebhook.ts` — procesa eventos de MP
> - `functions/src/checkSubscriptions.ts` — scheduler de vencimientos
> - `src/features/dashboard/modules/store-settings/components/sections/SubscriptionSection.tsx` — UI del dashboard
> - `src/features/dashboard/modules/store-settings/services/server/profile.server-service.ts` — serialización de datos
> - `src/app/suscripcion/confirmacion/page.tsx` — página de retorno de MP
