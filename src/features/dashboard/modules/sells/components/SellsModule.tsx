/**
 * Módulo principal de Ventas - Dashboard Sells Module (Optimizado para Producción)
 * 
 * Componente optimizado que maneja la vista principal de ventas con:
 * - Lista de ventas con paginación eficiente
 * - Filtros avanzados con debounce
 * - Estadísticas calculadas localmente
 * - Acciones CRUD optimizadas
 * - Aislamiento de datos por usuario
 * 
 * @module features/dashboard/modules/sells/components/SellsModule
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, DownloadIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSellStore } from "@/features/dashboard/modules/sells/api/sellStore";
import { useAuthStore } from "@/features/auth/api/authStore";
import { SellsFilters } from "./SellsFilters";
import { Sells } from "@/shared/types/store";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  SellsModuleProps, 
  SellsFilterValues, 
} from "../types/components";
import { 
  SellsFilter 
} from "../types/base";

/**
 * Vista de ventas optimizada con CRUD completo
 */
export const SellsModule: React.FC<SellsModuleProps> = ({
  initialSellId,
  readOnly = false
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    sells, 
    isLoading, 
    isLoadingStats, 
    error, 
    stats,
    hasMore,
    getSells,
    loadMoreSells,
    calculateStatsFromLoadedData,
    deleteSell,
    refreshWithFilters,
    clearError 
  } = useSellStore();

  // Estados locales
  const [filters, setFilters] = useState<SellsFilter>({});
  const [activeFilters, setActiveFilters] = useState<SellsFilterValues>({
    startDate: undefined,
    endDate: undefined,
    paymentMethod: 'all',
    customerSearch: '',
    deliveryMethod: 'all',
    sortBy: 'date-desc'
  });
  
  // Estados para control de carga ÚNICA
  const [dataLoadedForStore, setDataLoadedForStore] = useState<string | null>(null);
  const loadingRef = useRef(false);

  // OPTIMIZACIÓN CRÍTICA: Una sola función de carga sin dependencias complejas
  const loadDataOnce = useCallback(async (storeId: string) => {
    // Prevenir múltiples cargas simultáneas
    if (loadingRef.current || dataLoadedForStore === storeId) {
      return;
    }

    // Verificar si ya tenemos datos en el store
    if (sells.length > 0 && dataLoadedForStore === storeId) {
      // Ya tenemos datos para esta tienda, no cargar de nuevo
      calculateStatsFromLoadedData();
      return;
    }

    loadingRef.current = true;
    
    try {
      const searchFilter: SellsFilter = { limit: 20 };
      await getSells(storeId, searchFilter);
      setDataLoadedForStore(storeId);
    } finally {
      loadingRef.current = false;
    }
  }, [getSells, sells.length, dataLoadedForStore, calculateStatsFromLoadedData]);

  // Función optimizada para recargar con filtros - SOLO cuando es necesario
  const reloadWithFilters = useCallback(async () => {
    const storeId = user?.storeIds?.[0];
    if (!storeId) return;

    // Reset del estado de carga para permitir recarga con filtros
    setDataLoadedForStore(null);
    loadingRef.current = false;
    
    const searchFilter: SellsFilter = {
      ...filters,
      limit: 20
    };

    if (activeFilters.customerSearch.trim()) {
      searchFilter.customerName = activeFilters.customerSearch.trim();
    }

    await refreshWithFilters(storeId, searchFilter);
    setDataLoadedForStore(storeId);
  }, [user?.storeIds, filters, activeFilters.customerSearch, refreshWithFilters]);

  // Efecto para carga inicial de ventas - Optimizado siguiendo el patrón de productos
  useEffect(() => {
    const storeId = user?.storeIds?.[0];
    if (!storeId) return;
    
    // Verificar si ya cargamos datos para esta tienda
    if (dataLoadedForStore === storeId) {
      console.log('Datos ya cargados para esta tienda:', storeId);
      return;
    }
    
    // Limpiar el estado de carga para asegurar que se carguen los datos
    setDataLoadedForStore(null);
    loadingRef.current = false;
    
    console.log('Iniciando carga de ventas en SellsModule');
    const searchFilter: SellsFilter = { limit: 20 };
    
    // Cargar ventas y calcular estadísticas
    getSells(storeId, searchFilter)
      .then(() => {
        console.log('Ventas cargadas correctamente en SellsModule');
        setDataLoadedForStore(storeId);
        calculateStatsFromLoadedData();
      })
      .catch(error => {
        console.error('Error al cargar ventas:', error);
      });
  }, [user?.storeIds, dataLoadedForStore, getSells, calculateStatsFromLoadedData]); // Dependencias correctas

  // Efecto separado para calcular estadísticas cuando cambian las ventas
  useEffect(() => {
    if (sells.length > 0 && dataLoadedForStore) {
      calculateStatsFromLoadedData();
    }
  }, [sells.length, dataLoadedForStore, calculateStatsFromLoadedData]); // Incluir dataLoadedForStore como dependencia

  // Cargar más ventas (paginación)
  const handleLoadMore = useCallback(async () => {
    if (!user?.storeIds || user.storeIds.length === 0 || !hasMore || isLoading) return;
    
    const searchFilter: SellsFilter = {
      ...filters,
      limit: 20
    };

    if (activeFilters.customerSearch.trim()) {
      searchFilter.customerName = activeFilters.customerSearch.trim();
    }

    const currentStoreId = user.storeIds[0];
    await loadMoreSells(currentStoreId, searchFilter);
  }, [user?.storeIds, hasMore, isLoading, filters, activeFilters.customerSearch, loadMoreSells]);

  /**
   * Maneja la creación de nueva venta - Navegación real
   */
  const handleNewSell = useCallback(() => {
    router.push('/dashboard/sells/new');
  }, [router]);

  /**
   * Maneja la edición de venta - Navegación real
   */
  const handleEditSell = useCallback((sellId: string) => {
    router.push(`/dashboard/sells/edit/${sellId}`);
  }, [router]);

  /**
   * Maneja la visualización de venta - Navegación real
   */
  const handleViewSell = useCallback((sellId: string) => {
    router.push(`/dashboard/sells/view/${sellId}`);
  }, [router]);

  /**
   * Maneja la eliminación de venta
   */
  const handleDeleteSell = useCallback(async (sellId: string) => {
    if (!user?.storeIds || user.storeIds.length === 0) return;

    const confirmed = confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    const currentStoreId = user.storeIds[0];
    const success = await deleteSell(currentStoreId, sellId);
    if (success) {
      // Recalcular estadísticas inmediatamente
      calculateStatsFromLoadedData();
    }
  }, [user?.storeIds?.[0], deleteSell, calculateStatsFromLoadedData]);

  /**
   * Maneja el éxito en operaciones del formulario
   */
  const handleFormSuccess = useCallback(() => {
    // Recalcular estadísticas inmediatamente
    calculateStatsFromLoadedData();
  }, [calculateStatsFromLoadedData]);

  /**
   * Maneja los cambios en los filtros
   */
  const handleFiltersChange = useCallback((newFilters: SellsFilterValues) => {
    setActiveFilters(newFilters);
    
    // Convertir filtros del componente al formato del store
    const storeFilters: SellsFilter = {};
    
    if (newFilters.startDate) {
      storeFilters.startDate = newFilters.startDate;
    }
    
    if (newFilters.endDate) {
      storeFilters.endDate = newFilters.endDate;
    }
    
    if (newFilters.paymentMethod && newFilters.paymentMethod !== 'all') {
      storeFilters.paymentMethod = newFilters.paymentMethod;
    }
    
    if (newFilters.customerSearch.trim()) {
      storeFilters.customerName = newFilters.customerSearch.trim();
    }
    
    setFilters(storeFilters);
    
    // Recargar con debounce para evitar llamadas excesivas
    setTimeout(() => {
      reloadWithFilters();
    }, 300);
  }, [reloadWithFilters]);

  /**
   * Limpia todos los filtros
   */
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setActiveFilters({
      customerSearch: '',
      paymentMethod: 'all',
      deliveryMethod: 'all',
      sortBy: 'date-desc'
    });
    
    // Recargar datos sin filtros
    setTimeout(() => {
      reloadWithFilters();
    }, 100);
  }, [reloadWithFilters]);

  /**
   * Exporta datos de ventas
   */
  const handleExport = useCallback(async () => {
    if (!user?.storeIds || user.storeIds.length === 0) return;
    
    try {
      const currentStoreId = user.storeIds[0];
      // Obtener todas las ventas sin límite
      await getSells(currentStoreId, { ...filters, limit: undefined });
      
      // Crear CSV con los datos
      const headers = ['Fecha', 'Cliente', 'Total', 'Método de Pago', 'Método de Entrega', 'Estado'];
      const csvData = sells.map(sell => [
        format(new Date(sell.date), 'dd/MM/yyyy HH:mm', { locale: es }),
        sell.customerName,
        `$${sell.products.reduce((sum, p) => sum + (p.price * p.cantidad), 0).toFixed(2)}`,
        sell.paymentMethod,
        sell.deliveryMethod,
        'Completada'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      // Descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ventas_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al exportar ventas:', error);
    }
  }, [user?.storeIds, filters, sells, getSells]);

  return (
    <div className="space-y-6">{/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoadingStats ? '...' : `$${stats?.totalSales.toFixed(2) || '0.00'}`}
            </div>
            <p className="text-xs text-gray-500">Total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-gray-500">Total de ventas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? '...' : `$${stats?.averageOrderValue.toFixed(2) || '0.00'}`}
            </div>
            <p className="text-xs text-gray-500">Por venta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoadingStats ? '...' : `$${stats?.todaySales.toFixed(2) || '0.00'}`}
            </div>
            <p className="text-xs text-gray-500">Ventas del día</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Ventas */}
      <SellsFilters
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={Object.keys(filters).length > 0}
        resultsCount={sells.length}
      />

      {/* Barra de acciones */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleExport} disabled={isLoading}>
          <DownloadIcon className="w-4 h-4 mr-2" />
          Exportar
        </Button>
        
        {!readOnly && (
          <Button onClick={handleNewSell}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        )}
      </div>

      {/* Manejo de errores */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              variant="link" 
              onClick={clearError}
              className="ml-2 p-0 h-auto text-destructive"
            >
              Cerrar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Registradas ({sells.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && sells.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Cargando ventas...</p>
            </div>
          ) : sells.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No se encontraron ventas</p>
              {!readOnly && (
                <Button onClick={handleNewSell}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Crear primera venta
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sells.map((sell) => (
                  <div
                    key={sell.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-medium">{sell.customerName}</h4>
                          <Badge variant="outline">{sell.paymentMethod}</Badge>
                          <Badge variant="secondary">{sell.deliveryMethod}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div>
                            <strong>Fecha:</strong> {format(new Date(sell.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </div>
                          <div>
                            <strong>Productos:</strong> {sell.products.length} item(s)
                          </div>
                          <div>
                            <strong>Total:</strong> 
                            <span className="font-bold text-green-600 ml-1">
                              ${(sell.total || sell.products.reduce((sum, p) => sum + (p.price * p.cantidad), 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {sell.address && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Dirección:</strong> {sell.address}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSell(sell.id)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSell(sell.id)}
                            >
                              <EditIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSell(sell.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Botón de cargar más */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button 
                    variant="outline" 
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Cargando...' : 'Cargar más ventas'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellsModule;
