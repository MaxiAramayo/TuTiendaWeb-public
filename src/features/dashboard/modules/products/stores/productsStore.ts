import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { productsService } from '../api/products.service';
import { Product } from '@/shared/types/firebase.types';
import { ProductStats } from '../types/product.types';

interface ProductsState {
  // Datos principales
  products: Product[];
  stats: ProductStats | null;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingStats: boolean;
  
  // Caché
  _cacheTimestamp: number | null;
  _cachedStoreId: string | null;
  
  // Acciones
  setProducts: (products: Product[]) => void;
  setStats: (stats: ProductStats) => void;
  setLoading: (loading: boolean) => void;
  setLoadingStats: (loading: boolean) => void;
  
  // Funciones de carga
  loadProducts: (storeId: string, forceRefresh?: boolean) => Promise<Product[]>;
  loadStats: (storeId: string, forceRefresh?: boolean) => Promise<ProductStats>;
  
  // Utilidades
  clearCache: () => void;
  reset: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en millisegundos

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      products: [],
      stats: null,
      isLoading: false,
      isLoadingStats: false,
      _cacheTimestamp: null,
      _cachedStoreId: null,

      // Setters básicos
      setProducts: (products) => set({ products }),
      setStats: (stats) => set({ stats }),
      setLoading: (isLoading) => set({ isLoading }),
      setLoadingStats: (isLoadingStats) => set({ isLoadingStats }),

      // Función para cargar productos con caché inteligente
      loadProducts: async (storeId: string, forceRefresh = false) => {
        const state = get();
        const now = Date.now();
        
        // Verificar si tenemos datos en caché válidos
        const hasValidCache = 
          !forceRefresh &&
          state._cacheTimestamp &&
          state._cachedStoreId === storeId &&
          (now - state._cacheTimestamp) < CACHE_DURATION &&
          state.products.length > 0;

        if (hasValidCache) {
          console.log('📦 [ProductsStore] Usando productos del caché');
          return state.products;
        }

        try {
          console.log('🔄 [ProductsStore] Cargando productos desde API');
          set({ isLoading: true });
          
          const productsPage = await productsService.getProducts(storeId);
          const products = productsPage.products;
          
          set({ 
            products,
            isLoading: false,
            _cacheTimestamp: now,
            _cachedStoreId: storeId
          });
          
          console.log(`✅ [ProductsStore] ${products.length} productos cargados`);
          return products;
        } catch (error) {
          console.error('❌ [ProductsStore] Error cargando productos:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Función para cargar estadísticas con caché inteligente
      loadStats: async (storeId: string, forceRefresh = false) => {
        const state = get();
        const now = Date.now();
        
        // Verificar si tenemos stats en caché válidos
        const hasValidCache = 
          !forceRefresh &&
          state._cacheTimestamp &&
          state._cachedStoreId === storeId &&
          (now - state._cacheTimestamp) < CACHE_DURATION &&
          state.stats;

        if (hasValidCache) {
          console.log('📊 [ProductsStore] Usando estadísticas del caché');
          return state.stats!;
        }

        try {
          console.log('🔄 [ProductsStore] Cargando estadísticas desde API');
          set({ isLoadingStats: true });
          
          const stats = await productsService.getProductStats(storeId);
          
          set({ 
            stats,
            isLoadingStats: false,
            _cacheTimestamp: now,
            _cachedStoreId: storeId
          });
          
          console.log('✅ [ProductsStore] Estadísticas cargadas:', stats);
          return stats;
        } catch (error) {
          console.error('❌ [ProductsStore] Error cargando estadísticas:', error);
          set({ isLoadingStats: false });
          throw error;
        }
      },

      // Limpiar caché
      clearCache: () => {
        set({
          _cacheTimestamp: null,
          _cachedStoreId: null
        });
      },

      // Resetear estado completo
      reset: () => {
        set({
          products: [],
          stats: null,
          isLoading: false,
          isLoadingStats: false,
          _cacheTimestamp: null,
          _cachedStoreId: null
        });
      }
    }),
    {
      name: 'products-storage',
      // Solo persistir los datos importantes, no los estados de carga
      partialize: (state) => ({
        products: state.products,
        stats: state.stats,
        _cacheTimestamp: state._cacheTimestamp,
        _cachedStoreId: state._cachedStoreId
      })
    }
  )
);
