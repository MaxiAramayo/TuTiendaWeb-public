/**
 * Store de UI para el módulo de ventas - Zustand
 * 
 * SOLO maneja estado de UI:
 * - Filtros activos
 * - Modal abierto/cerrado
 * - Vista seleccionada (orders/products)
 * - Venta seleccionada para detalle
 * 
 * NO maneja datos del servidor (ventas, estadísticas).
 * Los datos se obtienen via Server Actions.
 * 
 * @module features/dashboard/modules/sells/stores/sells-ui.store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SellsFilterValues, SortOption } from '../schemas/sell.schema';

// =============================================================================
// TYPES
// =============================================================================

type ViewMode = 'orders' | 'products';

interface SellsUIState {
  // Vista
  viewMode: ViewMode;
  
  // Filtros
  filters: SellsFilterValues;
  
  // Modal de detalle
  selectedSellId: string | null;
  isDetailModalOpen: boolean;
  
  // Loading states para UI feedback
  isFilterPending: boolean;
  
  // Acciones
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: Partial<SellsFilterValues>) => void;
  resetFilters: () => void;
  openDetailModal: (sellId: string) => void;
  closeDetailModal: () => void;
  setFilterPending: (pending: boolean) => void;
  reset: () => void;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_FILTERS: SellsFilterValues = {
  customerSearch: '',
  startDate: undefined,
  endDate: undefined,
  paymentMethod: 'all',
  deliveryMethod: 'all',
  sortBy: 'date-desc' as SortOption,
};

// =============================================================================
// STORE
// =============================================================================

export const useSellsUIStore = create<SellsUIState>()(
  persist(
    (set) => ({
      // Estado inicial
      viewMode: 'orders',
      filters: DEFAULT_FILTERS,
      selectedSellId: null,
      isDetailModalOpen: false,
      isFilterPending: false,

      // Acciones
      setViewMode: (mode) => set({ viewMode: mode }),

      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters },
      })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      openDetailModal: (sellId) => set({
        selectedSellId: sellId,
        isDetailModalOpen: true,
      }),

      closeDetailModal: () => set({
        selectedSellId: null,
        isDetailModalOpen: false,
      }),

      setFilterPending: (pending) => set({ isFilterPending: pending }),

      reset: () => set({
        viewMode: 'orders',
        filters: DEFAULT_FILTERS,
        selectedSellId: null,
        isDetailModalOpen: false,
        isFilterPending: false,
      }),
    }),
    {
      name: 'sells-ui-store',
      // Solo persistir preferencias de UI, no estados transitorios
      partialize: (state) => ({
        viewMode: state.viewMode,
        filters: state.filters,
      }),
    }
  )
);

// =============================================================================
// SELECTORES (para evitar re-renders innecesarios)
// =============================================================================

/**
 * Selector para obtener solo el modo de vista
 */
export const useViewMode = () => useSellsUIStore((state) => state.viewMode);

/**
 * Selector para obtener solo los filtros
 */
export const useFilters = () => useSellsUIStore((state) => state.filters);

/**
 * Selector para verificar si hay filtros activos
 */
export const useHasActiveFilters = () => useSellsUIStore((state) => {
  const { filters } = state;
  return (
    filters.customerSearch.trim() !== '' ||
    filters.startDate !== undefined ||
    filters.endDate !== undefined ||
    filters.paymentMethod !== 'all' ||
    filters.deliveryMethod !== 'all' ||
    filters.sortBy !== 'date-desc'
  );
});

/**
 * Selector para el modal de detalle
 */
export const useDetailModal = () => useSellsUIStore((state) => ({
  isOpen: state.isDetailModalOpen,
  sellId: state.selectedSellId,
  open: state.openDetailModal,
  close: state.closeDetailModal,
}));

/**
 * Selector para estado de carga de filtros
 */
export const useFilterPending = () => useSellsUIStore((state) => state.isFilterPending);
