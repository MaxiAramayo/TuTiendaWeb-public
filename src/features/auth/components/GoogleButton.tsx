/**
 * Botón de autenticación con Google
 * 
 * Refactored to use signInWithPopup + Server Actions pattern
 * 
 * @module features/auth/components/GoogleButton
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/client';
import { createSessionAction } from '@/features/auth/actions/auth.actions';

interface GoogleButtonProps {
  className?: string;
  text?: string;
  onNewUser?: (userData: { email: string; displayName: string; uid: string }) => void;
}

/**
 * Componente de botón para autenticación con Google
 * Usa patrón híbrido: signInWithPopup (Client SDK) + createSessionAction (Server)
 */
export const GoogleButton = ({
  className = '',
  text = 'Continuar con Google',
  onNewUser
}: GoogleButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      // 1. Autenticar con Google usando Client SDK
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // 2. Obtener ID token
      const idToken = await user.getIdToken();

      // 3. Crear sesión en el servidor
      const result = await createSessionAction(idToken);

      if (!result.success) {
        toast.error('Error al crear sesión');
        setIsLoading(false);
        return;
      }

      // 4. Verificar si es nuevo usuario o tiene perfil incompleto
      // Esto lo determinamos verificando custom claims
      const tokenResult = await user.getIdTokenResult();
      const hasStore = !!tokenResult.claims.storeId;
      const isNewUser = !hasStore;

      if (isNewUser) {
        if (onNewUser) {
          // Si hay callback para nuevo usuario, usarlo (para multi-step)
          const userData = {
            email: user.email || '',
            displayName: user.displayName || '',
            uid: user.uid
          };
          onNewUser(userData);
        } else {
          // Redirigir a completar perfil
          toast.success('Cuenta iniciada con Google');
          router.push('/auth/complete-profile');
        }
      } else {
        // Usuario existente con tienda
        if (!onNewUser) {
          toast.success('Sesión iniciada correctamente');
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Error en autenticación con Google:', error);

      // Manejo específico para errores de Firebase
      if (error?.code === 'auth/popup-closed-by-user') {
        toast.error('Inicio de sesión cancelado');
      } else if (error?.code === 'auth/api-key-not-valid') {
        toast.error('Error de configuración. Verifica variables de entorno');
      } else if (error?.code === 'auth/cancelled-popup-request') {
        // Usuario cerró el popup, no mostrar error
        console.log('Popup cerrado por el usuario');
      } else {
        toast.error('Error al iniciar sesión con Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 ${className}`}
      onClick={handleGoogleSignIn}
    >
      {isLoading ? (
        <div className="h-4 w-4 border-2 border-t-blue-500 rounded-full animate-spin"></div>
      ) : (
        <FcGoogle className="h-5 w-5" />
      )}
      {text}
    </Button>
  );
};
