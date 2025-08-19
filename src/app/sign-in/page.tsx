/**
 * Página de inicio de sesión
 * 
 * @module app/sign-in
 */

import { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { AuthLayout } from '@/features/auth/components/AuthLayout';

export const metadata: Metadata = {
  title: 'Iniciar sesión | TuTienda',
  description: 'Inicia sesión en tu cuenta de TuTienda para gestionar tu negocio',
};

/**
 * Página de inicio de sesión
 */
export default function SignInPage() {
  return (
    <AuthLayout 
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para continuar con tu tienda"
    >
      <LoginForm />
    </AuthLayout>
  );
}
