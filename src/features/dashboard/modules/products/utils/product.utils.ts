/**
 * Utilidades para el manejo de productos
 * 
 * Funciones auxiliares para generar slugs, SKUs, palabras clave de búsqueda,
 * formateo de precios y otras operaciones comunes de productos.
 * 
 * @module features/dashboard/modules/products/utils
 */

import { Product } from '@/shared/types/firebase.types';
import { formatPrice, generateSlug } from '@/shared/utils/format.utils';

// Re-exportar funciones centralizadas para mantener compatibilidad
export { formatPrice, generateSlug };

// Tipo para el estado del producto
type ProductStatus = 'active' | 'inactive' | 'draft';

/**
 * Calcula el porcentaje de descuento entre dos precios
 */
export function calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0 || salePrice >= originalPrice) {
    return 0;
  }
  
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}



/**
 * Obtiene el estado de un producto en formato legible
 */
export function getProductStatusLabel(status: ProductStatus): string {
  const statusLabels: Record<ProductStatus, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    draft: 'Borrador'
  };
  
  return statusLabels[status] || 'Desconocido';
}

/**
 * Obtiene el color asociado a un estado de producto
 */
export function getProductStatusColor(status: ProductStatus): string {
  const statusColors: Record<ProductStatus, string> = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-red-600 bg-red-100',
    draft: 'text-yellow-600 bg-yellow-100'
  };
  
  return statusColors[status] || 'text-gray-600 bg-gray-100';
}

/**
 * Filtra productos por texto de búsqueda
 * Simplificado para restaurantes
 */
export function filterProductsBySearch(
  products: Product[],
  searchQuery: string
): Product[] {
  if (!searchQuery.trim()) {
    return products;
  }
  
  const query = searchQuery.toLowerCase();
  
  return products.filter(product => {
    return (
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    );
  });
}

/**
 * Ordena productos según el criterio especificado
 */
export function sortProducts(
  products: Product[],
  sortBy: string,
  direction: 'asc' | 'desc' = 'asc'
): Product[] {
  const sorted = [...products].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'created':
        aValue = a.createdAt.toMillis();
        bValue = b.createdAt.toMillis();
        break;
      case 'updated':
        aValue = a.updatedAt.toMillis();
        bValue = b.updatedAt.toMillis();
        break;
      default:
        aValue = a.createdAt.toMillis();
        bValue = b.createdAt.toMillis();
    }
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
}

/**
 * Obtiene la imagen principal de un producto
 * Simplificado para restaurantes - usa el primer elemento de imageUrls
 */
export function getProductMainImage(product: Product): string | null {
  if (product.imageUrls && product.imageUrls.length > 0) {
    return product.imageUrls[0];
  }
  
  return null;
}

/**
 * Genera un resumen corto de la descripción del producto
 */
export function generateProductSummary(description: string, maxLength: number = 150): string {
  if (description.length <= maxLength) {
    return description;
  }
  
  const truncated = description.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
}



