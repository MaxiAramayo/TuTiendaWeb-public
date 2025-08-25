/**
 * Servicio para la gestión de categorías de productos
 * 
 * Maneja todas las operaciones CRUD de categorías con Firebase Firestore,
 * implementando la nueva estructura multi-tenant donde las categorías
 * son documentos independientes en /stores/{storeId}/categories/{categoryId}
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Category } from '@/shared/types/firebase.types';
import { generateSlug } from '../utils/product.utils';

/**
 * Datos para crear una categoría
 */
export interface CreateCategoryData {
  /** Nombre de la categoría */
  name: string;
  /** ID de la categoría padre (opcional) */
  parentId?: string;
}

/**
 * Datos para actualizar una categoría
 */
export interface UpdateCategoryData {
  /** ID de la categoría */
  id: string;
  /** Nombre de la categoría */
  name?: string;
  /** ID de la categoría padre (opcional) */
  parentId?: string;
  /** Si está activa */
  isActive?: boolean;
}

/**
 * Servicio de categorías
 */
export class CategoriesService {
  /**
   * Obtiene la referencia de la colección de categorías
   */
  private getCategoriesCollection(storeId: string) {
    return collection(db, 'stores', storeId, 'categories');
  }

  /**
   * Crea una nueva categoría
   */
  async createCategory(storeId: string, data: CreateCategoryData): Promise<Category> {
    try {
      const categoriesRef = this.getCategoriesCollection(storeId);
      const slug = generateSlug(data.name);
      
      const categoryData = {
        storeId,
        name: data.name.trim(),
        slug,
        parentId: data.parentId || null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(categoriesRef, categoryData);
      
      return {
        id: docRef.id,
        ...categoryData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Category;
    } catch (error) {
      throw new Error('Error al crear la categoría');
    }
  }

  /**
   * Obtiene todas las categorías de una tienda
   */
  async getCategories(storeId: string): Promise<Category[]> {
    try {
      const categoriesRef = this.getCategoriesCollection(storeId);
      const q = query(
        categoriesRef,
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
    } catch (error) {
      throw new Error('Error al obtener las categorías');
    }
  }

  /**
   * Obtiene una categoría por ID
   */
  async getCategoryById(storeId: string, categoryId: string): Promise<Category | null> {
    try {
      const categoryRef = doc(db, 'stores', storeId, 'categories', categoryId);
      const snapshot = await getDoc(categoryRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Category;
    } catch (error) {
      throw new Error('Error al obtener la categoría');
    }
  }

  /**
   * Actualiza una categoría
   */
  async updateCategory(storeId: string, data: UpdateCategoryData): Promise<Category> {
    try {
      const categoryRef = doc(db, 'stores', storeId, 'categories', data.id);
      
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      
      if (data.name !== undefined) {
        updateData.name = data.name.trim();
        updateData.slug = generateSlug(data.name);
      }
      
      if (data.parentId !== undefined) {
        updateData.parentId = data.parentId;
      }
      
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }
      
      await updateDoc(categoryRef, updateData);
      
      // Obtener la categoría actualizada
      const updatedCategory = await this.getCategoryById(storeId, data.id);
      if (!updatedCategory) {
        throw new Error('Categoría no encontrada después de la actualización');
      }
      
      return updatedCategory;
    } catch (error) {
      throw new Error('Error al actualizar la categoría');
    }
  }

  /**
   * Elimina una categoría (soft delete)
   */
  async deleteCategory(storeId: string, categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(db, 'stores', storeId, 'categories', categoryId);
      
      await updateDoc(categoryRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw new Error('Error al eliminar la categoría');
    }
  }

  /**
   * Verifica si una categoría existe por nombre
   */
  async categoryExistsByName(storeId: string, name: string, excludeId?: string): Promise<boolean> {
    try {
      const categoriesRef = this.getCategoriesCollection(storeId);
      const q = query(
        categoriesRef,
        where('name', '==', name.trim()),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(q);
      
      if (excludeId) {
        return snapshot.docs.some(doc => doc.id !== excludeId);
      }
      
      return !snapshot.empty;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica si hay productos usando una categoría específica
   */
  async hasProductsInCategory(storeId: string, categoryId: string): Promise<{ hasProducts: boolean; count: number }> {
    try {
      const productsRef = collection(db, 'stores', storeId, 'products');
      const q = query(
        productsRef,
        where('categoryId', '==', categoryId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      
      return {
        hasProducts: !snapshot.empty,
        count: snapshot.size
      };
    } catch (error) {
      console.error('Error checking products in category:', error);
      return { hasProducts: false, count: 0 };
    }
  }

  /**
   * Elimina una categoría completamente (hard delete) - solo si no tiene productos
   */
  async hardDeleteCategory(storeId: string, categoryId: string): Promise<void> {
    try {
      // Primero verificar si hay productos en la categoría
      const { hasProducts, count } = await this.hasProductsInCategory(storeId, categoryId);
      
      if (hasProducts) {
        throw new Error(`No se puede eliminar la categoría porque tiene ${count} producto(s) asociado(s). Primero mueve o elimina los productos.`);
      }
      
      const categoryRef = doc(db, 'stores', storeId, 'categories', categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      throw error; // Re-throw para mantener el mensaje específico
    }
  }
}

// Instancia singleton del servicio
export const categoriesService = new CategoriesService();