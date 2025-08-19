/**
 * Página de restablecimiento de contraseña
 * 
 * @module app/reset-password
 */

import { Metadata } from 'next';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Restablecer contraseña | TuTienda',
  description: 'Restablece tu contraseña para acceder a tu cuenta de TuTienda',
};

/**
 * Página de restablecimiento de contraseña
 */
export default function ResetPasswordPage() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <AuthLayout 
        title="Restablecer contraseña"
        subtitle="Te enviaremos un enlace para crear una nueva contraseña"
      >
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
}
