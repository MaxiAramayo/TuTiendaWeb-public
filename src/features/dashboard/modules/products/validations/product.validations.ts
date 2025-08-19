/**
 * Validaciones para productos de restaurante usando Zod
 * 
 * Define esquemas de validación simplificados para productos de restaurante,
 * categorías y operaciones relacionadas según especificación del usuario.
 * 
 * @module features/dashboard/modules/products/validations
 */

import { z } from 'zod';

/**
 * Esquema base para productos de restaurante
 * Estructura simplificada según especificación del usuario
 */
const baseProductSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  
  description: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(5000, 'La descripción no puede exceder 5000 caracteres')
    .optional(),
  
  price: z.number()
    .min(0, 'El precio debe ser mayor o igual a 0')
    .max(999999.99, 'El precio no puede exceder 999,999.99'),
  
  categoryId: z.string().min(1, 'La categoría es requerida'),
  
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Estado inválido' })
  }).default('active')
});

/**
 * Esquema para crear producto de restaurante
 * Estructura simplificada según especificación del usuario
 */
export const createProductSchema = baseProductSchema;

/**
 * Esquema para actualizar producto de restaurante
 * Estructura simplificada según especificación del usuario
 */
export const updateProductSchema = baseProductSchema.partial();

// Esquemas de categorías y tags eliminados - estructura simplificada para restaurantes

/**
 * Esquema para filtros de productos de restaurante
 * Estructura simplificada según especificación del usuario
 */
export const productFiltersSchema = z.object({
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  categoryId: z.string().optional(),
  priceRange: z.object({
    min: z.number().min(0, 'El precio mínimo debe ser mayor o igual a 0').optional(),
    max: z.number().min(0, 'El precio máximo debe ser mayor o igual a 0').optional()
  }).optional()
}).refine(
  (data) => {
    // Validar que el precio máximo sea mayor al mínimo
    if (data.priceRange?.min !== undefined && data.priceRange?.max !== undefined) {
      return data.priceRange.max >= data.priceRange.min;
    }
    return true;
  },
  {
    message: 'El precio máximo debe ser mayor o igual al precio mínimo',
    path: ['priceRange', 'max']
  }
);

/**
 * Esquema para opciones de paginación de productos de restaurante
 * Estructura simplificada según especificación del usuario
 */
export const paginationOptionsSchema = z.object({
  limit: z.number()
    .int('El límite debe ser un número entero')
    .min(1, 'El límite debe ser mayor a 0')
    .max(100, 'El límite no puede exceder 100')
    .default(20),
  
  orderBy: z.enum(['name', 'price', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  
  orderDirection: z.enum(['asc', 'desc'])
    .default('desc'),
  
  startAfter: z.any().optional() // DocumentSnapshot de Firestore
});

/**
 * Esquema para búsqueda de productos
 */
export const productSearchSchema = z.object({
  query: z.string()
    .min(1, 'La consulta de búsqueda es requerida')
    .max(100, 'La consulta no puede exceder 100 caracteres'),
  
  filters: productFiltersSchema.optional(),
  
  pagination: paginationOptionsSchema.optional()
});

/**
 * Esquema para importación de productos
 */
export const productImportSchema = z.object({
  file: z.instanceof(File, { message: 'Archivo requerido' }),
  
  options: z.object({
    skipFirstRow: z.boolean().default(true),
    updateExisting: z.boolean().default(false),
    validateOnly: z.boolean().default(false)
  }).optional()
});

/**
 * Esquema para exportación de productos de restaurante
 * Estructura simplificada según especificación del usuario
 */
export const productExportSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json'], {
    errorMap: () => ({ message: 'Formato de exportación inválido' })
  }),
  
  filters: productFiltersSchema.optional(),
  
  fields: z.array(z.string()).optional(),
  
  includeImages: z.boolean().default(false)
});

/**
 * Tipos derivados de los esquemas simplificados
 */
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;
export type PaginationOptionsInput = z.infer<typeof paginationOptionsSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type ProductImportInput = z.infer<typeof productImportSchema>;
export type ProductExportInput = z.infer<typeof productExportSchema>;

/**
 * Función de validación rápida para productos
 */
export const validateProduct = (data: unknown, isUpdate = false) => {
  const schema = isUpdate ? updateProductSchema : createProductSchema;
  return schema.safeParse(data);
};

/**
 * Función de validación para filtros
 */
export const validateFilters = (data: unknown) => {
  return productFiltersSchema.safeParse(data);
};