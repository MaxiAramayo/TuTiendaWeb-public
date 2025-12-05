/**
 * Tipos para los componentes UI del módulo de ventas
 * 
 * Define las interfaces de props para todos los componentes
 * del módulo de ventas, organizados por responsabilidad.
 * 
 * @module features/dashboard/modules/sells/types/components
 */

import { Sale, SalesFilter, SellsFilterValues } from "../schemas/sell.schema";

// Alias para compatibilidad
type Sell = Sale;

/**
 * Props para el componente principal SellsModule
 */
export interface SellsModuleProps {
  /** ID único de la tienda */
  storeId: string;
  /** Nombre de la tienda */
  name?: string;
  /** ID inicial de venta para mostrar (opcional) */
  initialSellId?: string;
  /** Modo de solo lectura */
  readOnly?: boolean;
}

/**
 * Props para el componente SellsFilters
 */
export interface SellsFiltersProps {
  /** Función callback cuando se aplican filtros */
  onFiltersChange: (filters: SellsFilterValues) => void;
  /** Función callback cuando se limpia la búsqueda */
  onClearFilters: () => void;
  /** Indica si hay filtros activos */
  hasActiveFilters?: boolean;
  /** Total de resultados encontrados */
  resultsCount?: number;
}

/**
 * Props para el componente DateFilter
 */
export interface DateFilterProps {
  /** Función callback cuando cambian las fechas */
  onFilterChange: (startDate?: Date | null, endDate?: Date | null) => void;
}

/**
 * Props para el componente OrdersView
 */
export interface OrdersViewProps {
  /** Lista de ventas a mostrar */
  sells: Sell[];
  /** Función callback cuando se selecciona una venta */
  onSelectSell: (sell: Sell) => void;
  /** Venta actualmente seleccionada */
  selectedSell?: Sell | null;
}

/**
 * Props para el componente ProductsView
 */
export interface ProductsViewProps {
  /** Lista de ventas para analizar productos */
  sells: Sell[];
}

/**
 * Props para el componente ProductSelector
 */
export interface ProductSelectorProps {
  /** Función callback cuando se selecciona un producto */
  onProductSelect: (productId: string, quantity: number, notes?: string) => void;
  /** Lista de productos seleccionados actualmente */
  selectedProducts?: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
  /** Indica si el selector está deshabilitado */
  disabled?: boolean;
}

/**
 * Props para el componente SellDetail
 */
export interface SellDetailProps {
  /** Venta a mostrar en detalle */
  sell: Sell;
  /** Función callback cuando se cierra el detalle */
  onClose: () => void;
  /** Función callback para editar la venta */
  onEdit?: (sell: Sell) => void;
  /** Función callback para eliminar la venta */
  onDelete?: (sellId: string) => void;
}

/**
 * Props para el componente SellForm
 */
export interface SellFormProps {
  /** Venta inicial para edición (opcional) */
  initialSell?: Sell;
  /** Función callback cuando se guarda la venta */
  onSave: (sell: Sell) => void;
  /** Función callback cuando se cancela */
  onCancel: () => void;
  /** Indica si el formulario está en modo de carga */
  isLoading?: boolean;
}

/**
 * Props para el componente SellsStats
 */
export interface SellsStatsProps {
  /** ID de la tienda para obtener estadísticas */
  storeId: string;
  /** Filtros aplicados para las estadísticas */
  filters?: SalesFilter;
}
