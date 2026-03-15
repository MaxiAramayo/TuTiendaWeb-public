/**
 * Componente principal de listado de productos
 * 
 * Muestra la lista de productos con filtros, agrupados por categoría
 * 
 * @module features/store/modules/products/components
 */

"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/shared/types/store';
import ProductCard from './ProductCard';
import { ProductModal } from './ProductModal';
import CartDrawer from '../../../components/cart/CartDrawer';
import CartFloatingButton from '../../../components/cart/CartFloatingButton';
import AdvancedProductFilters from '../../../components/filters/AdvancedProductFilters';
import { applyAdvancedFilters } from '../utils/product-filter.utils';
import { useFiltersStore } from '../../../store/filters.store';
import { useCartStore } from '../../../store/cart.store';
import { useProductModalStore } from '../../../store/product-modal.store';
import { useThemeClasses, useThemeStyles } from '../../../hooks/useStoreTheme';

// Variantes de animación para secciones y cards
const sectionVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 80, damping: 18 }
  }
};

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 16 }
  }
};

interface ProductListProps {
  products: Product[];
}

/**
 * Componente principal para mostrar la lista de productos con filtros
 */
const ProductList = ({ products }: ProductListProps) => {
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

  // Filtrado sincrónico con useMemo — no hay estado intermedio ni flash de loading
  const filteredProductData = useMemo(() => {
    if (!products || !products.length) {
      return { groupedProducts: {} as Record<string, Product[]>, hasProducts: false };
    }
    const result = applyAdvancedFilters(products, {
      searchTerm,
      selectedCategory,
      priceRange,
      sortBy,
      onlyAvailable,
    });
    return { groupedProducts: result.groupedProducts, hasProducts: result.hasProducts };
  }, [products, searchTerm, selectedCategory, priceRange, sortBy, onlyAvailable]);

  // Acceder al store del modal de producto
  const openProductModal = useProductModalStore((state: any) => state.openModal);

  // Acceder al store del carrito
  const openCart = useCartStore((state: any) => state.openCart);

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
      {/* Componente de filtros avanzados con animación de entrada */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.15 }}
      >
        <AdvancedProductFilters products={products} />
      </motion.div>

      {/* Contenedor para productos */}
      <div className="relative">
        {/* Listado de productos */}
        {filteredProductData.hasProducts ? (
          <div className="space-y-8">
            {/* Productos agrupados por categoría */}
            {Object.entries(filteredProductData.groupedProducts).map(([category, categoryProducts]) => (
              <motion.section
                key={category}
                aria-labelledby={`category-${category}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={sectionVariants}
              >
                <h2
                  id={`category-${category}`}
                  className={`text-xl font-bold mb-4 border-l-4 ${themeClasses.border.primary} pl-3`}
                  style={{ color: 'var(--store-accent)' }}
                >
                  {category}
                </h2>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  variants={gridVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-20px' }}
                >
                  {categoryProducts.map((product) => (
                    <motion.div key={product.idProduct || product.id} variants={cardVariants}>
                      <ProductCard
                        product={product}
                        onOpenModal={handleOpenModal}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.section>
            ))}
          </div>
        ) : (
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
        )}
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