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
    street?: string;
    city?: string;
    zipCode?: string;
  } = {};

  if (storeId) {
    const onboarding = await getStoreOnboardingState(storeId);

    if (onboarding.completed) {
      redirect('/dashboard');
    }

    const profile = await profileServerService.getProfile(storeId);
    if (profile) {
      storeSlug = profile.basicInfo?.slug || null;
      defaults = {
        name: profile.basicInfo?.name || '',
        description: profile.basicInfo?.description || '',
        whatsapp: profile.contactInfo?.whatsapp || '+54 ',
        slug: profile.basicInfo?.slug || '',
        storeType: profile.basicInfo?.type || 'other',
        primaryColor: profile.theme?.primaryColor || '#4F46E5',
        secondaryColor: profile.theme?.secondaryColor || '#EEF2FF',
        accentColor: profile.theme?.accentColor || '#1E1B4B',
        street: profile.address?.street || '',
        city: profile.address?.city || '',
        zipCode: profile.address?.zipCode || '',
      };
    }
  }

  return (
    <OnboardingWizard
      storeSlug={storeSlug}
      defaultValues={defaults}
    />
  );
}
