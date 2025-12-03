/**
 * Servicio de perfil de tienda - Server Side
 * 
 * Usa Firebase Admin SDK para operaciones del lado servidor.
 * Este servicio es usado exclusivamente por Server Actions.
 * 
 * @module features/dashboard/modules/store-settings/services/server
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { 
  BasicInfoFormData,
  ContactInfoFormData,
  AddressFormData,
  SocialLinksFormData,
  ThemeConfigFormData 
} from '../../schemas/profile.schema';

const STORES_COLLECTION = 'stores';

/**
 * Tipos para el servicio - Internos (con Timestamps de Firebase)
 */
interface StoreProfileRaw {
  id: string;
  ownerId: string;
  basicInfo: {
    name: string;
    description: string;
    slug: string;
    type: string;
    category?: string;
  };
  contactInfo: {
    whatsapp: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  address?: {
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    zipCode?: string;
  };
  schedule?: Record<string, {
    closed?: boolean;
    periods?: Array<{ open: string; close: string; nextDay?: boolean }>;
  }>;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
  };
  theme?: {
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    style?: string;
    buttonStyle?: string;
  };
  settings?: {
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
  };
  subscription?: {
    active: boolean;
    plan: string;
    startDate: Timestamp | { _seconds: number; _nanoseconds: number };
    endDate: Timestamp | { _seconds: number; _nanoseconds: number };
    trialUsed: boolean;
  };
  metadata: {
    createdAt: Timestamp | { _seconds: number; _nanoseconds: number };
    updatedAt: Timestamp | { _seconds: number; _nanoseconds: number };
    version: number;
    status: string;
  };
}

/**
 * Tipos serializables para Client Components
 */
export interface StoreProfile {
  id: string;
  ownerId: string;
  basicInfo: {
    name: string;
    description: string;
    slug: string;
    type: string;
    category?: string;
  };
  contactInfo: {
    whatsapp: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  address?: {
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    zipCode?: string;
  };
  schedule?: Record<string, {
    closed?: boolean;
    periods?: Array<{ open: string; close: string; nextDay?: boolean }>;
  }>;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
  };
  theme?: {
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    style?: string;
    buttonStyle?: string;
  };
  settings?: {
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
  };
  subscription?: {
    active: boolean;
    plan: string;
    startDate: string; // ISO string serializado
    endDate: string;   // ISO string serializado
    trialUsed: boolean;
  };
  metadata: {
    createdAt: string; // ISO string serializado
    updatedAt: string; // ISO string serializado
    version: number;
    status: string;
  };
}

/**
 * Convierte un Timestamp de Firebase a ISO string
 */
function serializeTimestamp(
  timestamp: Timestamp | { _seconds: number; _nanoseconds: number } | null | undefined
): string {
  if (!timestamp) {
    return new Date().toISOString();
  }
  
  // Si es un Timestamp de Firebase Admin
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  
  // Si es un objeto con _seconds (formato serializado de Firestore)
  if (typeof timestamp === 'object' && '_seconds' in timestamp) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }
  
  return new Date().toISOString();
}

/**
 * Serializa un perfil completo para pasarlo a Client Components
 */
function serializeProfile(raw: StoreProfileRaw): StoreProfile {
  return {
    ...raw,
    subscription: raw.subscription ? {
      ...raw.subscription,
      startDate: serializeTimestamp(raw.subscription.startDate),
      endDate: serializeTimestamp(raw.subscription.endDate),
    } : undefined,
    metadata: {
      ...raw.metadata,
      createdAt: serializeTimestamp(raw.metadata.createdAt),
      updatedAt: serializeTimestamp(raw.metadata.updatedAt),
    },
  };
}

/**
 * Servicio de perfil - Server Side (Firebase Admin)
 */
class ProfileServerService {
  /**
   * Obtener perfil de la tienda por storeId
   * Devuelve datos serializables (sin Timestamps de Firebase)
   */
  async getProfile(storeId: string): Promise<StoreProfile | null> {
    try {
      const docRef = adminDb.collection(STORES_COLLECTION).doc(storeId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return null;
      }

      const data = docSnap.data() as Omit<StoreProfileRaw, 'id'>;
      const rawProfile: StoreProfileRaw = {
        id: docSnap.id,
        ...data,
      };

      // Serializar para que sea compatible con Client Components
      return serializeProfile(rawProfile);
    } catch (error) {
      console.error('Error getting profile:', error);
      throw new Error('No se pudo obtener el perfil');
    }
  }

  /**
   * Actualizar perfil completo
   */
  async updateProfile(storeId: string, data: Record<string, unknown>): Promise<void> {
    try {
      const docRef = adminDb.collection(STORES_COLLECTION).doc(storeId);
      
      // Construir objeto de actualización con dot notation
      const updateData: Record<string, unknown> = {
        'metadata.updatedAt': FieldValue.serverTimestamp(),
      };

      // Mapear campos planos a estructura anidada
      if (data.name !== undefined) updateData['basicInfo.name'] = data.name;
      if (data.description !== undefined) updateData['basicInfo.description'] = data.description;
      if (data.siteName !== undefined) updateData['basicInfo.slug'] = (data.siteName as string).toLowerCase().trim();
      if (data.storeType !== undefined) updateData['basicInfo.type'] = data.storeType;
      if (data.category !== undefined) updateData['basicInfo.category'] = data.category;
      
      if (data.whatsapp !== undefined) updateData['contactInfo.whatsapp'] = data.whatsapp;
      if (data.website !== undefined) updateData['contactInfo.website'] = data.website || '';
      
      if (data.street !== undefined) updateData['address.street'] = data.street;
      if (data.city !== undefined) updateData['address.city'] = data.city;
      if (data.province !== undefined) updateData['address.province'] = data.province;
      if (data.country !== undefined) updateData['address.country'] = data.country;
      if (data.zipCode !== undefined) updateData['address.zipCode'] = data.zipCode;
      
      if (data.instagram !== undefined) updateData['socialLinks.instagram'] = data.instagram || '';
      if (data.facebook !== undefined) updateData['socialLinks.facebook'] = data.facebook || '';
      
      if (data.schedule !== undefined) updateData['schedule'] = data.schedule;
      
      if (data.paymentMethods !== undefined) updateData['settings.paymentMethods'] = data.paymentMethods;
      if (data.deliveryMethods !== undefined) updateData['settings.deliveryMethods'] = data.deliveryMethods;
      
      // Campos de tema
      if (data.primaryColor !== undefined) updateData['theme.primaryColor'] = data.primaryColor;
      if (data.secondaryColor !== undefined) updateData['theme.secondaryColor'] = data.secondaryColor;
      if (typeof data.theme === 'object' && data.theme !== null) {
        const theme = data.theme as Record<string, unknown>;
        Object.entries(theme).forEach(([key, value]) => {
          if (value !== undefined) {
            updateData[`theme.${key}`] = value;
          }
        });
      }

      await docRef.update(updateData);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('No se pudo actualizar el perfil');
    }
  }

  /**
   * Actualizar información básica
   */
  async updateBasicInfo(storeId: string, data: BasicInfoFormData): Promise<void> {
    try {
      const docRef = adminDb.collection(STORES_COLLECTION).doc(storeId);
      
      const updateData: Record<string, unknown> = {
        'metadata.updatedAt': FieldValue.serverTimestamp(),
      };

      if (data.name !== undefined) updateData['basicInfo.name'] = data.name;
      if (data.description !== undefined) updateData['basicInfo.description'] = data.description;
      if (data.slug !== undefined) updateData['basicInfo.slug'] = data.slug.toLowerCase().trim();
      if (data.type !== undefined) updateData['basicInfo.type'] = data.type;

      await docRef.update(updateData);
    } catch (error) {
      console.error('Error updating basic info:', error);
      throw new Error('No se pudo actualizar la información básica');
    }
  }

  /**
   * Actualizar información de contacto
   */
  async updateContactInfo(storeId: string, data: ContactInfoFormData): Promise<void> {
    try {
      const docRef = adminDb.collection(STORES_COLLECTION).doc(storeId);
      
      const updateData: Record<string, unknown> = {
        'metadata.updatedAt': FieldValue.serverTimestamp(),
      };

      if (data.whatsapp !== undefined) updateData['contactInfo.whatsapp'] = data.whatsapp;
      if (data.email !== undefined) updateData['contactInfo.email'] = data.email;
      if (data.phone !== undefined) updateData['contactInfo.phone'] = data.phone;
      if (data.website !== undefined) updateData['contactInfo.website'] = data.website || '';

      await docRef.update(updateData);
    } catch (error) {
      console.error('Error updating contact info:', error);
      throw new Error('No se pudo actualizar la información de contacto');
    }
  }

  /**
   * Actualizar dirección
   */
  async updateAddress(storeId: string, data: AddressFormData): Promise<void> {
    try {
      const docRef = adminDb.collection(STORES_COLLECTION).doc(storeId);
      
      const updateData: Record<string, unknown> = {
        'metadata.updatedAt': FieldValue.serverTimestamp(),
      };

      if (data.street !== undefined) updateData['address.street'] = data.street;
      if (data.city !== undefined) updateData['address.city'] = data.city;
      if (data.province !== undefined) updateData['address.province'] = data.province;
      if (data.country !== undefined) updateData['address.country'] = data.country;
      if (data.zipCode !== undefined) updateData['address.zipCode'] = data.zipCode;

      await docRef.update(updateData);
    } catch (error) {
      console.error('Error updating address:', error);
      throw new Error('No se pudo actualizar la dirección');
    }
  }

  /**
   * Actualizar redes sociales
   */
  async updateSocialLinks(storeId: string, data: SocialLinksFormData): Promise<void> {
    try {
      const docRef = adminDb.collection(STORES_COLLECTION).doc(storeId);
      
      const updateData: Record<string, unknown> = {
        'metadata.updatedAt': FieldValue.serverTimestamp(),
      };

      if (data.instagram !== undefined) updateData['socialLinks.instagram'] = data.instagram || '';
      if (data.facebook !== undefined) updateData['socialLinks.facebook'] = data.facebook || '';

      await docRef.update(updateData);
    } catch (error) {
      console.error('Error updating social links:', error);
      throw new Error('No se pudo actualizar las redes sociales');
    }
  }

  /**
   * Actualizar tema/apariencia
   */
  async updateTheme(storeId: string, data: ThemeConfigFormData): Promise<void> {
    try {
      const docRef = adminDb.collection(STORES_COLLECTION).doc(storeId);
      
      const updateData: Record<string, unknown> = {
        'metadata.updatedAt': FieldValue.serverTimestamp(),
      };

      // Solo incluir campos que tengan valor (no undefined)
      if (data.logoUrl !== undefined) updateData['theme.logoUrl'] = data.logoUrl || '';
      if (data.bannerUrl !== undefined) updateData['theme.bannerUrl'] = data.bannerUrl || '';
      if (data.primaryColor !== undefined) updateData['theme.primaryColor'] = data.primaryColor;
      if (data.secondaryColor !== undefined) updateData['theme.secondaryColor'] = data.secondaryColor;
      if (data.accentColor !== undefined) updateData['theme.accentColor'] = data.accentColor;
      if (data.fontFamily !== undefined) updateData['theme.fontFamily'] = data.fontFamily;
      if (data.style !== undefined) updateData['theme.style'] = data.style;
      if (data.buttonStyle !== undefined) updateData['theme.buttonStyle'] = data.buttonStyle;

      await docRef.update(updateData);
    } catch (error) {
      console.error('Error updating theme:', error);
      throw new Error('No se pudo actualizar el tema');
    }
  }

  /**
   * Actualizar configuración (métodos de pago/entrega)
   */
  async updateSettings(storeId: string, data: {
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
  }): Promise<void> {
    try {
      const docRef = adminDb.collection(STORES_COLLECTION).doc(storeId);
      
      const updateData: Record<string, unknown> = {
        'metadata.updatedAt': FieldValue.serverTimestamp(),
      };

      if (data.paymentMethods !== undefined) {
        updateData['settings.paymentMethods'] = data.paymentMethods;
      }
      if (data.deliveryMethods !== undefined) {
        updateData['settings.deliveryMethods'] = data.deliveryMethods;
      }

      await docRef.update(updateData);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('No se pudo actualizar la configuración');
    }
  }

  /**
   * Actualizar horarios
   */
  async updateSchedule(storeId: string, schedule: Record<string, {
    closed?: boolean;
    periods?: Array<{ open: string; close: string; nextDay?: boolean }>;
  }>): Promise<void> {
    try {
      const docRef = adminDb.collection(STORES_COLLECTION).doc(storeId);
      
      await docRef.update({
        'schedule': schedule,
        'metadata.updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw new Error('No se pudo actualizar los horarios');
    }
  }

  /**
   * Verificar si un slug es único
   */
  async isSlugUnique(slug: string, excludeStoreId?: string): Promise<boolean> {
    try {
      const normalizedSlug = slug.toLowerCase().trim();
      
      const querySnapshot = await adminDb
        .collection(STORES_COLLECTION)
        .where('basicInfo.slug', '==', normalizedSlug)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return true;
      }

      // Si encontramos un documento, verificar que no sea el mismo que estamos editando
      if (excludeStoreId && querySnapshot.docs.length === 1) {
        return querySnapshot.docs[0].id === excludeStoreId;
      }

      return false;
    } catch (error) {
      console.error('Error checking slug uniqueness:', error);
      throw new Error('No se pudo verificar la disponibilidad del nombre');
    }
  }
}

// Instancia singleton
export const profileServerService = new ProfileServerService();
