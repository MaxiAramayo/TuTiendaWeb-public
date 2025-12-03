/**
 * Formulario de perfil con autenticación
 * 
 * Wrapper que maneja la autenticación antes de mostrar el formulario
 * 
 * @module features/dashboard/modules/profile/forms/profile
 */

"use client";
import { useAuthClient } from "@/features/auth/hooks/use-auth-client";
import { ProfileForm as ProfileFormComponent } from "../../components/ProfileForm";
// Removed LoadingSpinner import

/**
 * Componente de formulario de perfil con verificación de autenticación
 * 
 * @returns Componente React
 */
const ProfileForm = () => {
  const { user, isLoading } = useAuthClient();
  const isReady = !isLoading;

  // Estado de carga mientras se hidrata
  if (!isReady) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }


  // Renderizar formulario con usuario autenticado
  return (
    <ProfileFormComponent
      showStats={true}
      showTips={true}
    />
  );
};

export default ProfileForm;
