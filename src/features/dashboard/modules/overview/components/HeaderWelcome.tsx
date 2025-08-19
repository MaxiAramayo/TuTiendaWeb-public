/**
 * Componente de cabecera de bienvenida para el dashboard
 * 
 * Muestra un mensaje de bienvenida personalizado con el nombre de la tienda
 * 
 * @module features/dashboard/modules/overview/components
 */

"use client";
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated";
import { useProfile } from "@/features/dashboard/modules/store-settings/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Cabecera de bienvenida para el dashboard
 * 
 * Muestra un saludo personalizado al usuario con el nombre de su tienda
 * 
 * @returns Componente React
 */
const HeaderWelcome: React.FC = () => {
  const { user, isReady, isLoading: authLoading } = useAuthHydrated();
  const { profile, isLoading: profileLoading } = useProfile();

  const isLoading = authLoading || profileLoading;

  // Loading state optimizado
  if (isLoading) {
    return (
      <header className="flex flex-col gap-3 items-center justify-center text-center w-full">
        <div className="w-80 h-8 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="w-48 h-5 bg-gray-200 animate-pulse rounded-md"></div>
      </header>
    );
  }

  // Usuario no disponible después de carga
  if (!isReady || !user) {
    return (
      <header className="flex flex-col gap-3 items-center justify-center text-center w-full">
        <div className="w-80 h-8 bg-gray-200 animate-pulse rounded-md"></div>
        <div className="w-48 h-5 bg-gray-200 animate-pulse rounded-md"></div>
      </header>
    );
  }

  // Obtener el nombre de la tienda del perfil, fallback al nombre del usuario
  const name = profile?.basicInfo?.name || user.displayName || 'Tu tienda';

  return (
    <header className="flex flex-col gap-3 items-center justify-center text-center w-full">
      <h1 className="text-3xl font-bold">
        Bienvenido a <span className="underline">{name}</span>
      </h1>
      <p className="text-gray-500">¿Qué deseas hacer hoy?</p>
    </header>
  );
};

export default HeaderWelcome;