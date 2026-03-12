import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";
import { profileServerService } from "@/features/dashboard/modules/store-settings/services/server/profile.server-service";
import SettingsLayoutClient from "@/features/dashboard/modules/store-settings/components/SettingsLayoutClient";
import type { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";

export const metadata = {
  title: 'Configuración | Dashboard',
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect('/sign-in');
  }
  
  if (!session.storeId) {
    redirect('/complete-profile');
  }

  let initialProfile: StoreProfile | null = null;
  try {
    const profile = await profileServerService.getProfile(session.storeId);
    initialProfile = profile as StoreProfile | null;
  } catch (error) {
    console.error('Error loading profile:', error);
  }

  return (
    <div className="mx-3 sm:mx-6 lg:mx-8">
      <SettingsLayoutClient initialProfile={initialProfile}>
        {children}
      </SettingsLayoutClient>
    </div>
  );
}
