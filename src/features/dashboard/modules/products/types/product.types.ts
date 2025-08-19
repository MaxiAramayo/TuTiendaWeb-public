/**
 * Tipos de datos para el módulo de productos de restaurante
 * 
 * Define todas las interfaces y tipos relacionados con productos de restaurante,
 * categorías y configuraciones simplificadas para el sector gastronómico.
 * 
 * NOTA: Este archivo mantiene compatibilidad con la estructura antigua.
 * Para la nueva estructura, ver: @/shared/types/firebase.types.ts
 * 
 * @module features/dashboard/modules/products/types
 */

import { Timestamp, DocumentSnapshot } from 'firebase/firestore';
import { Product, Category as NewCategory, Tag as NewTag, ProductVariant } from '@/shared/types/firebase.types';

// Re-exportar tipos principales para compatibilidad
export type { Product, ProductVariant };

/**
 * Estados posibles de un producto de restaurante
 */
export type ProductStatus = 'active' | 'inactive';

/**
 * Tipo de vista de productos
 */
export type ProductViewType = 'grid' | 'list';

// ProductVariant ahora se importa desde @shared/types/firebase.types para mantener consistencia



/**
 * Opciones de paginación para productos
 */
export interface PaginationOptions {
  /** Límite de productos por página (20-50) */
  limit: number;
  /** Campo de ordenamiento */
  orderBy: 'createdAt' | 'name' | 'price' | 'updated';
  /** Dirección del ordenamiento */
  direction: 'asc' | 'desc';
  /** Cursor para paginación */
  startAfter?: DocumentSnapshot;
  /** Filtros aplicados */
  filters?: ProductFilters;
}

/**
 * Filtros para búsqueda de productos
 * Estructura simplificada según especificación del usuario
 */
export interface ProductFilters {
  /** Filtrar por estado */
  status?: ProductStatus;
  /** Filtrar por categoría */
  categoryId?: string;
  /** Rango de precios */
  priceRange?: {
    min: number;
    max: number;
  };
  /** Consulta de búsqueda de texto */
  searchQuery?: string;
}

/**
 * Resultado de una página de productos
 */
export interface ProductsPage {
  /** Lista de productos */
  products: Product[];
  /** Si hay más productos disponibles */
  hasMore: boolean;
  /** Último documento para paginación */
  lastDoc?: DocumentSnapshot;
  /** Total de productos (opcional) */
  total?: number;
}

/**
 * Datos para crear un producto
 * Estructura mejorada con campos adicionales
 */
export interface CreateProductData {
  /** Nombre del producto */
  name: string;
  /** Descripción corta del producto */
  shortDescription?: string;
  /** Descripción detallada */
  description?: string;
  /** ID de la categoría */
  categoryId: string;
  /** Precio del producto */
  price: number;
  /** Precio de costo (opcional) */
  costPrice?: number;
  /** Archivos de imagen */
  images?: File[];
  /** Estado del producto */
  status?: ProductStatus;
  /** Variantes del producto */
  variants?: ProductVariant[];
  /** Tags/etiquetas del producto */
  tags?: string[];
  /** Si se pueden aplicar promociones */
  promotionsEnabled?: boolean;
  /** Si el producto tiene una promoción activa */
  hasPromotion?: boolean;
}

/**
 * Datos para actualizar un producto
 * Estructura mejorada con campos adicionales
 */
export interface UpdateProductData {
  /** ID del producto (opcional para updates) */
  id?: string;
  /** Nombre del producto */
  name?: string;
  /** Descripción corta del producto */
  shortDescription?: string;
  /** Descripción detallada */
  description?: string;
  /** ID de la categoría */
  categoryId?: string;
  /** Precio del producto */
  price?: number;
  /** Precio de costo (opcional) */
  costPrice?: number;
  /** Imágenes que pueden ser archivos nuevos o URLs existentes */
  images?: (File | string)[];
  /** Estado del producto */
  status?: ProductStatus;
  /** Variantes del producto */
  variants?: ProductVariant[];
  /** Tags/etiquetas del producto */
  tags?: string[];
  /** Si se pueden aplicar promociones */
  promotionsEnabled?: boolean;
  /** Si el producto tiene una promoción activa */
  hasPromotion?: boolean;
}

/**
 * Datos para crear una categoría
 */
export interface CreateCategoryData {
  /** Nombre de la categoría */
  name: string;
  /** Descripción opcional */
  description?: string;
  /** URL de imagen */
  imageUrl?: string;
  /** Icono de la categoría */
  icon?: string;
  /** Color de la categoría */
  color?: string;
  /** Orden de visualización */
  sortOrder: number;
  /** Si está activa */
  isActive: boolean;
}

/**
 * Datos para actualizar una categoría
 */
export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  /** ID de la categoría */
  id: string;
}

/**
 * Estadísticas de productos de restaurante
 */
export interface ProductStats {
  /** Total de productos */
  totalProducts: number;
  /** Productos activos */
  activeProducts: number;
  /** Productos inactivos */
  inactiveProducts: number;
  /** Total de categorías */
  totalCategories: number;
}

/**
 * Resultado de búsqueda de productos
 */
export interface ProductSearchResult {
  /** Productos encontrados */
  products: Product[];
  /** Total de resultados */
  total: number;
  /** Si hay más resultados */
  hasMore: boolean;
  /** Tiempo de búsqueda en ms */
  searchTime: number;
}

/**
 * Configuración de vista de productos
 */
export interface ProductViewConfig {
  /** Tipo de vista */
  viewType: ProductViewType;
  /** Elementos por página */
  itemsPerPage: number;
  /** Mostrar imágenes */
  showImages: boolean;
  /** Campo de ordenamiento */
  sortBy: string;
  /** Dirección del ordenamiento */
  sortDirection: 'asc' | 'desc';
}