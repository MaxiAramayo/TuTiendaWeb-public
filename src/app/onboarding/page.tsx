import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server-session';
import { profileServerService } from '@/features/dashboard/modules/store-settings/services/server/profile.server-service';
import OnboardingWizard from '@/features/auth/components/OnboardingWizard';
import { findStoreIdByUserId, getStoreOnboardingState } from '@/lib/auth/store-session';

export const metadata = {
  title: 'Onboarding | TuTienda',
};

export default async function OnboardingPage() {
  const session = await getServerSession();
  if (!session) redirect('/sign-in');

  const storeId = session.storeId || await findStoreIdByUserId(session.userId);

  let currentStep: 'welcome' | 'basic-info' | 'design-choice' | 'design-customize' | 'product-intro' | 'product-create' | 'complete' = 'welcome';
  let storeSlug: string | null = null;

  let defaults: {
    name?: string;
    description?: string;
    whatsapp?: string;
    slug?: string;
    storeType?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
  } = {};

  if (storeId) {
    const onboarding = await getStoreOnboardingState(storeId);

    if (onboarding.completed) {
      redirect('/dashboard');
    }

    currentStep = onboarding.hasProduct
      ? 'complete'
      : (onboarding.step || 'basic-info');

    const profile = await profileServerService.getProfile(storeId);
    if (profile) {
      storeSlug = profile.basicInfo?.slug || null;
      defaults = {
        name: profile.basicInfo?.name || '',
        description: profile.basicInfo?.description || '',
        whatsapp: profile.contactInfo?.whatsapp || '',
        slug: profile.basicInfo?.slug || '',
        storeType: profile.basicInfo?.type || 'other',
        primaryColor: profile.theme?.primaryColor || '#4F46E5',
        secondaryColor: profile.theme?.secondaryColor || '#EEF2FF',
        accentColor: profile.theme?.accentColor || '#1E1B4B',
        logoUrl: profile.theme?.logoUrl || '',
      };
    }
  }

  return (
    <OnboardingWizard
      initialStep={currentStep}
      storeSlug={storeSlug}
      defaultValues={defaults}
    />
  );
}
