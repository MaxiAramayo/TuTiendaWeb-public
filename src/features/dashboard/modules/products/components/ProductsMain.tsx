/**
 * Componente principal del módulo de productos
 * 
 * Integra todos los componentes de productos y maneja la lógica
 * de vista, filtros, búsqueda y acciones principales.
 * 
 * @module features/dashboard/modules/products/components
 */

"use client";

import React, { useState, useCallback } from 'react';
import { Plus, Search, Filter, Download, Upload, Package } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { ProductFilters } from '../types/product.types';
import { Product } from '@/shared/types/firebase.types';
import ProductGrid from './ProductGrid';
import ProductDataTable from './ProductDataTable';
import ProductViewToggle from './ProductViewToggle';
import { toast } from 'sonner';

/**
 * Props del componente ProductsMain
 */
interface ProductsMainProps {
  /** Función para navegar a crear producto */
  onCreateProduct?: () => void;
  /** Función para navegar a editar producto */
  onEditProduct?: (product: Product) => void;
  /** Función para ver detalles del producto */
  onViewProduct?: (product: Product) => void;
}

/**
 * Componente principal de productos
 */
const ProductsMain: React.FC<ProductsMainProps> = ({
  onCreateProduct,
  onEditProduct,
  onViewProduct
}) => {
  // Hook de productos
  const {
    products,
    loading,
    error,
    hasMore,
    total,
    stats,
    viewType,
    filters,
    searchQuery,
    storeId,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    loadNextPage,
    searchProducts,
    applyFilters,
    clearSearch,
    setViewType
  } = useProducts();

  // Estado local
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  /**
   * Maneja la búsqueda de productos
   */
  const handleSearch = useCallback((query: string) => {
    setSearchInput(query);
    if (query.trim()) {
      searchProducts(query);
    } else {
      clearSearch();
    }
  }, [searchProducts, clearSearch]);

  /**
   * Maneja el cambio de estado de un producto
   */
  const handleToggleStatus = useCallback(async (productId: string, status: 'active' | 'inactive') => {
    const success = await updateProduct(productId, { id: productId, status: status as any });
    if (success) {
      toast.success(`Producto ${status === 'active' ? 'activado' : 'desactivado'} exitosamente`);
    }
  }, [updateProduct]);

  // Función handleToggleFeatured eliminada - no aplica para restaurantes

  /**
   * Maneja la eliminación de un producto
   */
  const handleDeleteProduct = useCallback(async (productId: string) => {
    const success = await deleteProduct(productId);
    if (success) {
      // Remover de seleccionados si estaba seleccionado
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  }, [deleteProduct]);

  /**
   * Maneja la duplicación de un producto
   */
  const handleDuplicateProduct = useCallback(async (productId: string) => {
    const newProductId = await duplicateProduct(productId);
    if (newProductId) {
      toast.success('Producto duplicado exitosamente');
    }
  }, [duplicateProduct]);

  /**
   * Maneja la selección de productos
   */
  const handleSelectProduct = useCallback((productId: string, selected: boolean) => {
    setSelectedProducts(prev => {
      if (selected) {
        return [...prev, productId];
      } else {
        return prev.filter(id => id !== productId);
      }
    });
  }, []);

  /**
   * Maneja la selección de todos los productos
   */
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  }, [products]);

  /**
   * Maneja la carga de más productos (scroll infinito)
   */
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadNextPage();
    }
  }, [hasMore, loading, loadNextPage]);



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-8">
          {/* Header optimizado para móvil */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div>
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-4">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl">
                    <Package className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-4xl font-bold text-gray-900">Productos</h1>
                    <p className="text-gray-600 text-sm sm:text-lg">
                      {total > 0 ? `${total} producto${total !== 1 ? 's' : ''} en total` : 'Gestiona tu catálogo de productos'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Botón de crear producto optimizado */}
                <button
                  onClick={onCreateProduct}
                  className="inline-flex items-center px-4 py-2 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="w-4 h-4 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                  <span className="hidden sm:inline">Crear Producto</span>
                  <span className="sm:hidden">Crear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Estadísticas optimizadas para móvil */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
              <div className="bg-white p-3 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalProducts}</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Total</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-100 rounded-lg sm:rounded-xl">
                    <Package className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white p-3 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold text-green-600">{stats.activeProducts}</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Activos</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl sm:text-3xl font-bold text-red-600">{stats.inactiveProducts}</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Inactivos</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Barra de herramientas optimizada para móvil */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
              {/* Búsqueda optimizada */}
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos por nombre..."
                    value={searchInput}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 focus:bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Controles optimizados */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Filtros */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl border transition-all duration-300 ${
                    showFilters
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md'
                  }`}
                >
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Filtros</span>
                </button>

                {/* Selector de vista */}
                <ProductViewToggle
                  currentView={viewType}
                  onViewChange={setViewType}
                />

                {/* Acciones adicionales - ocultas en móvil */}
                <div className="hidden sm:flex items-center space-x-2">
                  <button
                    className="p-2 sm:p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Exportar productos"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    className="p-2 sm:p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Importar productos"
                  >
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de filtros avanzados optimizado para móvil */}
          {showFilters && (
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Filtros avanzados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {/* Filtro por estado */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 sm:mb-4">
                    Estado del producto
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => applyFilters({ ...filters, status: e.target.value as any })}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white shadow-sm hover:shadow-md"
                  >
                    <option value="">Todos los estados</option>
                    <option value="active">✅ Activo</option>
                    <option value="inactive">❌ Inactivo</option>
                  </select>
                </div>

                {/* Filtro de destacado eliminado - no aplica para restaurantes */}

                {/* Rango de precios */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 sm:mb-4">
                    Rango de precios
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Precio mínimo"
                        value={filters.priceRange?.min || ''}
                        onChange={(e) => {
                          const min = parseFloat(e.target.value) || undefined;
                          applyFilters({
                            ...filters,
                            priceRange: {
                              min: min ?? 0,
                              max: filters.priceRange?.max ?? 0
                            }
                          });
                        }}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white shadow-sm hover:shadow-md"
                      />
                    </div>
                    <div className="flex items-center justify-center sm:justify-start">
                      <span className="text-gray-500 font-bold text-lg">-</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Precio máximo"
                        value={filters.priceRange?.max || ''}
                        onChange={(e) => {
                          const max = parseFloat(e.target.value) || undefined;
                          applyFilters({
                            ...filters,
                            priceRange: {
                              min: filters.priceRange?.min ?? 0,
                              max: max ?? 0
                            }
                          });
                        }}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-white shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Error mejorado */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-red-800 font-semibold">Error al cargar productos</h3>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Lista/Cuadrícula de productos mejorada */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {viewType === 'grid' ? (
              <div className="p-6">
                <ProductGrid
                  products={products}
                  storeId={storeId || ''}
                  loading={loading}
                  onEdit={onEditProduct}
                  onDelete={handleDeleteProduct}
                  onDuplicate={handleDuplicateProduct}
                  onToggleStatus={handleToggleStatus}
                  // onToggleFeatured eliminado - no aplica para restaurantes
                  onView={onViewProduct}
                />
              </div>
            ) : (
              <div className="p-6">
                <ProductDataTable
                  products={products}
                  storeId={storeId || ''}
                  loading={loading}
                  onEdit={onEditProduct}
                  onDelete={handleDeleteProduct}
                  onDuplicate={handleDuplicateProduct}
                  onToggleStatus={handleToggleStatus}
                  onView={onViewProduct}
                  onCreateProduct={onCreateProduct}
                />
              </div>
            )}
          </div>

          {/* Botón cargar más optimizado para móvil */}
          {hasMore && (
            <div className="flex justify-center mt-6 sm:mt-12">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg sm:rounded-2xl hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                    <span className="hidden sm:inline">Cargando productos...</span>
                    <span className="sm:hidden">Cargando</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    <span className="hidden sm:inline">Cargar más productos</span>
                    <span className="sm:hidden">Cargar más</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsMain;