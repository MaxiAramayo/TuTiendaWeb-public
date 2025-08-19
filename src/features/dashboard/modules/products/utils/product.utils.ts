/**
 * Utilidades para el manejo de productos
 * 
 * Funciones auxiliares para generar slugs, SKUs, palabras clave de búsqueda,
 * formateo de precios y otras operaciones comunes de productos.
 * 
 * @module features/dashboard/modules/products/utils
 */

import { Product } from '@/shared/types/firebase.types';

// Tipo para el estado del producto
type ProductStatus = 'active' | 'inactive' | 'draft';

/**
 * Genera un slug único a partir de un nombre de producto
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones duplicados
    .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
}





/**
 * Formatea un precio con la moneda especificada
 */
export function formatPrice(price: number, currency: string = 'ARS'): string {
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return formatter.format(price);
}

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



/**
 * Genera variaciones de nombre para búsqueda
 */
export function generateNameVariations(name: string): string[] {
  const variations: string[] = [name.toLowerCase()];
  
  // Agregar sin acentos
  const withoutAccents = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  variations.push(withoutAccents);
  
  // Agregar palabras individuales
  const words = name.toLowerCase().split(/\s+/);
  variations.push(...words);
  
  // Remover duplicados
  return Array.from(new Set(variations));
}

/**
 * Calcula el peso total de un producto con sus variantes
 */
export function calculateTotalWeight(product: Product): number {
  // Peso base del producto (removido weight del tipo)
  let totalWeight = 0;
  
  // ProductDocument no tiene variantes en la estructura simplificada
  // Se mantiene el peso total en 0
  totalWeight = 0;
  
  return totalWeight;
}

/**
 * Formatea el tamaño de archivo en formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}



/**
 * Genera un nombre de archivo único para imágenes
 */
export function generateImageFileName(originalName: string, productId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  
  const prefix = productId ? `${productId}_` : '';
  return `${prefix}${timestamp}_${random}.${extension}`;
}

/**
 * Convierte un producto a formato de exportación
 * Simplificado para restaurantes
 */
export function productToExportFormat(product: Product): Record<string, any> {
  return {
    ID: product.id,
    Nombre: product.name,
    Descripción: product.description,
    Precio: product.price,
    Moneda: 'ARS', // ProductDocument no tiene currency, usar valor por defecto
    Categoría: product.categoryId,
    Estado: getProductStatusLabel(product.status),
    'Fecha Creación': product.createdAt.toDate().toLocaleDateString(),
    'Fecha Actualización': product.updatedAt.toDate().toLocaleDateString(),
    'Tiene Imagen': (product.imageUrls && product.imageUrls.length > 0) ? 'Sí' : 'No'
  };
}