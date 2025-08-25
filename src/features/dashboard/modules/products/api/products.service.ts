/**
 * Servicio principal para la gestión de productos de restaurante
 * 
 * Maneja todas las operaciones CRUD de productos con Firebase Firestore,
 * optimizado para el sector gastronómico con funcionalidades específicas
 * como horarios de disponibilidad, extras y variantes.
 * 
 * @module features/dashboard/modules/products/api
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';
import {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  PaginationOptions,
  ProductStats,
  ProductsPage,
  ProductSearchResult
} from '../types/product.types';

/**
 * Clase de servicio para operaciones de productos
 */
export class ProductsService {
  private readonly COLLECTION_NAME = 'products';
  private readonly STORAGE_PATH = 'products';

  /**
   * Obtiene la referencia de la colección de productos de una tienda
   */
  private getProductsCollection(storeId: string) {
    return collection(db, 'stores', storeId, this.COLLECTION_NAME);
  }

  /**
   * Obtiene la referencia de un documento de producto
   */
  private getProductDoc(storeId: string, productId: string) {
    return doc(db, 'stores', storeId, this.COLLECTION_NAME, productId);
  }

  /**
   * Crea un nuevo producto de restaurante
   * Estructura simplificada según especificación del usuario
   * @param storeId - ID de la tienda
   * @param data - Datos del producto a crear
   * @returns Promise con el ID del producto creado
   */
  async createProduct(storeId: string, data: CreateProductData): Promise<string> {
    try {
      const now = Timestamp.now();
      
      // Subir imágenes si existen
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        imageUrls = await this.uploadProductImages(storeId, data.images);
      }
      
      const productData: Omit<Product, 'id'> = {
        storeId,
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        shortDescription: data.shortDescription?.trim() || undefined,
        description: data.description,
        price: data.price,
        costPrice: data.costPrice || 0,
        currency: 'ARS',
        categoryId: data.categoryId || '',
        imageUrls: imageUrls,
        status: data.status || 'active',
        tags: data.tags || [],
        variants: data.variants || [],
        hasPromotion: data.hasPromotion || false,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(this.getProductsCollection(storeId), productData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  /**
   * Actualiza un producto de restaurante existente
   * Estructura simplificada según especificación del usuario
   * @param storeId - ID de la tienda
   * @param productId - ID del producto a actualizar
   * @param data - Datos a actualizar
   */
  async updateProduct(storeId: string, productId: string, data: UpdateProductData): Promise<void> {
    try {
      const productRef = this.getProductDoc(storeId, productId);
      const now = Timestamp.now();
      
      // Preparar datos de actualización
      const updateData: Partial<Product> = {
        updatedAt: now
      };
      
      // Copiar todas las propiedades válidas de data
      if (data.name !== undefined) updateData.name = data.name;
      if (data.shortDescription !== undefined) {
        updateData.shortDescription = data.shortDescription.trim() || undefined;
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.variants !== undefined) updateData.variants = data.variants;
      if (data.hasPromotion !== undefined) updateData.hasPromotion = data.hasPromotion;
      
      // Manejar imágenes - combinar existentes con nuevas
      if (data.images && Array.isArray(data.images)) {
        const imageUrls: string[] = [];
        
        // Separar URLs existentes de archivos nuevos
        for (const image of data.images) {
          if (typeof image === 'string') {
            // Es una URL existente
            imageUrls.push(image);
          } else if (image instanceof File) {
            // Es un archivo nuevo, subirlo
            const uploadedUrls = await this.uploadProductImages(storeId, [image]);
            imageUrls.push(...uploadedUrls);
          }
        }
        
        updateData.imageUrls = imageUrls;
      }
      
      await updateDoc(productRef, updateData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  /**
   * Elimina un producto
   */
  async deleteProduct(storeId: string, productId: string): Promise<void> {
    try {
      // Obtener el producto para eliminar su imagen
      const product = await this.getProduct(storeId, productId);
      
      if (product && product.imageUrls && product.imageUrls.length > 0) {
        // Eliminar imágenes del storage
        await this.deleteProductImagesByUrls(storeId, product.imageUrls);
      }
      
      // Eliminar el documento
      const productRef = this.getProductDoc(storeId, productId);
      await deleteDoc(productRef);
    } catch (error) {
      throw new Error('Failed to delete product');
    }
  }

  /**
   * Obtiene un producto por ID
   */
  async getProduct(storeId: string, productId: string): Promise<Product | null> {
    try {
      const productRef = this.getProductDoc(storeId, productId);
      const docSnap = await getDoc(productRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Product;
      }
      
      return null;
    } catch (error) {
      throw new Error('Failed to get product');
    }
  }

  /**
   * Obtiene productos de restaurante con paginación y filtros
   * @param storeId - ID de la tienda
   * @param options - Opciones de paginación y filtros
   * @returns Página de productos con información de paginación
   */
  async getProducts(storeId: string, options: Partial<PaginationOptions> = {}): Promise<ProductsPage> {
    try {
      const {
        limit: limitCount = 10,
        orderBy: orderByField = 'createdAt',
        direction = 'desc',
        startAfter: startAfterDoc,
        filters = {}
      } = options;
      
      let q = query(this.getProductsCollection(storeId));
      
      // Aplicar filtros
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      if (filters.categoryId) {
        q = query(q, where('categoryId', '==', filters.categoryId));
      }
      
      if (filters.searchQuery) {
        // Búsqueda simple por nombre
        const searchLower = filters.searchQuery.toLowerCase();
        q = query(q, where('name', '>=', searchLower), where('name', '<=', searchLower + '\uf8ff'));
      }
      
      if (filters.priceRange?.min !== undefined) {
        q = query(q, where('price', '>=', filters.priceRange.min));
      }
      
      if (filters.priceRange?.max !== undefined) {
        q = query(q, where('price', '<=', filters.priceRange.max));
      }
      
      // Aplicar ordenamiento
      q = query(q, orderBy(orderByField, direction));
      
      // Aplicar cursor de paginación si existe
      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }
      
      // Aplicar límite
      q = query(q, limit(limitCount));
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      const hasMore = products.length === limitCount;
      const lastDoc = products.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
      
      return {
        products,
        hasMore,
        lastDoc
      };
    } catch (error) {
      throw new Error('Failed to get products');
    }
  }

  /**
   * Busca productos por texto
   */
  async searchProducts(storeId: string, searchQuery: string, options?: Partial<PaginationOptions>): Promise<ProductSearchResult> {
    try {
      const startTime = Date.now();
      
      // Crear consulta de búsqueda
      let q = query(
        this.getProductsCollection(storeId),
        where('name', '>=', searchQuery.toLowerCase()),
        where('name', '<=', searchQuery.toLowerCase() + '\uf8ff'),
        orderBy('name'),
        limit(options?.limit || 20)
      );
      
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      const searchTime = Date.now() - startTime;
      
      return {
        products,
        total: products.length,
        hasMore: products.length === (options?.limit || 20),
        searchTime
      };
    } catch (error) {
      throw new Error('Failed to search products');
    }
  }

  /**
   * Obtiene estadísticas de productos
   */
  async getProductStats(storeId: string): Promise<ProductStats> {
    try {
      const productsRef = this.getProductsCollection(storeId);
      
      // Obtener todos los productos para calcular estadísticas
      const snapshot = await getDocs(productsRef);
      const products = snapshot.docs.map(doc => doc.data()) as Product[];
      
      const stats: ProductStats = {
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        inactiveProducts: products.filter(p => p.status === 'inactive').length,
        totalCategories: new Set(products.map(p => p.categoryId)).size
      };
      
      return stats;
    } catch (error) {
      throw new Error('Failed to get product stats');
    }
  }

  /**
   * Sube imágenes de producto a Firebase Storage
   * @param storeId - ID de la tienda
   * @param images - Archivos de imagen a subir
   * @returns Array de URLs de las imágenes subidas
   */
  private async uploadProductImages(storeId: string, images: File[]): Promise<string[]> {
    const uploadPromises = images.map(async (image, index) => {
      const fileName = `${Date.now()}_${index}_${image.name}`;
      const imagePath = `stores/${storeId}/products/${fileName}`;
      const imageRef = ref(storage, imagePath);
      
      await uploadBytes(imageRef, image);
      return await getDownloadURL(imageRef);
    });
    
    return Promise.all(uploadPromises);
  }

  /**
   * Elimina imágenes de producto del storage por URLs
   */
  private async deleteProductImagesByUrls(storeId: string, imageUrls: string[]): Promise<void> {
    for (const imageUrl of imageUrls) {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        // Continuar con las demás imágenes
      }
    }
  }

  /**
   * Elimina una imagen específica de un producto
   * @param storeId - ID de la tienda
   * @param productId - ID del producto
   * @param imageUrl - URL de la imagen a eliminar
   */
  async removeProductImage(storeId: string, productId: string, imageUrl: string): Promise<void> {
    try {
      // Obtener el producto actual
      const product = await this.getProduct(storeId, productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Eliminar la imagen del storage
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Error deleting image from storage:', error);
        // Continuar aunque falle la eliminación del storage
      }

      // Actualizar el producto removiendo la URL de la imagen
      const updatedImageUrls = product.imageUrls?.filter(url => url !== imageUrl) || [];
      
      const productRef = this.getProductDoc(storeId, productId);
      await updateDoc(productRef, {
        imageUrls: updatedImageUrls,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error removing product image:', error);
      throw new Error('Failed to remove product image');
    }
  }





  /**
   * Actualiza múltiples productos en lote
   */
  async bulkUpdateProducts(storeId: string, updates: { id: string; data: Partial<Product> }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      for (const update of updates) {
        const productRef = this.getProductDoc(storeId, update.id);
        batch.update(productRef, {
          ...update.data,
          updatedAt: Timestamp.now()
        });
      }
      
      await batch.commit();
    } catch (error) {
      throw new Error('Failed to bulk update products');
    }
  }

  /**
   * Verifica si existe un producto con el mismo nombre
   * @param storeId - ID de la tienda
   * @param productName - Nombre del producto a verificar
   * @param excludeProductId - ID del producto a excluir (para edición)
   * @returns Promise<boolean> - true si existe, false si no
   */
  async hasProductWithName(storeId: string, productName: string, excludeProductId?: string): Promise<boolean> {
    try {
      const productsRef = this.getProductsCollection(storeId);
      
      // Normalizar el nombre para comparación case-insensitive
      const normalizedName = productName.trim().toLowerCase();
      
      // Consulta simple sin orderBy para evitar errores de índice
      const q = query(
        productsRef,
        where('status', 'in', ['active', 'inactive']) // Excluir productos eliminados
      );
      
      const snapshot = await getDocs(q);
      
      // Verificar si algún producto tiene el mismo nombre (case-insensitive)
      const duplicates = snapshot.docs.filter(doc => {
        const product = doc.data() as Product;
        const productNormalizedName = product.name.trim().toLowerCase();
        
        // Si estamos editando, excluir el producto actual
        if (excludeProductId && doc.id === excludeProductId) {
          return false;
        }
        
        return productNormalizedName === normalizedName;
      });
      
      return duplicates.length > 0;
    } catch (error) {
      console.error('Error checking for duplicate product name:', error);
      throw new Error('Error al verificar nombre del producto');
    }
  }

  /**
   * Duplica un producto
   * Estructura simplificada según especificación del usuario
   */
  async duplicateProduct(storeId: string, productId: string): Promise<string> {
    try {
      const originalProduct = await this.getProduct(storeId, productId);
      
      if (!originalProduct) {
        throw new Error('Product not found');
      }
      
      const duplicateData: CreateProductData = {
        name: `${originalProduct.name} (Copia)`,
        description: originalProduct.description,
        categoryId: originalProduct.categoryId,
        price: originalProduct.price,
        // currency eliminado - no existe en ProductDocument
        status: 'active' // Siempre activo para restaurantes
      };
      
      return await this.createProduct(storeId, duplicateData);
    } catch (error) {
      throw new Error('Failed to duplicate product');
    }
  }
}

// Instancia singleton del servicio
export const productsService = new ProductsService();