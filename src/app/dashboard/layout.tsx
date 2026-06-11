import DashboardLayout from "@/features/dashboard/layouts/DashboardLayout";
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-session';
import ClientHardRedirect from '@/components/navigation/ClientHardRedirect';
import { findStoreIdByUserId, getStoreOnboardingState } from '@/lib/auth/store-session';
import { profileServerService } from "@/features/dashboard/modules/store-settings/services/server/profile.server-service";
import AccessDeniedView from "@/components/ui/generals/AccessDeniedView";

/**
 * Layout de Dashboard - Route Component (Server Component)
 * 
 * Server Component que renderiza el DashboardLayout.
 * La interactividad se maneja dentro de DashboardLayout con "use client".
 * 
 * Beneficios del Server Component:
 * - Mejor SEO y performance inicial
 * - Renderizado del lado del servidor
 * - Delegación de interactividad a componentes específicos
 */
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    return <ClientHardRedirect to="/sign-in" title="Redirigiendo a inicio de sesión" description="Necesitamos validar tu acceso antes de continuar." />;
  }

  const storeId = session.storeId || await findStoreIdByUserId(session.userId);

  if (!storeId) {
    return <ClientHardRedirect to="/onboarding" title="Continuemos con tu configuración" description="Tu tienda todavía no está lista, te llevamos al onboarding." />;
  }

  const onboarding = await getStoreOnboardingState(storeId);

  if (!onboarding.completed) {
    return <ClientHardRedirect to="/onboarding" title="Retomando tu onboarding" description="Detectamos que todavía faltan pasos para terminar tu tienda." />;
  }

  // Verificar la suscripción
  const profile = await profileServerService.getProfile(storeId);
  const subscription = profile?.subscription;

  const now = Date.now();
  const isPro = subscription?.plan === 'pro' && subscription?.active;
  const isOnTrial = subscription?.plan === 'trial' && subscription?.active;

  const endDateMs = subscription?.endDate ? new Date(subscription.endDate as string).getTime() : 0;
  const graceUntilMs = subscription?.graceUntil ? new Date(subscription.graceUntil as string).getTime() : 0;

  // Pago iniciado pero aún no confirmado: mantener acceso para no bloquear al usuario durante el proceso
  const isPendingPayment = subscription?.paymentStatus === 'pending' && !!subscription?.billing?.pendingPlan;

  // Tiene acceso si: es Pro activo, O está en Trial vigente (no venció),
  // O tiene un pago en proceso, O está en período de gracia. No existe plan "free":
  // un trial vencido o un pro suspendido quedan con active=false → sin acceso.
  const hasValidAccess =
    isPro ||
    (isOnTrial && endDateMs > now) ||
    isPendingPayment ||
    (graceUntilMs > now);

  if (!hasValidAccess) {
    return <AccessDeniedView supportNumber={process.env.NEXT_PUBLIC_SUPPORT_NUMBER} />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
