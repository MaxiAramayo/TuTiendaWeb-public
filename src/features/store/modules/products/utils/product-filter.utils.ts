/**
 * Utilidades para filtrar y ordenar productos
 * 
 * @module features/store/modules/products/utils
 */

import { FilterOptions, GroupedProducts, Product, ProductFilters, SortOption } from "@/shared/types/store";
import { SortOption as FiltersSortOption } from '@/features/store/store/filters.store';

/**
 * Filtra los productos por término de búsqueda
 * 
 * @param products - Lista de productos a filtrar
 * @param searchTerm - Término de búsqueda
 * @returns Lista de productos filtrados
 */
export const filterProductsBySearchTerm = (products: Product[], searchTerm: string): Product[] => {
  if (!searchTerm.trim()) return products;
  
  const term = searchTerm.toLowerCase().trim();
  return products.filter(product => 
    product.name.toLowerCase().includes(term) || 
    product.description.toLowerCase().includes(term)
  );
};

/**
 * Filtra los productos por categoría
 * 
 * @param products - Lista de productos a filtrar
 * @param category - Categoría seleccionada
 * @returns Lista de productos filtrados
 */
export const filterProductsByCategory = (products: Product[], category: string): Product[] => {
  if (category === 'all') return products;
  
  return products.filter(product => 
    product.category?.toLowerCase() === category.toLowerCase()
  );
};

/**
 * Ordena los productos por precio
 * 
 * @param products - Lista de productos a ordenar
 * @param sortByPrice - Tipo de ordenamiento ('asc' o 'desc')
 * @returns Lista de productos ordenados
 */
export const sortProductsByPrice = (products: Product[], sortByPrice: string): Product[] => {
  if (!sortByPrice) return products;
  
  return [...products].sort((a, b) => {
    if (sortByPrice === 'asc') {
      return a.price - b.price;
    } else {
      return b.price - a.price;
    }
  });
};

/**
 * Agrupa los productos por categoría
 * 
 * @param products - Lista de productos a agrupar
 * @returns Objeto con productos agrupados por categoría
 */
export const groupProductsByCategory = (products: Product[]): GroupedProducts => {
  return products.reduce((groups, product) => {
    const category = product.category || 'Sin categoría';
    groups[category] = groups[category] || [];
    groups[category].push(product);
    return groups;
  }, {} as GroupedProducts);
};

/**
 * Filtra productos por rango de precios
 * 
 * @param products - Lista de productos a filtrar
 * @param priceRange - Rango de precios [min, max]
 * @returns Lista de productos filtrados
 */
export const filterProductsByPriceRange = (products: Product[], priceRange: [number, number]): Product[] => {
  const [minPrice, maxPrice] = priceRange;
  return products.filter(product => 
    product.price >= minPrice && product.price <= maxPrice
  );
};

/**
 * Filtra productos por disponibilidad
 * 
 * @param products - Lista de productos a filtrar
 * @param onlyAvailable - Si solo mostrar productos disponibles
 * @returns Lista de productos filtrados
 */
export const filterProductsByAvailability = (products: Product[], onlyAvailable: boolean): Product[] => {
  if (!onlyAvailable) return products;
  return products.filter(product => product.available !== false);
};

/**
 * Ordena productos usando las nuevas opciones de ordenamiento
 * 
 * @param products - Lista de productos a ordenar
 * @param sortBy - Opción de ordenamiento
 * @returns Lista de productos ordenados
 */
export const sortProductsAdvanced = (products: Product[], sortBy: FiltersSortOption): Product[] => {
  if (sortBy === 'none') return products;
  
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
        // Asumimos que los productos más nuevos están primero en el array original
        return 0;
      default:
        return 0;
    }
  });
};

/**
 * Aplica todos los filtros avanzados a una lista de productos
 * 
 * @param products - Lista de productos a filtrar
 * @param filters - Configuración de filtros
 * @returns Productos filtrados y agrupados
 */
export const applyAdvancedFilters = (
  products: Product[],
  filters: {
    searchTerm: string;
    selectedCategory: string;
    priceRange: [number, number];
    sortBy: FiltersSortOption;
    onlyAvailable: boolean;
  }
) => {
  const { searchTerm, selectedCategory, priceRange, sortBy, onlyAvailable } = filters;
  
  // Aplicar filtros en secuencia
  let filteredProducts = filterProductsBySearchTerm(products, searchTerm);
  filteredProducts = filterProductsByCategory(filteredProducts, selectedCategory);
  filteredProducts = filterProductsByPriceRange(filteredProducts, priceRange);
  filteredProducts = filterProductsByAvailability(filteredProducts, onlyAvailable);
  filteredProducts = sortProductsAdvanced(filteredProducts, sortBy);
  
  // Agrupar por categoría
  const groupedProducts = groupProductsByCategory(filteredProducts);
  
  return {
    groupedProducts,
    hasProducts: filteredProducts.length > 0,
    totalProducts: filteredProducts.length,
  };
};

/**
 * Aplica todos los filtros a una lista de productos (versión legacy)
 * 
 * @param products - Lista de productos a filtrar
 * @param filterOptions - Opciones de filtrado
 * @returns Productos filtrados y agrupados
 */
export const applyProductFilters = (
  products: Product[], 
  filterOptions: FilterOptions
) => {
  const { searchTerm, selectedCategory, sortByPrice } = filterOptions;
  
  // Aplicar filtros en secuencia
  let filteredProducts = filterProductsBySearchTerm(products, searchTerm);
  filteredProducts = filterProductsByCategory(filteredProducts, selectedCategory);
  filteredProducts = sortProductsByPrice(filteredProducts, sortByPrice);
  
  // Agrupar por categoría
  const groupedProducts = groupProductsByCategory(filteredProducts);
  
  return {
    groupedProducts,
    hasProducts: filteredProducts.length > 0,
  };
};

/**
 * Devuelve las categorías únicas de una lista de productos
 * 
 * @param products - Lista de productos
 * @returns Array de categorías únicas
 */
export const getUniqueCategories = (products: Product[]): string[] => {
  if (!products || products.length === 0) {
    return [];
  }
  
  const categories = new Set(
    products
      .map(product => product.category)
      .filter((category): category is string => Boolean(category))
  );
  
  return Array.from(categories);
};

/**
 * Obtiene el rango de precios de una lista de productos
 * 
 * @param products - Lista de productos
 * @returns Rango de precios [min, max]
 */
export const getPriceRange = (products: Product[]): [number, number] => {
  if (!products || products.length === 0) {
    return [0, 10000];
  }
  
  const prices = products.map(product => product.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  return [Math.floor(minPrice), Math.ceil(maxPrice)];
};

/**
 * Obtiene estadísticas de productos filtrados
 * 
 * @param products - Lista de productos
 * @param filteredProducts - Lista de productos filtrados
 * @returns Estadísticas de filtrado
 */
export const getFilterStats = (products: Product[], filteredProducts: Product[]) => {
  return {
    total: products.length,
    filtered: filteredProducts.length,
    percentage: products.length > 0 ? Math.round((filteredProducts.length / products.length) * 100) : 0,
    categories: getUniqueCategories(filteredProducts).length,
    priceRange: getPriceRange(filteredProducts),
  };
};

/**
 * Formatea el precio para mostrarlo como moneda
 * 
 * @param price - Precio a formatear
 * @param locale - Configuración regional (por defecto 'es-AR')
 * @param currency - Moneda (por defecto 'ARS')
 * @returns Precio formateado como string (ej: "$ 1.234,56")
 */
export const formatPrice = (
  price: number,
  locale: string = 'es-MX',
  currency: string = 'MXN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
};

/**
 * Filtra productos según criterios
 * 
 * @param products - Lista de productos
 * @param filters - Filtros a aplicar
 * @returns Productos filtrados
 */
export const filterProducts = (products: Product[], filters: ProductFilters): Product[] => {
  return products.filter(product => {
    // Filtrar por término de búsqueda
    if (filters.search && !productMatchesSearch(product, filters.search)) {
      return false;
    }
    
    // Filtrar por categoría
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    
    // Filtrar por precio mínimo
    if (filters.minPrice !== undefined && product.price < filters.minPrice) {
      return false;
    }
    
    // Filtrar por precio máximo
    if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
      return false;
    }
    
    // Filtrar por disponibilidad
    if (filters.available !== undefined && product.available !== filters.available) {
      return false;
    }
    
    return true;
  });
};

/**
 * Verifica si un producto coincide con un término de búsqueda
 * 
 * @param product - Producto a verificar
 * @param searchTerm - Término de búsqueda
 * @returns True si coincide, false en caso contrario
 */
export const productMatchesSearch = (product: Product, searchTerm: string): boolean => {
  const term = searchTerm.toLowerCase().trim();
  const name = product.name.toLowerCase();
  const description = product.description?.toLowerCase() || '';
  const category = product.category?.toLowerCase() || '';
  
  return (
    name.includes(term) ||
    description.includes(term) ||
    category.includes(term)
  );
};

/**
 * Ordena productos según una opción
 * 
 * @param products - Lista de productos
 * @param sortOption - Opción de ordenamiento
 * @returns Productos ordenados
 */
export const sortProducts = (products: Product[], sortOption: SortOption): Product[] => {
  const sortedProducts = [...products];
  
  switch (sortOption) {
    case 'price-asc':
      return sortedProducts.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sortedProducts.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
    case 'newest':
      // Aquí normalmente usaríamos una fecha de creación, pero como no tenemos esa propiedad
      // lo dejamos igual al orden original (asumiendo que los más nuevos están primero)
      return sortedProducts;
    default:
      return sortedProducts;
  }
};