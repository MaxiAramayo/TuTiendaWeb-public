/**
 * Barra superior moderna para el dashboard
 * 
 * Características:
 * - Responsive y moderna
 * - Navegación breadcrumb
 * - Perfil de usuario
 * - Notificaciones
 * - Búsqueda rápida
 * 
 * @module features/dashboard/components
 */

"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Menu, 
  User, 
  Settings,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserType } from "@/features/user/user.types";
import { useProfile } from "@/features/dashboard/modules/store-settings/hooks/useProfile";
import SignOutButton from "./SignOutButton";

/**
 * Props para el componente ModernTopBar
 */
interface ModernTopBarProps {
  /** Usuario actual */
  user: UserType | undefined;
  /** Función para alternar sidebar móvil */
  toggleMobileSidebar: () => void;
}

/**
 * Mapeo de rutas para breadcrumbs
 */
const routeTitles: Record<string, string> = {
  "/dashboard": "Inicio",
  "/dashboard/products": "Productos",
  "/dashboard/sells": "Ventas",
  "/dashboard/sells/new": "Nueva Venta",
  "/dashboard/profile": "Configuración",
  "/dashboard/qr": "QR Menu",
  "/dashboard/guides": "Guía de Usuario"
};

/**
 * Barra superior moderna del dashboard
 */
const ModernTopBar: React.FC<ModernTopBarProps> = ({
  user,
  toggleMobileSidebar
}) => {
  const pathname = usePathname();
  const { profile } = useProfile();
  
  // Obtener el nombre de la tienda del perfil, fallback al nombre del usuario
  const name = profile?.basicInfo?.name || user?.displayName || 'Mi Tienda';
  const storeInitial = name.charAt(0).toUpperCase();
  
  // URL del logo de la tienda desde el perfil
  const logoUrl = profile?.theme?.logoUrl;

  /**
   * Obtiene el título de la página actual
   */
  const getCurrentPageTitle = () => {
    return routeTitles[pathname] || "Dashboard";
  };

  /**
   * Genera breadcrumbs basados en la ruta actual
   */
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const title = routeTitles[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({
        title,
        path: currentPath,
        isLast: currentPath === pathname
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-6">
        
        {/* Lado izquierdo - Mobile menu + Breadcrumbs */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Botón menú móvil */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileSidebar}
            className="lg:hidden w-8 h-8 p-0"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Breadcrumbs y título */}
          <div className="hidden sm:flex flex-col">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {getCurrentPageTitle()}
            </h1>
            {breadcrumbs.length > 1 && (
              <nav className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.path}>
                    {index > 0 && (
                      <span className="text-gray-300 dark:text-gray-600">/</span>
                    )}
                    <span className={crumb.isLast ? "text-gray-900 dark:text-white font-medium" : ""}>
                      {crumb.title}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>

          {/* Título móvil */}
          <h1 className="sm:hidden text-base font-semibold text-gray-900 dark:text-white">
            {getCurrentPageTitle()}
          </h1>
        </div>

        {/* Lado derecho - Solo perfil */}
        <div className="flex items-center">
          {/* Menú de perfil */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 sm:h-10 w-auto px-1 sm:px-2">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    {logoUrl ? (
                      <AvatarImage 
                        src={logoUrl} 
                        alt={`Logo de ${name}`}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-blue-500 text-white text-xs sm:text-sm">
                      {storeInitial}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email || "email@ejemplo.com"}
                    </span>
                  </div>
                  
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "email@ejemplo.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link 
                  href="/dashboard/profile" 
                  className="flex items-center cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link 
                  href="/dashboard/profile" 
                  className="flex items-center cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <div className="w-full">
                  <SignOutButton inDropdown={true} />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default ModernTopBar;
