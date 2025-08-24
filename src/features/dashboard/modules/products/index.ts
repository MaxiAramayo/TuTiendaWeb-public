/**
 * Punto de entrada principal del módulo de productos
 *
 * Exporta todos los componentes, hooks, servicios, tipos,
 * utilidades y validaciones del módulo de productos.
 *
 * @module features/dashboard/modules/products
 */

// Componentes principales
export { default as ProductsMain } from "./components/ProductsMain";
export { default as ProductGrid } from "./components/ProductGrid";
export { default as ProductCard } from "./components/ProductCard";
export { default as ProductViewToggle } from "./components/ProductViewToggle";

// Formularios
export { default as ProductForm } from "./forms/ProductForm";

// Hooks
export { useProducts, useProduct } from "./hooks/useProducts";

// Store con persistencia
export { useProductsStore } from "./stores/productsStore";

// Servicios
export * from "./api/products.service";

// Store - Removido: se usa el hook useProducts en su lugar

// Tipos
export type {
  Product,
  ProductVariant,
  // ProductImage eliminado - estructura simplificada
  // CategoryDocument, TagDocument, ProductSettingsDocument eliminados - estructura simplificada
  PaginationOptions,
  ProductFilters,
  ProductsPage,
  CreateProductData,
  UpdateProductData,
  CreateCategoryData,
  UpdateCategoryData,
  // CreateTagData, UpdateTagData eliminados - estructura simplificada
  ProductViewType,
  ProductViewConfig,
  ProductStats,
  ProductSearchResult,
  // ExportConfig, ImportResult, ImportDetail eliminados - estructura simplificada
} from "./types/product.types";

// Utilidades
export {
  generateSlug,
  formatPrice,
  calculateDiscountPercentage,
  getProductStatusLabel,
  getProductStatusColor,
  filterProductsBySearch,
  sortProducts,
  getProductMainImage,
  generateProductSummary,
} from "./utils/product.utils";

// Validaciones centralizadas
export {
  validateProductData,
  validateImageDimensions,
} from "@shared/validations";

// Validaciones
export {
  createProductSchema,
  updateProductSchema,
  // categorySchema y tagSchema eliminados - estructura simplificada
  productFiltersSchema,
  paginationOptionsSchema,
  productSearchSchema,
  productImportSchema,
  productExportSchema,
  validateProduct,
  // validateCategory y validateTag eliminados - estructura simplificada
  validateFilters,
} from "./validations/product.validations";
export type {
  CreateProductInput,
  UpdateProductInput,
  // CategoryInput y TagInput eliminados - estructura simplificada
  ProductFiltersInput,
  PaginationOptionsInput,
  ProductSearchInput,
  ProductImportInput,
  ProductExportInput,
} from "./validations/product.validations";

/**
 * Configuración por defecto del módulo
 */
export const PRODUCTS_CONFIG = {
  // Paginación
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Límites
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_VARIANTS_PER_PRODUCT: 100,
  MAX_TAGS_PER_PRODUCT: 20,
  MAX_KEYWORDS_PER_PRODUCT: 10,

  // Tamaños de archivo
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],

  // Dimensiones de imagen
  MIN_IMAGE_WIDTH: 100,
  MIN_IMAGE_HEIGHT: 100,
  RECOMMENDED_IMAGE_WIDTH: 800,
  RECOMMENDED_IMAGE_HEIGHT: 800,

  // Texto
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_SHORT_DESCRIPTION_LENGTH: 160,
  MAX_SEO_TITLE_LENGTH: 60,
  MAX_SEO_DESCRIPTION_LENGTH: 160,

  // Precios
  MIN_PRICE: 0,
  MAX_PRICE: 999999.99,



  // Estados
  PRODUCT_STATUSES: ["active", "inactive", "draft"] as const,

  // Ordenamiento
  SORT_OPTIONS: [
    { value: "name", label: "Nombre" },
    { value: "price", label: "Precio" },
    { value: "createdAt", label: "Fecha de creación" },
    { value: "updatedAt", label: "Última actualización" },

  ],

  // Vistas
  VIEW_TYPES: ["grid", "list"] as const,

  // Exportación
  EXPORT_FORMATS: ["csv", "xlsx", "json"] as const,

  // Cache
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos

  // Búsqueda
  MIN_SEARCH_LENGTH: 1,
  MAX_SEARCH_LENGTH: 100,
  SEARCH_DEBOUNCE_MS: 300,
} as const;

/**
 * Mensajes de error comunes
 */
export const PRODUCTS_ERRORS = {
  PRODUCT_NOT_FOUND: "Producto no encontrado",
  INVALID_PRODUCT_DATA: "Datos de producto inválidos",

  CATEGORY_NOT_FOUND: "Categoría no encontrada",
  TAG_NOT_FOUND: "Etiqueta no encontrada",
  IMAGE_UPLOAD_FAILED: "Error al subir la imagen",
  INVALID_IMAGE_FORMAT: "Formato de imagen no válido",
  IMAGE_TOO_LARGE: "La imagen es demasiado grande",
  INSUFFICIENT_PERMISSIONS: "Permisos insuficientes",
  NETWORK_ERROR: "Error de conexión",
  VALIDATION_ERROR: "Error de validación",
  
  INVALID_PRICE_RANGE: "Rango de precios inválido",
  EXPORT_FAILED: "Error al exportar productos",
  IMPORT_FAILED: "Error al importar productos",
} as const;

/**
 * Mensajes de éxito
 */
export const PRODUCTS_SUCCESS = {
  PRODUCT_CREATED: "Producto creado exitosamente",
  PRODUCT_UPDATED: "Producto actualizado exitosamente",
  PRODUCT_DELETED: "Producto eliminado exitosamente",
  PRODUCT_DUPLICATED: "Producto duplicado exitosamente",
  PRODUCTS_EXPORTED: "Productos exportados exitosamente",
  PRODUCTS_IMPORTED: "Productos importados exitosamente",
  IMAGE_UPLOADED: "Imagen subida exitosamente",
  STATUS_UPDATED: "Estado actualizado exitosamente",
  
} as const;

/**
 * Rutas del módulo
 */
export const PRODUCTS_ROUTES = {
  LIST: "/dashboard/products",
  CREATE: "/dashboard/products/create",
  EDIT: (id: string) => `/dashboard/products/${id}/edit`,
  VIEW: (id: string) => `/dashboard/products/${id}`,
  CATEGORIES: "/dashboard/products/categories",
  TAGS: "/dashboard/products/tags",
  IMPORT: "/dashboard/products/import",
  EXPORT: "/dashboard/products/export",
} as const;
