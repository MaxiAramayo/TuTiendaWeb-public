/**
 * Servicio para gestión de tags de productos
 * 
 * @module features/store/api/tagsService
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  getFirestore
} from 'firebase/firestore';
import { ProductTag } from '@/shared/types/firebase.types';

/**
 * Servicio para operaciones CRUD de tags de productos
 */
export class TagsService {
  private static db = getFirestore();

  /**
   * Obtiene todos los tags de una tienda
   * @param storeId ID de la tienda
   * @returns Promise con array de ProductTag
   */
  static async getStoreTags(storeId: string): Promise<ProductTag[]> {
    try {
      const tagsRef = collection(this.db, 'stores', storeId, 'productTags');
      const q = query(tagsRef, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductTag[];
    } catch (error) {
      console.error('Error obteniendo tags de la tienda:', error);
      throw new Error('No se pudieron cargar los tags de la tienda');
    }
  }

  /**
   * Crea un nuevo tag
   * @param storeId ID de la tienda
   * @param tagData Datos del tag (sin id, createdAt, updatedAt)
   * @returns Promise con el ProductTag creado
   */
  static async createTag(
    storeId: string, 
    tagData: Omit<ProductTag, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>
  ): Promise<ProductTag> {
    try {
      // Validar datos de entrada
      this.validateTagData(tagData);
      
      const tagsRef = collection(this.db, 'stores', storeId, 'productTags');
      const now = Timestamp.now();
      
      const newTagData = {
        ...tagData,
        storeId,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(tagsRef, newTagData);
      
      return {
        id: docRef.id,
        ...newTagData
      } as ProductTag;
    } catch (error) {
      console.error('Error creando tag:', error);
      throw new Error('No se pudo crear el tag');
    }
  }

  /**
   * Actualiza un tag existente
   * @param storeId ID de la tienda
   * @param tagId ID del tag
   * @param updates Campos a actualizar
   */
  static async updateTag(
    storeId: string, 
    tagId: string, 
    updates: Partial<Omit<ProductTag, 'id' | 'storeId' | 'createdAt'>>
  ): Promise<void> {
    try {
      // Validar datos si se están actualizando
      if (updates.name || updates.color || updates.textColor) {
        this.validateTagData(updates as any);
      }
      
      const tagRef = doc(this.db, 'stores', storeId, 'productTags', tagId);
      
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(tagRef, updateData);
    } catch (error) {
      console.error('Error actualizando tag:', error);
      throw new Error('No se pudo actualizar el tag');
    }
  }

  /**
   * Elimina un tag
   * @param storeId ID de la tienda
   * @param tagId ID del tag
   */
  static async deleteTag(storeId: string, tagId: string): Promise<void> {
    try {
      const tagRef = doc(this.db, 'stores', storeId, 'productTags', tagId);
      await deleteDoc(tagRef);
    } catch (error) {
      console.error('Error eliminando tag:', error);
      throw new Error('No se pudo eliminar el tag');
    }
  }

  /**
   * Busca tags por nombre
   * @param storeId ID de la tienda
   * @param searchTerm Término de búsqueda
   * @returns Promise con array de ProductTag que coinciden
   */
  static async searchTags(storeId: string, searchTerm: string): Promise<ProductTag[]> {
    try {
      const tagsRef = collection(this.db, 'stores', storeId, 'productTags');
      const q = query(
        tagsRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductTag[];
    } catch (error) {
      console.error('Error buscando tags:', error);
      throw new Error('No se pudieron buscar los tags');
    }
  }

  /**
   * Obtiene tags por IDs específicos
   * @param storeId ID de la tienda
   * @param tagIds Array de IDs de tags
   * @returns Promise con array de ProductTag
   */
  static async getTagsByIds(storeId: string, tagIds: string[]): Promise<ProductTag[]> {
    try {
      if (tagIds.length === 0) return [];
      
      const tagsRef = collection(this.db, 'stores', storeId, 'productTags');
      const q = query(tagsRef, where('__name__', 'in', tagIds));
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductTag[];
    } catch (error) {
      console.error('Error obteniendo tags por IDs:', error);
      throw new Error('No se pudieron cargar los tags especificados');
    }
  }

  /**
   * Valida los datos de un tag
   * @param tagData Datos del tag a validar
   */
  private static validateTagData(tagData: Partial<ProductTag>): void {
    if (tagData.name && tagData.name.trim().length === 0) {
      throw new Error('El nombre del tag no puede estar vacío');
    }
    
    if (tagData.name && tagData.name.length > 50) {
      throw new Error('El nombre del tag no puede exceder 50 caracteres');
    }
    
    if (tagData.color && !this.isValidHexColor(tagData.color)) {
      throw new Error('El color debe ser un valor hexadecimal válido');
    }
    
    if (tagData.textColor && !this.isValidHexColor(tagData.textColor)) {
      throw new Error('El color del texto debe ser un valor hexadecimal válido');
    }
    
    // Validar contraste si ambos colores están presentes
    if (tagData.color && tagData.textColor) {
      if (!this.hasGoodContrast(tagData.color, tagData.textColor)) {
        console.warn('Los colores seleccionados pueden tener poco contraste');
      }
    }
  }

  /**
   * Valida si un color es hexadecimal válido
   * @param color Color en formato hex
   * @returns true si es válido
   */
  private static isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Calcula si dos colores tienen buen contraste
   * @param bg Color de fondo
   * @param text Color del texto
   * @returns true si el contraste es adecuado
   */
  private static hasGoodContrast(bg: string, text: string): boolean {
    // Implementación básica de contraste
    // En una implementación real, se usaría una librería como chroma-js
    const bgLuminance = this.getLuminance(bg);
    const textLuminance = this.getLuminance(text);
    
    const contrast = (Math.max(bgLuminance, textLuminance) + 0.05) / 
                    (Math.min(bgLuminance, textLuminance) + 0.05);
    
    return contrast >= 4.5; // WCAG AA standard
  }

  /**
   * Calcula la luminancia de un color
   * @param hex Color en formato hex
   * @returns Valor de luminancia
   */
  private static getLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;
    
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convierte hex a RGB
   * @param hex Color en formato hex
   * @returns Objeto con valores RGB o null
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Sanitiza el nombre de un tag
   * @param name Nombre a sanitizar
   * @returns Nombre sanitizado
   */
  static sanitizeTagName(name: string): string {
    return name
      .trim()
      .replace(/[<>"'&]/g, '') // Remover caracteres peligrosos
      .substring(0, 50); // Limitar longitud
  }
}