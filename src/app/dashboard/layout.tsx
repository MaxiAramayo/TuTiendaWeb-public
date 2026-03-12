import DashboardLayout from "@/features/dashboard/layouts/DashboardLayout";
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-session';
import ClientHardRedirect from '@/components/navigation/ClientHardRedirect';
import { findStoreIdByUserId, getStoreOnboardingState } from '@/lib/auth/store-session';

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

  return <DashboardLayout>{children}</DashboardLayout>;
}
