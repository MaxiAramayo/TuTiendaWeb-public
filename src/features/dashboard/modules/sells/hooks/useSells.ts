/**
 * Hook principal para la gestión de ventas
 * 
 * Proporciona funcionalidades completas para CRUD de ventas,
 * paginación, búsqueda, filtrado y gestión de estado.
 * Sigue el mismo patrón que useProducts para consistencia.
 * 
 * @module features/dashboard/modules/sells/hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/api/authStore';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { OptimizedSell as Sell } from '../types/optimized-sell';
import { SellsFilter, SellsStats } from '../types/base';
import { toast } from 'sonner';

/**
 * Configuración por defecto para paginación
 */
const DEFAULT_PAGINATION: SellsFilter = {
  limit: 50
};

/**
 * Estado del hook de ventas
 */
interface UseSellsState {
  sells: Sell[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  stats: SellsStats | null;
  filters: SellsFilter;
}

/**
 * Hook principal para gestión de ventas
 */
export function useSells() {
  const { user } = useAuthStore();
  // Usar el primer storeId del usuario (para restaurantes solo tienen una tienda)
  const storeId = user?.storeIds?.[0];

  // Estado principal
  const [state, setState] = useState<UseSellsState>({
    sells: [],
    loading: false,
    error: null,
    hasMore: false,
    total: 0,
    stats: null,
    filters: DEFAULT_PAGINATION
  });

  // Opciones de paginación actuales
  const [paginationOptions, setPaginationOptions] = useState<SellsFilter>(DEFAULT_PAGINATION);

  /**
   * Actualiza el estado de forma segura
   */
  const updateState = useCallback((updates: Partial<UseSellsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Carga ventas con las opciones actuales
   */
  const loadSells = useCallback(async (options?: Partial<SellsFilter>) => {
    if (!storeId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const finalOptions = {
        ...paginationOptions,
        ...options
      };

      // Obtener ventas directamente desde Firebase (como hace products)
      const sellsRef = collection(db, 'stores', storeId, 'sells');
      let q = query(sellsRef);

      // Aplicar filtros si existen
      if (finalOptions.startDate) {
        q = query(q, where('date', '>=', finalOptions.startDate));
      }
      if (finalOptions.endDate) {
        q = query(q, where('date', '<=', finalOptions.endDate));
      }
      if (finalOptions.status && finalOptions.status !== 'all') {
        q = query(q, where('status', '==', finalOptions.status));
      }
      if (finalOptions.paymentStatus && finalOptions.paymentStatus !== 'all') {
        q = query(q, where('paymentStatus', '==', finalOptions.paymentStatus));
      }

      // Ordenamiento - usar valores fijos ya que no están en SellsFilter
      const orderField = 'date';
      const orderDirection = 'desc';
      q = query(q, orderBy(orderField, orderDirection));

      // Límite
      if (finalOptions.limit) {
        q = query(q, limit(finalOptions.limit));
      }

      const snapshot = await getDocs(q);
      const sells = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sell[];
      
      setState(prev => ({
        ...prev,
        sells,
        loading: false,
        hasMore: sells.length === (finalOptions.limit || 50),
        total: sells.length
      }));

      // Calcular estadísticas automáticamente
      calculateStats(sells);

    } catch (error) {
      console.error('Error cargando ventas:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar las ventas'
      }));
    }
  }, [storeId, paginationOptions]);

  /**
   * Carga estadísticas de ventas desde los datos ya cargados
   */
  const calculateStats = useCallback((sellsData?: Sell[]) => {
    const sells = sellsData || state.sells;
    
    if (sells.length === 0) {
      updateState({ stats: null });
      return;
    }

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      let totalSales = 0;
      let totalOrders = 0;
      let todaySales = 0;
      let monthSales = 0;
      const productCounts: { [key: string]: number } = {};
      const customerCounts: { [key: string]: number } = {};

      sells.forEach(sell => {
        const sellTotal = sell.total || 0;
        const sellDate = sell.date instanceof Date 
          ? sell.date 
          : new Date(sell.date as any);
        
        totalSales += sellTotal;
        totalOrders += 1;

        // Ventas de hoy
        if (sellDate >= todayStart) {
          todaySales += sellTotal;
        }

        // Ventas del mes
        if (sellDate >= monthStart) {
          monthSales += sellTotal;
        }

        // Contar productos
        sell.products?.forEach(product => {
          const productName = product.name || 'Sin nombre';
          productCounts[productName] = (productCounts[productName] || 0) + (product.cantidad || 1);
        });

        // Contar clientes
        const customerName = sell.customerName || 'Cliente anónimo';
        customerCounts[customerName] = (customerCounts[customerName] || 0) + 1;
      });

      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Producto más vendido
      const topProductEntry = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
      const topProduct = topProductEntry ? {
        name: topProductEntry[0],
        quantity: topProductEntry[1] // Cambiar 'sales' por 'quantity'
      } : undefined;

      // Cliente más frecuente
      const topCustomerEntry = Object.entries(customerCounts).sort((a, b) => b[1] - a[1])[0];
      const topCustomer = topCustomerEntry ? {
        name: topCustomerEntry[0],
        orders: topCustomerEntry[1]
      } : undefined;

      const stats: SellsStats = {
        totalSales,
        totalOrders,
        averageOrderValue,
        todaySales,
        monthSales,
        topProduct,
        topCustomer
      };

      updateState({ stats });
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
    }
  }, [state.sells, updateState]);

  /**
   * Carga estadísticas (alias para mantener compatibilidad)
   */
  const loadStats = useCallback(() => {
    calculateStats();
  }, [calculateStats]);

  /**
   * Recarga ventas desde el inicio
   */
  const refreshSells = useCallback(() => {
    const refreshOptions = {
      ...paginationOptions
    };
    loadSells(refreshOptions);
  }, [loadSells, paginationOptions]);

  /**
   * Efecto para cargar datos iniciales
   */
  useEffect(() => {
    if (storeId && state.sells.length === 0 && !state.loading) {
      loadSells();
    }
  }, [storeId, loadSells, state.sells.length, state.loading]);

  /**
   * Valores memoizados para optimización
   */
  const memoizedValues = useMemo(() => ({
    sells: state.sells,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    total: state.total,
    stats: state.stats,
    filters: state.filters,
    storeId
  }), [state, storeId]);

  return {
    ...memoizedValues,
    // Funciones de carga
    loadSells,
    loadStats,
    refreshSells,
    calculateStats,
    // Funciones de utilidad
    updateFilters: (newFilters: Partial<SellsFilter>) => {
      const updatedFilters = { ...paginationOptions, ...newFilters };
      setPaginationOptions(updatedFilters);
      updateState({ filters: updatedFilters });
      loadSells(updatedFilters);
    },
    clearError: () => updateState({ error: null })
  };
}

/**
 * Hook para obtener una venta específica por ID
 */
export function useSell(sellId: string) {
  const { user } = useAuthStore();
  const storeId = user?.storeIds?.[0];
  const [sell, setSell] = useState<Sell | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSell = useCallback(async () => {
    if (!storeId || !sellId) return;

    try {
      setLoading(true);
      setError(null);

      // Aquí implementarías la carga de una venta específica
      // Por ahora dejamos un placeholder
      
      setLoading(false);
    } catch (error) {
      console.error('Error cargando venta:', error);
      setError('Error al cargar la venta');
      setLoading(false);
    }
  }, [storeId, sellId]);

  useEffect(() => {
    if (sellId) {
      loadSell();
    }
  }, [sellId, loadSell]);

  return {
    sell,
    loading,
    error,
    loadSell,
    clearError: () => setError(null)
  };
}
