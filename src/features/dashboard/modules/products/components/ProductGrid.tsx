/**
 * Componente de cuadrícula de productos
 * 
 * Muestra productos en formato de cuadrícula con imágenes,
 * información básica y acciones rápidas.
 * 
 * @module features/dashboard/modules/products/components
 */

"use client";

import React from 'react';
import { Product } from '@/shared/types/firebase.types';
import ProductCard from './ProductCard';
import { Loader2 } from 'lucide-react';

/**
 * Props del componente ProductGrid
 */
interface ProductGridProps {
  /** Lista de productos a mostrar */
  products: Product[];
  /** ID de la tienda */
  storeId: string;
  /** Estado de carga */
  loading?: boolean;
  /** Función para manejar la edición de un producto */
  onEdit?: (product: Product) => void;
  /** Función para manejar la eliminación de un producto */
  onDelete?: (productId: string) => void;
  /** Función para manejar la duplicación de un producto */
  onDuplicate?: (productId: string) => void;
  /** Función para manejar el cambio de estado de un producto */
  onToggleStatus?: (productId: string, status: 'active' | 'inactive') => void;
  // onToggleFeatured eliminado - no aplica para restaurantes
  /** Función para ver detalles del producto */
  onView?: (product: Product) => void;
}

/**
 * Componente de cuadrícula de productos
 */
const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  storeId,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  // onToggleFeatured eliminado
  onView
}) => {
  // Estado de carga
  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando productos...</span>
        </div>
      </div>
    );
  }

  // Estado vacío
  if (!loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay productos
        </h3>
        <p className="text-gray-500 mb-4">
          Comienza creando tu primer producto para tu tienda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cuadrícula de productos optimizada para móvil */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            storeId={storeId}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleStatus={onToggleStatus}
            // onToggleFeatured eliminado
            onView={onView}
          />
        ))}
      </div>

      {/* Indicador de carga para más productos */}
      {loading && products.length > 0 && (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando más productos...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;