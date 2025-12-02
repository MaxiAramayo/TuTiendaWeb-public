/**
 * Botón de autenticación con Google
 * 
 * @module features/auth/components/GoogleButton
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface GoogleButtonProps {
  className?: string;
  text?: string;
  onNewUser?: (userData: { email: string; displayName: string; uid: string }) => void;
}

/**
 * Componente de botón para autenticación con Google
 */
export const GoogleButton = ({ 
  className = '', 
  text = 'Continuar con Google',
  onNewUser
}: GoogleButtonProps) => {
  const { signInWithGoogle, isLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const result = await signInWithGoogle(!onNewUser); // No auto-redirect si hay callback
      
      if (result?.isNewUser || result?.hasIncompleteProfile) {
        if (onNewUser) {
          // Si hay callback para nuevo usuario o perfil incompleto, usarlo (para multi-step)
          const userData = {
            email: result.userCredential.user.email || '',
            displayName: result.userCredential.user.displayName || '',
            uid: result.userCredential.user.uid
          };
          onNewUser(userData);
        } else {
          // Flujo original para complete-profile - toast manejado por useAuth
          router.push('/complete-profile');
        }
      } else {
        if (!onNewUser) {
          // Usuario existente con perfil completo
          toast.success('Sesión iniciada correctamente');
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Error en autenticación con Google:', error);
      
      // Manejo específico para errores de Firebase
      if (error?.code === 'auth/api-key-not-valid') {
        toast.error(
          'Error de configuración de Firebase. Por favor, verifica las variables de entorno.'
        );
      } else if (error?.code === 'auth/popup-closed-by-user') {
        toast.error('Inicio de sesión cancelado.');
      } else {
        // El error ya se maneja en useAuth con toast, pero agregamos fallback
        if (!error?.message?.includes('toast')) {
          toast.error('Error al iniciar sesión con Google. Inténtalo de nuevo.');
        }
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading || isGoogleLoading}
      className={`flex items-center justify-center gap-2 ${className}`}
      onClick={handleGoogleSignIn}
    >
      {isGoogleLoading ? (
        <div className="h-4 w-4 border-2 border-t-blue-500 rounded-full animate-spin"></div>
      ) : (
        <FcGoogle className="h-5 w-5" />
      )}
      {text}
    </Button>
  );
};
