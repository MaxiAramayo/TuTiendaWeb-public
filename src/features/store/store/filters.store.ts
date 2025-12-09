/**
 * Store de filtros para productos usando Zustand
 * 
 * Maneja el estado global de filtros de productos incluyendo búsqueda,
 * categorías, rango de precios y ordenamiento
 * 
 * @module features/store/api
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Opciones de ordenamiento disponibles
 */
export type SortOption = 'name' | 'price-asc' | 'price-desc' | 'newest' | 'none';

/**
 * Estado de los filtros
 */
interface FiltersState {
  searchTerm: string;
  selectedCategory: string;
  priceRange: [number, number];
  sortBy: SortOption;
  onlyAvailable: boolean;
  isLoading: boolean;
}

/**
 * Acciones para manejar los filtros
 */
interface FiltersActions {
  setSearchTerm: (term: string) => void;
  setCategory: (category: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setSortBy: (sort: SortOption) => void;
  toggleAvailability: () => void;
  setLoading: (loading: boolean) => void;
  clearFilters: () => void;
  resetPriceRange: (maxPrice: number) => void;
}

/**
 * Estado inicial de los filtros
 */
const initialState: FiltersState = {
  searchTerm: '',
  selectedCategory: 'all',
  priceRange: [0, 10000],
  sortBy: 'none',
  onlyAvailable: false,
  isLoading: false,
};

/**
 * Store de filtros usando Zustand con persistencia
 */
export const useFiltersStore = create<FiltersState & FiltersActions>()
  (persist(
    (set, get) => ({
      // Estado inicial
      ...initialState,
      
      // Acciones
      setSearchTerm: (term: string) => {
        set({ searchTerm: term });
      },
      
      setCategory: (category: string) => {
        set({ selectedCategory: category });
      },
      
      setPriceRange: (range: [number, number]) => {
        set({ priceRange: range });
      },
      
      setSortBy: (sort: SortOption) => {
        set({ sortBy: sort });
      },
      
      toggleAvailability: () => {
        set((state) => ({ onlyAvailable: !state.onlyAvailable }));
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
      
      clearFilters: () => {
        const currentState = get();
        set({
          searchTerm: '',
          selectedCategory: 'all',
          sortBy: 'none',
          onlyAvailable: false,
          // Resetear el rango de precios al rango completo
          priceRange: [0, currentState.priceRange[1]],
        });
      },
      
      resetPriceRange: (maxPrice: number) => {
        set({ priceRange: [0, maxPrice] });
      },
    }),
    {
      name: 'store-filters', // Nombre para localStorage
      partialize: (state) => ({
        // Solo persistir algunos campos
        selectedCategory: state.selectedCategory,
        sortBy: state.sortBy,
        onlyAvailable: state.onlyAvailable,
      }),
    }
  ));

/**
 * Hook personalizado para obtener filtros activos
 * @param maxPrice - Precio máximo de los productos para comparar el rango
 */
export const useActiveFilters = (maxPrice: number = 10000) => {
  const {
    searchTerm,
    selectedCategory,
    priceRange,
    sortBy,
    onlyAvailable
  } = useFiltersStore();
  
  // Verificar si el rango de precios ha sido modificado del valor inicial
  // Comparar con el rango completo [0, maxPrice] en lugar de valores hardcodeados
  const isPriceRangeModified = priceRange[0] !== 0 || priceRange[1] !== maxPrice;
  
  const hasActiveFilters = 
    searchTerm !== '' ||
    selectedCategory !== 'all' ||
    isPriceRangeModified ||
    sortBy !== 'none' ||
    onlyAvailable;
    
  return {
    hasActiveFilters,
    activeFiltersCount: [
      searchTerm !== '',
      selectedCategory !== 'all',
      isPriceRangeModified,
      sortBy !== 'none',
      onlyAvailable
    ].filter(Boolean).length
  };
};

/**
 * Hook para obtener configuración de filtros
 */
export const useFiltersConfig = () => {
  const state = useFiltersStore();
  
  return {
    filters: {
      searchTerm: state.searchTerm,
      selectedCategory: state.selectedCategory,
      priceRange: state.priceRange,
      sortBy: state.sortBy,
      onlyAvailable: state.onlyAvailable,
    },
    isLoading: state.isLoading,
    actions: {
      setSearchTerm: state.setSearchTerm,
      setCategory: state.setCategory,
      setPriceRange: state.setPriceRange,
      setSortBy: state.setSortBy,
      toggleAvailability: state.toggleAvailability,
      setLoading: state.setLoading,
      clearFilters: state.clearFilters,
      resetPriceRange: state.resetPriceRange,
    }
  };
};