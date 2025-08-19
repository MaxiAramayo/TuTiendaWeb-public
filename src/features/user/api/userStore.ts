/**
 * Store de usuario con Zustand
 * 
 * @module features/user/api/userStore
 */

import { create } from 'zustand';
import { User } from '@/features/user/user.types';
import { StoreProfile, CreateStoreProfileData } from '@/features/dashboard/modules/store-settings/types/store.type';
import { userService } from '@/features/user/services/userService';
import { userLogger } from '@/shared/services/logger.service';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * Estado del store de usuario
 */
interface UserState {
  /** Usuario actual */
  user: User | null;
  /** Tiendas del usuario */
  stores: StoreProfile[];
  /** Estado de carga */
  isLoading: boolean;
  /** Error actual */
  error: string | null;
  
  // Acciones
  /** Obtener datos del usuario */
  getUser: (uid: string) => Promise<void>;
  /** Actualizar datos del usuario */
  updateUser: (uid: string, data: Partial<User>) => Promise<void>;
  /** Verificar disponibilidad de nombre de tienda */
  checkStoreNameAvailability: (name: string) => Promise<boolean>;
  /** Crear nueva tienda */
  createStore: (storeData: CreateStoreProfileData) => Promise<string | null>;
  /** Obtener tiendas del usuario */
  getUserStores: (uid: string) => Promise<void>;
}

/**
 * Store de usuario
 * 
 * Este store maneja el estado del usuario y sus tiendas.
 */
export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  stores: [],
  isLoading: false,
  error: null,

  /**
   * Obtener datos del usuario
   */
  getUser: async (uid: string) => {
    try {
      set({ isLoading: true, error: null });
      const userData = await userService.getUserData(uid);
      set({ user: userData || null, isLoading: false });
    } catch (error: any) {
      console.error('Error al obtener usuario:', error);
      set({ 
        error: error.message || 'Error al obtener datos del usuario', 
        isLoading: false 
      });
    }
  },

  /**
   * Actualizar datos del usuario
   */
  updateUser: async (uid: string, data: Partial<User>) => {
    try {
      set({ isLoading: true, error: null });
      await userService.updateUser(uid, data);
      
      // Actualizar el estado local
      const currentUser = get().user;
      if (currentUser) {
        set({ 
          user: { ...currentUser, ...data },
          isLoading: false 
        });
      }
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      set({ 
        error: error.message || 'Error al actualizar datos del usuario', 
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Verificar disponibilidad de nombre de tienda (usa servicio centralizado)
   */
  checkStoreNameAvailability: async (name: string) => {
    const context = { function: 'checkStoreNameAvailability' };
    
    try {
      set({ isLoading: true, error: null });
      
      userLogger.debug('Verificando disponibilidad del nombre de tienda', context, {
        name
      });
      
      // Validar formato del slug
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(name) || name.length < 3 || name.length > 50) {
        userLogger.warn('Formato de nombre de tienda inválido', context, {
          name,
          error: 'El nombre debe contener solo letras minúsculas, números y guiones'
        });
        set({ isLoading: false });
        throw new Error('Formato inválido: El nombre debe contener solo letras minúsculas, números y guiones');
      }
      
      // Verificar unicidad consultando Firestore directamente
      const storesQuery = query(
        collection(db, 'stores'),
        where('basicInfo.slug', '==', name),
        limit(1)
      );
      const querySnapshot = await getDocs(storesQuery);
      const isAvailable = querySnapshot.empty;
      
      userLogger.debug('Verificación de unicidad completada', context, {
        name,
        isAvailable
      });
      
      set({ isLoading: false });
      return isAvailable;
    } catch (error: any) {
      userLogger.error('Error al verificar disponibilidad del nombre de tienda', context, error);
      set({ 
        error: error.message || 'Error al verificar disponibilidad del nombre', 
        isLoading: false 
      });
      return false;
    }
  },

  /**
   * Crear una nueva tienda
   */
  createStore: async (storeData: CreateStoreProfileData) => {
    const context = { function: 'createStore', ownerId: storeData.ownerId };
    
    try {
      set({ isLoading: true, error: null });
      
      userLogger.info('Iniciando creación de tienda desde store', context, {
        name: storeData.basicInfo.name,
        storeType: storeData.basicInfo.type,
        slug: storeData.basicInfo.slug
      });
      
      if (!storeData.ownerId) {
        userLogger.error('ID de propietario requerido', context);
        throw new Error('ID de propietario requerido');
      }
      
      // Validación adicional en tiempo de ejecución
      if (!storeData.basicInfo.name.trim() || !storeData.basicInfo.slug?.trim() || !storeData.basicInfo.type || !storeData.contactInfo.whatsapp.trim()) {
        userLogger.error('Datos de tienda incompletos', {
          ...context,
          metadata: {
            hasName: !!storeData.basicInfo.name.trim(),
            hasSlug: !!storeData.basicInfo.slug?.trim(),
            hasType: !!storeData.basicInfo.type,
            hasWhatsapp: !!storeData.contactInfo.whatsapp.trim()
          }
        });
        throw new Error('Datos de tienda incompletos');
      }

      const storeId = await userService.createStore(storeData);

      userLogger.debug('Actualizando lista de tiendas del usuario', context, {
        newStoreId: storeId
      });

      // Actualizar la lista de tiendas
      await get().getUserStores(storeData.ownerId);
      
      userLogger.info('Tienda creada exitosamente desde store', context, {
        storeId
      });
      
      set({ isLoading: false });
      return storeId;
    } catch (error: any) {
      userLogger.error('Error al crear tienda desde store', context, error as Error);
      set({ 
        error: error.message || 'Error al crear la tienda', 
        isLoading: false 
      });
      throw error;
    }
  },

  /**
   * Obtener tiendas del usuario
   */
  getUserStores: async (uid: string) => {
    try {
      set({ isLoading: true, error: null });
      const stores = await userService.getUserStores(uid);
      set({ stores, isLoading: false });
    } catch (error: any) {
      console.error('Error al obtener tiendas:', error);
      set({ 
        error: error.message || 'Error al obtener tiendas del usuario', 
        isLoading: false 
      });
    }
  }
}));