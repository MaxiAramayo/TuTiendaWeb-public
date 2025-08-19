/**
 * Store de Perfil de Tienda - Dashboard Profile Module
 * 
 * Maneja todas las operaciones relacionadas con la gestión del perfil de la tienda:
 * - Actualización por secciones específicas
 * - Validación de nombres únicos de sitio
 * - Configuración modular de la tienda
 * 
 * Separado del authStore para mantener responsabilidades claras según FSD.
 * Refactorizado para manejar actualizaciones por secciones específicas.
 * 
 * @module features/dashboard/modules/profile/api/profileStore
 */

import { db } from "@/lib/firebase/client";
import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { create } from "zustand";
import { z } from "zod";
import { profileSchema } from "@/validations/productSchema";
import { User } from "@/shared/types/store";
import { isSiteNameUnique } from "../utils/profile.utils";
import { errorService, ErrorType, ErrorSeverity } from '@/shared/services/error.service';
import { profileService } from '../services/profile.service';

/**
 * Datos del formulario de edición de perfil
 * Usa el mismo schema de validación que el componente FormProfile
 */
export type FormEditData = z.infer<typeof profileSchema>;

/**
 * Definición de secciones del perfil
 */
export interface ProfileSection {
  id: string;
  name: string;
  fields: (keyof FormEditData)[];
  dependencies?: string[];
}

/**
 * Datos específicos por sección - Alineados con fireStorePath.md
 */
export interface BasicInfoData {
  name?: string;
  description?: string;
  slug?: string;
  type?: string;
}

export interface ContactData {
  whatsapp?: string;
  website?: string;
}

export interface AddressData {
  street?: string;
  city?: string;
  province?: string;
  country?: string;
  zipCode?: string;
  mapsLink?: string;
}

export interface ScheduleData {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface SocialLinksData {
  instagram?: string;
  facebook?: string;
}

export interface PaymentDeliveryData {
  paymentMethods?: any[];
  deliveryMethods?: any[];
}

export interface ThemeData {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  style?: string;
  buttonStyle?: string;
}

export interface SettingsData {
  currency?: string;
  language?: string;
  timezone?: string;
  paymentMethods?: Array<{
    id: string;
    name: string;
    enabled: boolean;
    instructions?: string;
  }>;
  deliveryMethods?: Array<{
    id: string;
    name: string;
    enabled: boolean;
    price?: number;
    instructions?: string;
  }>;
  notifications?: {
    receiveOrdersOnWhatsApp?: boolean;
    receiveOrdersInApp?: boolean;
    pushNotifications?: boolean;
  };
}



/**
 * Tipo unión para todos los datos de sección
 */
export type SectionData = 
  | BasicInfoData 
  | ContactData 
  | AddressData 
  | ScheduleData 
  | SocialLinksData
  | PaymentDeliveryData 
  | ThemeData 
  | SettingsData;

/**
 * Estado por sección
 */
interface SectionState {
  /** Está guardando esta sección */
  isSaving: boolean;
  /** Hay cambios sin guardar en esta sección */
  isDirty: boolean;
  /** Último guardado exitoso */
  lastSaved: Date | null;
  /** Error específico de la sección */
  error: string | null;
}

/**
 * Estado del store de perfil de tienda
 */
interface ProfileState {
  /** Estado de carga para operaciones de perfil */
  isUpdating: boolean;
  /** Estado de validación de siteName */
  isValidating: boolean;
  /** Error en operaciones de perfil */
  error: string | null;
  /** Éxito en la última operación */
  success: boolean;
  /** Estados por sección */
  sections: Record<string, SectionState>;

  // === ACCIONES GENERALES ===
  /** Actualizar datos del perfil de la tienda (método legacy) */
  updateProfile: (uid: string, data: FormEditData) => Promise<boolean>;
  /** Verificar si un nombre de sitio está disponible */
  validateSiteNameUnique: (siteName: string) => Promise<boolean>;
  /** Limpiar estado de error/éxito */
  clearStatus: () => void;

  // === ACCIONES POR SECCIÓN ===
  /** Actualizar información básica */
  updateBasicInfo: (storeId: string, data: BasicInfoData) => Promise<boolean>;
  /** Actualizar información de contacto */
  updateContactInfo: (storeId: string, data: ContactData) => Promise<boolean>;
  /** Actualizar dirección */
  updateAddress: (storeId: string, data: AddressData) => Promise<boolean>;
  /** Actualizar horarios */
  updateSchedule: (storeId: string, data: ScheduleData) => Promise<boolean>;
  /** Actualizar redes sociales */
  updateSocialLinks: (storeId: string, data: SocialLinksData) => Promise<boolean>;
  /** Actualizar tema y colores */
  updateTheme: (storeId: string, data: ThemeData) => Promise<boolean>;
  /** Actualizar métodos de pago y entrega */
  updatePaymentDelivery: (storeId: string, data: PaymentDeliveryData) => Promise<boolean>;
  /** Actualizar configuración general */
  updateSettings: (storeId: string, data: SettingsData) => Promise<boolean>;


  // === UTILIDADES DE SECCIÓN ===
  /** Actualizar una sección específica (método genérico) */
  updateSection: (storeId: string, sectionId: string, data: SectionData) => Promise<boolean>;
  /** Marcar sección como modificada */
  markSectionDirty: (section: string) => void;
  /** Marcar sección como limpia */
  markSectionClean: (section: string) => void;
  /** Obtener estado de una sección */
  getSectionState: (section: string) => SectionState;
  /** Obtener configuración de una sección */
  getSectionConfig: (sectionId: string) => ProfileSection | null;
  /** Validar datos de una sección */
  validateSectionData: (sectionId: string, data: SectionData) => boolean;
  /** Método interno para actualizar sección en Firestore */
  _updateSectionInFirestore: (storeId: string, sectionId: string, data: Record<string, any>) => Promise<boolean>;
}

/**
 * Store para gestión del perfil de tienda
 * 
 * Maneja las operaciones específicas del perfil de la tienda,
 * separado del authStore para mantener responsabilidades claras.
 */
/**
 * Estado inicial de una sección
 */
const createInitialSectionState = (): SectionState => ({
  isSaving: false,
  isDirty: false,
  lastSaved: null,
  error: null,
});

/**
 * Configuración de secciones del perfil - Alineadas con fireStorePath.md
 */
export const PROFILE_SECTIONS: Record<string, ProfileSection> = {
  basic: {
    id: 'basic',
    name: 'Información Básica',
    fields: ['name', 'description', 'slug', 'type']
  },
  contact: {
    id: 'contact',
    name: 'Información de Contacto',
    fields: ['whatsapp', 'website']
  },
  address: {
    id: 'address',
    name: 'Dirección',
    fields: ['street', 'city', 'province', 'country', 'zipCode']
  },
  schedule: {
    id: 'schedule',
    name: 'Horarios',
    fields: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  socialLinks: {
    id: 'socialLinks',
    name: 'Redes Sociales',
    fields: ['facebook', 'instagram', 'twitter', 'youtube', 'tiktok', 'linkedin']
  }
};

/**
 * Lista de IDs de secciones disponibles
 */
const SECTION_IDS = Object.keys(PROFILE_SECTIONS);

export const useProfileStore = create<ProfileState>((set, get) => ({
  // === ESTADO INICIAL ===
  isUpdating: false,
  isValidating: false,
  error: null,
  success: false,
  sections: SECTION_IDS.reduce((acc, sectionId) => {
    acc[sectionId] = createInitialSectionState();
    return acc;
  }, {} as Record<string, SectionState>),

  // === FUNCIONES AUXILIARES ===

  /**
   * Función auxiliar para actualizar una sección específica en Firestore
   * @param storeId - ID de la tienda
   * @param sectionId - ID de la sección
   * @param data - Datos a actualizar
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  _updateSectionInFirestore: async (storeId: string, sectionId: string, data: Record<string, any>) => {
    try {
      if (!storeId) {
        throw new Error("ID de tienda requerido");
      }

      // Marcar sección como guardando
      set(state => ({
        ...state,
        sections: {
          ...state.sections,
          [sectionId]: { ...state.sections[sectionId], isSaving: true, error: null }
        }
      }));

      // Mapear sectionId a nombre de campo anidado en el documento principal
      const sectionFieldMap: Record<string, string> = {
        'basic': 'basicInfo',
        'contact': 'contactInfo', 
        'address': 'address',
        'schedule': 'schedule',
        'socialLinks': 'socialLinks',
        'theme': 'theme',
        'paymentDelivery': 'settings', // Los métodos de pago van en settings según fireStorePath.md
        'settings': 'settings',

      };
      
      const fieldName = sectionFieldMap[sectionId] || sectionId;
      
      // Referencia al documento principal de la tienda
      const storeDocRef = doc(db, "stores", storeId);

      // Filtrar solo campos definidos (permitir null para eliminar campos)
      const dataToSave: Record<string, any> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          dataToSave[key] = value;
        }
      });

      // Preparar la actualización como campos anidados
      const updateData: Record<string, any> = {};
      
      // Para secciones que van en settings (paymentDelivery)
      if (sectionId === 'paymentDelivery') {
        if (data.paymentMethods) updateData['settings.paymentMethods'] = data.paymentMethods;
        if (data.deliveryMethods) updateData['settings.deliveryMethods'] = data.deliveryMethods;
      } else {
        // Para otras secciones, actualizar como campos anidados normales
        Object.entries(dataToSave).forEach(([key, value]) => {
          updateData[`${fieldName}.${key}`] = value;
        });
      }

      // Actualizar en Firestore usando dot notation para campos anidados
      await updateDoc(storeDocRef, updateData);

      // Marcar sección como guardada exitosamente
      set(state => ({
        ...state,
        sections: {
          ...state.sections,
          [sectionId]: {
            ...state.sections[sectionId],
            isSaving: false,
            isDirty: false,
            lastSaved: new Date(),
            error: null
          }
        }
      }));

      return true;

    } catch (err) {
      
      const sectionConfig = PROFILE_SECTIONS[sectionId];
      const sectionName = sectionConfig?.name || sectionId;
      
      const structuredError = errorService.createError(
          ErrorType.BUSINESS_LOGIC,
          'SECTION_UPDATE_ERROR',
          (err as Error).message || `Error al actualizar ${sectionName}`,
          `Error al actualizar la sección ${sectionName}`,
          {
            severity: ErrorSeverity.HIGH,
            context: { storeId, sectionId, data },
            originalError: err as Error,
          recoverable: true,
          retryable: true
        }
      );
      
      errorService.handleError(structuredError);
      
      // Marcar sección con error
      set(state => ({
        ...state,
        sections: {
          ...state.sections,
          [sectionId]: {
            ...state.sections[sectionId],
            isSaving: false,
            error: `Error al actualizar ${sectionName}`
          }
        }
      }));
      
      return false;
    }
  },

  // === ACCIONES GENERALES ===

  /**
   * Actualiza los datos del perfil de la tienda (método legacy)
   * @param uid - ID del usuario/tienda
   * @param data - Datos a actualizar
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updateProfile: async (uid: string, data: FormEditData) => {
    try {
      set({ isUpdating: true, error: null, success: false });

      const success = await get()._updateSectionInFirestore(uid, 'basic', data);
      
      set({ 
        isUpdating: false, 
        error: success ? null : "Error al actualizar el perfil de la tienda",
        success 
      });

      return success;

    } catch (err) {
      set({ 
        error: "Error al actualizar el perfil de la tienda",
        isUpdating: false,
        success: false 
      });
      return false;
    }
  },

  /**
   * Verifica si un nombre de sitio está disponible (es único)
   * @param siteName - Nombre del sitio a validar
   * @returns Promise<boolean> - true si está disponible, false si ya existe
   */
  validateSiteNameUnique: async (siteName: string) => {
    try {
      if (!siteName || siteName.trim().length === 0) {
        set({ error: "Nombre de sitio requerido" });
        return false;
      }

      set({ isValidating: true, error: null });

      // Buscar en la colección stores por basicInfo.slug
      const q = query(
        collection(db, "stores"),
        where("basicInfo.slug", "==", siteName.trim())
      );
      const querySnapshot = await getDocs(q);

      const isAvailable = querySnapshot.empty;

      set({ 
        isValidating: false,
        error: isAvailable ? null : "Este nombre de sitio ya está en uso"
      });

      return isAvailable;

    } catch (err) {
      const structuredError = errorService.createError(
        ErrorType.VALIDATION,
        'SITE_NAME_VALIDATION_ERROR',
        (err as Error).message || 'Error al validar nombre de sitio',
        'Error al validar disponibilidad del nombre',
        {
          severity: ErrorSeverity.MEDIUM,
          context: { siteName },
          originalError: err as Error,
          recoverable: true,
          retryable: true
        }
      );
      
      errorService.handleError(structuredError);
      set({ 
        error: "Error al validar disponibilidad del nombre",
        isValidating: false 
      });
      return false;
    }
  },

  /**
   * Limpia los estados de error y éxito
   */
  clearStatus: () => {
    set({ 
      error: null, 
      success: false 
    });
  },

  // === ACCIONES POR SECCIÓN ===

  /**
   * Actualizar información básica
   * @param storeId - ID de la tienda
   * @param data - Datos de información básica
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updateBasicInfo: async (storeId: string, data: BasicInfoData) => {
    return await get()._updateSectionInFirestore(storeId, 'basic', data);
  },

  /**
   * Actualizar información de contacto
   * @param storeId - ID de la tienda
   * @param data - Datos de contacto
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updateContactInfo: async (storeId: string, data: ContactData) => {
    return await get()._updateSectionInFirestore(storeId, 'contact', data);
  },

  /**
   * Actualizar dirección
   * @param storeId - ID de la tienda
   * @param data - Datos de dirección
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updateAddress: async (storeId: string, data: AddressData) => {
    return await get()._updateSectionInFirestore(storeId, 'address', data);
  },

  /**
   * Actualizar horarios
   * @param storeId - ID de la tienda
   * @param data - Datos de horarios
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updateSchedule: async (storeId: string, data: ScheduleData) => {
    return await get()._updateSectionInFirestore(storeId, 'schedule', data);
  },

  /**
   * Actualizar redes sociales
   * @param storeId - ID de la tienda
   * @param data - Datos de redes sociales
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updateSocialLinks: async (storeId: string, data: SocialLinksData) => {
    return await get()._updateSectionInFirestore(storeId, 'socialLinks', data);
  },

  /**
   * Actualizar tema y colores
   * @param storeId - ID de la tienda
   * @param data - Datos de tema
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updateTheme: async (storeId: string, data: ThemeData) => {
    return await get()._updateSectionInFirestore(storeId, 'theme', data);
  },

  /**
   * Actualizar métodos de pago y entrega
   * @param storeId - ID de la tienda
   * @param data - Datos de métodos de pago y entrega
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updatePaymentDelivery: async (storeId: string, data: PaymentDeliveryData) => {
    return await get()._updateSectionInFirestore(storeId, 'paymentDelivery', data);
  },

  /**
   * Actualizar configuración general
   * @param storeId - ID de la tienda
   * @param data - Datos de configuración
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updateSettings: async (storeId: string, data: SettingsData) => {
    return await get()._updateSectionInFirestore(storeId, 'settings', data);
  },



  // === UTILIDADES DE SECCIÓN ===

  /**
   * Actualizar una sección específica (método genérico)
   * @param storeId - ID de la tienda
   * @param sectionId - ID de la sección
   * @param data - Datos a actualizar
   * @returns Promise<boolean> - true si la actualización fue exitosa
   */
  updateSection: async (storeId: string, sectionId: string, data: SectionData) => {
    // Validar que la sección existe
    const sectionConfig = PROFILE_SECTIONS[sectionId];
    if (!sectionConfig) {
      set(state => ({
        ...state,
        sections: {
          ...state.sections,
          [sectionId]: { 
            ...state.sections[sectionId], 
            error: `Sección '${sectionId}' no encontrada` 
          }
        }
      }));
      return false;
    }

    // Validar datos de la sección
    if (!get().validateSectionData(sectionId, data)) {
      return false;
    }

    return await get()._updateSectionInFirestore(storeId, sectionId, data as Record<string, any>);
  },

  /**
   * Marca una sección como modificada
   * @param section - Nombre de la sección
   */
  markSectionDirty: (section: string) => {
    set(state => ({
      ...state,
      sections: {
        ...state.sections,
        [section]: { ...state.sections[section], isDirty: true }
      }
    }));
  },

  /**
   * Marca una sección como limpia
   * @param section - Nombre de la sección
   */
  markSectionClean: (section: string) => {
    set(state => ({
      ...state,
      sections: {
        ...state.sections,
        [section]: { ...state.sections[section], isDirty: false }
      }
    }));
  },

  /**
   * Obtiene el estado de una sección
   * @param section - Nombre de la sección
   * @returns SectionState - Estado de la sección
   */
  getSectionState: (section: string): SectionState => {
    const state = get();
    return state.sections[section] || createInitialSectionState();
  },

  /**
   * Obtiene la configuración de una sección
   * @param sectionId - ID de la sección
   * @returns ProfileSection | null - Configuración de la sección o null si no existe
   */
  getSectionConfig: (sectionId: string): ProfileSection | null => {
    return PROFILE_SECTIONS[sectionId] || null;
  },

  /**
   * Valida los datos de una sección
   * @param sectionId - ID de la sección
   * @param data - Datos a validar
   * @returns boolean - true si los datos son válidos
   */
  validateSectionData: (sectionId: string, data: SectionData): boolean => {
    const sectionConfig = PROFILE_SECTIONS[sectionId];
    if (!sectionConfig) {
      console.warn(`Sección '${sectionId}' no encontrada`);
      return false;
    }

    // Validación básica: verificar que los campos pertenezcan a la sección
    const dataKeys = Object.keys(data);
    const invalidFields = dataKeys.filter(key => 
      !sectionConfig.fields.includes(key as keyof FormEditData)
    );

    if (invalidFields.length > 0) {
      console.warn(`Campos inválidos para la sección '${sectionId}':`, invalidFields);
      set(state => ({
        ...state,
        sections: {
          ...state.sections,
          [sectionId]: {
            ...state.sections[sectionId],
            error: `Campos inválidos: ${invalidFields.join(', ')}`
          }
        }
      }));
      return false;
    }

    return true;
  },
}));
