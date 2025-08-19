/**
 * Componente skeleton para mostrar durante la carga de productos
 * 
 * Proporciona una representación visual de carga que mantiene el layout estable
 * 
 * @module features/store/modules/products/components
 */

"use client";

import React from 'react';

interface ProductSkeletonProps {
  /** Número de elementos skeleton a mostrar */
  count?: number;
}

/**
 * Componente individual de skeleton para un producto
 */
const ProductSkeletonCard = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      {/* Imagen skeleton */}
      <div className="w-full h-32 bg-gray-200 rounded-lg mb-3"></div>
      
      {/* Título skeleton */}
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
      
      {/* Precio skeleton */}
      <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
      
      {/* Botón skeleton */}
      <div className="h-8 bg-gray-200 rounded"></div>
    </div>
  );
};

/**
 * Componente skeleton para la lista de productos
 */
const ProductSkeleton = ({ count = 6 }: ProductSkeletonProps) => {
  return (
    <div className="space-y-8">
      {/* Skeleton para categorías */}
      {Array.from({ length: Math.ceil(count / 3) }).map((_, categoryIndex) => (
        <section key={categoryIndex}>
          {/* Título de categoría skeleton */}
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
          
          {/* Grid de productos skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: Math.min(3, count - categoryIndex * 3) }).map((_, productIndex) => (
              <ProductSkeletonCard key={`${categoryIndex}-${productIndex}`} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProductSkeleton;