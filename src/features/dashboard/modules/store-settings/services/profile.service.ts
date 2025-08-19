/**
 * Servicio para gestión del perfil de tienda
 * 
 * Maneja todas las operaciones CRUD del perfil con Firebase,
 * incluyendo validaciones, cache y optimizaciones
 * 
 * @module features/dashboard/modules/profile/services
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase/client';
import { 
  StoreProfile, 
  ProfileFormData, 
  CreateStoreProfileData,
  UpdateStoreProfileData
} from '../types/store.type';
import { calculateProfileCompleteness, convertPeriodsScheduleToSimple } from '../utils/profile.utils';
import { profileLogger } from '@/shared/services/logger.service';

/**
 * Configuración del servicio
 */
const CONFIG = {
  collections: {
    profiles: 'stores',
    users: 'users',
  },
  storage: {
    profiles: 'profiles',
    images: 'images',
  },
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutos
  },
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    quality: 0.8,
  },
};

/**
 * Cache en memoria para perfiles (corregido para usar storeId como clave)
 */
class ProfileCache {
  private cache = new Map<string, { data: StoreProfile; timestamp: number }>();

  set(key: string, data: StoreProfile): void {
    this.cache.set(key, {
      data: { ...data },
      timestamp: Date.now(),
    });
  }

  get(key: string): StoreProfile | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CONFIG.cache.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Método para invalidar cache por userId
  invalidateByUserId(userId: string): void {
    // Buscar y eliminar entradas que correspondan al userId
    for (const [key, value] of Array.from(this.cache.entries())) {
      if (value.data.ownerId === userId) {
        this.cache.delete(key);
      }
    }
  }
}

const profileCache = new ProfileCache();

/**
 * Clase principal del servicio de perfil
 */
class ProfileService {
  /**
   * Obtiene el perfil de una tienda por ownerId
   */
  async getProfile(userId: string): Promise<StoreProfile | null> {
    const context = { function: 'getProfile', userId };
    
    try {
      profileLogger.info('Iniciando búsqueda de perfil', context, { userId });
      
      // Verificar cache primero
      const cached = profileCache.get(userId);
      if (cached) {
        profileLogger.debug('Perfil encontrado en cache', context);
        return cached;
      }

      // Buscar tienda por ownerId
      const storesRef = collection(db, CONFIG.collections.profiles);
      const q = query(storesRef, where('ownerId', '==', userId));
      profileLogger.debug('Ejecutando query en Firestore', context, { 
        collection: CONFIG.collections.profiles 
      });
      
      const querySnapshot = await getDocs(q);
      profileLogger.info('Query ejecutado', context, { 
        documentsFound: querySnapshot.size 
      });

      if (querySnapshot.empty) {
        profileLogger.warn('No se encontró perfil para el usuario', context);
        return null;
      }

      // Tomar la primera tienda encontrada
      const storeDoc = querySnapshot.docs[0];
      const data = storeDoc.data();
      profileLogger.debug('Datos del documento obtenidos', context, { 
        documentId: storeDoc.id,
        hasBasicInfo: !!data.basicInfo,
        hasContactInfo: !!data.contactInfo,
        hasSettings: !!data.settings,
        hasMetadata: !!data.metadata
      });
      
      let profile: StoreProfile;
      
      // Verificar si los datos ya tienen la estructura nueva (anidada)
      if (data.basicInfo && data.contactInfo && data.settings && data.metadata) {
        profileLogger.debug('Estructura nueva detectada, usando datos directamente', context);
        profile = {
          ...data,
          id: storeDoc.id,
        } as StoreProfile;
      } else {
        profileLogger.debug('Estructura antigua detectada, mapeando datos', context);
        profile = this.mapFirestoreToStoreProfile(data, storeDoc.id);
      }
      
      profileLogger.info('Perfil cargado exitosamente', context, { 
        profileId: profile.id,
        name: profile.basicInfo.name
      });
      
      // Guardar en cache
      profileCache.set(userId, profile);
      
      return profile;
    } catch (error) {
      profileLogger.error('Error al cargar perfil', context, error as Error);
      throw new Error('No se pudo cargar el perfil');
    }
  }

  /**
   * Crea un nuevo perfil de tienda
   */
  async createProfile(data: CreateStoreProfileData): Promise<StoreProfile> {
    const context = { function: 'createProfile', userId: data.ownerId };
    
    try {
      profileLogger.info('Iniciando creación de perfil', context, {
        name: data.basicInfo.name,
        type: data.basicInfo.type,
        slug: data.basicInfo.slug
      });
      
      // Generar ID único para la tienda
      const storeRef = doc(collection(db, CONFIG.collections.profiles));
      const storeId = storeRef.id;
      
      profileLogger.debug('ID de tienda generado', context, { storeId });
      
      // Preparar datos completos del perfil
      const now = serverTimestamp();
      const profileData: Omit<StoreProfile, 'id'> = {
        ownerId: data.ownerId,
        basicInfo: {
          name: data.basicInfo.name,
          description: data.basicInfo.description || '',
          slug: data.basicInfo.slug || '',
          type: data.basicInfo.type,
          category: data.basicInfo.category,
        },
        contactInfo: {
          whatsapp: data.contactInfo.whatsapp,
          website: data.contactInfo.website || '',
        },
        address: undefined,
        schedule: undefined,
        socialLinks: {},
        theme: {
          primaryColor: '#6366f1',
          style: 'modern',
        },
        settings: {
          paymentMethods: this.getDefaultPaymentMethods(),
          deliveryMethods: this.getDefaultDeliveryMethods(),
        },
        subscription: {
          active: false,
          plan: 'free',
          startDate: now as any,
          endDate: now as any,
          trialUsed: false,
        },
        metadata: {
          createdAt: now as any,
          updatedAt: now as any,
          version: 1,
          status: 'active',
        },
      };
      
      profileLogger.debug('Datos del perfil preparados', context, {
        hasBasicInfo: !!profileData.basicInfo,
        hasContactInfo: !!profileData.contactInfo,
        hasSettings: !!profileData.settings
      });
      
      // Crear documento en Firestore
      await setDoc(storeRef, profileData);
      
      profileLogger.info('Perfil creado exitosamente en Firestore', context, { storeId });
      
      // Crear objeto StoreProfile completo
      const createdProfile: StoreProfile = {
        id: storeId,
        ...profileData,
      };
      
      // Guardar en cache
      profileCache.set(data.ownerId, createdProfile);
      
      profileLogger.info('Perfil creado y cacheado exitosamente', context, {
        profileId: createdProfile.id,
        name: createdProfile.basicInfo.name
      });
      
      return createdProfile;
    } catch (error) {
      profileLogger.error('Error al crear perfil', context, error as Error);
      throw new Error('No se pudo crear el perfil');
    }
  }

  /**
   * Actualiza el perfil de una tienda
   */
  async updateProfile(userId: string, data: Partial<ProfileFormData>): Promise<StoreProfile> {
    try {
      // Updating profile for user
      
      // Obtener perfil actual
      let currentProfile = await this.getProfile(userId);
      
      // Si no existe el perfil, crear uno básico
      if (!currentProfile) {
        // Profile not found, creating basic profile
        
        // Crear datos básicos para el perfil
        const basicProfileData: CreateStoreProfileData = {
          ownerId: userId,
          basicInfo: {
            name: data.name || 'Mi Tienda',
            description: data.description || '',
            type: (data.storeType as any) || 'other',
            slug: data.siteName || `tienda-${userId.slice(-8)}`,
          },
          contactInfo: {
            whatsapp: data.whatsapp || '',
            website: data.website || '',
          },
        };
        
        // Crear el perfil
        currentProfile = await this.createProfile(basicProfileData);
        // Basic profile created
      }
      
      // Current profile found

      const storeRef = doc(db, CONFIG.collections.profiles, currentProfile.id);

      // Preparar datos de actualización para la estructura anidada
      const updateData: any = {
        'metadata.updatedAt': serverTimestamp(),
      };

      // Mapear campos del formulario a la estructura anidada
      if (data.name !== undefined) {
        updateData['basicInfo.name'] = data.name.trim();
        // Updating basic info name
      }
      
      if (data.description !== undefined) {
        updateData['basicInfo.description'] = data.description.trim();
        // Updating basic info description
      }
      
      if (data.siteName !== undefined) {
        // Verificar que el slug sea único
        if (data.siteName !== currentProfile.basicInfo.slug) {
          // Verifying slug uniqueness
          const storesQuery = query(
            collection(db, 'stores'),
            where('basicInfo.slug', '==', data.siteName),
            limit(1)
          );
          const querySnapshot = await getDocs(storesQuery);
          const isUnique = querySnapshot.empty || (querySnapshot.docs.length === 1 && querySnapshot.docs[0].id === currentProfile.id);
          if (!isUnique) {
            // Slug not unique
            throw new Error('El nombre del sitio ya está en uso');
          }
          // Slug uniqueness verified
        }
        updateData['basicInfo.slug'] = data.siteName.toLowerCase().trim();
        // Updating basic info slug
      }
      
      if (data.whatsapp !== undefined) {
        updateData['contactInfo.whatsapp'] = data.whatsapp;
        // Updating contact whatsapp
      }
      

      if (data.website !== undefined) {
        updateData['contactInfo.website'] = data.website || '';
        // Updating contact website
      }
      
      // Dirección
      if (data.street !== undefined) {
        updateData['address.street'] = data.street;
        // Updating address street
      }
      
      if (data.city !== undefined) {
        updateData['address.city'] = data.city;
        // Updating address city
      }
      
      if (data.province !== undefined) {
        updateData['address.province'] = data.province;
        // Updating address province
      }
      
      if (data.country !== undefined) {
        updateData['address.country'] = data.country;
        // Updating address country
      }
      
      // Redes sociales
      if (data.instagram !== undefined) {
        updateData['socialLinks.instagram'] = data.instagram || '';
        // Updating social instagram
      }
      
      if (data.facebook !== undefined) {
        updateData['socialLinks.facebook'] = data.facebook || '';
        // Updating social facebook
      }
      
      // Configuración - currency y language no están en CommerceConfig
      
      // Tema
      if (data.theme !== undefined) {
        if (data.theme.primaryColor !== undefined) {
          updateData['theme.primaryColor'] = data.theme.primaryColor;
          // Updating theme primary color
        }
        
        if (data.theme.secondaryColor !== undefined) {
          updateData['theme.secondaryColor'] = data.theme.secondaryColor;
          // Updating theme secondary color
        }
        
        if (data.theme.accentColor !== undefined) {
          updateData['theme.accentColor'] = data.theme.accentColor;
          // Updating theme accent color
        }
        
        if (data.theme.fontFamily !== undefined) {
          updateData['theme.fontFamily'] = data.theme.fontFamily;
          // Updating theme font family
        }
        
        if (data.theme.style !== undefined) {
          updateData['theme.style'] = data.theme.style;
          // Updating theme style
        }
        
        if (data.theme.buttonStyle !== undefined) {
          updateData['theme.buttonStyle'] = data.theme.buttonStyle;
          // Updating theme button style
        }
        
        if (data.theme.logoUrl !== undefined) {
          updateData['theme.logoUrl'] = data.theme.logoUrl;
          // Updating theme logo URL
        }
        
        if (data.theme.bannerUrl !== undefined) {
          updateData['theme.bannerUrl'] = data.theme.bannerUrl;
          // Updating theme banner URL
        }
      }
      
      // Horarios - convertir del formato de períodos al formato simple para Firestore
      if (data.schedule !== undefined) {
        const convertedSchedule = convertPeriodsScheduleToSimple(data.schedule);
        updateData['schedule'] = convertedSchedule;
        // Updating schedule
      }
      
      // Métodos de pago
      if (data.paymentMethods !== undefined) {
        updateData['settings.paymentMethods'] = data.paymentMethods;
        // Updating payment methods
      }
      
      // Métodos de entrega
      if (data.deliveryMethods !== undefined) {
        updateData['settings.deliveryMethods'] = data.deliveryMethods;
        // Updating delivery methods
      }
      


      // Final data for Firestore
      
      // Actualizar en Firestore
      await updateDoc(storeRef, updateData);
      // Document updated in Firestore
      
      // Invalidar cache y obtener perfil actualizado
      profileCache.invalidate(userId);
      // Cache invalidated
      
      const updatedProfile = await this.getProfile(userId);
      
      if (!updatedProfile) {
        // Error getting updated profile
        throw new Error('Error al obtener perfil actualizado');
      }

      // Profile updated successfully
      return updatedProfile;
    } catch (error) {
      // Update profile error
      throw error instanceof Error ? error : new Error('No se pudo actualizar el perfil');
    }
  }

  /**
   * Sube una imagen del perfil
   */
  async uploadImage(userId: string, file: File, type: 'logo' | 'banner' | 'profile'): Promise<string> {
    try {
      // Obtener perfil actual para obtener el ID de la tienda
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile) {
        throw new Error('Perfil no encontrado');
      }

      // Validar archivo
      this.validateImageFile(file);
      
      // Generar nombre único
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `${type}_${timestamp}.${extension}`;
      
      // Referencia de almacenamiento usando el ID de la tienda
      const storageRef = ref(storage, `${CONFIG.storage.profiles}/${currentProfile.id}/${fileName}`);
      
      // Subir archivo
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Actualizar perfil con la nueva URL usando el ID de la tienda
      const storeRef = doc(db, CONFIG.collections.profiles, currentProfile.id);
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };
      
      if (type === 'logo') {
        updateData.urlProfile = downloadURL;
      } else if (type === 'banner') {
        updateData.urlPortada = downloadURL;
      }
      
      await updateDoc(storeRef, updateData);
      
      // Invalidar cache
      profileCache.invalidate(userId);
      
      return downloadURL;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      throw new Error('No se pudo subir la imagen');
    }
  }

  /**
   * Elimina una imagen del perfil
   */
  async deleteImage(userId: string, imageUrl: string, type: 'logo' | 'banner'): Promise<void> {
    try {
      // Eliminar de Storage
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      
      // Actualizar perfil
      const profileRef = doc(db, CONFIG.collections.profiles, userId);
      const updateData: any = {
        'metadata.updatedAt': serverTimestamp(),
      };
      
      if (type === 'logo') {
        updateData['theme.logoUrl'] = null;
      } else if (type === 'banner') {
        updateData['theme.bannerUrl'] = null;
      }
      
      await updateDoc(profileRef, updateData);
      
      // Invalidar cache
      profileCache.invalidate(userId);
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      throw new Error('No se pudo eliminar la imagen');
    }
  }

  /**
   * Verifica si un slug es único
   */
  async isSlugUnique(slug: string, excludeStoreId?: string): Promise<boolean> {
    const storesQuery = query(
      collection(db, 'stores'),
      where('basicInfo.slug', '==', slug),
      limit(1)
    );
    const querySnapshot = await getDocs(storesQuery);
    return querySnapshot.empty || (!!excludeStoreId && querySnapshot.docs.length === 1 && querySnapshot.docs[0].id === excludeStoreId);
  }

  /**
   * Genera un slug único basado en el nombre
   */
  private async generateUniqueSlug(name: string, excludeStoreId?: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (!(await this.isSlugUnique(slug, excludeStoreId))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  }

  /**
   * Valida un archivo de imagen
   */
  private validateImageFile(file: File): void {
    if (!CONFIG.images.allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Use JPG, PNG o WebP.');
    }
    
    if (file.size > CONFIG.images.maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 5MB.');
    }
  }

  /**
   * Mapea datos de Firestore a StoreProfile
   */
  private mapFirestoreToProfile(data: any): StoreProfile {
    return {
      id: data.id,
      ownerId: data.ownerId,
      basicInfo: data.basicInfo,
      contactInfo: data.contactInfo,
      address: data.address,
      schedule: data.schedule,
      socialLinks: data.socialLinks || {},
      theme: data.theme || {},
      settings: data.settings,
      subscription: data.subscription,
      metadata: {
        ...data.metadata,
        createdAt: data.metadata.createdAt,
        updatedAt: data.metadata.updatedAt,
      },
    };
  }

  /**
   * Mapea datos de la colección stores al formato StoreProfile
   */
  private mapFirestoreToStoreProfile(data: any, storeId: string): StoreProfile {
    const now = Timestamp.now();
    
    return {
      id: storeId,
      ownerId: data.ownerId,
      basicInfo: {
        name: data.name || 'Mi Tienda',
        description: data.descripcion || '',
        slug: data.siteName || '',
        type: 'other' as const,
      },
      contactInfo: {
        whatsapp: data.whatsapp || '',
        website: '',
      },
      address: data.localaddress ? {
        street: data.localaddress,
        city: '',
        province: '',
        country: 'Argentina',
        zipCode: '',
      } : undefined,
      schedule: undefined,
      socialLinks: {
        instagram: data.instagramlink || '',
      },
      theme: {
        primaryColor: '#6366f1',
        style: 'modern',
        logoUrl: data.urlProfile,
        bannerUrl: data.urlPortada,
      },
      settings: {
        paymentMethods: this.getDefaultPaymentMethods(),
        deliveryMethods: this.getDefaultDeliveryMethods(),
      },
      subscription: {
        active: data.suscripcion || false,
        plan: 'free' as const,
        startDate: data.createdAt || now,
        endDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        trialUsed: false,
      },
      metadata: {
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
        version: 1,
        status: 'active' as const,
      },
    };
  }

  /**
   * Obtiene métodos de pago por defecto
   */
  private getDefaultPaymentMethods() {
    return [
      {
        id: 'cash',
        name: 'Efectivo',
        enabled: true,
      },
      {
        id: 'transfer',
        name: 'Transferencia bancaria',
        enabled: false,
        requiresVerification: true,
      },
      {
        id: 'mercadopago',
        name: 'Mercado Pago',
        enabled: false,
      },
    ];
  }

  /**
   * Obtiene métodos de entrega por defecto
   */
  private getDefaultDeliveryMethods() {
    return [
      {
        id: 'pickup',
        name: 'Retiro en local',
        enabled: true,
        price: 0,
        estimatedTime: '15-30 minutos',
      },
      {
        id: 'delivery',
        name: 'Delivery',
        enabled: false,
        price: 500,
        freeOver: 5000,
        estimatedTime: '30-60 minutos',
      },
    ];
  }

  /**
   * Limpia el cache
   */
  clearCache(): void {
    profileCache.clear();
  }
}

// Instancia singleton del servicio
export const profileService = new ProfileService();

// Exportar también la clase para testing
export { ProfileService };