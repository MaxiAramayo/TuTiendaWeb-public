/**
 * Hook para detectar cambios de usuario y limpiar datos
 * 
 * Este hook previene que los datos de un usuario se muestren a otro usuario
 * cuando hay cambios de sesión.
 * 
 * Refactorizado para eliminar dependencia de userStore (seguir arquitectura Server-First)
 * 
 * @module shared/hooks/useUserChange
 */

import { useEffect, useRef } from 'react';
import { useAuthClient } from '@/features/auth/hooks/use-auth-client';
import { useSellStore } from '@/features/dashboard/modules/sells/api/sellStore';
import { useProfileStore } from '@/features/dashboard/modules/store-settings/stores/profile.store';

/**
 * Hook que detecta cambios de usuario y limpia los stores correspondientes
 */
export const useUserChange = () => {
  const { user } = useAuthClient();
  const { clearDataForUser: clearSellData } = useSellStore();
  const clearProfileData = useProfileStore((state) => state.clear);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.uid || null;
    const previousUserId = previousUserIdRef.current;

    // Si hay un cambio de usuario (incluyendo login/logout)
    if (previousUserId !== currentUserId) {
      // Limpiar datos del usuario anterior si existía
      if (previousUserId !== null) {
        clearSellData();
        clearProfileData();
      }

      // Actualizar referencia
      previousUserIdRef.current = currentUserId;
    }
  }, [user?.uid, clearSellData, clearProfileData]);
};
