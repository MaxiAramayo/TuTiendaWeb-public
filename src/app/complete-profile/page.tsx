/**
 * Página para completar el perfil después del registro con Google
 * 
 * @module app/complete-profile
 */

import { Metadata } from 'next';
import { GoogleProfileSetup } from '@/features/auth/components/GoogleProfileSetup';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Completar perfil | TuTienda',
  description: 'Completa tu perfil para comenzar a usar TuTienda',
};

/**
 * Página para completar el perfil después del registro con Google
 */
export default function CompleteProfilePage() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <AuthLayout 
        title="Completa tu perfil"
        subtitle="Solo unos detalles más para comenzar con tu tienda"
      >
        <GoogleProfileSetup />
      </AuthLayout>
    </>
  );
}