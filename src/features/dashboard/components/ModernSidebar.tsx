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
        "flex items-center border-b border-gray-200 dark:border-gray-800 h-16",
        isCollapsed ? "justify-center" : "justify-between px-4"
      )}>
        {/* Logo/Título */}
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2.5 overflow-hidden">
            <Store className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <span className="text-base font-bold text-gray-900 dark:text-white truncate">
              TuTiendaWeb
            </span>
          </Link>
        )}

        {isCollapsed && (
          <Link href="/dashboard" className="flex items-center justify-center w-full">
            <Store className="w-6 h-6 text-blue-600" />
          </Link>
        )}

        {/* Collapse button - Solo en desktop */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleCollapse(!isCollapsed)}
          className="hidden lg:flex w-8 h-8 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>

        {/* Close button - Solo en móvil */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobile}
          className="lg:hidden w-8 h-8 rounded-md text-gray-500 hover:text-gray-900"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
                "flex items-center rounded-md transition-colors duration-200 group relative",
                isCollapsed ? "justify-center py-2.5" : "px-3 py-2 space-x-3",
                isItemActive
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <item.icon className={cn(
                "flex-shrink-0 transition-colors",
                isItemActive
                  ? "text-blue-700 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300",
                "w-5 h-5"
              )} />

              {!isCollapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">
                    {item.title}
                  </span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 border-none">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}

              {/* Tooltip en modo colapsado */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium rounded-md shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {item.title}
                  <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Tienda Link */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 mt-auto">
        <Link
          href={storeSlug ? `/${storeSlug}` : '#'}
          target="_blank"
          className={cn(
            "flex items-center rounded-md transition-colors duration-200 group relative",
            isCollapsed ? "justify-center py-2.5" : "px-3 py-2.5 space-x-3",
            "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          <Store className={cn(
            "flex-shrink-0 transition-colors w-5 h-5",
            "text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
          )} />

          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Ver mi tienda</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                {storeSlug ? `/${storeSlug}` : 'Configura tu tienda'}
              </p>
            </div>
          )}

          {/* Tooltip en modo colapsado */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium rounded-md shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Visitar tienda
              <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-800 rotate-45"></div>
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
          "hidden lg:flex flex-col flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default ModernSidebar;
