/**
 * Hook para detectar cambios de usuario y limpiar datos
 * 
 * Este hook previene que los datos de un usuario se muestren a otro usuario
 * cuando hay cambios de sesión.
 * 
 * @module shared/hooks/useUserChange
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/api/authStore';
import { useSellStore } from '@/features/dashboard/modules/sells/api/sellStore';
import { useUserStore } from '@/features/user/api/userStore';

/**
 * Hook que detecta cambios de usuario y limpia los stores correspondientes
 */
export const useUserChange = () => {
  const { user } = useAuthStore();
  const { clearDataForUser: clearSellData } = useSellStore();
  const { clearDataForUser: clearUserData } = useUserStore();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // Si hay un cambio de usuario (incluyendo login/logout)
    if (previousUserId !== currentUserId) {
      // Limpiar datos del usuario anterior si existía
      if (previousUserId !== null) {
        clearSellData();
        clearUserData();
      }

      // Actualizar referencia
      previousUserIdRef.current = currentUserId;
    }
  }, [user?.id, clearSellData, clearUserData]);
};
