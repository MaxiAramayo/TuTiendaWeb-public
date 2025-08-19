/**
 * Contenedor principal para la página de inicio del dashboard
 * 
 * Proporciona la estructura central para mostrar el contenido
 * principal del dashboard, incluyendo la alerta de suscripción
 * 
 * @module features/dashboard/modules/overview/components
 */

"use client";
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated";
import AlertDialogSuscripcion from "@/components/ui/generals/AlertDialogSuscripcion";
import HeaderWelcome from "./HeaderWelcome";
import DashboardOverview from "./DashboardOverview";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Contenedor principal del dashboard
 * 
 * @returns Componente React
 */
const DashboardContainer: React.FC = () => {
  const { user, isReady, isLoading } = useAuthHydrated();

  // Loading state optimizado
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 items-center md:max-w-4xl mx-auto w-[90%]">
        <header className="flex flex-col gap-3 items-center justify-center text-center w-full">
          <Skeleton className="w-80 h-8 rounded-md" />
          <Skeleton className="w-48 h-5 rounded-md" />
        </header>
        <div className="w-full">
          <Skeleton className="w-full h-64 rounded-md" />
        </div>
      </div>
    );
  }

  // Usuario no disponible
  if (!isReady || !user) {
    return (
      <div className="flex flex-col gap-6 items-center md:max-w-4xl mx-auto w-[90%]">
        <p className="text-gray-500">Cargando información del usuario...</p>
      </div>
    );
  }

  return (
    <>
      {/* Alerta de suscripción */}
      <AlertDialogSuscripcion suscripcion={undefined} />

      {/* Contenido principal */}
      <div className="flex flex-col gap-6 items-center md:max-w-6xl mx-auto w-[90%]">
        {/* Cabecera de bienvenida */}
        <HeaderWelcome />

        {/* Vista general del dashboard */}
        <DashboardOverview />
      </div>
    </>
  );
};

export default DashboardContainer;