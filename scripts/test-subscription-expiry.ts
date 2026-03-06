/**
 * test-subscription-expiry.ts
 *
 * Setea la suscripción de un store en Firestore para que venza pronto,
 * permitiendo testear el flujo de checkSubscriptions sin esperar el scheduler.
 *
 * Uso:
 *   STORE_ID=<id> npx tsx scripts/test-subscription-expiry.ts
 *
 * Variables de entorno:
 *   STORE_ID   (requerido) — ID del documento en /stores/{storeId}
 *   MINUTES    (opcional, default=5) — en cuántos minutos vence endDate
 *   SCENARIO   (opcional, default=cancel) — qué escenario preparar:
 *                "cancel"  → cancelAtPeriodEnd=true, simula que el usuario canceló
 *                "failed"  → simula pago fallido (sin graceUntil ni cancelAtPeriodEnd)
 *                "grace"   → simula gracia vencida (graceUntil en el pasado)
 *                "reset"   → restaura a estado Pro sano (endDate +30 días)
 *
 * Ejemplos:
 *   STORE_ID=abc123 npx tsx scripts/test-subscription-expiry.ts
 *   STORE_ID=abc123 MINUTES=2 SCENARIO=failed npx tsx scripts/test-subscription-expiry.ts
 *   STORE_ID=abc123 SCENARIO=reset npx tsx scripts/test-subscription-expiry.ts
 *
 * Requiere variables de entorno del Admin SDK en .env.local:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// ─── Cargar variables de entorno ─────────────────────────────────────────────

// Buscar en orden: .env.local → .env → variables del sistema
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: false });
  console.log('✓ .env.local cargado');
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
  console.log('✓ .env cargado');
} else {
  console.log('⚠ No se encontró .env ni .env.local — usando variables de entorno del sistema');
}

// ─── Init Firebase Admin ──────────────────────────────────────────────────────

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('✗ Faltan variables de entorno del Admin SDK:');
    if (!projectId) console.error('  - FIREBASE_PROJECT_ID');
    if (!clientEmail) console.error('  - FIREBASE_CLIENT_EMAIL');
    if (!privateKey) console.error('  - FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();

// ─── Parámetros ───────────────────────────────────────────────────────────────

const STORE_ID = process.env.STORE_ID;
const MINUTES = parseInt(process.env.MINUTES ?? '30', 10);
const SCENARIO = (process.env.SCENARIO ?? 'cancel') as
  | 'cancel'
  | 'failed'
  | 'grace'
  | 'reset';

if (!STORE_ID) {
  console.error('✗ STORE_ID es requerido. Ej: STORE_ID=abc123 npx tsx scripts/test-subscription-expiry.ts');
  process.exit(1);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const storeRef = db.collection('stores').doc(STORE_ID!);
  const snap = await storeRef.get();

  if (!snap.exists) {
    console.error(`✗ No se encontró el store con ID: ${STORE_ID}`);
    process.exit(1);
  }

  const data = snap.data()!;
  const sub = data.subscription ?? {};
  console.log('\nEstado actual de subscription:');
  console.log(`  active:             ${sub.active}`);
  console.log(`  plan:               ${sub.plan}`);
  console.log(`  paymentStatus:      ${sub.paymentStatus}`);
  console.log(`  cancelAtPeriodEnd:  ${sub.cancelAtPeriodEnd}`);
  console.log(`  endDate:            ${sub.endDate?.toDate?.().toISOString() ?? 'N/A'}`);
  console.log(`  graceUntil:         ${sub.graceUntil?.toDate?.().toISOString() ?? 'N/A'}`);
  console.log(`  lastPaymentDate:    ${sub.lastPaymentDate?.toDate?.().toISOString() ?? 'N/A'}`);

  const now = Date.now();
  const endDateMs = now + MINUTES * 60 * 1000;
  const endDate = admin.firestore.Timestamp.fromMillis(endDateMs);
  // lastPaymentDate hace más de 24hs para que el buffer de checkSubscriptions no lo saltee
  const lastPaymentDate = admin.firestore.Timestamp.fromMillis(now - 25 * 60 * 60 * 1000);

  let update: Record<string, unknown>;
  let description: string;

  switch (SCENARIO) {
    case 'cancel':
      // Simula: usuario canceló desde el dashboard, endDate vence pronto
      update = {
        'subscription.active': true,
        'subscription.plan': 'pro',
        'subscription.paymentStatus': 'authorized',
        'subscription.cancelAtPeriodEnd': true,
        'subscription.endDate': endDate,
        'subscription.lastPaymentDate': lastPaymentDate,
        'subscription.graceUntil': admin.firestore.FieldValue.delete(),
      };
      description = `Camino A (cancelación voluntaria): endDate en ${MINUTES} min, cancelAtPeriodEnd=true`;
      break;

    case 'failed':
      // Simula: pago falló, endDate vencida, sin graceUntil todavía (Fase 1)
      // checkSubscriptions va a escribir graceUntil=now+3días
      update = {
        'subscription.active': true,
        'subscription.plan': 'pro',
        'subscription.paymentStatus': 'authorized',
        'subscription.cancelAtPeriodEnd': false,
        'subscription.endDate': endDate,
        'subscription.lastPaymentDate': lastPaymentDate,
        'subscription.graceUntil': admin.firestore.FieldValue.delete(),
      };
      description = `Camino B Fase 1 (pago fallido): endDate en ${MINUTES} min, sin graceUntil`;
      break;

    case 'grace':
      // Simula: ya pasó por la gracia, graceUntil también vencido (Fase 2)
      // checkSubscriptions va a suspender
      const graceUntilPast = admin.firestore.Timestamp.fromMillis(now - 60 * 1000); // hace 1 min
      update = {
        'subscription.active': true,
        'subscription.plan': 'pro',
        'subscription.paymentStatus': 'authorized',
        'subscription.cancelAtPeriodEnd': false,
        'subscription.endDate': endDate,
        'subscription.lastPaymentDate': lastPaymentDate,
        'subscription.graceUntil': graceUntilPast,
      };
      description = `Camino C (gracia vencida): endDate en ${MINUTES} min, graceUntil=hace 1 min`;
      break;

    case 'reset': {
      // Restaura a estado Pro sano — siempre +30 días, ignora MINUTES
      const endDateFuture = admin.firestore.Timestamp.fromMillis(now + 30 * 24 * 60 * 60 * 1000);
      update = {
        'subscription.active': true,
        'subscription.plan': 'pro',
        'subscription.paymentStatus': 'authorized',
        'subscription.cancelAtPeriodEnd': false,
        'subscription.endDate': endDateFuture,
        'subscription.lastPaymentDate': admin.firestore.Timestamp.fromMillis(now),
        'subscription.graceUntil': admin.firestore.FieldValue.delete(),
      };
      description = 'Reset: estado Pro sano (endDate +30 días)';
      break;
    }

    default:
      console.error(`✗ SCENARIO inválido: ${SCENARIO}. Opciones: cancel, failed, grace, reset`);
      process.exit(1);
  }

  await storeRef.update(update);

  console.log(`\n✓ Firestore actualizado — ${description}`);

  if (SCENARIO === 'reset') {
    const resetEndDate = new Date(now + 30 * 24 * 60 * 60 * 1000);
    console.log(`\nNuevo estado:`);
    console.log(`  endDate:           ${resetEndDate.toISOString()} (+30 días)`);
    console.log(`  active:            true`);
    console.log(`  plan:              pro`);
    console.log(`  paymentStatus:     authorized`);
    console.log(`  cancelAtPeriodEnd: false`);
    console.log(`\nEstado restaurado a Pro activo. No hace falta disparar nada más.`);
  } else {
    console.log(`\nNuevo estado:`);
    console.log(`  endDate:  ${endDate.toDate().toISOString()} (en ${MINUTES} min)`);
    if (SCENARIO === 'cancel') {
      console.log(`  cancelAtPeriodEnd: true`);
      console.log(`\nQué esperar cuando checkSubscriptions corra (después de ${MINUTES} min):`);
      console.log(`  → PreApproval cancelado en MP`);
      console.log(`  → active=false, plan=free, paymentStatus=cancelled`);
    } else if (SCENARIO === 'failed') {
      console.log(`\nQué esperar cuando checkSubscriptions corra (después de ${MINUTES} min):`);
      console.log(`  → graceUntil=ahora+3días escrito en Firestore`);
      console.log(`  → Notificación "Tenés 3 días para renovar"`);
      console.log(`  → Para testear la Fase 2: correr SCENARIO=grace`);
    } else if (SCENARIO === 'grace') {
      console.log(`  graceUntil: hace 1 min (ya vencida)`);
      console.log(`\nQué esperar cuando checkSubscriptions corra (después de ${MINUTES} min):`);
      console.log(`  → active=false, plan=free, paymentStatus=expired`);
    }
  }

  console.log(`\nPara disparar checkSubscriptions manualmente:`);
  console.log(`  firebase functions:call checkSubscriptions --project <tu-project-id>`);
  console.log(`  o desde Firebase Console → Functions → checkSubscriptions → Test function\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Error inesperado:', err);
  process.exit(1);
});
