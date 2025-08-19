/**
 * Hook personalizado para manejar suscripciones
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Subscription, 
  SubscriptionPlan, 
  CreateSubscriptionData,
  SubscriptionStats 
} from '../types/subscription.types';
import { subscriptionAPI } from '../api/subscription.api';

/**
 * Estado del hook de suscripción
 */
interface UseSubscriptionState {
  currentSubscription: Subscription | null;
  availablePlans: SubscriptionPlan[];
  stats: SubscriptionStats | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para manejar suscripciones
 * @param userId - ID del usuario
 * @returns Estado y funciones para manejar suscripciones
 */
export const useSubscription = (userId: string) => {
  const [state, setState] = useState<UseSubscriptionState>({
    currentSubscription: null,
    availablePlans: [],
    stats: null,
    isLoading: false,
    error: null
  });

  /**
   * Actualiza el estado de manera segura
   */
  const updateState = useCallback((updates: Partial<UseSubscriptionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Limpia errores
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Obtiene la suscripción actual del usuario
   */
  const fetchCurrentSubscription = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      const subscription = await subscriptionAPI.getCurrentSubscription(userId);
      updateState({ currentSubscription: subscription, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo suscripción';
      updateState({ error: errorMessage, isLoading: false });
    }
  }, [userId, updateState]);

  /**
   * Obtiene los planes disponibles
   */
  const fetchAvailablePlans = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      const plans = await subscriptionAPI.getAvailablePlans();
      updateState({ availablePlans: plans, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo planes';
      updateState({ error: errorMessage, isLoading: false });
    }
  }, [updateState]);

  /**
   * Crea una nueva suscripción
   */
  const createSubscription = useCallback(async (data: CreateSubscriptionData): Promise<string> => {
    try {
      updateState({ isLoading: true, error: null });
      const paymentUrl = await subscriptionAPI.createSubscription(userId, data);
      updateState({ isLoading: false });
      return paymentUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error creando suscripción';
      updateState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }, [userId, updateState]);

  /**
   * Cancela la suscripción actual
   */
  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    try {
      updateState({ isLoading: true, error: null });
      await subscriptionAPI.cancelSubscription(subscriptionId);
      await fetchCurrentSubscription(); // Refresca la suscripción
      updateState({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error cancelando suscripción';
      updateState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }, [updateState, fetchCurrentSubscription]);

  /**
   * Actualiza la suscripción a un plan superior
   */
  const upgradeSubscription = useCallback(async (planId: string): Promise<string> => {
    if (!state.currentSubscription) {
      throw new Error('No hay suscripción activa para actualizar');
    }

    try {
      updateState({ isLoading: true, error: null });
      const paymentUrl = await subscriptionAPI.upgradeSubscription(
        state.currentSubscription.id, 
        planId
      );
      updateState({ isLoading: false });
      return paymentUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error actualizando suscripción';
      updateState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }, [state.currentSubscription, updateState]);

  /**
   * Pausa la suscripción actual
   */
  const pauseSubscription = useCallback(async (subscriptionId: string) => {
    try {
      updateState({ isLoading: true, error: null });
      await subscriptionAPI.pauseSubscription(subscriptionId);
      await fetchCurrentSubscription(); // Refresca la suscripción
      updateState({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error pausando suscripción';
      updateState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }, [updateState, fetchCurrentSubscription]);

  /**
   * Reanuda la suscripción pausada
   */
  const resumeSubscription = useCallback(async (subscriptionId: string) => {
    try {
      updateState({ isLoading: true, error: null });
      await subscriptionAPI.resumeSubscription(subscriptionId);
      await fetchCurrentSubscription(); // Refresca la suscripción
      updateState({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error reanudando suscripción';
      updateState({ error: errorMessage, isLoading: false });
      throw error;
    }
  }, [updateState, fetchCurrentSubscription]);

  /**
   * Obtiene estadísticas de suscripciones
   */
  const fetchStats = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null });
      const stats = await subscriptionAPI.getSubscriptionStats(userId);
      updateState({ stats, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error obteniendo estadísticas';
      updateState({ error: errorMessage, isLoading: false });
    }
  }, [userId, updateState]);

  /**
   * Verifica si el usuario tiene una suscripción activa
   */
  const hasActiveSubscription = useCallback(() => {
    return state.currentSubscription?.status === 'active';
  }, [state.currentSubscription]);

  /**
   * Verifica si el usuario puede acceder a una característica específica
   */
  const canAccessFeature = useCallback((feature: keyof SubscriptionPlan) => {
    if (!state.currentSubscription || !hasActiveSubscription()) {
      return false;
    }
    return state.currentSubscription.plan[feature] === true;
  }, [state.currentSubscription, hasActiveSubscription]);

  /**
   * Obtiene el plan actual del usuario
   */
  const getCurrentPlan = useCallback(() => {
    return state.currentSubscription?.plan || null;
  }, [state.currentSubscription]);

  /**
   * Verifica si el usuario puede actualizar a un plan específico
   */
  const canUpgradeToPlan = useCallback((planId: string) => {
    if (!state.currentSubscription) return true;
    
    const currentPlan = state.currentSubscription.plan;
    const targetPlan = state.availablePlans.find(p => p.id === planId);
    
    if (!targetPlan) return false;
    
    // Lógica simple: solo puede actualizar si el precio es mayor
    return targetPlan.price > currentPlan.price;
  }, [state.currentSubscription, state.availablePlans]);

  // Efectos para cargar datos iniciales
  useEffect(() => {
    if (userId) {
      fetchCurrentSubscription();
      fetchAvailablePlans();
    }
  }, [userId, fetchCurrentSubscription, fetchAvailablePlans]);

  return {
    // Estado
    currentSubscription: state.currentSubscription,
    availablePlans: state.availablePlans,
    stats: state.stats,
    isLoading: state.isLoading,
    error: state.error,
    
    // Acciones
    fetchCurrentSubscription,
    fetchAvailablePlans,
    createSubscription,
    cancelSubscription,
    upgradeSubscription,
    pauseSubscription,
    resumeSubscription,
    fetchStats,
    clearError,
    
    // Utilidades
    hasActiveSubscription,
    canAccessFeature,
    getCurrentPlan,
    canUpgradeToPlan
  };
};