/**
 * Servicio para gestión del perfil de tienda por secciones
 * 
 * Maneja operaciones CRUD específicas por cada sección de la tienda
 * Estructura: stores/{storeId}/secciones
 * 
 * @module features/dashboard/modules/store-settings/services
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { 
  StoreProfile, 
  BasicStoreInfo,
  Address,
  WeeklySchedule,
  SocialLinks,
  ThemeConfig,
} from '../types/store.type';

/**
 * Cache simple para perfiles
 */
class StoreCache {
  private cache = new Map<string, { data: StoreProfile; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  get(storeId: string): StoreProfile | null {
    const cached = this.cache.get(storeId);
    if (!cached || Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(storeId);
      return null;
    }
    return cached.data;
  }

  set(storeId: string, data: StoreProfile): void {
    this.cache.set(storeId, { data: { ...data }, timestamp: Date.now() });
  }

  invalidate(storeId: string): void {
    this.cache.delete(storeId);
  }

  clear(): void {
    this.cache.clear();
  }
}

const storeCache = new StoreCache();

/**
 * Servicio de perfil de tienda organizado por secciones
 */
class ProfileService {
  
  // ===== OBTENER TIENDA =====
  
  /**
   * Obtiene la tienda por userId (ownerId)
   */
  async getStoreByUserId(userId: string): Promise<StoreProfile | null> {
    try {
      console.log('🔍 Buscando tienda para userId:', userId);
      
      const storesRef = collection(db, 'stores');
      const q = query(storesRef, where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('❌ No se encontró tienda para el usuario');
        return null;
      }

      const storeDoc = querySnapshot.docs[0];
      const storeData = storeDoc.data() as StoreProfile;
      
      const store: StoreProfile = {
        ...storeData,
        id: storeDoc.id,
      };

      storeCache.set(store.id, store);
      console.log('✅ Tienda encontrada:', store.basicInfo.name);
      
      return store;
    } catch (error) {
      console.error('❌ Error al buscar tienda:', error);
      throw new Error('No se pudo cargar la tienda');
    }
  }

  /**
   * Obtiene tienda por ID desde cache o Firestore
   */
  async getStore(storeId: string): Promise<StoreProfile | null> {
    try {
      // Verificar cache
      const cached = storeCache.get(storeId);
      if (cached) {
        console.log('🎯 Tienda desde cache:', cached.basicInfo.name);
        return cached;
      }

      // Buscar en Firestore
      const storeRef = doc(db, 'stores', storeId);
      const storeDoc = await getDoc(storeRef);

      if (!storeDoc.exists()) {
        console.log('❌ Tienda no encontrada:', storeId);
        return null;
      }

      const storeData = storeDoc.data() as StoreProfile;
      const store: StoreProfile = {
        ...storeData,
        id: storeDoc.id,
      };

      storeCache.set(storeId, store);
      console.log('✅ Tienda cargada:', store.basicInfo.name);
      
      return store;
    } catch (error) {
      console.error('❌ Error al cargar tienda:', error);
      throw new Error('No se pudo cargar la tienda');
    }
  }

  // ===== ACTUALIZAR POR SECCIONES =====

  /**
   * Actualiza información básica de la tienda
   */
  async updateBasicInfo(storeId: string, data: Partial<BasicStoreInfo>): Promise<StoreProfile> {
    try {
      console.log('🔄 Actualizando información básica:', Object.keys(data));
      
      const storeRef = doc(db, 'stores', storeId);
      const updateData: any = {
        'metadata.updatedAt': serverTimestamp(),
      };

      // Mapear campos específicos
      if (data.name !== undefined) {
        updateData['basicInfo.name'] = data.name.trim();
      }
      if (data.description !== undefined) {
        updateData['basicInfo.description'] = data.description.trim();
      }
      if (data.slug !== undefined) {
        updateData['basicInfo.slug'] = data.slug.toLowerCase().trim();
      }
      if (data.type !== undefined) {
        updateData['basicInfo.type'] = data.type;
      }
      if (data.category !== undefined) {
        updateData['basicInfo.category'] = data.category;
      }

      await updateDoc(storeRef, updateData);
      storeCache.invalidate(storeId);

      const updatedStore = await this.getStore(storeId);
      if (!updatedStore) throw new Error('Error al obtener tienda actualizada');

      console.log('✅ Información básica actualizada');
      return updatedStore;
    } catch (error) {
      console.error('❌ Error al actualizar información básica:', error);
      throw new Error('No se pudo actualizar la información básica');
    }
  }

  /**
   * Actualiza dirección
   */
  async updateAddress(storeId: string, data: Partial<Address>): Promise<StoreProfile> {
    try {
      console.log('🔄 Actualizando dirección:', Object.keys(data));
      
      const storeRef = doc(db, 'stores', storeId);
      const updateData: any = {
        'metadata.updatedAt': serverTimestamp(),
      };

      if (data.street !== undefined) {
        updateData['address.street'] = data.street;
      }
      if (data.city !== undefined) {
        updateData['address.city'] = data.city;
      }
      if (data.province !== undefined) {
        updateData['address.province'] = data.province;
      }
      if (data.country !== undefined) {
        updateData['address.country'] = data.country;
      }
      if (data.zipCode !== undefined) {
        updateData['address.zipCode'] = data.zipCode;
      }

      await updateDoc(storeRef, updateData);
      storeCache.invalidate(storeId);

      const updatedStore = await this.getStore(storeId);
      if (!updatedStore) throw new Error('Error al obtener tienda actualizada');

      console.log('✅ Dirección actualizada');
      return updatedStore;
    } catch (error) {
      console.error('❌ Error al actualizar dirección:', error);
      throw new Error('No se pudo actualizar la dirección');
    }
  }

  /**
   * Actualiza horarios
   */
  async updateSchedule(storeId: string, data: Partial<WeeklySchedule>): Promise<StoreProfile> {
    try {
      console.log('🔄 Actualizando horarios:', Object.keys(data));
      
      const storeRef = doc(db, 'stores', storeId);
      const updateData: any = {
        'metadata.updatedAt': serverTimestamp(),
        'schedule': data, // Guardar el horario completo
      };

      await updateDoc(storeRef, updateData);
      storeCache.invalidate(storeId);

      const updatedStore = await this.getStore(storeId);
      if (!updatedStore) throw new Error('Error al obtener tienda actualizada');

      console.log('✅ Horarios actualizados');
      return updatedStore;
    } catch (error) {
      console.error('❌ Error al actualizar horarios:', error);
      throw new Error('No se pudo actualizar los horarios');
    }
  }

  /**
   * Actualiza redes sociales
   */
  async updateSocialLinks(storeId: string, data: Partial<SocialLinks>): Promise<StoreProfile> {
    try {
      console.log('🔄 Actualizando redes sociales:', Object.keys(data));
      
      const storeRef = doc(db, 'stores', storeId);
      const updateData: any = {
        'metadata.updatedAt': serverTimestamp(),
      };

      if (data.instagram !== undefined) {
        updateData['socialLinks.instagram'] = data.instagram || '';
      }
      if (data.facebook !== undefined) {
        updateData['socialLinks.facebook'] = data.facebook || '';
      }

      await updateDoc(storeRef, updateData);
      storeCache.invalidate(storeId);

      const updatedStore = await this.getStore(storeId);
      if (!updatedStore) throw new Error('Error al obtener tienda actualizada');

      console.log('✅ Redes sociales actualizadas');
      return updatedStore;
    } catch (error) {
      console.error('❌ Error al actualizar redes sociales:', error);
      throw new Error('No se pudo actualizar las redes sociales');
    }
  }

  /**
   * Actualiza tema
   */
  async updateTheme(storeId: string, data: Partial<ThemeConfig>): Promise<StoreProfile> {
    try {
      console.log('🔄 Actualizando tema:', Object.keys(data));
      
      const storeRef = doc(db, 'stores', storeId);
      const updateData: any = {
        'metadata.updatedAt': serverTimestamp(),
      };

      if (data.primaryColor !== undefined) {
        updateData['theme.primaryColor'] = data.primaryColor;
      }
      if (data.secondaryColor !== undefined) {
        updateData['theme.secondaryColor'] = data.secondaryColor;
      }
      if (data.accentColor !== undefined) {
        updateData['theme.accentColor'] = data.accentColor;
      }
      if (data.fontFamily !== undefined) {
        updateData['theme.fontFamily'] = data.fontFamily;
      }
      if (data.style !== undefined) {
        updateData['theme.style'] = data.style;
      }
      if (data.buttonStyle !== undefined) {
        updateData['theme.buttonStyle'] = data.buttonStyle;
      }
      if (data.logoUrl !== undefined) {
        updateData['theme.logoUrl'] = data.logoUrl;
      }
      if (data.bannerUrl !== undefined) {
        updateData['theme.bannerUrl'] = data.bannerUrl;
      }

      await updateDoc(storeRef, updateData);
      storeCache.invalidate(storeId);

      const updatedStore = await this.getStore(storeId);
      if (!updatedStore) throw new Error('Error al obtener tienda actualizada');

      console.log('✅ Tema actualizado');
      return updatedStore;
    } catch (error) {
      console.error('❌ Error al actualizar tema:', error);
      throw new Error('No se pudo actualizar el tema');
    }
  }

 
  // ===== UTILIDADES =====

  /**
   * Verifica si un slug es único
   */
  async isSlugUnique(slug: string, excludeStoreId?: string): Promise<boolean> {
    try {
      const storesQuery = query(
        collection(db, 'stores'),
        where('basicInfo.slug', '==', slug.toLowerCase())
      );
      const querySnapshot = await getDocs(storesQuery);

      if (querySnapshot.empty) {
        return true; // No existe, es único
      }
      if (excludeStoreId) {
        // Verificar si el único resultado es la tienda que estamos editando
        if (querySnapshot.size === 1 && querySnapshot.docs[0].id === excludeStoreId) {
          return true;
        }
      }
      return false; // Ya existe
    } catch (error) {
    console.error('Error al verificar slug:', error);
      return false;
    }
  }

  /**
   * Limpia el cache
   */
  clearCache(): void {
    storeCache.clear();
  }
}

export const profileService = new ProfileService();
export { ProfileService };