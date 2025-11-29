/**
 * Servicio de usuario
 * 
 * @module features/user/services/userService
 */

import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  Timestamp,
  serverTimestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore';

import { db, withRetry } from '@/lib/firebase/client';
import { User } from '@/features/user/user.types';
import { StoreProfile, CreateStoreProfileData } from '@/features/dashboard/modules/store-settings/types/store.type';
import { profileService } from '@/features/dashboard/modules/store-settings/services/profile.service';
import { userLogger } from '@/shared/services/logger.service';
import { errorService, ErrorType, ErrorSeverity } from '@/shared/services/error.service';

/**
 * Servicio de usuario
 */
class UserService {
  /**
   * Obtener datos del usuario desde Firestore
   */
  async getUserData(uid: string): Promise<User | null> {
    const context = { function: 'getUserData', userId: uid };

    try {
      userLogger.debug('Obteniendo datos del usuario', context);

      return await withRetry(async () => {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          userLogger.debug('Usuario encontrado exitosamente', context);
          return userDoc.data() as User;
        }

        userLogger.info('Usuario no encontrado', context);
        return null;
      });
    } catch (error: any) {
      userLogger.error('Error al obtener datos del usuario', context, error);
      throw error;
    }
  }

  /**
   * Actualizar datos del usuario
   */
  async updateUser(uid: string, data: Partial<User>): Promise<void> {
    const context = { function: 'updateUser', userId: uid };

    try {
      userLogger.debug('Actualizando datos del usuario', context, {
        fieldsToUpdate: Object.keys(data)
      });

      await withRetry(async () => {
        const userRef = doc(db, 'users', uid);

        // Filtrar campos undefined para evitar errores de Firestore
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, value]) => value !== undefined)
        );

        await setDoc(userRef, {
          ...cleanData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });

      userLogger.info('Usuario actualizado exitosamente', context);
    } catch (error: any) {
      userLogger.error('Error al actualizar usuario', context, error);
      throw error;
    }
  }

  /**
   * Obtener tiendas del usuario (optimizado con batch)
   */
  async getUserStores(uid: string): Promise<StoreProfile[]> {
    const context = { function: 'getUserStores', userId: uid };

    try {
      userLogger.debug('Obteniendo tiendas del usuario', context);

      // 1. Obtener el usuario para ver sus storeIds
      const user = await this.getUserData(uid);
      if (!user || !user.storeIds || user.storeIds.length === 0) {
        userLogger.info('Usuario sin tiendas asociadas', context, {
          hasUser: !!user,
          storeIdsCount: user?.storeIds?.length || 0
        });
        return [];
      }

      userLogger.debug('Cargando tiendas con batch read', context, {
        storeCount: user.storeIds.length,
        storeIds: user.storeIds
      });

      // 2. Obtener las tiendas usando batch para mejor rendimiento
      const batch = writeBatch(db);
      const storePromises = user.storeIds.map(storeId => {
        const storeRef = doc(db, 'stores', storeId);
        return getDoc(storeRef);
      });

      const storeDocs = await Promise.all(storePromises);
      const stores: StoreProfile[] = [];

      storeDocs.forEach(storeDoc => {
        if (storeDoc.exists()) {
          stores.push(storeDoc.data() as StoreProfile);
        }
      });

      userLogger.info('Tiendas cargadas exitosamente', context, {
        requestedCount: user.storeIds.length,
        foundCount: stores.length
      });

      return stores;
    } catch (error: any) {
      // Manejo específico de errores de Firebase
      const isOfflineError = error?.message?.includes('client is offline') ||
        error?.message?.includes('Failed to get document because the client is offline') ||
        error?.code === 'unavailable';

      const isConfigError = error?.message?.includes('Variable de entorno faltante');

      if (isOfflineError) {
        userLogger.warn('Firebase está offline - verificar configuración', context, {
          errorCode: error?.code,
          errorMessage: error?.message
        });
        userLogger.warn('Firebase está offline o no disponible temporalmente', context, {
          errorCode: error?.code,
          errorMessage: error?.message
        });
        // Retornar array vacío en lugar de lanzar error para no bloquear la UI
        return [];
      } else if (isConfigError) {
        userLogger.error('Error de configuración de Firebase', context, error);
        throw new Error('Error de configuración: Verifica que las variables de entorno de Firebase estén configuradas correctamente.');
      } else {
        userLogger.error('Error al obtener las tiendas del usuario', context, error);
        throw new Error('Error al obtener las tiendas del usuario');
      }
    }
  }

  /**
   * Verificar disponibilidad de nombre de tienda (usa servicio centralizado)
   */
  async checkSiteNameAvailability(siteName: string): Promise<boolean> {
    const context = { function: 'checkSiteNameAvailability' };

    try {
      userLogger.debug('Verificando disponibilidad del nombre de sitio', context, {
        siteName
      });

      // Verificar disponibilidad consultando Firestore directamente
      const storesQuery = query(
        collection(db, 'stores'),
        where('basicInfo.slug', '==', siteName),
        limit(1)
      );
      const querySnapshot = await getDocs(storesQuery);
      const isAvailable = querySnapshot.empty;

      userLogger.debug('Verificación de disponibilidad completada', context, {
        siteName,
        isAvailable
      });

      return isAvailable;
    } catch (error: any) {
      userLogger.error('Error al verificar disponibilidad del nombre de sitio', context, error);
      throw new Error('Error al verificar disponibilidad del nombre de sitio');
    }
  }

  /**
   * Crear una nueva tienda con transacción atómica
   */
  async createStore(storeData: CreateStoreProfileData): Promise<string> {
    const context = { function: 'createStore', userId: storeData.ownerId };

    try {
      userLogger.info('Iniciando creación de tienda', context, {
        name: storeData.basicInfo.name,
        storeType: storeData.basicInfo.type,
        slug: storeData.basicInfo.slug
      });

      // 1. Validar formato del slug
      if (!storeData.basicInfo.slug) {
        throw new Error('El slug es requerido');
      }

      userLogger.debug('Validando formato del slug', context, { slug: storeData.basicInfo.slug });
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(storeData.basicInfo.slug) || storeData.basicInfo.slug.length < 3 || storeData.basicInfo.slug.length > 50) {
        userLogger.warn('Formato de slug inválido', context, {
          slug: storeData.basicInfo.slug,
          error: 'El slug debe contener solo letras minúsculas, números y guiones'
        });
        throw new Error('Slug inválido: El slug debe contener solo letras minúsculas, números y guiones');
      }

      // 2. Verificar unicidad del slug
      userLogger.debug('Verificando unicidad del slug', context, { slug: storeData.basicInfo.slug });
      const storesQuery = query(
        collection(db, 'stores'),
        where('basicInfo.slug', '==', storeData.basicInfo.slug),
        limit(1)
      );
      const querySnapshot = await getDocs(storesQuery);
      const isSlugUnique = querySnapshot.empty;
      if (!isSlugUnique) {
        userLogger.warn('Slug ya está en uso', context, { slug: storeData.basicInfo.slug });
        throw new Error('El nombre de sitio ya está en uso');
      }

      // 3. Usar transacción para operación atómica
      userLogger.debug('Iniciando transacción atómica', context);
      const result = await runTransaction(db, async (transaction) => {
        // Verificar que el usuario existe
        const userRef = doc(db, 'users', storeData.ownerId);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          userLogger.error('Usuario no encontrado en transacción', context);
          throw new Error('Usuario no encontrado');
        }

        userLogger.debug('Usuario verificado, preparando datos del perfil', context);

        // Preparar datos para el profileService
        const profileData: CreateStoreProfileData = {
          ownerId: storeData.ownerId,
          basicInfo: {
            name: storeData.basicInfo.name,
            description: storeData.basicInfo.description || '',
            type: storeData.basicInfo.type,
            slug: storeData.basicInfo.slug,
          },
          contactInfo: {
            whatsapp: storeData.contactInfo.whatsapp,
            website: storeData.contactInfo.website || '',
          },
        };

        userLogger.debug('Datos preparados para profileService', context, {
          hasBasicInfo: !!profileData.basicInfo,
          hasContactInfo: !!profileData.contactInfo
        });

        // Crear perfil usando profileService
        const profile = await profileService.createProfile(profileData);
        userLogger.info('Perfil creado exitosamente', context, { profileId: profile.id });

        // Actualizar el usuario con el ID de la tienda
        const userData = userDoc.data() as User;
        const storeIds = [...(userData.storeIds || []), profile.id];

        transaction.update(userRef, {
          storeIds,
          updatedAt: serverTimestamp()
        });

        userLogger.debug('Usuario actualizado con nuevo storeId', context, {
          newStoreIds: storeIds,
          addedStoreId: profile.id
        });

        return profile.id;
      });

      userLogger.info('Transacción completada exitosamente', context, {
        createdStoreId: result
      });
      return result;

    } catch (error: any) {
      userLogger.error('Error al crear tienda', context, error);

      // Crear error estructurado
      let structuredError;

      if (error.message.includes('Slug inválido')) {
        structuredError = errorService.createError(
          ErrorType.VALIDATION,
          'INVALID_SLUG',
          error.message,
          'El nombre del sitio no es válido. Usa solo letras, números y guiones.',
          {
            severity: ErrorSeverity.LOW,
            context,
            originalError: error,
            recoverable: true,
            retryable: false
          }
        );
      } else if (error.message.includes('ya está en uso')) {
        structuredError = errorService.createError(
          ErrorType.BUSINESS_LOGIC,
          'SLUG_ALREADY_EXISTS',
          error.message,
          'Este nombre de sitio ya está en uso. Elige otro nombre.',
          {
            severity: ErrorSeverity.LOW,
            context,
            originalError: error,
            recoverable: true,
            retryable: false
          }
        );
      } else if (error.message.includes('Usuario no encontrado')) {
        structuredError = errorService.createError(
          ErrorType.AUTHENTICATION,
          'USER_NOT_FOUND',
          error.message,
          'No se pudo verificar el usuario. Inicia sesión nuevamente.',
          {
            severity: ErrorSeverity.HIGH,
            context,
            originalError: error,
            recoverable: true,
            retryable: false
          }
        );
      } else {
        structuredError = errorService.createError(
          ErrorType.FIRESTORE,
          'CREATE_STORE_ERROR',
          error.message,
          'Error al crear la tienda. Por favor, inténtalo de nuevo.',
          {
            severity: ErrorSeverity.MEDIUM,
            context,
            originalError: error,
            recoverable: true,
            retryable: true
          }
        );
      }

      errorService.handleError(structuredError);
      throw new Error(structuredError.userMessage);
    }
  }

  /**
   * Crear documento de usuario en Firestore
   */
  async createUserDocument(uid: string, userData: User): Promise<void> {
    const context = { function: 'createUserDocument', userId: uid };

    try {
      userLogger.info('Creando documento de usuario', context, {
        providedFields: Object.keys(userData)
      });

      const userRef = doc(db, 'users', uid);

      // Filtrar campos undefined para evitar errores de Firestore
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== undefined)
      );

      await setDoc(userRef, cleanUserData);

      userLogger.info('Documento de usuario creado exitosamente', context);
    } catch (error: any) {
      userLogger.error('Error al crear documento de usuario', context, error);
      throw error;
    }
  }
}

export const userService = new UserService();