import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";
import { profileServerService } from "@/features/dashboard/modules/store-settings/services/server/profile.server-service";
import SubscriptionPageClient from "@/features/dashboard/modules/store-settings/components/SubscriptionPageClient";
import type { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";

export const metadata = {
  title: 'Suscripción | Dashboard',
};

/**
 * Página de configuración de la suscripción de la tienda
 */
export default async function SubscriptionPage() {
  // 1. Verificar autenticación
  const session = await getServerSession();
  if (!session) {
    redirect('/sign-in');
  }
  
  if (!session.storeId) {
    redirect('/complete-profile');
  }

  // 2. Fetch inicial de datos (Server Component)
  let initialProfile: StoreProfile | null = null;
  try {
    const profile = await profileServerService.getProfile(session.storeId);
    initialProfile = profile as StoreProfile | null;
  } catch (error) {
    console.error('Error loading profile:', error);
  }

  return (
    <div className="sm:mx-auto mx-4 max-w-5xl">
      <SubscriptionPageClient initialProfile={initialProfile} userEmail={session.email || undefined} />
    </div>
  );
}
