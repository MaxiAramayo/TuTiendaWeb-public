/**
 * Componente de loading spinner reutilizable
 * 
 * Proporciona diferentes variantes de loading para distintos contextos
 * 
 * @module features/store/components/ui
 */

"use client";

import { Loader2, ShoppingCart, Package, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Tamaño del spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Variante del loading */
  variant?: 'default' | 'cart' | 'products' | 'search' | 'checkout';
  /** Texto descriptivo */
  text?: string;
  /** Mostrar solo el spinner sin texto */
  spinnerOnly?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Mapeo de tamaños para los iconos
 */
const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

/**
 * Mapeo de textos por defecto para cada variante
 */
const defaultTexts = {
  default: 'Cargando...',
  cart: 'Actualizando carrito...',
  products: 'Cargando productos...',
  search: 'Buscando...',
  checkout: 'Procesando pedido...'
};

/**
 * Mapeo de iconos para cada variante
 */
const iconMap = {
  default: Loader2,
  cart: ShoppingCart,
  products: Package,
  search: Search,
  checkout: Loader2
};

/**
 * Componente de loading spinner
 */
const LoadingSpinner = ({
  size = 'md',
  variant = 'default',
  text,
  spinnerOnly = false,
  className
}: LoadingSpinnerProps) => {
  const Icon = iconMap[variant];
  const displayText = text || defaultTexts[variant];
  const iconSize = sizeMap[size];
  
  if (spinnerOnly) {
    return (
      <Icon 
        className={cn(
          iconSize,
          'animate-spin text-purple-600',
          className
        )} 
      />
    );
  }
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-2',
      className
    )}>
      <Icon 
        className={cn(
          iconSize,
          'animate-spin text-purple-600'
        )} 
      />
      {displayText && (
        <p className={cn(
          'text-gray-600 font-medium',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          size === 'xl' && 'text-lg'
        )}>
          {displayText}
        </p>
      )}
    </div>
  );
};

/**
 * Componente de loading para tarjetas de productos
 */
export const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Imagen skeleton */}
      <div className="w-full h-48 bg-gray-200" />
      
      {/* Contenido skeleton */}
      <div className="p-4 space-y-3">
        {/* Título */}
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        
        {/* Descripción */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
        
        {/* Precio y botón */}
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

/**
 * Componente de loading para lista de productos
 */
export const ProductListSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Componente de loading para el carrito
 */
export const CartSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
          {/* Imagen */}
          <div className="w-16 h-16 bg-gray-200 rounded" />
          
          {/* Contenido */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
          
          {/* Precio */}
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
};

/**
 * Componente de loading para filtros
 */
export const FiltersSkeleton = () => {
  return (
    <div className="space-y-4 mb-8">
      {/* Barra de búsqueda */}
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      
      {/* Filtros */}
      <div className="flex gap-4">
        <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-48 animate-pulse" />
      </div>
    </div>
  );
};

export default LoadingSpinner;