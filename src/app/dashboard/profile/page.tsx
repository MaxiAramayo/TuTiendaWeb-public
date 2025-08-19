/**
 * Página de configuración del perfil de tienda
 *
 * Proporciona acceso a la configuración completa del perfil de la tienda
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProfileForm from "@/features/dashboard/modules/store-settings/forms/profile/ProfileForm";

/**
 * Página de configuración del perfil de tienda
 */
export default function ProfilePage() {
  return (
    <div className=" sm:mx-auto mx-4">
      <ProfileForm />
    </div>
  );
}
