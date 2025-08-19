/**
 * Hook principal para la gestión de productos
 * 
 * Proporciona funcionalidades completas para CRUD de productos,
 * paginación, búsqueda, filtrado y gestión de estado.
 * 
 * @module features/dashboard/modules/products/hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/features/auth/api/authStore';
import { productsService } from '../api/products.service';
import {
  Product,
  CreateProductData,
  UpdateProductData,
  PaginationOptions,
  ProductFilters,
  ProductsPage,
  ProductStats,
  ProductViewType
} from '../types/product.types';
import { toast } from 'sonner';

/**
 * Configuración por defecto para paginación
 */
const DEFAULT_PAGINATION: PaginationOptions = {
  limit: 20,
  orderBy: 'createdAt',
  direction: 'desc',
  filters: {}
};

/**
 * Estado del hook de productos
 */
interface UseProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  currentPage: ProductsPage | null;
  stats: ProductStats | null;
  viewType: ProductViewType;
  filters: ProductFilters;
  searchQuery: string;
}

/**
 * Hook principal para gestión de productos
 */
export function useProducts() {
  const { user } = useAuthStore();
  // Usar el primer storeId del usuario (para restaurantes solo tienen una tienda)
  const storeId = user?.storeIds?.[0];

  // Estado principal
  const [state, setState] = useState<UseProductsState>({
    products: [],
    loading: false,
    error: null,
    hasMore: false,
    total: 0,
    currentPage: null,
    stats: null,
    viewType: 'grid',
    filters: DEFAULT_PAGINATION.filters || {},
    searchQuery: ''
  });

  // Opciones de paginación actuales
  const [paginationOptions, setPaginationOptions] = useState<PaginationOptions>(DEFAULT_PAGINATION);

  /**
   * Actualiza el estado de forma segura
   */
  const updateState = useCallback((updates: Partial<UseProductsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Carga productos con las opciones actuales
   */
  const loadProducts = useCallback(async (options?: Partial<PaginationOptions>) => {
    if (!storeId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const finalOptions = {
        ...paginationOptions,
        ...options
      };

      const page = await productsService.getProducts(storeId, finalOptions);
      
      setState(prev => ({
        ...prev,
        products: page.products,
        hasMore: page.hasMore,
        total: page.total || 0,
        currentPage: page,
        loading: false
      }));

      // Actualizar opciones de paginación solo si son diferentes
      if (JSON.stringify(finalOptions) !== JSON.stringify(paginationOptions)) {
        setPaginationOptions(finalOptions);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar productos'
      }));
      toast.error('Error al cargar productos');
    }
  }, [storeId, paginationOptions]);

  /**
   * Carga la siguiente página de productos
   */
  const loadNextPage = useCallback(async () => {
    if (!storeId || !state.hasMore || state.loading || !state.currentPage?.lastDoc) return;

    try {
      updateState({ loading: true });

      const nextPageOptions = {
        ...paginationOptions,
        startAfter: state.currentPage.lastDoc
      };

      const page = await productsService.getProducts(storeId, nextPageOptions);
      
      updateState({
        products: [...state.products, ...page.products],
        hasMore: page.hasMore,
        currentPage: page,
        loading: false
      });
    } catch (error) {
      updateState({
        loading: false,
        error: 'Error al cargar más productos'
      });
      toast.error('Error al cargar más productos');
    }
  }, [storeId, state.hasMore, state.loading, state.currentPage, state.products, updateState]);

  /**
   * Recarga productos desde el inicio
   */
  const refreshProducts = useCallback(() => {
    const refreshOptions = {
      ...paginationOptions,
      startAfter: undefined
    };
    loadProducts(refreshOptions);
  }, [loadProducts]);

  /**
   * Carga estadísticas de productos
   */
  const loadStats = useCallback(async () => {
    if (!storeId) return;

    try {
      const stats = await productsService.getProductStats(storeId);
      updateState({ stats });
    } catch (error) {
      // Error silencioso para estadísticas
    }
  }, [storeId, updateState]);

  /**
   * Crea un nuevo producto
   */
  const createProduct = useCallback(async (data: CreateProductData): Promise<string | null> => {
    if (!storeId) return null;

    try {
      updateState({ loading: true, error: null });
      
      const productId = await productsService.createProduct(storeId, data);
      
      // Recargar productos para mostrar el nuevo
      const refreshOptions = {
        ...paginationOptions,
        startAfter: undefined
      };
      await loadProducts(refreshOptions);
      
      // Recargar estadísticas después de crear
      await loadStats();
      
      updateState({ loading: false });
      
      // Toast de éxito se maneja en el formulario
      
      return productId;
    } catch (error) {
      updateState({
        loading: false,
        error: 'Error al crear producto'
      });
      toast.error('Error al crear producto');
      return null;
    }
  }, [storeId, paginationOptions, updateState, loadProducts, loadStats]);

  /**
   * Actualiza un producto existente
   */
  const updateProduct = useCallback(async (productId: string, data: UpdateProductData): Promise<boolean> => {
    if (!storeId) return false;

    try {
      updateState({ loading: true, error: null });
      
      await productsService.updateProduct(storeId, productId, data);
      
      // Actualizar el producto en el estado local
      updateState({
        products: state.products.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                name: data.name || product.name,
                shortDescription: data.shortDescription !== undefined ? data.shortDescription : product.shortDescription,
                description: data.description || product.description,
                price: data.price || product.price,
                costPrice: data.costPrice !== undefined ? data.costPrice : product.costPrice,
                categoryId: data.categoryId || product.categoryId,
                status: data.status || product.status,
                tags: data.tags !== undefined ? data.tags : product.tags,
                variants: data.variants !== undefined ? data.variants : product.variants,
                hasPromotion: data.hasPromotion !== undefined ? data.hasPromotion : product.hasPromotion,
                updatedAt: new Date() as any 
              }
            : product
        ),
        loading: false
      });
      
      // Toast de éxito se maneja en el formulario
      
      return true;
    } catch (error) {
      updateState({
        loading: false,
        error: 'Error al actualizar producto'
      });
      toast.error('Error al actualizar producto');
      return false;
    }
  }, [storeId, state.products, updateState]);

  /**
   * Elimina un producto
   */
  const deleteProduct = useCallback(async (productId: string): Promise<boolean> => {
    if (!storeId) return false;

    try {
      updateState({ loading: true, error: null });
      
      await productsService.deleteProduct(storeId, productId);
      
      // Remover el producto del estado local
      updateState({
        products: state.products.filter(product => product.id !== productId),
        total: state.total - 1,
        loading: false
      });
      
      // Recargar estadísticas después de eliminar
      await loadStats();
      
      // Toast de éxito se maneja en el componente que llama
      
      return true;
    } catch (error) {
      updateState({
        loading: false,
        error: 'Error al eliminar producto'
      });
      toast.error('Error al eliminar producto');
      return false;
    }
  }, [storeId, state.products, state.total, updateState, loadStats]);

  /**
   * Duplica un producto
   */
  const duplicateProduct = useCallback(async (productId: string): Promise<string | null> => {
    if (!storeId) return null;

    try {
      updateState({ loading: true, error: null });
      
      const newProductId = await productsService.duplicateProduct(storeId, productId);
      
      // Recargar productos para mostrar el duplicado
      await refreshProducts();
      
      updateState({ loading: false });
      
      // Toast de éxito se maneja en el componente que llama
      
      return newProductId;
    } catch (error) {
      updateState({
        loading: false,
        error: 'Error al duplicar producto'
      });
      toast.error('Error al duplicar producto');
      return null;
    }
  }, [storeId, updateState, refreshProducts]);

  /**
   * Busca productos por texto
   */
  const searchProducts = useCallback(async (query: string) => {
    if (!storeId) return;

    try {
      updateState({ loading: true, error: null, searchQuery: query });

      if (!query.trim()) {
        // Si no hay query, cargar productos normales
        const refreshOptions = {
          ...paginationOptions,
          startAfter: undefined
        };
        await loadProducts(refreshOptions);
        return;
      }

      const result = await productsService.searchProducts(storeId, query, {
        limit: 20 // Usar valor fijo para evitar dependencias
      });
      
      updateState({
        products: result.products,
        hasMore: result.hasMore,
        total: result.total,
        loading: false
      });
    } catch (error) {
      updateState({
        loading: false,
        error: 'Error al buscar productos'
      });
      toast.error('Error al buscar productos');
    }
  }, [storeId, paginationOptions, updateState, loadProducts]);

  /**
   * Aplica filtros a los productos
   */
  const applyFilters = useCallback((filters: ProductFilters) => {
    setState(prev => ({ ...prev, filters }));
    
    const newOptions = {
      ...paginationOptions,
      filters,
      startAfter: undefined // Reiniciar paginación
    };
    
    loadProducts(newOptions);
  }, [loadProducts]);

  /**
   * Cambia el tipo de vista
   */
  const setViewType = useCallback((viewType: ProductViewType) => {
    updateState({ viewType });
    
    // Guardar preferencia en localStorage
    localStorage.setItem('products-view-type', viewType);
  }, [updateState]);

  /**
   * Cambia las opciones de ordenamiento
   */
  const setSorting = useCallback((orderBy: string, direction: 'asc' | 'desc') => {
    const newOptions = {
      ...paginationOptions,
      orderBy: orderBy as any,
      direction,
      startAfter: undefined // Reiniciar paginación
    };
    
    loadProducts(newOptions);
  }, [loadProducts]);



  /**
   * Obtiene un producto por ID
   */
  const getProduct = useCallback(async (productId: string): Promise<Product | null> => {
    if (!storeId) return null;

    try {
      return await productsService.getProduct(storeId, productId);
    } catch (error) {
      toast.error('Error al obtener producto');
      return null;
    }
  }, [storeId]);

  /**
   * Elimina una imagen específica de un producto
   */
  const removeProductImage = useCallback(async (productId: string, imageUrl: string): Promise<boolean> => {
    if (!storeId) return false;

    try {
      updateState({ loading: true, error: null });
      
      await productsService.removeProductImage(storeId, productId, imageUrl);
      
      // Actualizar el producto en el estado local
      updateState({
        products: state.products.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                imageUrls: product.imageUrls?.filter(url => url !== imageUrl) || [],
                updatedAt: new Date() as any 
              }
            : product
        ),
        loading: false
      });
      
      return true;
    } catch (error) {
      updateState({
        loading: false,
        error: 'Error al eliminar imagen'
      });
      toast.error('Error al eliminar imagen del producto');
      return false;
    }
  }, [storeId, state.products, updateState]);

  /**
   * Productos filtrados localmente (para búsqueda instantánea)
   */
  const filteredProducts = useMemo(() => {
    let filtered = [...state.products];

    // Aplicar filtro de búsqueda local si hay query
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        false // tags eliminados - estructura simplificada
      );
    }

    return filtered;
  }, [state.products, state.searchQuery]);

  /**
   * Efecto para cargar productos iniciales
   */
  useEffect(() => {
    if (storeId) {
      // Cargar preferencia de vista desde localStorage
      const savedViewType = localStorage.getItem('products-view-type') as ProductViewType;
      if (savedViewType) {
        updateState({ viewType: savedViewType });
      }
      
      // Cargar productos y estadísticas
      loadProducts();
      loadStats();
    }
  }, [storeId]); // Solo depende de storeId para evitar bucles infinitos

  /**
   * Limpia la búsqueda
   */
  const clearSearch = useCallback(() => {
    updateState({ searchQuery: '' });
    const refreshOptions = {
      ...paginationOptions,
      startAfter: undefined
    };
    loadProducts(refreshOptions);
  }, [updateState, loadProducts]);

  return {
    // Estado
    products: filteredProducts,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    total: state.total,
    stats: state.stats,
    viewType: state.viewType,
    filters: state.filters,
    searchQuery: state.searchQuery,
    storeId,
    
    // Acciones CRUD
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    getProduct,
    removeProductImage,
    
    // Navegación y paginación
    loadProducts,
    loadNextPage,
    refreshProducts,
    
    // Búsqueda y filtros
    searchProducts,
    applyFilters,
    clearSearch,
    
    // Vista y ordenamiento
    setViewType,
    setSorting,
    
    // Utilidades
    loadStats
  };
}

/**
 * Hook simplificado para obtener un producto específico
 */
export function useProduct(productId: string) {
  const { user } = useAuthStore();
  const storeId = user?.id;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!storeId || !productId) return;

    try {
      setLoading(true);
      setError(null);
      
      const productData = await productsService.getProduct(storeId, productId);
      setProduct(productData);
    } catch (err) {
      setError('Error al cargar producto');
    } finally {
      setLoading(false);
    }
  }, [storeId, productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  return {
    product,
    loading,
    error,
    refetch: loadProduct
  };
}