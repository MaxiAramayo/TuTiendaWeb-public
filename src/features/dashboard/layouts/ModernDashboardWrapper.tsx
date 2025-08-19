/**
 * Layout moderno del Dashboard (Client Wrapper)
 * 
 * Características:
 * - Sidebar que no se superpone al contenido
 * - Completamente responsivo
 * - Animaciones suaves
 * - Modo collapse para desktop
 * - Drawer para móvil
 * 
 * @module features/dashboard/layouts
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthHydrated } from "@/features/auth/hooks/useAuthHydrated";
// Store eliminado - se usa useProducts hook en componentes específicos
import ModernSidebar from "../components/ModernSidebar";
import ModernTopBar from "../components/ModernTopBar";
import Spinner from "@/components/ui/spinners/Spinner";


/**
 * Props para el componente ModernDashboardWrapper
 */
interface ModernDashboardWrapperProps {
  /** Contenido a renderizar dentro del layout */
  children: React.ReactNode;
}

/**
 * Wrapper moderno del lado del cliente para el dashboard
 * 
 * Maneja:
 * - Estado de autenticación hidratado
 * - Carga de productos del usuario
 * - Estado responsive del sidebar
 * - Redirección si no hay autenticación
 * - Layout moderno sin superposiciones
 */
const ModernDashboardWrapper = ({ children }: ModernDashboardWrapperProps) => {
  const { user, isReady, isLoading } = useAuthHydrated();
  // Los productos se cargan desde los componentes específicos que los necesitan
  const router = useRouter();
  
  // Estado para controlar la visibilidad del sidebar en móvil
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Estado para controlar si el sidebar está colapsado
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  /**
   * Alterna la visibilidad de la barra lateral móvil
   */
  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  /**
   * Cierra la barra lateral móvil
   */
  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Los productos se cargan desde los componentes específicos que los necesitan

  // Redireccionar si no hay usuario después de la carga
  useEffect(() => {
    if (isReady && !user) {
      // Agregar un pequeño delay para evitar problemas de hidratación
      const timer = setTimeout(() => {
        router.replace("/sign-in"); // usar replace en lugar de push
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [isReady, user, router]);

  // Loading state durante la carga inicial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Spinner />
      </div>
    );
  }

  // Si no hay usuario después de la carga, no renderizar nada
  // (la redirección se encargará)
  if (!isReady || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar Moderno */}
        <ModernSidebar
          user={user}
          isMobileOpen={isMobileSidebarOpen}
          toggleMobile={toggleMobileSidebar}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={setIsSidebarCollapsed}
        />
        
        {/* Área de contenido principal */}
        <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
          {/* Barra superior moderna */}
          <ModernTopBar
            user={user}
            toggleMobileSidebar={toggleMobileSidebar}
          />
          
          {/* Contenido de la página */}
          <main className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-auto">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
  );
};

export default ModernDashboardWrapper;
