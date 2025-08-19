/**
 * Página de registro
 * 
 * @module app/sign-up
 */

import { Metadata } from 'next';
import { MultiStepRegister } from '@/features/auth/components/MultiStepRegister';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Crear cuenta | TuTienda',
  description: 'Crea una cuenta en TuTienda para comenzar a gestionar tu negocio',
};

/**
 * Página de registro
 */
export default function SignUpPage() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <AuthLayout 
        title="Crea tu cuenta"
        subtitle="Comienza a gestionar tu negocio en minutos"
      >
        <MultiStepRegister />
      </AuthLayout>
    </>
  );
}
