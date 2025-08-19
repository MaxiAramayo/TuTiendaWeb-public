/**
 * Componente de protección de rutas
 * 
 * Protege rutas que requieren autenticación y maneja errores de forma segura
 * 
 * @module components/auth/AuthGuard
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/client';
import { toast } from 'sonner';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Ruta a la que redirigir si no está autenticado */
  redirectTo?: string;
  /** Si debe mostrar un loading mientras verifica */
  showLoading?: boolean;
  /** Si debe mostrar un mensaje de error */
  showErrorMessage?: boolean;
}

/**
 * Componente que protege rutas requiriendo autenticación
 */
export const AuthGuard = ({ 
  children, 
  redirectTo = '/sign-in',
  showLoading = true,
  showErrorMessage = true
}: AuthGuardProps) => {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Si hay un error de Firebase Auth, manejarlo de forma segura
    if (error) {
      console.error('Error de autenticación:', error);
      if (showErrorMessage) {
        toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
      }
      if (!hasRedirected) {
        setHasRedirected(true);
        router.push(redirectTo);
      }
      return;
    }

    // Si no está cargando y no hay usuario, redirigir
    if (!loading && !user && !hasRedirected) {
      setHasRedirected(true);
      if (showErrorMessage) {
        toast.error('Debes iniciar sesión para acceder a esta página.');
      }
      router.push(redirectTo);
    }
  }, [user, loading, error, router, redirectTo, hasRedirected, showErrorMessage]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si hay error o no hay usuario, no mostrar el contenido
  if (error || !user) {
    return null;
  }

  // Usuario autenticado, mostrar el contenido
  return <>{children}</>;
};