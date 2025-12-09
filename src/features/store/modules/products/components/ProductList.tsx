/**
 * Componente principal de listado de productos
 * 
 * Muestra la lista de productos con filtros, agrupados por categoría
 * 
 * @module features/store/modules/products/components
 */

"use client";

import { useState, useEffect } from 'react';
import { Product } from '@/shared/types/store';
import ProductCard from './ProductCard';
import { ProductModal } from './ProductModal';
import ProductSkeleton from './ProductSkeleton';
import CartDrawer from '../../../components/cart/CartDrawer';
import CartFloatingButton from '../../../components/cart/CartFloatingButton';
import AdvancedProductFilters from '../../../components/filters/AdvancedProductFilters';
import { applyAdvancedFilters } from '../utils/product-filter.utils';
import { useFiltersStore } from '../../../store/filters.store';
import { useCartStore } from '../../../store/cart.store';
import { useProductModalStore } from '../../../store/product-modal.store';
import { Loader2 } from 'lucide-react';
import { useThemeClasses, useThemeStyles } from '../../../hooks/useStoreTheme';

interface ProductListProps {
  products: Product[];
  name?: string;
  whatsapp?: string;
  menu?: any;
  uid?: string;
  isLoading?: boolean;
}

/**
 * Componente principal para mostrar la lista de productos con filtros
 */
const ProductList = ({ 
  products, 
  name, 
  whatsapp, 
  menu, 
  uid,
  isLoading = false 
}: ProductListProps) => {
  // Store de filtros
  const {
    searchTerm,
    selectedCategory,
    priceRange,
    sortBy,
    onlyAvailable
  } = useFiltersStore();
  
  // Hooks del tema
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();
  
  // Estado para manejar los productos filtrados
  const [filteredProductData, setFilteredProductData] = useState({
    groupedProducts: {} as Record<string, Product[]>,
    hasProducts: false,
  });
  const [isFiltering, setIsFiltering] = useState(false);

  // Acceder al store del modal de producto
  const openProductModal = useProductModalStore((state: any) => state.openModal);
  
  // Acceder al store del carrito
  const cartItems = useCartStore((state: any) => state.items);
  const openCart = useCartStore((state: any) => state.openCart);

  // Aplicar filtros cuando cambien las opciones o los productos
  useEffect(() => {
    if (!products || !products.length) {
      setFilteredProductData({ groupedProducts: {}, hasProducts: false });
      return;
    }
    
    setIsFiltering(true);
    
    // Usar setTimeout para simular procesamiento asíncrono y mostrar loading
    const timeoutId = setTimeout(() => {
      const filterResult = applyAdvancedFilters(products, {
           searchTerm,
           selectedCategory,
           priceRange,
           sortBy,
           onlyAvailable
         });
         
         setFilteredProductData({
           groupedProducts: filterResult.groupedProducts,
           hasProducts: filterResult.hasProducts
         });
      setIsFiltering(false);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [products, searchTerm, selectedCategory, priceRange, sortBy, onlyAvailable]);

  /**
   * Abre el modal con los detalles del producto
   */
  const handleOpenModal = (product: Product) => {
    openProductModal(product);
  };

  /**
   * Abre el carrito de compras
   */
  const handleOpenCart = () => {
    openCart();
  };

  // Si no hay productos, mostrar mensaje de error
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">No hay productos disponibles</h2>
        <p className="text-gray-500">
          Actualmente no hay productos para mostrar. Vuelve a intentarlo más tarde.
        </p>
      </div>
    );
  }

  // Contenedor principal para la lista de productos
  return (
    <div className="pb-24 px-4 mx-auto max-w-5xl">
      {/* Componente de filtros avanzados */}
      <AdvancedProductFilters
        products={products}
      />

      {/* Contenedor con altura fija para evitar layout shifting */}
      <div className="h-[600px] md:h-[800px] relative overflow-y-auto">
        {/* Skeleton loading durante filtrado para mantener layout estable */}
        {(isLoading || isFiltering) && (
          <div className="relative">
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex justify-center items-start pt-8">
              <div className="flex items-center bg-white/90 px-4 py-2 rounded-full shadow-sm border">
                <Loader2 className="h-4 w-4 animate-spin mr-2" style={{ color: 'var(--store-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--store-secondary)' }}>Filtrando productos...</span>
              </div>
            </div>
            <ProductSkeleton count={6} />
          </div>
        )}

        {/* Listado de productos */}
        {!isLoading && !isFiltering && filteredProductData.hasProducts ? (
          <div className="space-y-8">
            {/* Productos agrupados por categoría */}
            {Object.entries(filteredProductData.groupedProducts).map(([category, categoryProducts]) => (
              <section key={category} aria-labelledby={`category-${category}`}>
                <h2 
                  id={`category-${category}`}
                  className={`text-xl font-bold mb-4 border-l-4 ${themeClasses.border.primary} pl-3`}
                  style={{ color: 'var(--store-secondary)' }}
                >
                  {category}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.idProduct || product.id}
                      product={product}
                      onOpenModal={handleOpenModal}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : !isLoading && !isFiltering ? (
          // Mensaje cuando no hay resultados para los filtros aplicados
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No se encontraron productos</h3>
            <p className="text-gray-500 max-w-md">
              No se encontraron productos que coincidan con los filtros seleccionados. 
              Intenta con otros términos de búsqueda o categorías.
            </p>
          </div>
        ) : null}
      </div>

      {/* Modal de producto */}
      <ProductModal />
      
      {/* Carrito de compras */}
      <CartDrawer />

      {/* Botón flotante del carrito */}
      <CartFloatingButton />
    </div>
  );
};

export default ProductList;