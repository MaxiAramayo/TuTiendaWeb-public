'use server';

import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getServerSession } from '@/lib/auth/server-session';
import { createStore } from '@/features/store/services/store.service';
import { setUserClaims, revokeUserTokens } from '@/features/auth/services/server/auth.service';
import {
  onboardingBasicInfoSchema,
  onboardingDesignSchema,
  onboardingProductSchema,
  onboardingCompleteSchema,
  type OnboardingBasicInfoInput,
  type OnboardingDesignInput,
  type OnboardingProductInput,
  type OnboardingCompleteInput,
} from '@/features/auth/schemas/onboarding.schema';
import { ActionResponse } from '@/features/auth/auth.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const ONBOARDING_STEPS = [
  'welcome',
  'basic-info',
  'design-choice',
  'design-customize',
  'product-intro',
  'product-create',
  'complete',
] as const;

type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
type OnboardingEventType = 'skip' | 'back' | 'next' | 'abandon';

// ============================================================================
// HELPERS
// ============================================================================

async function getCurrentStore(userId: string, sessionStoreId: string | null) {
  if (sessionStoreId) {
    const doc = await adminDb.collection('stores').doc(sessionStoreId).get();
    if (doc.exists) return { id: doc.id, data: doc.data() as Record<string, unknown> };
  }

  const byOwner = await adminDb
    .collection('stores')
    .where('metadata.ownerId', '==', userId)
    .limit(1)
    .get();

  if (!byOwner.empty) {
    const doc = byOwner.docs[0];
    return { id: doc.id, data: doc.data() as Record<string, unknown> };
  }

  return null;
}

async function markStep(storeId: string, step: OnboardingStep) {
  await adminDb.collection('stores').doc(storeId).update({
    'metadata.onboardingStep': step,
    'metadata.updatedAt': FieldValue.serverTimestamp(),
  });
}

// ============================================================================
// NEW: Complete onboarding with flat schema (v2 - 9 slices)
// ============================================================================

export async function completeNewOnboardingAction(
  input: OnboardingCompleteInput
): Promise<ActionResponse<{ storeId: string; done: boolean }>> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  const parsed = onboardingCompleteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  let store = await getCurrentStore(session.userId, session.storeId);
  let storeId = store?.id;

  try {
    if (!store) {
      // Create the store
      const created = await createStore({
        storeName: data.name,
        storeType: data.storeType,
        slug: data.slug,
        phone: data.whatsapp,
        address: data.street || '',
        ownerId: session.userId,
      });

      storeId = created.id;
      store = { id: created.id, data: created as unknown as Record<string, unknown> };

      await setUserClaims(session.userId, { storeId: created.id, role: 'owner' });
      await revokeUserTokens(session.userId);
    }

    // Update store with all onboarding data
    const updates: Record<string, unknown> = {
      'basicInfo.name': data.name,
      'basicInfo.description': data.description,
      'basicInfo.slug': data.slug,
      'basicInfo.type': data.storeType,
      'contactInfo.whatsapp': data.whatsapp,
      'contactInfo.phone': data.whatsapp,
      'address.street': data.street || '',
      'address.city': data.city || '',
      'address.zipCode': data.zipCode || '',
      'metadata.onboardingStep': 'complete',
      'metadata.onboardingCompleted': true,
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    };

    if (data.primaryColor) updates['theme.primaryColor'] = data.primaryColor;
    if (data.secondaryColor) updates['theme.secondaryColor'] = data.secondaryColor;
    if (data.accentColor) updates['theme.accentColor'] = data.accentColor;

    await adminDb.collection('stores').doc(storeId!).update(updates);

    // No llamamos revalidatePath aquí para no disparar un refresh del router
    // que causaría que page.tsx detecte onboardingCompleted=true y redirija
    // antes de mostrar la pantalla de felicitaciones.
    // El dashboard recibirá datos frescos cuando el usuario navegue allí.
    return { success: true, data: { storeId: storeId!, done: true } };
  } catch (error) {
    console.error('[onboarding] complete new onboarding error', error);
    return { success: false, errors: { _form: ['No se pudo completar el onboarding'] } };
  }
}

// ============================================================================
// LEGACY: Complete full onboarding (v1 - old nested schema)
// ============================================================================

export async function completeFullOnboardingAction(
  input: any
): Promise<ActionResponse<{ storeId: string; done: boolean }>> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  const { basicInfo, design, product } = input;
  let store = await getCurrentStore(session.userId, session.storeId);
  let storeId = store?.id;

  try {
    if (!store) {
      const created = await createStore({
        storeName: basicInfo.name,
        storeType: basicInfo.storeType,
        slug: basicInfo.slug,
        phone: basicInfo.whatsapp,
        address: '',
        ownerId: session.userId,
      });

      storeId = created.id;
      store = {
        id: created.id,
        data: created as unknown as Record<string, unknown>,
      };

      await setUserClaims(session.userId, { storeId: created.id, role: 'owner' });
      await revokeUserTokens(session.userId);
    }

    const updates: Record<string, unknown> = {
      'basicInfo.name': basicInfo.name,
      'basicInfo.description': basicInfo.description,
      'basicInfo.slug': basicInfo.slug,
      'basicInfo.type': basicInfo.storeType,
      'contactInfo.whatsapp': basicInfo.whatsapp,
      'contactInfo.phone': basicInfo.whatsapp,
      'metadata.onboardingStep': 'complete',
      'metadata.onboardingCompleted': true,
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    };

    if (design?.primaryColor) updates['theme.primaryColor'] = design.primaryColor;
    if (design?.secondaryColor) updates['theme.secondaryColor'] = design.secondaryColor;
    if (design?.accentColor) updates['theme.accentColor'] = design.accentColor;
    if (design?.logoUrl !== undefined) updates['theme.logoUrl'] = design.logoUrl || '';

    await adminDb.collection('stores').doc(storeId!).update(updates);

    // If product is provided, try creating it
    if (product && product.name && product.price !== undefined && product.price > 0) {
      const categoriesSnap = await adminDb
        .collection('stores')
        .doc(storeId!)
        .collection('categories')
        .limit(1)
        .get();

      let categoryId: string | null = null;
      if (categoriesSnap.empty) {
        try {
          const catRef = await adminDb.collection('stores').doc(storeId!).collection('categories').add({
            name: product.categoryName || 'General',
            slug: (product.categoryName || 'General').toLowerCase().replace(/\s+/g, '-'),
            storeId: storeId!,
            isActive: true,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          categoryId = catRef.id;
        } catch (e) {
          console.error('[onboarding] fast category creation failed', e);
        }
      } else {
        categoryId = categoriesSnap.docs[0].id;
      }

      if (categoryId) {
        try {
          await adminDb.collection('stores').doc(storeId!).collection('products').add({
            name: product.name,
            description: product.description || '',
            price: product.price,
            costPrice: 0,
            categoryId,
            active: true,
            status: 'active',
            storeId: storeId!,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (e) {
          console.error('[onboarding] fast product creation failed', e);
        }
      }
    }

    revalidatePath('/dashboard');
    return { success: true, data: { storeId: storeId!, done: true } };
  } catch (error) {
    console.error('[onboarding] complete full onboarding error', error);
    return { success: false, errors: { _form: ['No se pudo completar el onboarding'] } };
  }
}

// ============================================================================
// GET ONBOARDING STATE
// ============================================================================

export async function getOnboardingStateAction(): Promise<
  ActionResponse<{
    hasStore: boolean;
    storeId: string | null;
    completed: boolean;
    currentStep: OnboardingStep;
    hasProduct: boolean;
    storeSlug: string | null;
  }>
> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  const store = await getCurrentStore(session.userId, session.storeId);
  if (!store) {
    return {
      success: true,
      data: {
        hasStore: false,
        storeId: null,
        completed: false,
        currentStep: 'welcome',
        hasProduct: false,
        storeSlug: null,
      },
    };
  }

  const productSnap = await adminDb.collection('stores').doc(store.id).collection('products').limit(1).get();
  const hasProduct = !productSnap.empty;
  const completed = Boolean((store.data.metadata as any)?.onboardingCompleted);
  const metadataStep = (store.data.metadata as any)?.onboardingStep as OnboardingStep | undefined;
  const currentStep = completed || hasProduct
    ? 'complete'
    : metadataStep || 'basic-info';

  return {
    success: true,
    data: {
      hasStore: true,
      storeId: store.id,
      completed,
      currentStep,
      hasProduct,
      storeSlug: (store.data.basicInfo as any)?.slug || null,
    },
  };
}

// ============================================================================
// STEP-BY-STEP ACTIONS (legacy, kept for backward compat)
// ============================================================================

export async function saveOnboardingBasicInfoAction(
  input: OnboardingBasicInfoInput
): Promise<ActionResponse<{ storeId: string }>> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  const parsed = onboardingBasicInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  let store = await getCurrentStore(session.userId, session.storeId);

  try {
    if (!store) {
      const created = await createStore({
        storeName: data.name,
        storeType: data.storeType,
        slug: data.slug,
        phone: data.whatsapp,
        address: '',
        ownerId: session.userId,
      });

      store = {
        id: created.id,
        data: created as unknown as Record<string, unknown>,
      };

      await setUserClaims(session.userId, { storeId: created.id, role: 'owner' });
      await revokeUserTokens(session.userId);
    }

    await adminDb.collection('stores').doc(store.id).update({
      'basicInfo.name': data.name,
      'basicInfo.description': data.description,
      'basicInfo.slug': data.slug,
      'basicInfo.type': data.storeType,
      'contactInfo.whatsapp': data.whatsapp,
      'contactInfo.phone': data.whatsapp,
      'metadata.onboardingStep': 'design-choice',
      'metadata.onboardingCompleted': false,
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings/general');

    return { success: true, data: { storeId: store.id } };
  } catch (error) {
    console.error('[onboarding] save basic info error', error);
    return { success: false, errors: { _form: ['No se pudo guardar la informacion basica'] } };
  }
}

export async function chooseOnboardingDesignAction(
  customize: boolean
): Promise<ActionResponse<{ nextStep: OnboardingStep }>> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  const store = await getCurrentStore(session.userId, session.storeId);
  if (!store) return { success: false, errors: { _form: ['Tienda no encontrada'] } };

  const nextStep: OnboardingStep = customize ? 'design-customize' : 'product-intro';
  await markStep(store.id, nextStep);
  return { success: true, data: { nextStep } };
}

export async function advanceOnboardingStepAction(
  step: OnboardingStep
): Promise<ActionResponse<{ currentStep: OnboardingStep }>> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  if (!ONBOARDING_STEPS.includes(step)) {
    return { success: false, errors: { _form: ['Paso de onboarding invalido'] } };
  }

  const store = await getCurrentStore(session.userId, session.storeId);

  if (!store) {
    if (step === 'welcome' || step === 'basic-info') {
      return { success: true, data: { currentStep: step } };
    }
    return { success: false, errors: { _form: ['Tienda no encontrada'] } };
  }

  await markStep(store.id, step);
  return { success: true, data: { currentStep: step } };
}

export async function saveOnboardingDesignAction(
  input: OnboardingDesignInput
): Promise<ActionResponse<{ updated: boolean }>> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  const parsed = onboardingDesignSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const store = await getCurrentStore(session.userId, session.storeId);
  if (!store) return { success: false, errors: { _form: ['Tienda no encontrada'] } };

  const updates: Record<string, unknown> = {
    'metadata.onboardingStep': 'product-intro',
    'metadata.updatedAt': FieldValue.serverTimestamp(),
  };

  if (parsed.data.primaryColor) updates['theme.primaryColor'] = parsed.data.primaryColor;
  if (parsed.data.secondaryColor) updates['theme.secondaryColor'] = parsed.data.secondaryColor;
  if (parsed.data.accentColor) updates['theme.accentColor'] = parsed.data.accentColor;
  if (parsed.data.logoUrl !== undefined) updates['theme.logoUrl'] = parsed.data.logoUrl || '';

  await adminDb.collection('stores').doc(store.id).update(updates);
  revalidatePath('/dashboard/settings/appearance');

  return { success: true, data: { updated: true } };
}

export async function createOnboardingProductAction(
  input: OnboardingProductInput
): Promise<ActionResponse<{ productId: string }>> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  const parsed = onboardingProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const store = await getCurrentStore(session.userId, session.storeId);
  if (!store) return { success: false, errors: { _form: ['Tienda no encontrada'] } };

  const categoriesSnap = await adminDb
    .collection('stores')
    .doc(store.id)
    .collection('categories')
    .limit(1)
    .get();

  let categoryId: string;

  try {
    if (categoriesSnap.empty) {
      const catRef = await adminDb.collection('stores').doc(store.id).collection('categories').add({
        name: parsed.data.categoryName || 'General',
        slug: (parsed.data.categoryName || 'General').toLowerCase().replace(/\s+/g, '-'),
        storeId: store.id,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      categoryId = catRef.id;
    } else {
      categoryId = categoriesSnap.docs[0].id;
    }
  } catch (error) {
    console.error('[onboarding] create category error', error);
    return { success: false, errors: { _form: ['No se pudo crear la categoria inicial'] } };
  }

  try {
    const productRef = await adminDb.collection('stores').doc(store.id).collection('products').add({
      name: parsed.data.name || '',
      description: parsed.data.description || '',
      price: parsed.data.price || 0,
      costPrice: 0,
      categoryId,
      active: true,
      status: 'active',
      storeId: store.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection('stores').doc(store.id).update({
      'metadata.onboardingCompleted': true,
      'metadata.onboardingStep': 'complete',
      'metadata.updatedAt': FieldValue.serverTimestamp(),
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/products');

    return { success: true, data: { productId: productRef.id } };
  } catch (error) {
    console.error('[onboarding] create product error', error);
    return { success: false, errors: { _form: ['No se pudo crear el producto'] } };
  }
}

export async function completeOnboardingAction(): Promise<ActionResponse<{ done: boolean }>> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  const store = await getCurrentStore(session.userId, session.storeId);
  if (!store) return { success: false, errors: { _form: ['Tienda no encontrada'] } };

  await adminDb.collection('stores').doc(store.id).update({
    'metadata.onboardingCompleted': true,
    'metadata.onboardingStep': 'complete',
    'metadata.updatedAt': FieldValue.serverTimestamp(),
  });

  return { success: true, data: { done: true } };
}

export async function trackOnboardingEventAction(
  eventType: OnboardingEventType,
  step: OnboardingStep,
  detail?: string
): Promise<ActionResponse<{ tracked: boolean }>> {
  const session = await getServerSession();
  if (!session) return { success: false, errors: { _form: ['No autenticado'] } };

  const store = await getCurrentStore(session.userId, session.storeId);
  if (!store) return { success: false, errors: { _form: ['Tienda no encontrada'] } };

  const metadata = (store.data.metadata as Record<string, unknown>) || {};
  const tracking = (metadata.onboardingTracking as Record<string, unknown>) || {};

  const events = Array.isArray(tracking.events)
    ? [...(tracking.events as Array<Record<string, unknown>>)]
    : [];

  events.push({
    eventType,
    step,
    detail: detail || '',
    at: Date.now(),
  });

  const skippedSteps = Array.isArray(tracking.skippedSteps)
    ? [...(tracking.skippedSteps as string[])]
    : [];

  if (eventType === 'skip' && !skippedSteps.includes(step)) {
    skippedSteps.push(step);
  }

  await adminDb.collection('stores').doc(store.id).update({
    'metadata.onboardingTracking': {
      ...tracking,
      skippedSteps,
      events: events.slice(-80),
      lastEventType: eventType,
      lastEventStep: step,
      lastEventAt: Date.now(),
    },
    'metadata.updatedAt': FieldValue.serverTimestamp(),
  });

  return { success: true, data: { tracked: true } };
}
