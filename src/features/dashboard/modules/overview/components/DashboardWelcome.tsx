/**
 * Componente de bienvenida del dashboard
 * 
 * Muestra una bienvenida personalizada con estadísticas generales,
 * acciones rápidas y guías para nuevos usuarios.
 * 
 * @module features/dashboard/modules/overview/components
 */

"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Plus,
  Eye,
  BookOpen,
  Settings,
  QrCode,
  CreditCard,
  TrendingUp,
  Star,
  Calendar
} from 'lucide-react';
import { useCurrentStore } from "@/features/dashboard/hooks/useCurrentStore";

import { SellsStats } from '@/features/dashboard/modules/sells/schemas/sell.schema';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { formatNumber } from '@/shared/utils/format.utils';
import { toast } from 'sonner';

interface DashboardWelcomeProps {
  initialStats?: {
    totalProducts: number;
    activeProducts: number;
  };
  sellStats?: SellsStats;
}

/**
 * Componente de bienvenida del dashboard
 */
const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({ initialStats, sellStats }) => {
  const router = useRouter();
  const { storeId } = useCurrentStore();
  const { isOnline, wasOffline, resetWasOffline } = useNetworkStatus();

  /**
   * Manejar reconexión a internet
   */
  useEffect(() => {
    if (isOnline && wasOffline) {
      console.log('🌐 Reconexión detectada');
      toast.success('Conexión restaurada.');
      resetWasOffline();
    }
  }, [isOnline, wasOffline, resetWasOffline]);

  /**
   * Acciones rápidas principales
   */
  const quickActions = [
    {
      title: 'Crear Producto',
      description: 'Añade un nuevo producto a tu catálogo',
      icon: Plus,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      action: () => router.push('/dashboard/products/new')
    },
    {
      title: 'Ver Productos',
      description: 'Gestiona tu catálogo completo',
      icon: Package,
      color: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      action: () => router.push('/dashboard/products')
    },
    {
      title: 'Nueva Venta',
      description: 'Registra una nueva venta',
      icon: ShoppingCart,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      action: () => router.push('/dashboard/sells/new')
    },
    {
      title: 'Ver Tienda',
      description: 'Visualiza tu tienda online',
      icon: Eye,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
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
      stats: `${initialStats?.totalProducts || 0} productos`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Ventas',
      description: 'Historial de ventas',
      icon: BarChart3,
      path: '/dashboard/sells',
      stats: `${sellStats?.totalOrders || 0} ventas`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Perfil',
      description: 'Configuración de la tienda',
      icon: Settings,
      path: '/dashboard/profile',
      stats: 'Configurar',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Código QR',
      description: 'Comparte tu tienda',
      icon: QrCode,
      path: '/dashboard/qr',
      stats: 'Generar QR',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Guías',
      description: 'Aprende a usar la plataforma',
      icon: BookOpen,
      path: '/dashboard/guides',
      stats: 'Ver guías',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Suscripción',
      description: 'Gestiona tu plan',
      icon: CreditCard,
      path: '/dashboard/subscription',
      stats: 'Plan actual',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Header de bienvenida */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-6">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4">
                ¡Bienvenido a tu Dashboard!
              </h1>
              <p className="text-sm sm:text-base lg:text-xl text-gray-600 mb-4 sm:mb-5 lg:mb-6 max-w-2xl mx-auto px-2">
                Gestiona tu tienda online de manera fácil y eficiente. Aquí puedes administrar productos, ventas, y mucho más.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Último acceso: {new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  <span>Plan Básico</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{initialStats?.totalProducts || 0}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{sellStats?.totalOrders || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Productos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{initialStats?.activeProducts || 0}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ventas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">${formatNumber(sellStats?.totalSales || 0)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <section>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-1">Acciones rápidas</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`${action.color} text-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group min-h-[120px] sm:min-h-[140px] lg:min-h-auto`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 lg:space-y-4">
                      <div className="p-2 sm:p-2.5 lg:p-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base lg:text-lg mb-0.5 sm:mb-1">{action.title}</h3>
                        <p className="text-xs sm:text-sm opacity-90 leading-tight">{action.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Estadísticas rápidas */}
          <section>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-1">Resumen de tu tienda</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">Productos</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                      {initialStats?.totalProducts || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Total en catálogo</p>
                  </div>
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-blue-50 rounded-full">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">Ventas</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                      {formatNumber(sellStats?.totalOrders || 0)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Este mes</p>
                  </div>
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-green-50 rounded-full">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">Visitantes</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Esta semana</p>
                  </div>
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-purple-50 rounded-full">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">Ingresos</p>
                    <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                      {`$${formatNumber(sellStats?.totalSales || 0)}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Total</p>
                  </div>
                  <div className="p-2 sm:p-2.5 lg:p-3 bg-orange-50 rounded-full">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Secciones del dashboard */}
          <section>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-1">Gestiona tu tienda</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {dashboardSections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <button
                    key={index}
                    onClick={() => router.push(section.path)}
                    className="bg-white p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300 text-left group"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className={`flex-shrink-0 p-2 sm:p-2.5 lg:p-3 ${section.bgColor} rounded-lg group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${section.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {section.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                          {section.description}
                        </p>
                        <p className="text-xs font-medium text-blue-600">
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
          <section className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6">
              <div className="p-2 sm:p-3 bg-white/20 rounded-full flex-shrink-0">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3">
                  ¿Necesitas ayuda para empezar?
                </h3>
                <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg">
                  Consulta nuestras guías paso a paso para aprender a configurar tu tienda, agregar productos y gestionar ventas de manera efectiva.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => router.push('/dashboard/guides')}
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-white text-blue-600 text-sm sm:text-base font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Ver guías
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/products/new')}
                    className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-white/20 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Crear primer producto
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardWelcome;