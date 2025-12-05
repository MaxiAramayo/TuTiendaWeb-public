/**
 * Módulo principal de Ventas - Dashboard Sells Module
 * 
 * Componente cliente que maneja la vista principal de ventas.
 * Recibe datos iniciales del Server Component y usa Server Actions para mutaciones.
 * 
 * @module features/dashboard/modules/sells/components/SellsModule
 */

"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, DownloadIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import { 
  deleteSaleAction, 
  getSalesAction 
} from "../actions/sale.actions";
import { 
  useSellsUIStore, 
  useHasActiveFilters 
} from "../stores/sells-ui.store";
import { 
  applyFilters, 
  generateSalesCSV, 
  downloadCSV 
} from "../utils/sell.utils";
import type { 
  Sale,
  SalesStats, 
  SalesFilterValues,
  SalesFilter 
} from "../schemas/sell.schema";
import {
  PAYMENT_METHODS_LABELS,
  DELIVERY_METHODS_LABELS
} from "../schemas/sell.schema";
import { SellsFilters } from "./SellsFilters";

// =============================================================================
// TYPES
// =============================================================================

interface SellsModuleProps {
  storeId: string;
  initialSells?: Sale[];
  initialStats?: SalesStats;
  readOnly?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SellsModule({
  storeId,
  initialSells = [],
  initialStats,
  readOnly = false,
}: SellsModuleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [sells, setSells] = useState<Sale[]>(initialSells);
  const [stats, setStats] = useState<SalesStats | undefined>(initialStats);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialSells.length >= 50);
  
  const { filters, setFilters, resetFilters } = useSellsUIStore();
  const hasActiveFilters = useHasActiveFilters();

  const filteredSells = applyFilters(sells, filters);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleReloadWithFilters = useCallback(async (newFilters?: SalesFilter) => {
    startTransition(async () => {
      const result = await getSalesAction(newFilters);
      if (result.success) {
        setSells(result.data.sales);
        setHasMore(result.data.sales.length >= 50);
      } else {
        setError(result.errors._form?.[0] || 'Error al cargar ventas');
      }
    });
  }, []);

  const handleFiltersChange = useCallback((newFilters: SalesFilterValues) => {
    setFilters(newFilters);
    
    const serverFilters: SalesFilter = {};
    if (newFilters.startDate) serverFilters.startDate = newFilters.startDate;
    if (newFilters.endDate) serverFilters.endDate = newFilters.endDate;
    if (newFilters.paymentMethod && newFilters.paymentMethod !== 'all') {
      serverFilters.paymentMethod = newFilters.paymentMethod;
    }
    if (newFilters.customerSearch.trim()) {
      serverFilters.customerName = newFilters.customerSearch.trim();
    }
    
    if (newFilters.startDate || newFilters.endDate) {
      handleReloadWithFilters(serverFilters);
    }
  }, [setFilters, handleReloadWithFilters]);

  const handleClearFilters = useCallback(() => {
    resetFilters();
    handleReloadWithFilters();
  }, [resetFilters, handleReloadWithFilters]);

  const handleNewSell = useCallback(() => {
    router.push('/dashboard/sells/new');
  }, [router]);

  const handleEditSell = useCallback((sellId: string) => {
    router.push(`/dashboard/sells/edit/${sellId}`);
  }, [router]);

  const handleViewSell = useCallback((sellId: string) => {
    router.push(`/dashboard/sells/view/${sellId}`);
  }, [router]);

  const handleDeleteSell = useCallback(async (sellId: string) => {
    const confirmed = confirm('¿Estás seguro de que quieres eliminar esta venta?');
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteSaleAction(sellId);
      if (result.success) {
        setSells(prev => prev.filter(s => s.id !== sellId));
        toast.success('Venta eliminada correctamente');
      } else {
        toast.error(result.errors._form?.[0] || 'Error al eliminar la venta');
      }
    });
  }, []);

  const handleExport = useCallback(() => {
    const csvContent = generateSalesCSV(filteredSells);
    const filename = `ventas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(csvContent, filename);
    toast.success('Archivo exportado correctamente');
  }, [filteredSells]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats?.totalSales.toFixed(2) || '0.00'}
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
              {stats?.totalOrders || 0}
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
              ${stats?.averageOrderValue.toFixed(2) || '0.00'}
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
              ${stats?.todaySales.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-gray-500">Ventas del día</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <SellsFilters
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        resultsCount={filteredSells.length}
      />

      {/* Acciones */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleExport} disabled={isPending}>
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

      {/* Error */}
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
          <CardTitle>Ventas Registradas ({filteredSells.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending && filteredSells.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Cargando ventas...</p>
            </div>
          ) : filteredSells.length === 0 ? (
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
                {filteredSells.map((sale) => (
                  <div
                    key={sale.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-medium">{sale.customer.name}</h4>
                          <Badge variant="outline">
                            {PAYMENT_METHODS_LABELS[sale.payment.method] || sale.payment.method}
                          </Badge>
                          <Badge variant="secondary">
                            {DELIVERY_METHODS_LABELS[sale.delivery.method] || sale.delivery.method}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div>
                            <strong>Fecha:</strong>{' '}
                            {sale.metadata.createdAt 
                              ? format(new Date(sale.metadata.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })
                              : 'Sin fecha'
                            }
                          </div>
                          <div>
                            <strong>Productos:</strong> {sale.items.length} item(s)
                          </div>
                          <div>
                            <strong>Total:</strong>
                            <span className="font-bold text-green-600 ml-1">
                              ${sale.totals.total.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {sale.delivery.address && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Dirección:</strong> {sale.delivery.address}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSell(sale.id)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSell(sale.id)}
                            >
                              <EditIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSell(sale.id)}
                              disabled={isPending}
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

              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => handleReloadWithFilters({ limit: sells.length + 50 })}
                    disabled={isPending}
                  >
                    {isPending ? 'Cargando...' : 'Cargar más ventas'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SellsModule;
