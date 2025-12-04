/**
 * Server Actions para el módulo de perfil de tienda
 * 
 * Maneja todas las mutaciones del perfil siguiendo el patrón Server-First:
 * - Autenticación vía cookies (Server Session)
 * - Validación con Zod
 * - Mutación con Firebase Admin SDK
 * - Revalidación de rutas
 * 
 * @module features/dashboard/modules/store-settings/actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/server-session';
import { profileServerService } from '../services/server/profile.server-service';
import { 
  profileFormSchema,
  basicInfoSchema,
  contactInfoSchema,
  addressSchema,
  socialLinksSchema,
  themeConfigSchema,
  slugValidationSchema
} from '../schemas/profile.schema';
import type { 
  ProfileFormData,
  BasicInfoFormData,
  ContactInfoFormData,
  AddressFormData,
  SocialLinksFormData,
  ThemeConfigFormData 
} from '../schemas/profile.schema';

/**
 * Tipo de respuesta estándar para Server Actions
 */
type ActionResponse<T = unknown> = 
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

/**
 * Obtener perfil del usuario autenticado
 */
export async function getProfileAction(): Promise<ActionResponse<Awaited<ReturnType<typeof profileServerService.getProfile>>>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  try {
    // 2. FETCH
    const profile = await profileServerService.getProfile(session.storeId);
    
    if (!profile) {
      return { success: false, errors: { _form: ['Perfil no encontrado'] } };
    }

    return { success: true, data: profile };
  } catch (error) {
    console.error('Error getting profile:', error);
    return { success: false, errors: { _form: ['Error al obtener el perfil'] } };
  }
}

/**
 * Actualizar perfil completo
 */
export async function updateProfileAction(
  formData: Partial<ProfileFormData>
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  // 2. VALIDATE
  const validation = profileFormSchema.partial().safeParse(formData);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value;
    }
    return { success: false, errors };
  }

  try {
    // 3. MUTATE
    await profileServerService.updateProfile(session.storeId, validation.data);
    
    // 4. REVALIDATE
    revalidatePath('/dashboard/profile');
    revalidatePath(`/${session.storeId}`);
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, errors: { _form: ['Error al actualizar el perfil'] } };
  }
}

/**
 * Actualizar información básica
 */
export async function updateBasicInfoAction(
  data: BasicInfoFormData
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  // 2. VALIDATE
  const validation = basicInfoSchema.safeParse(data);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value;
    }
    return { success: false, errors };
  }

  try {
    // 3. CHECK SLUG UNIQUENESS
    if (data.slug) {
      const isUnique = await profileServerService.isSlugUnique(data.slug, session.storeId);
      if (!isUnique) {
        return { success: false, errors: { slug: ['Este nombre de sitio ya está en uso'] } };
      }
    }

    // 4. MUTATE
    await profileServerService.updateBasicInfo(session.storeId, validation.data);
    
    // 5. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating basic info:', error);
    return { success: false, errors: { _form: ['Error al actualizar la información básica'] } };
  }
}

/**
 * Actualizar información de contacto
 */
export async function updateContactInfoAction(
  data: ContactInfoFormData
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  // 2. VALIDATE
  const validation = contactInfoSchema.safeParse(data);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value;
    }
    return { success: false, errors };
  }

  try {
    // 3. MUTATE
    await profileServerService.updateContactInfo(session.storeId, validation.data);
    
    // 4. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating contact info:', error);
    return { success: false, errors: { _form: ['Error al actualizar la información de contacto'] } };
  }
}

/**
 * Actualizar dirección
 */
export async function updateAddressAction(
  data: AddressFormData
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  // 2. VALIDATE
  const validation = addressSchema.safeParse(data);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value;
    }
    return { success: false, errors };
  }

  try {
    // 3. MUTATE
    await profileServerService.updateAddress(session.storeId, validation.data);
    
    // 4. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating address:', error);
    return { success: false, errors: { _form: ['Error al actualizar la dirección'] } };
  }
}

/**
 * Actualizar redes sociales
 */
export async function updateSocialLinksAction(
  data: SocialLinksFormData
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  // 2. VALIDATE
  const validation = socialLinksSchema.safeParse(data);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value;
    }
    return { success: false, errors };
  }

  try {
    // 3. MUTATE
    await profileServerService.updateSocialLinks(session.storeId, validation.data);
    
    // 4. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating social links:', error);
    return { success: false, errors: { _form: ['Error al actualizar las redes sociales'] } };
  }
}

/**
 * Actualizar tema/apariencia
 */
export async function updateThemeAction(
  data: ThemeConfigFormData
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  // 2. VALIDATE
  const validation = themeConfigSchema.safeParse(data);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const errors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
      if (value) errors[key] = value;
    }
    return { success: false, errors };
  }

  try {
    // 3. MUTATE
    await profileServerService.updateTheme(session.storeId, validation.data);
    
    // 4. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating theme:', error);
    return { success: false, errors: { _form: ['Error al actualizar el tema'] } };
  }
}

/**
 * Validar disponibilidad de slug
 */
export async function validateSlugAction(
  slug: string
): Promise<ActionResponse<{ available: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  // 2. VALIDATE FORMAT
  const validation = slugValidationSchema.safeParse({ slug });
  if (!validation.success) {
    return { success: false, errors: { slug: ['Formato de slug inválido'] } };
  }

  try {
    // 3. CHECK AVAILABILITY
    const isUnique = await profileServerService.isSlugUnique(slug, session.storeId);
    
    return { success: true, data: { available: isUnique } };
  } catch (error) {
    console.error('Error validating slug:', error);
    return { success: false, errors: { _form: ['Error al validar disponibilidad'] } };
  }
}

/**
 * Actualizar métodos de pago
 */
export async function updatePaymentMethodsAction(
  paymentMethods: Array<{
    id: string;
    name: string;
    enabled: boolean;
    instructions?: string;
  }>
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  try {
    // 2. MUTATE
    await profileServerService.updateSettings(session.storeId, { paymentMethods });
    
    // 3. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating payment methods:', error);
    return { success: false, errors: { _form: ['Error al actualizar los métodos de pago'] } };
  }
}

/**
 * Actualizar métodos de entrega
 */
export async function updateDeliveryMethodsAction(
  deliveryMethods: Array<{
    id: string;
    name: string;
    enabled: boolean;
    price?: number;
    instructions?: string;
  }>
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  try {
    // 2. MUTATE
    await profileServerService.updateSettings(session.storeId, { deliveryMethods });
    
    // 3. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating delivery methods:', error);
    return { success: false, errors: { _form: ['Error al actualizar los métodos de entrega'] } };
  }
}

/**
 * Actualizar horarios
 */
export async function updateScheduleAction(
  schedule: Record<string, {
    closed?: boolean;
    periods?: Array<{ open: string; close: string; nextDay?: boolean }>;
  }>
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  try {
    // 2. MUTATE
    await profileServerService.updateSchedule(session.storeId, schedule);
    
    // 3. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating schedule:', error);
    return { success: false, errors: { _form: ['Error al actualizar los horarios'] } };
  }
}

/**
 * Actualizar métodos de pago y entrega combinados
 */
export async function updatePaymentDeliveryAction(
  data: {
    paymentMethods: Array<{
      id: string;
      name: string;
      enabled: boolean;
      instructions?: string;
    }>;
    deliveryMethods: Array<{
      id: string;
      name: string;
      enabled: boolean;
      price?: number;
      instructions?: string;
    }>;
  }
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  try {
    // 2. MUTATE - actualizar ambos
    await profileServerService.updateSettings(session.storeId, {
      paymentMethods: data.paymentMethods,
      deliveryMethods: data.deliveryMethods,
    });
    
    // 3. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating payment/delivery methods:', error);
    return { success: false, errors: { _form: ['Error al actualizar los métodos de pago y entrega'] } };
  }
}

/**
 * Actualizar configuración de suscripción
 */
export async function updateSubscriptionAction(
  subscription: {
    active: boolean;
    plan?: 'free' | 'basic' | 'premium' | 'enterprise';
    billing?: {
      provider?: 'mercadopago' | 'stripe';
      autoRenew?: boolean;
    };
  }
): Promise<ActionResponse<{ updated: boolean }>> {
  // 1. AUTH
  const session = await getServerSession();
  if (!session) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }
  if (!session.storeId) {
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  try {
    // 2. MUTATE
    await profileServerService.updateSettings(session.storeId, { subscription });
    
    // 3. REVALIDATE
    revalidatePath('/dashboard/profile');
    
    return { success: true, data: { updated: true } };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, errors: { _form: ['Error al actualizar la suscripción'] } };
  }
}
