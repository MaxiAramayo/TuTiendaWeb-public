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
import { PlusIcon, DownloadIcon, EditIcon, TrashIcon, EyeIcon, UserIcon, PackageIcon, TruckIcon, CreditCardIcon, ReceiptIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/use-media-query";
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
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [sells, setSells] = useState<Sale[]>(initialSells);
  const [stats, setStats] = useState<SalesStats | undefined>(initialStats);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialSells.length >= 50);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  
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

  const handleViewSell = useCallback((sale: Sale) => {
    setViewingSale(sale);
  }, []);

  const handleDeleteSell = useCallback((sellId: string) => {
    setDeleteTarget(sellId);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteSaleAction(deleteTarget);
      if (result.success) {
        setSells(prev => prev.filter(s => s.id !== deleteTarget));
        toast.success('Venta eliminada correctamente');
      } else {
        toast.error(result.errors._form?.[0] || 'Error al eliminar la venta');
      }
      setDeleteTarget(null);
    });
  }, [deleteTarget]);

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

      {/* Acciones */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="outline" onClick={handleExport} disabled={isPending} size="sm">
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

      {/* Filtros */}
      <SellsFilters
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        resultsCount={filteredSells.length}
      />

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
                    className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <h4 className="font-medium text-sm sm:text-base">{sale.customer.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {PAYMENT_METHODS_LABELS[sale.payment.method] || sale.payment.method}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {DELIVERY_METHODS_LABELS[sale.delivery.method] || sale.delivery.method}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
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
                          <div className="text-sm text-gray-600 mt-1 truncate">
                            <strong>Dirección:</strong> {sale.delivery.address}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewSell(sale)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {!readOnly && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditSell(sale.id)}
                            >
                              <EditIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteSell(sale.id)}
                              disabled={isPending}
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

      {/* ── Delete confirmation ─────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La venta será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── View sale Dialog / Drawer ───────────────────────────────────── */}
      {viewingSale && (() => {
        const saleContent = (
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-5 p-1">
              {/* Cliente */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <UserIcon className="h-4 w-4" />
                  Cliente
                </div>
                <p className="font-medium">{viewingSale.customer.name}</p>
                {viewingSale.customer.phone && <p className="text-sm text-gray-600">{viewingSale.customer.phone}</p>}
                {viewingSale.customer.email && <p className="text-sm text-gray-600">{viewingSale.customer.email}</p>}
              </div>
              <Separator />

              {/* Productos */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <PackageIcon className="h-4 w-4" />
                  Productos ({viewingSale.items.length})
                </div>
                <div className="space-y-2">
                  {viewingSale.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.productName}</p>
                        {item.variants && item.variants.length > 0 && (
                          <p className="text-xs text-gray-500">{item.variants.map(v => v.name).join(', ')}</p>
                        )}
                        {item.notes && <p className="text-xs text-gray-400 italic">{item.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gray-500 text-xs">x{item.quantity}</p>
                        <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />

              {/* Entrega y pago */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    <TruckIcon className="h-3.5 w-3.5" />
                    Entrega
                  </div>
                  <p className="text-sm font-medium">{DELIVERY_METHODS_LABELS[viewingSale.delivery.method] || viewingSale.delivery.method}</p>
                  {viewingSale.delivery.address && <p className="text-xs text-gray-600 mt-0.5">{viewingSale.delivery.address}</p>}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    <CreditCardIcon className="h-3.5 w-3.5" />
                    Pago
                  </div>
                  <p className="text-sm font-medium">{PAYMENT_METHODS_LABELS[viewingSale.payment.method] || viewingSale.payment.method}</p>
                </div>
              </div>
              <Separator />

              {/* Totales */}
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <ReceiptIcon className="h-4 w-4" />
                  Totales
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${viewingSale.totals.subtotal.toFixed(2)}</span>
                  </div>
                  {viewingSale.totals.discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento</span>
                      <span>-${viewingSale.totals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-1 border-t">
                    <span>Total</span>
                    <span className="text-green-600">${viewingSale.totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {viewingSale.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notas</p>
                    <p className="text-sm text-gray-700">{viewingSale.notes}</p>
                  </div>
                </>
              )}

              {/* Fecha */}
              {viewingSale.metadata?.createdAt && (
                <p className="text-xs text-gray-400 text-right">
                  {format(new Date(viewingSale.metadata.createdAt), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
                </p>
              )}
            </div>
          </ScrollArea>
        );

        const saleActions = !readOnly && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setViewingSale(null); handleEditSell(viewingSale.id); }}
            >
              <EditIcon className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        );

        if (isDesktop) {
          return (
            <Dialog open onOpenChange={(open) => !open && setViewingSale(null)}>
              <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>{viewingSale.customer.name}</DialogTitle>
                </DialogHeader>
                {saleContent}
                {saleActions}
              </DialogContent>
            </Dialog>
          );
        }

        return (
          <Drawer open onOpenChange={(open) => !open && setViewingSale(null)}>
            <DrawerContent className="max-h-[90vh] flex flex-col">
              <DrawerHeader className="flex-shrink-0 text-left">
                <DrawerTitle>{viewingSale.customer.name}</DrawerTitle>
              </DrawerHeader>
              <div className="flex-1 overflow-y-auto px-4 pb-2">
                {saleContent}
              </div>
              {saleActions && (
                <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t bg-white">
                  {saleActions}
                </div>
              )}
            </DrawerContent>
          </Drawer>
        );
      })()}
    </div>
  );
}

export default SellsModule;
