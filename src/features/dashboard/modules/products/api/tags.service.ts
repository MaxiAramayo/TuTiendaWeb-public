/**
 * Servicio para la gestión de tags/etiquetas de productos
 * 
 * Maneja todas las operaciones CRUD de tags con Firebase Firestore,
 * implementando la nueva estructura multi-tenant donde los tags
 * son documentos independientes en /stores/{storeId}/tags/{tagId}
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
import { Tag } from '@/shared/types/firebase.types';
import { generateSlug } from '../utils/product.utils';

/**
 * Datos para crear un tag
 */
export interface CreateTagData {
  /** Nombre del tag */
  name: string;
}

/**
 * Datos para actualizar un tag
 */
export interface UpdateTagData {
  /** ID del tag */
  id: string;
  /** Nombre del tag */
  name?: string;
}

/**
 * Servicio de tags
 */
export class TagsService {
  /**
   * Obtiene la referencia de la colección de tags
   */
  private getTagsCollection(storeId: string) {
    return collection(db, 'stores', storeId, 'tags');
  }

  /**
   * Crea un nuevo tag
   */
  async createTag(storeId: string, data: CreateTagData): Promise<Tag> {
    try {
      const tagsRef = this.getTagsCollection(storeId);
      const slug = generateSlug(data.name);
      
      const tagData = {
        storeId,
        name: data.name.trim(),
        slug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(tagsRef, tagData);
      
      return {
        id: docRef.id,
        ...tagData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Tag;
    } catch (error) {
      throw new Error('Error al crear el tag');
    }
  }

  /**
   * Obtiene todos los tags de una tienda
   */
  async getTags(storeId: string): Promise<Tag[]> {
    try {
      const tagsRef = this.getTagsCollection(storeId);
      const q = query(
        tagsRef,
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tag[];
    } catch (error) {
      throw new Error('Error al obtener los tags');
    }
  }

  /**
   * Obtiene un tag por ID
   */
  async getTagById(storeId: string, tagId: string): Promise<Tag | null> {
    try {
      const tagRef = doc(db, 'stores', storeId, 'tags', tagId);
      const snapshot = await getDoc(tagRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Tag;
    } catch (error) {
      throw new Error('Error al obtener el tag');
    }
  }

  /**
   * Obtiene múltiples tags por sus IDs
   */
  async getTagsByIds(storeId: string, tagIds: string[]): Promise<Tag[]> {
    try {
      if (tagIds.length === 0) {
        return [];
      }

      const tags: Tag[] = [];
      
      // Obtener tags uno por uno para evitar problemas con consultas complejas
      for (const tagId of tagIds) {
        try {
          const tag = await this.getTagById(storeId, tagId);
          if (tag) {
            tags.push(tag);
          }
        } catch (error) {
          // Continuar con el siguiente tag si uno falla
          console.warn(`Error al obtener tag ${tagId}:`, error);
        }
      }
      
      return tags;
    } catch (error) {
      throw new Error('Error al obtener los tags');
    }
  }

  /**
   * Actualiza un tag
   */
  async updateTag(storeId: string, data: UpdateTagData): Promise<Tag> {
    try {
      const tagRef = doc(db, 'stores', storeId, 'tags', data.id);
      
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      
      if (data.name !== undefined) {
        updateData.name = data.name.trim();
        updateData.slug = generateSlug(data.name);
      }
      
      await updateDoc(tagRef, updateData);
      
      // Obtener el tag actualizado
      const updatedTag = await this.getTagById(storeId, data.id);
      if (!updatedTag) {
        throw new Error('Tag no encontrado después de la actualización');
      }
      
      return updatedTag;
    } catch (error) {
      throw new Error('Error al actualizar el tag');
    }
  }

  /**
   * Elimina un tag
   */
  async deleteTag(storeId: string, tagId: string): Promise<void> {
    try {
      const tagRef = doc(db, 'stores', storeId, 'tags', tagId);
      await deleteDoc(tagRef);
    } catch (error) {
      throw new Error('Error al eliminar el tag');
    }
  }

  /**
   * Verifica si un tag existe por nombre
   */
  async tagExistsByName(storeId: string, name: string, excludeId?: string): Promise<boolean> {
    try {
      const tagsRef = this.getTagsCollection(storeId);
      const q = query(
        tagsRef,
        where('name', '==', name.trim())
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
   * Busca tags por nombre (para autocompletado)
   */
  async searchTags(storeId: string, searchTerm: string, limit: number = 10): Promise<Tag[]> {
    try {
      const tagsRef = this.getTagsCollection(storeId);
      
      // Búsqueda simple por prefijo
      const q = query(
        tagsRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs
        .slice(0, limit)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Tag[];
    } catch (error) {
      throw new Error('Error al buscar tags');
    }
  }
}

// Instancia singleton del servicio
export const tagsService = new TagsService();