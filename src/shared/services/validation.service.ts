/**
 * Servicio de Validación para Migración Firebase
 * 
 * Proporciona funcionalidades para validar la integridad de datos
 * antes, durante y después de la migración a la nueva estructura.
 * 
 * @module shared/services/validation
 */

import { Timestamp } from 'firebase/firestore';
import {
  Product,
  Category,
  Tag,
  StoreSettings,
  StoreMetadata
} from '@/shared/types/firebase.types';

/**
 * Tipos de validación locales
 */
export interface ValidationError {
  id: string;
  type: 'error' | 'critical';
  entity: string;
  entityId: string;
  field: string;
  message: string;
  value: any;
  suggestion: string;
}

export interface ValidationWarning {
  id: string;
  type: 'warning';
  entity: string;
  entityId: string;
  field: string;
  message: string;
  value: any;
  suggestion: string;
}

// Tipos de validación básicos removidos - funcionalidad de migración eliminada

/**
 * Interfaz para opciones de validación
 */
export interface ValidationOptions {
  strict?: boolean; // Modo estricto con validaciones adicionales
  skipWarnings?: boolean; // Omitir advertencias no críticas
  validateReferences?: boolean; // Validar referencias entre entidades
  maxErrors?: number; // Máximo número de errores antes de parar
}

/**
 * Interfaz para resultado de validación detallado
 */
export interface DetailedValidationResult {
  isValid: boolean;
  summary: {
    totalItems: number;
    validItems: number;
    invalidItems: number;
    warningItems: number;
  };
  errors: ValidationError[];
  warnings: ValidationWarning[];
  performance: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

/**
 * Interfaz para validación de referencias
 */
export interface ReferenceValidationResult {
  missingCategories: string[];
  missingTags: string[];
  orphanedProducts: string[];
  circularReferences: string[];
}

/**
 * Servicio de Validación
 */
export class ValidationService {
  private static instance: ValidationService;
  private readonly DEFAULT_MAX_ERRORS = 100;

  private constructor() {}

  public static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }





  /**
   * Valida datos migrados en la nueva estructura
   */
  public async validateMigratedData(
    data: {
      products: Product[];
      categories: Category[];
      tags: Tag[];
      settings: StoreSettings;
      metadata: StoreMetadata;
    },
    options: ValidationOptions = {}
  ): Promise<DetailedValidationResult> {
    const startTime = Date.now();
    console.log('🔍 Iniciando validación de datos migrados...');

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Validar productos migrados
      const productValidation = await this.validateMigratedProducts(
        data.products,
        data.categories,
        data.tags,
        options
      );
      errors.push(...productValidation.errors);
      warnings.push(...productValidation.warnings);

      // Validar categorías migradas
      const categoryValidation = await this.validateMigratedCategories(
        data.categories,
        options
      );
      errors.push(...categoryValidation.errors);
      warnings.push(...categoryValidation.warnings);

      // Validar tags migrados
      const tagValidation = await this.validateMigratedTags(
        data.tags,
        options
      );
      errors.push(...tagValidation.errors);
      warnings.push(...tagValidation.warnings);

      // Validar configuraciones migradas
      const settingsValidation = await this.validateMigratedSettings(
        data.settings,
        options
      );
      errors.push(...settingsValidation.errors);
      warnings.push(...settingsValidation.warnings);

      // Validar metadatos
      const metadataValidation = await this.validateStoreMetadata(
        data.metadata,
        options
      );
      errors.push(...metadataValidation.errors);
      warnings.push(...metadataValidation.warnings);

      const endTime = Date.now();
      const totalItems = data.products.length + data.categories.length + data.tags.length + 2; // +2 for settings and metadata

      const result: DetailedValidationResult = {
        isValid: errors.length === 0,
        summary: {
          totalItems,
          validItems: totalItems - errors.length,
          invalidItems: errors.length,
          warningItems: warnings.length
        },
        errors,
        warnings: options.skipWarnings ? [] : warnings,
        performance: {
          startTime,
          endTime,
          duration: endTime - startTime
        }
      };

      console.log(`✅ Validación de datos migrados completada en ${result.performance.duration}ms`);
      
      return result;

    } catch (error) {
      console.error('❌ Error durante validación de datos migrados:', error);
      
      return {
        isValid: false,
        summary: {
          totalItems: 0,
          validItems: 0,
          invalidItems: 1,
          warningItems: 0
        },
        errors: [{
          id: 'migrated_validation_error',
          type: 'critical',
          entity: 'validation',
          entityId: 'system',
          field: 'system',
          message: `Error crítico validando datos migrados: ${error}`,
          value: null,
          suggestion: 'Revisar proceso de migración'
        }],
        warnings: [],
        performance: {
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Valida productos migrados
   */
  private async validateMigratedProducts(
    products: Product[],
    categories: Category[],
    tags: Tag[],
    options: ValidationOptions
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    const categoryIds = new Set(categories.map(c => c.id));
    const tagIds = new Set(tags.map(t => t.id));

    for (const product of products) {
      // TODO: Implementar validación básica de productos
      // const basicErrors = validateProduct(product);
      // basicErrors.forEach((errorMsg: string) => {
      //   errors.push({
      //     id: `migrated_product_${product.id}_error`,
      //     type: 'error',
      //     entity: 'product',
      //     entityId: product.id,
      //     field: this.extractFieldFromError(errorMsg),
      //     message: errorMsg,
      //     value: this.extractValueFromProduct(product, errorMsg),
      //     suggestion: this.getSuggestionForProductError(errorMsg)
      //   });
      // });

      // Validar referencias
      if (!categoryIds.has(product.categoryId)) {
        errors.push({
          id: `migrated_product_${product.id}_category_ref`,
          type: 'error',
          entity: 'product',
          entityId: product.id,
          field: 'categoryId',
          message: `Referencia a categoría inválida: ${product.categoryId}`,
          value: product.categoryId,
          suggestion: 'Verificar que la categoría existe o asignar categoría válida'
        });
      }

      // Validar tags
      if (product.tags) {
        for (const tagId of product.tags) {
          if (!tagIds.has(tagId)) {
            errors.push({
              id: `migrated_product_${product.id}_tag_ref_${tagId}`,
              type: 'error',
              entity: 'product',
              entityId: product.id,
              field: 'tags',
              message: `Referencia a tag inválida: ${tagId}`,
              value: tagId,
              suggestion: 'Verificar que el tag existe o remover referencia'
            });
          }
        }
      }

      // Validar campos específicos de la nueva estructura
      if (!product.slug || product.slug.trim() === '') {
        warnings.push({
          id: `migrated_product_${product.id}_slug`,
          type: 'warning',
          entity: 'product',
          entityId: product.id,
          field: 'slug',
          message: 'Producto sin slug URL-friendly',
          value: product.slug,
          suggestion: 'Generar slug basado en el nombre del producto'
        });
      }

      if (!product.storeId || product.storeId.trim() === '') {
        errors.push({
          id: `migrated_product_${product.id}_store_id`,
          type: 'error',
          entity: 'product',
          entityId: product.id,
          field: 'storeId',
          message: 'Producto sin storeId asignado',
          value: product.storeId,
          suggestion: 'Asignar storeId válido al producto'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Valida categorías migradas
   */
  private async validateMigratedCategories(
    categories: Category[],
    options: ValidationOptions
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const category of categories) {
      // TODO: Implementar validación básica de categorías
      // const basicErrors = validateCategory(category);
      // basicErrors.forEach((errorMsg: string) => {
      //   errors.push({
      //     id: `migrated_category_${category.id}_error`,
      //     type: 'error',
      //     entity: 'category',
      //     entityId: category.id,
      //     field: this.extractFieldFromError(errorMsg),
      //     message: errorMsg,
      //     value: this.extractValueFromCategory(category, errorMsg),
      //     suggestion: this.getSuggestionForCategoryError(errorMsg)
      //   });
      // });

      // Validar campos específicos
      if (!category.slug || category.slug.trim() === '') {
        warnings.push({
          id: `migrated_category_${category.id}_slug`,
          type: 'warning',
          entity: 'category',
          entityId: category.id,
          field: 'slug',
          message: 'Categoría sin slug URL-friendly',
          value: category.slug,
          suggestion: 'Generar slug basado en el nombre de la categoría'
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Valida tags migrados
   */
  private async validateMigratedTags(
    tags: Tag[],
    options: ValidationOptions
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const tag of tags) {
      // TODO: Implementar validación básica de tags
      // const basicErrors = validateTag(tag);
      // basicErrors.forEach((errorMsg: string) => {
      //   errors.push({
      //     id: `migrated_tag_${tag.id}_error`,
      //     type: 'error',
      //     entity: 'tag',
      //     entityId: tag.id,
      //     field: this.extractFieldFromError(errorMsg),
      //     message: errorMsg,
      //     value: tag.name,
      //     suggestion: 'Verificar datos del tag'
      //   });
      // });
    }

    return { errors, warnings };
  }

  /**
   * Valida configuraciones migradas
   */
  private async validateMigratedSettings(
    settings: StoreSettings,
    options: ValidationOptions
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validar estructura de productos
    if (!settings.products) {
      errors.push({
        id: 'migrated_settings_products_missing',
        type: 'error',
        entity: 'settings',
        entityId: 'products',
        field: 'products',
        message: 'Configuración de productos faltante',
        value: null,
        suggestion: 'Agregar configuración de productos con valores por defecto'
      });
    }

    // Validar estructura de comercio
    if (!settings.commerce) {
      errors.push({
        id: 'migrated_settings_commerce_missing',
        type: 'error',
        entity: 'settings',
        entityId: 'commerce',
        field: 'commerce',
        message: 'Configuración de comercio faltante',
        value: null,
        suggestion: 'Agregar configuración de comercio con valores por defecto'
      });
    }

    return { errors, warnings };
  }

  /**
   * Valida metadatos de tienda
   */
  private async validateStoreMetadata(
    metadata: StoreMetadata,
    options: ValidationOptions
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!metadata.name || metadata.name.trim() === '') {
      errors.push({
        id: 'migrated_metadata_name_missing',
        type: 'error',
        entity: 'metadata',
        entityId: 'name',
        field: 'name',
        message: 'Nombre de tienda faltante',
        value: metadata.name,
        suggestion: 'Establecer nombre válido para la tienda'
      });
    }

    if (!metadata.ownerId || metadata.ownerId.trim() === '') {
      errors.push({
        id: 'migrated_metadata_owner_missing',
        type: 'error',
        entity: 'metadata',
        entityId: 'ownerId',
        field: 'ownerId',
        message: 'ID de propietario faltante',
        value: metadata.ownerId,
        suggestion: 'Asignar UID válido del propietario'
      });
    }

    return { errors, warnings };
  }

  // Métodos auxiliares para extraer información de errores
  private extractFieldFromError(errorMsg: string): string {
    if (errorMsg.includes('Nombre')) return 'name';
    if (errorMsg.includes('Precio')) return 'price';
    if (errorMsg.includes('Estado')) return 'status';
    if (errorMsg.includes('ID de tienda')) return 'storeId';
    return 'unknown';
  }

  private extractValueFromProduct(product: any, errorMsg: string): any {
    const field = this.extractFieldFromError(errorMsg);
    return product[field] || null;
  }

  private extractValueFromCategory(category: any, errorMsg: string): any {
    const field = this.extractFieldFromError(errorMsg);
    return category[field] || null;
  }

  private getSuggestionForProductError(errorMsg: string): string {
    if (errorMsg.includes('Nombre')) return 'Proporcionar nombre válido para el producto';
    if (errorMsg.includes('Precio')) return 'Establecer precio mayor a 0';
    if (errorMsg.includes('Estado')) return 'Usar estado válido: active, inactive o draft';
    return 'Verificar datos del producto';
  }

  private getSuggestionForCategoryError(errorMsg: string): string {
    if (errorMsg.includes('Nombre')) return 'Proporcionar nombre válido para la categoría';
    if (errorMsg.includes('ID de tienda')) return 'Asignar storeId válido';
    return 'Verificar datos de la categoría';
  }



  private convertReferenceErrorsToValidationErrors(
    referenceResult: ReferenceValidationResult
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    referenceResult.missingCategories.forEach(categoryId => {
      errors.push({
        id: `reference_missing_category_${categoryId}`,
        type: 'error',
        entity: 'reference',
        entityId: categoryId,
        field: 'categoryId',
        message: `Categoría referenciada no existe: ${categoryId}`,
        value: categoryId,
        suggestion: 'Crear la categoría o actualizar referencias'
      });
    });

    referenceResult.orphanedProducts.forEach(productId => {
      errors.push({
        id: `reference_orphaned_product_${productId}`,
        type: 'error',
        entity: 'reference',
        entityId: productId,
        field: 'categoryId',
        message: `Producto huérfano sin categoría válida: ${productId}`,
        value: productId,
        suggestion: 'Asignar categoría válida al producto'
      });
    });

    return errors;
  }
}

// Exportar instancia singleton
export const validationService = ValidationService.getInstance();