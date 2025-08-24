/**
 * Tipos base para el módulo de ventas
 * 
 * Define las interfaces y tipos principales del dominio de ventas,
 * incluyendo filtros, estadísticas y estados de venta.
 * 
 * @module features/dashboard/modules/sells/types/base
 */

import { DocumentSnapshot } from "firebase/firestore";
import { OptimizedSell, ProductInSell } from "./optimized-sell";

// Alias para compatibilidad con código existente
export type Sell = OptimizedSell;

/**
 * Filtros para consultas de ventas
 */
export interface SellsFilter {
  /** Fecha de inicio para filtrado */
  startDate?: Date;
  /** Fecha de fin para filtrado */
  endDate?: Date;
  /** Estado de la venta */
  status?: string;
  /** Cliente específico */
  customerName?: string;
  /** Método de pago */
  paymentMethod?: string;
  /** Método de entrega */
  deliveryMethod?: string;
  /** Canal de venta */
  source?: string;
  /** Estado de pago */
  paymentStatus?: string;
  /** Límite de resultados */
  limit?: number;
}

/**
 * Estadísticas de ventas
 */
export interface SellsStats {
  /** Total de ventas en el período */
  totalSales: number;
  /** Cantidad de órdenes */
  totalOrders: number;
  /** Promedio por venta */
  averageOrderValue: number;
  /** Ventas del día actual */
  todaySales: number;
  /** Ventas del mes actual */
  monthSales: number;
  /** Producto más vendido */
  topProduct?: {
    name: string;
    quantity: number;
  };
  /** Cliente más frecuente */
  topCustomer?: {
    name: string;
    orders: number;
  };
}

/**
 * Estado del store de ventas
 */
export interface SellState {
  /** Lista de ventas */
  sells: OptimizedSell[];
  /** Estado de carga para operaciones */
  isLoading: boolean;
  /** Estado de carga para estadísticas */
  isLoadingStats: boolean;
  /** Error en operaciones */
  error: string | null;
  /** Estadísticas calculadas */
  stats: SellsStats | null;
  /** Último documento para paginación */
  lastDoc: DocumentSnapshot | null;
  /** Indica si hay más documentos disponibles */
  hasMore: boolean;

  // === OPTIMIZACIÓN DE CACHE ===
  /** Timestamp del último cache válido */
  _cacheTimestamp?: number | null;
  /** ID de la tienda para la cual se cached los datos */
  _cachedStoreId?: string | null;

  // === ACCIONES ===
  /** Agregar una nueva venta */
  addSell: (sell: OptimizedSell, storeId: string) => Promise<boolean>;
  /** Obtener ventas con filtros opcionales */
  getSells: (storeId: string, filter?: SellsFilter) => Promise<boolean>;
  /** Cargar más ventas (paginación) */
  loadMoreSells: (storeId: string, filter?: SellsFilter) => Promise<boolean>;
  /** Calcular estadísticas de ventas */
  calculateStats: (storeId: string, filter?: SellsFilter) => Promise<boolean>;
  /** Obtener venta por ID */
  getSellById: (storeId: string, sellId: string) => Promise<OptimizedSell | null>;
  /** Obtener una venta específica (alias para getSellById) */
  getSell: (sellId: string, storeId: string) => Promise<OptimizedSell | null>;
  /** Actualizar una venta completa */
  updateSell: (sell: OptimizedSell, storeId: string) => Promise<boolean>;
  /** Eliminar una venta */
  deleteSell: (sellId: string, storeId: string) => Promise<boolean>;
  /** Actualizar estado de una venta */
  updateSellStatus: (storeId: string, sellId: string, status: string) => Promise<boolean>;
  /** Refrescar datos con filtros actuales */
  refreshWithFilters: (storeId: string, filter?: SellsFilter) => Promise<boolean>;
  /** Limpiar estado */
  clearState: () => void;
  /** Limpiar errores */
  clearError: () => void;
  /** Calcular estadísticas desde datos ya cargados */
  calculateStatsFromLoadedData: () => void;
  /** Limpiar datos al cambiar de usuario */
  clearDataForUser: () => void;
}

/**
 * Opciones para formatear fechas
 */
export interface DateFormatOptions {
  /** Incluir la hora */
  includeTime?: boolean;
  /** Formato corto (solo día/mes) */
  short?: boolean;
  /** Formato relativo (hace 2 días, hoy, etc.) */
  relative?: boolean;
}
