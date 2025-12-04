/**
 * Página principal del módulo QR
 * 
 * Server Component que obtiene el perfil de la tienda
 * y lo pasa al componente cliente.
 * 
 * Patrón: Server-First (fetch inicial en servidor)
 * 
 * @module app/dashboard/qr
 */

import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/server-session";
import { profileServerService } from "@/features/dashboard/modules/store-settings/services/server/profile.server-service";
import { QRModuleClient } from "@/features/dashboard/modules/qr/components/QRModuleClient";
import type { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";

export const metadata = {
  title: 'Código QR | Dashboard',
  description: 'Genera y descarga el código QR de tu tienda',
};

/**
 * Página del dashboard para generar códigos QR (Server Component)
 */
export default async function QRPage() {
  // 1. Verificar autenticación
  const session = await getServerSession();
  if (!session) {
    redirect('/sign-in');
  }

  if (!session.storeId) {
    redirect('/complete-profile');
  }

  // 2. Fetch inicial de datos (Server Component)
  let storeProfile: StoreProfile | null = null;
  try {
    const profile = await profileServerService.getProfile(session.storeId);
    storeProfile = profile as StoreProfile | null;
  } catch (error) {
    console.error('Error loading store profile for QR:', error);
  }

  // 3. Renderizar componente cliente con datos
  return <QRModuleClient storeProfile={storeProfile} />;
}
