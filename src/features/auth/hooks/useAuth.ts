/**
 * Hook personalizado para autenticación
 * 
 * @module features/auth/hooks/useAuth
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';

import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/features/auth/api/authStore';
import { useUserStore } from '@/features/user/api/userStore';
import { userService } from '@/features/user/services/userService';
import { AuthCredentials } from '@/features/auth/auth.types';
import {
  RegisterFormValues,
  GoogleProfileSetupValues
} from '@/features/auth/validation';
import { useUserData } from '@/features/user/hooks/useUserData';
import { useStoreOperations } from '@/features/user/hooks/useStoreOperations';
import { errorService, ErrorType, ErrorSeverity } from '@/shared/services/error.service';
import { handleAuthError } from '../utils/errorHandling';
import { createSession, deleteSession } from '@/lib/auth/actions';
// Removido: import { optimizeFirestoreSettings, checkFirestoreConnection } from '@/lib/firebase/client';

/**
 * Hook para manejar la autenticación
 */
export const useAuth = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stores
  const { setUser, resetPassword } = useAuthStore();
  const { getUser } = useUserStore();

  // Hooks especializados
  const { loadUserData } = useUserData();
  const { createUserStore } = useStoreOperations();

  /**
   * Iniciar sesión con email y contraseña
   */
  const signIn = useCallback(async (credentials: AuthCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      // Primero intentar autenticar con Firebase
      const userCredential = await authService.signIn(credentials);

      // Crear sesión en el servidor
      const token = await userCredential.user.getIdToken();
      await createSession(token);

      // Solo cargar datos del usuario si la autenticación fue exitosa
      try {
        await loadUserData(userCredential.user.uid);

        // Sincronizar estado entre stores
        const userState = useUserStore.getState().user;
        setUser(userState);

        console.log('✅ Login exitoso con datos de usuario');
        // Toast de éxito manejado por el componente que llama
        router.push('/dashboard');
        return userCredential;
      } catch (userDataError: any) {
        // Si falla la carga de datos del usuario, pero la autenticación fue exitosa,
        // crear el documento del usuario y continuar de forma segura
        console.warn('Usuario autenticado pero sin datos en Firestore, creando documento básico:', userDataError);

        try {
          // Crear datos básicos del usuario
          const basicUserData = {
            id: userCredential.user.uid,
            email: userCredential.user.email || credentials.email,
            displayName: userCredential.user.displayName || '',
            role: 'owner' as const,
            storeIds: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          // Intentar crear el documento en Firestore
          await userService.createUserDocument(userCredential.user.uid, basicUserData);

          // Actualizar el store con los datos básicos
          setUser(basicUserData);

          console.log('ℹ️ Creando datos básicos para usuario nuevo');
          // Toast de éxito manejado por el componente que llama
          router.push('/complete-profile'); // Redirigir a completar perfil
          return userCredential;
        } catch (createError: any) {
          // Si también falla la creación del documento, al menos establecer el estado básico
          console.error('Error al crear documento de usuario:', createError);

          const basicUserData = {
            id: userCredential.user.uid,
            email: userCredential.user.email || credentials.email,
            displayName: userCredential.user.displayName || '',
            role: 'owner' as const,
            storeIds: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };

          setUser(basicUserData);
          // Toast de éxito manejado por el componente que llama
          router.push('/complete-profile');
          return userCredential;
        }
      }
    } catch (error: any) {
      console.error('❌ Error en signIn:', error?.code, error?.message);

      // Manejar errores de autenticación de Firebase
      let userMessage = 'Error al iniciar sesión. Verifica tus credenciales.';

      // Mensajes específicos para errores comunes de Firebase Auth
      switch (error?.code) {
        case 'auth/user-not-found':
          userMessage = 'No existe una cuenta con este email. ¿Quieres registrarte?';
          break;
        case 'auth/wrong-password':
          userMessage = 'Contraseña incorrecta. Inténtalo de nuevo.';
          break;
        case 'auth/invalid-email':
          userMessage = 'El formato del email no es válido.';
          break;
        case 'auth/user-disabled':
          userMessage = 'Esta cuenta ha sido deshabilitada.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Error de conexión. Verifica tu internet.';
          break;
        case 'auth/invalid-credential':
          userMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
          break;
        default:
          // Manejo específico para errores de Firestore
          if (error?.message?.includes('ERR_ABORTED') || error?.code === 'unavailable') {
            userMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
          }
          break;
      }

      const structuredError = errorService.createError(
        ErrorType.AUTHENTICATION,
        error?.code || 'AUTH_SIGNIN_ERROR',
        error.message || 'Error al iniciar sesión',
        userMessage,
        {
          severity: ErrorSeverity.HIGH,
          context: { function: 'signIn', email: credentials.email },
          originalError: error,
          recoverable: true,
          retryable: true
        }
      );

      // Solo mostrar toast para errores de autenticación, no logging interno
      toast.error(userMessage);
      setError(structuredError.userMessage);

      // Preservar el código de error original para manejo específico
      const enhancedError = new Error(structuredError.userMessage);
      (enhancedError as any).code = error?.code || 'unknown';
      throw enhancedError;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData, router, setUser]);

  /**
   * Iniciar sesión con Google
   */
  const signInWithGoogle = useCallback(async (autoRedirect: boolean = true) => {
    try {
      setIsLoading(true);
      setError(null);

      const { userCredential, isNewUser } = await authService.signInWithGoogle();

      // Crear sesión en el servidor
      const token = await userCredential.user.getIdToken();
      await createSession(token);

      let userState = null;

      // Intentar cargar datos del usuario
      try {
        await loadUserData(userCredential.user.uid);
        userState = useUserStore.getState().user;
        setUser(userState);
        console.log('✅ Login con Google exitoso - usuario existente');
      } catch (userDataError: any) {
        // Si falla la carga de datos del usuario, crear datos básicos
        console.warn('Usuario de Google autenticado pero sin datos en Firestore:', userDataError);

        const basicUserData = {
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          displayName: userCredential.user.displayName || '',
          role: 'owner' as const,
          storeIds: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        userState = basicUserData;
        setUser(userState);
        console.log('ℹ️ Creando datos básicos para usuario de Google');
      }

      if (autoRedirect) {
        if (isNewUser || !userState?.storeIds || userState.storeIds.length === 0) {
          // Usuario nuevo o sin tienda configurada
          // Toast de éxito manejado por el componente que llama
          router.push('/complete-profile');
        } else {
          // Usuario con tienda configurada - ir al dashboard
          // Toast de éxito manejado por el componente que llama
          router.push('/dashboard');
        }
      }

      return { userCredential, isNewUser, hasIncompleteProfile: !userState?.storeIds || userState.storeIds.length === 0 };
    } catch (error: any) {
      console.error('❌ Error en signInWithGoogle:', error?.code, error?.message);

      // Manejar errores específicos de Google Auth
      let userMessage = 'Error al iniciar sesión con Google. Inténtalo de nuevo.';

      switch (error?.code) {
        case 'auth/popup-closed-by-user':
          userMessage = 'Inicio de sesión cancelado.';
          break;
        case 'auth/popup-blocked':
          userMessage = 'Popup bloqueado. Permite popups para este sitio.';
          break;
        case 'auth/cancelled-popup-request':
          userMessage = 'Solicitud de popup cancelada.';
          break;
        case 'auth/network-request-failed':
          userMessage = 'Error de conexión. Verifica tu internet.';
          break;
        default:
          // Manejo específico para errores de Firestore
          if (error?.message?.includes('ERR_ABORTED') || error?.code === 'unavailable') {
            userMessage = 'Error de conexión con Google. Verifica tu internet e intenta nuevamente.';
          }
          break;
      }

      const structuredError = errorService.createError(
        ErrorType.AUTHENTICATION,
        error?.code || 'AUTH_GOOGLE_ERROR',
        error.message || 'Error al iniciar sesión con Google',
        userMessage,
        {
          severity: ErrorSeverity.HIGH,
          context: { function: 'signInWithGoogle' },
          originalError: error,
          recoverable: true,
          retryable: true
        }
      );

      // Solo mostrar toast para errores reales, no para cancelaciones
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        toast.error(userMessage);
      }
      setError(structuredError.userMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData, router, setUser]);

  /**
   * Registrar nuevo usuario
   */
  const signUp = useCallback(async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Crear usuario
      const userCredential = await authService.signUp({
        email: values.email as string,
        password: values.password as string,
        userData: {
          displayName: values.displayName as string,
          role: 'owner' as const,
          storeIds: []
        }
      });
      const userId = userCredential.user.uid;

      // Crear sesión en el servidor
      const token = await userCredential.user.getIdToken();
      await createSession(token);

      // 2. Crear tienda usando el hook especializado
      const storeData = {
        basicInfo: {
          name: values.name as string,
          slug: values.slug as string,
          type: values.storeType as any,
          description: ''
        },
        contactInfo: {
          whatsapp: values.whatsappNumber as string,
          website: ''
        },
        ownerId: userId
      };

      await createUserStore(storeData);

      // 3. Cargar datos actualizados
      await loadUserData(userId);

      // Sincronizar estado entre stores
      const userState = useUserStore.getState().user;
      setUser(userState);

      // Toast de éxito manejado por el componente que llama
      router.push('/dashboard');
      return userId;
    } catch (error: any) {
      const errorInfo = handleAuthError(error, false); // No mostrar toast aquí
      setError(errorInfo.message);
      // Preservar el código de error original para manejo específico
      const enhancedError = new Error(errorInfo.message);
      (enhancedError as any).code = error?.code || 'unknown';
      throw enhancedError;
    } finally {
      setIsLoading(false);
    }
  }, [createUserStore, loadUserData, router, setUser]);

  /**
   * Completar perfil para usuarios de Google
   */
  const completeGoogleProfile = useCallback(async (uid: string, values: GoogleProfileSetupValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Crear tienda usando el hook especializado
      const storeData = {
        basicInfo: {
          name: values.name,
          slug: values.slug,
          type: values.storeType,
          description: ''
        },
        contactInfo: {
          whatsapp: values.whatsappNumber,
          website: ''
        },
        ownerId: uid
      };

      await createUserStore(storeData as any);

      // 2. Cargar datos actualizados
      await loadUserData(uid);

      // Sincronizar estado entre stores
      const userState = useUserStore.getState().user;
      setUser(userState);

      // Toast de éxito manejado por el componente que llama
      router.push('/dashboard');
    } catch (error: any) {
      const structuredError = errorService.createError(
        ErrorType.AUTHENTICATION,
        error?.code || 'AUTH_GOOGLE_PROFILE_ERROR',
        error.message || 'Error al completar perfil de Google',
        'Error al completar el perfil. Inténtalo de nuevo.',
        {
          severity: ErrorSeverity.HIGH,
          context: { function: 'completeGoogleProfile', uid },
          originalError: error,
          recoverable: true,
          retryable: true
        }
      );

      errorService.handleError(structuredError);
      setError(structuredError.userMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [createUserStore, loadUserData, router, setUser]);

  /**
   * Cerrar sesión
   */
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await deleteSession();
      await authService.signOut();
      // Toast de éxito manejado por el componente que llama
      router.push('/');
    } catch (error: any) {
      const structuredError = errorService.createError(
        ErrorType.AUTHENTICATION,
        error?.code || 'AUTH_SIGNOUT_ERROR',
        error.message || 'Error al cerrar sesión',
        'Error al cerrar sesión. Inténtalo de nuevo.',
        {
          severity: ErrorSeverity.MEDIUM,
          context: { function: 'signOut' },
          originalError: error,
          recoverable: true,
          retryable: true
        }
      );

      errorService.handleError(structuredError);
      setError(structuredError.userMessage);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Enviar email de recuperación de contraseña
   */
  const handleResetPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await resetPassword(email);
      // Toast de éxito manejado por el componente que llama
    } catch (error: any) {
      const structuredError = errorService.createError(
        ErrorType.AUTHENTICATION,
        error?.code || 'AUTH_RESET_PASSWORD_ERROR',
        error.message || 'Error al enviar email de recuperación',
        'Error al enviar el email de recuperación. Verifica tu dirección de correo.',
        {
          severity: ErrorSeverity.MEDIUM,
          context: { function: 'handleResetPassword', email },
          originalError: error,
          recoverable: true,
          retryable: true
        }
      );

      errorService.handleError(structuredError);
      setError(structuredError.userMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [resetPassword]);

  return {
    isLoading,
    error,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword: handleResetPassword,
    completeGoogleProfile
  };
};
