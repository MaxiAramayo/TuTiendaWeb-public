/**
 * Componente de vista general del dashboard
 * 
 * Muestra un resumen de la tienda con accesos rápidos a las principales
 * funcionalidades y estadísticas básicas.
 * 
 * @module features/dashboard/modules/overview/components
 */

"use client";

import { useRouter } from 'next/navigation';
import {
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Plus,
  Eye,
  Settings,
  QrCode,
  BookOpen,
  CreditCard
} from 'lucide-react';
import { useAuthClient } from "@/features/auth/hooks/use-auth-client";
import { useCurrentStore } from "@/features/dashboard/hooks/useCurrentStore";
import { useProfile } from "@/features/dashboard/modules/store-settings/hooks/useProfile";

/**
 * Componente de vista general del dashboard
 * 
 * @returns Componente React
 */
const DashboardOverview: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthClient();
  const { storeId } = useCurrentStore();
  const { profile } = useProfile();

  /**
   * Acciones rápidas disponibles en el dashboard
   */
  const quickActions = [
    {
      title: 'Crear Producto',
      description: 'Agrega un nuevo producto a tu catálogo',
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => router.push('/dashboard/products/new')
    },
    {
      title: 'Ver Productos',
      description: 'Gestiona tu catálogo de productos',
      icon: Package,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => router.push('/dashboard/products')
    },
    {
      title: 'Nueva Venta',
      description: 'Registra una nueva venta',
      icon: ShoppingCart,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => router.push('/dashboard/sells/new')
    },
    {
      title: 'Ver Tienda',
      description: 'Visualiza tu tienda online',
      icon: Eye,
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => {
        if (storeId) {
          window.open(`/store/${storeId}`, '_blank');
        }
      }
    }
  ];

  /**
   * Secciones principales del dashboard
   */
  const dashboardSections = [
    {
      title: 'Productos',
      description: 'Gestiona tu catálogo',
      icon: Package,
      path: '/dashboard/products',
      stats: '0 productos'
    },
    {
      title: 'Ventas',
      description: 'Historial de ventas',
      icon: BarChart3,
      path: '/dashboard/sells',
      stats: '0 ventas'
    },
    {
      title: 'Perfil',
      description: 'Configuración de la tienda',
      icon: Settings,
      path: '/dashboard/profile',
      stats: 'Configurar'
    },
    {
      title: 'Código QR',
      description: 'Comparte tu tienda',
      icon: QrCode,
      path: '/dashboard/qr',
      stats: 'Generar QR'
    },
    {
      title: 'Guías',
      description: 'Aprende a usar la plataforma',
      icon: BookOpen,
      path: '/dashboard/guides',
      stats: 'Ver guías'
    },
    {
      title: 'Suscripción',
      description: 'Gestiona tu plan',
      icon: CreditCard,
      path: '/dashboard/subscription',
      stats: 'Plan actual'
    }
  ];

  return (
    <div className="w-full space-y-8">
      {/* Acciones rápidas */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className={`${action.color} text-white p-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <IconComponent className="w-8 h-8" />
                  <div>
                    <h3 className="font-semibold text-lg">{action.title}</h3>
                    <p className="text-sm opacity-90">{action.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Estadísticas rápidas */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Productos</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visitantes</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">$0</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Secciones del dashboard */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestiona tu tienda</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardSections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <button
                key={index}
                onClick={() => router.push(section.path)}
                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300 text-left"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {section.description}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {section.stats}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Consejos y ayuda */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-4">
          <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ¿Necesitas ayuda para empezar?
            </h3>
            <p className="text-gray-600 mb-4">
              Consulta nuestras guías para aprender a configurar tu tienda, agregar productos y gestionar ventas.
            </p>
            <button
              onClick={() => router.push('/dashboard/guides')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Ver guías
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardOverview;