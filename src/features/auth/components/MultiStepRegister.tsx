/**
 * Componente de registro simplificado (solo datos del usuario)
 * 
 * El paso 2 (configuracion de tienda) fue movido al onboarding.
 * 
 * Flujo: Sign-up (email, password, nombre) -> /onboarding (9 slices)
 * 
 * @module features/auth/components/MultiStepRegister
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { UserRegistrationStep } from './UserRegistrationStep';
import { registerAction, syncTokenAction } from '@/features/auth/actions/auth.actions';
import { hybridRegister, refreshCurrentToken } from '@/features/auth/lib/hybrid-login';

export interface UserData {
  email: string;
  password: string;
  displayName: string;
  terms: boolean;
}

// Keep StoreData exported for backward compatibility (other components may import it)
export interface StoreData {
  whatsappNumber: string;
  name: string;
  storeType: string;
  slug: string;
}

/**
 * Componente principal de registro - paso unico
 */
export const MultiStepRegister = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleUserDataComplete = async (data: UserData) => {
    setIsLoading(true);

    try {
      const isGoogleUser = !data.password;

      if (isGoogleUser) {
        // For Google users, they're already authenticated
        // Just redirect to onboarding
        window.location.href = '/onboarding';
        return;
      }

      // 1. Create user in Firebase Auth + Firestore
      const registerFormData = new FormData();
      registerFormData.append('email', data.email);
      registerFormData.append('password', data.password);
      registerFormData.append('displayName', data.displayName);

      const registerResult = await registerAction(null, registerFormData);

      if (!registerResult.success) {
        if (registerResult.errors?.email) throw new Error(registerResult.errors.email[0]);
        if (registerResult.errors?.password) throw new Error(registerResult.errors.password[0]);
        throw new Error(registerResult.errors?._form?.[0] || 'Error al crear cuenta');
      }

      // 2. Hybrid login (Client Auth + Server Session)
      await hybridRegister(data.email, data.password);

      // 3. Sync token
      const refreshedToken = await refreshCurrentToken();
      if (refreshedToken) {
        await syncTokenAction(refreshedToken);
      }

      // 4. Redirect to onboarding
      window.location.href = '/onboarding';
    } catch (error: any) {
      console.error('Error en registro:', error);
      toast.error(error.message || 'Error al crear la cuenta. Intentalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <UserRegistrationStep
        onComplete={handleUserDataComplete}
        initialData={null}
      />
    </div>
  );
};
