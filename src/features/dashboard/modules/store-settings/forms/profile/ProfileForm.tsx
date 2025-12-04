/**
 * Formulario de perfil con autenticación
 * 
 * Wrapper que recibe datos iniciales del Server Component
 * y los pasa al formulario principal.
 * 
 * @module features/dashboard/modules/profile/forms/profile
 */

"use client";
import { useAuthClient } from "@/features/auth/hooks/use-auth-client";
import { ProfileForm as ProfileFormComponent } from "../../components/ProfileForm";
import type { StoreProfile } from "../../types/store.type";

interface ProfileFormWrapperProps {
  initialProfile?: StoreProfile | null;
}

/**
 * Componente de formulario de perfil con verificación de autenticación
 * 
 * @param initialProfile - Datos iniciales del perfil desde el Server Component
 * @returns Componente React
 */
const ProfileForm = ({ initialProfile }: ProfileFormWrapperProps) => {
  const { user, isLoading } = useAuthClient();
  const isReady = !isLoading;

  // Estado de carga mientras se hidrata (solo si no hay datos iniciales)
  if (!isReady && !initialProfile) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Renderizar formulario con datos iniciales
  return (
    <ProfileFormComponent
      showStats={true}
      showTips={true}
      initialProfile={initialProfile}
    />
  );
};

export default ProfileForm;
