/**
 * Página de configuración del perfil de tienda
 *
 * Server Component que obtiene los datos iniciales del perfil
 * y los pasa al formulario cliente.
 * 
 * Patrón: Server-First (fetch inicial en servidor)
 */

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";
import { profileServerService } from "@/features/dashboard/modules/store-settings/services/server/profile.server-service";
import ProfileForm from "@/features/dashboard/modules/store-settings/forms/profile/ProfileForm";
import type { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";

export const metadata = {
  title: 'Perfil de Tienda | Dashboard',
};

/**
 * Página de configuración del perfil de tienda
 */
export default async function ProfilePage() {
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
    // Cast para compatibilidad de tipos (el servicio retorna string para type)
    initialProfile = profile as StoreProfile | null;
  } catch (error) {
    console.error('Error loading profile:', error);
    // El formulario manejará el estado de error
  }

  return (
    <div className="sm:mx-auto mx-4">
      <ProfileForm initialProfile={initialProfile} />
    </div>
  );
}
