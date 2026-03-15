import { adminDb } from '@/lib/firebase/admin';

export async function findStoreIdByUserId(userId: string): Promise<string | null> {
  const byMetadataOwner = await adminDb
    .collection('stores')
    .where('metadata.ownerId', '==', userId)
    .limit(1)
    .get();

  if (!byMetadataOwner.empty) {
    return byMetadataOwner.docs[0].id;
  }

  const byRootOwner = await adminDb
    .collection('stores')
    .where('ownerId', '==', userId)
    .limit(1)
    .get();

  if (!byRootOwner.empty) {
    return byRootOwner.docs[0].id;
  }

  return null;
}

export async function getStoreOnboardingState(storeId: string) {
  const storeDoc = await adminDb.collection('stores').doc(storeId).get();

  if (!storeDoc.exists) {
    return {
      exists: false,
      completed: false,
      step: 'welcome' as const,
      hasProduct: false,
      metadata: {},
    };
  }

  const metadata = (storeDoc.data()?.metadata || {}) as Record<string, unknown>;
  const completed = Boolean(metadata.onboardingCompleted);
  const step = (metadata.onboardingStep as
    | 'welcome'
    | 'basic-info'
    | 'design-choice'
    | 'design-customize'
    | 'product-intro'
    | 'product-create'
    | 'complete'
    | undefined) || 'welcome';

  const productSnap = await adminDb
    .collection('stores')
    .doc(storeId)
    .collection('products')
    .limit(1)
    .get();

  return {
    exists: true,
    completed,
    step,
    hasProduct: !productSnap.empty,
    metadata,
  };
}
