/**
 * Navegación lateral moderna para el dashboard
 * 
 * Características:
 * - Diseño moderno y profesional
 * - Completamente responsivo
 * - Animaciones suaves
 * - No se superpone al contenido
 * - Modo collapse en desktop
 * - Drawer en móvil
 * 
 * @module features/dashboard/components
 */

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Package,
  Settings,
  Store,
  QrCode,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentStore } from "@/features/dashboard/hooks/useCurrentStore";

/**
 * Props para el componente ModernSidebar
 */
interface ModernSidebarProps {
  /** Usuario actual */
  user: { displayName?: string | null; email?: string | null } | undefined | null;
  /** Estado del sidebar en móvil */
  isMobileOpen: boolean;
  /** Función para alternar sidebar móvil */
  toggleMobile: () => void;
  /** Estado colapsado del sidebar */
  isCollapsed: boolean;
  /** Función para alternar estado colapsado */
  onToggleCollapse: (collapsed: boolean) => void;
}

/**
 * Elementos de navegación del sidebar
 */
const navigationItems = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: Store,
    badge: null,
    description: "Panel principal"
  },
  {
    title: "Ventas",
    href: "/dashboard/sells",
    icon: TrendingUp,
    badge: null,
    description: "Gestiona tus ventas"
  },
  {
    title: "Productos",
    href: "/dashboard/products",
    icon: Package,
    badge: null,
    description: "Administra tu inventario"
  },
  {
    title: "Configuración",
    href: "/dashboard/profile",
    icon: Settings,
    badge: null,
    description: "Ajustes de tu cuenta"
  },
  {
    title: "QR Menu",
    href: "/dashboard/qr",
    icon: QrCode,
    badge: "Nuevo",
    description: "Código QR de tu menú"
  },
  {
    title: "Guía",
    href: "/dashboard/guides",
    icon: BookOpen,
    badge: null,
    description: "Manual de usuario"
  }
];

/**
 * Componente de navegación lateral moderna
 */
const ModernSidebar: React.FC<ModernSidebarProps> = ({
  user,
  isMobileOpen,
  toggleMobile,
  isCollapsed,
  onToggleCollapse
}) => {
  const pathname = usePathname();
  const { storeSlug } = useCurrentStore();

  /**
   * Verifica si una ruta está activa
   */
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  /**
   * Contenido del sidebar
   */
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-gray-200 dark:border-gray-700",
        isCollapsed ? "justify-center p-3 sm:p-4" : "justify-between p-3 sm:p-4"
      )}>
        {/* Logo/Título */}
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              TuTienda
            </span>
          </Link>
        )}

        {isCollapsed && (
          <Link href="/dashboard" className="flex items-center">
            <Store className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </Link>
        )}

        {/* Collapse button - Solo en desktop */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleCollapse(!isCollapsed)}
          className="hidden lg:flex w-7 h-7 sm:w-8 sm:h-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
        </Button>

        {/* Close button - Solo en móvil */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobile}
          className="lg:hidden w-7 h-7 sm:w-8 sm:h-8 p-0"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2">
        {navigationItems.map((item) => {
          const isItemActive = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                // Cerrar sidebar móvil al navegar
                if (window.innerWidth < 1024) {
                  toggleMobile();
                }
              }}
              className={cn(
                "flex items-center rounded-lg transition-all duration-200 group relative",
                isCollapsed ? "justify-center p-2 sm:p-3" : "p-2 sm:p-3 space-x-2 sm:space-x-3",
                isItemActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <item.icon className={cn(
                "flex-shrink-0 transition-colors",
                isItemActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300",
                isCollapsed ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4 sm:w-5 sm:h-5"
              )} />

              {!isCollapsed && (
                <>
                  <span className="flex-1 text-xs sm:text-sm font-medium">
                    {item.title}
                  </span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}

              {/* Tooltip en modo colapsado */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {item.title}
                  <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
                </div>
              )}

              {/* Indicador activo */}
              {isItemActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Tienda Link */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <Link
          href={storeSlug ? `/${storeSlug}` : '#'}
          target="_blank"
          className={cn(
            "flex items-center rounded-lg p-2 sm:p-3 transition-all duration-200 group relative",
            isCollapsed ? "justify-center" : "space-x-2 sm:space-x-3",
            "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
        >
          <Store className={cn(
            "flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",
            isCollapsed ? "w-5 h-5 sm:w-6 sm:h-6" : "w-4 h-4 sm:w-5 sm:h-5"
          )} />
          
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium">Ver mi tienda</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                {storeSlug || 'Configura tu tienda'}
              </p>
            </div>
          )}

          {/* Tooltip en modo colapsado */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Visitar tienda
              <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
            </div>
          )}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay para móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default ModernSidebar;
