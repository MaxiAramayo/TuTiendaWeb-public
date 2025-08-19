/**
 * API para el manejo de suscripciones
 */

import { 
  Subscription, 
  SubscriptionPlan, 
  CreateSubscriptionData,
  SubscriptionStats,
  SubscriptionStatus
} from '../types/subscription.types';

/**
 * Clase para manejar las operaciones de API de suscripciones
 */
export class SubscriptionAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/subscription';
  }

  /**
   * Obtiene la suscripción actual del usuario
   * @param userId - ID del usuario
   * @returns Suscripción actual o null
   */
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    try {
      const response = await fetch(`${this.baseUrl}/current?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Error obteniendo suscripción: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        nextBillingDate: new Date(data.nextBillingDate),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };
    } catch (error) {
      console.error('Error obteniendo suscripción actual:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los planes de suscripción disponibles
   * @returns Lista de planes disponibles
   */
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await fetch(`${this.baseUrl}/plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo planes: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo planes:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva suscripción
   * @param userId - ID del usuario
   * @param subscriptionData - Datos de la suscripción
   * @returns URL de pago de MercadoPago
   */
  async createSubscription(
    userId: string, 
    subscriptionData: CreateSubscriptionData
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          ...subscriptionData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error creando suscripción: ${response.statusText}`);
      }

      const data = await response.json();
      return data.paymentUrl;
    } catch (error) {
      console.error('Error creando suscripción:', error);
      throw error;
    }
  }

  /**
   * Cancela una suscripción
   * @param subscriptionId - ID de la suscripción
   * @returns Resultado de la cancelación
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${subscriptionId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error cancelando suscripción: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      throw error;
    }
  }

  /**
   * Actualiza una suscripción a un plan superior
   * @param subscriptionId - ID de la suscripción actual
   * @param newPlanId - ID del nuevo plan
   * @returns URL de pago para la actualización
   */
  async upgradeSubscription(subscriptionId: string, newPlanId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/${subscriptionId}/upgrade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPlanId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error actualizando suscripción: ${response.statusText}`);
      }

      const data = await response.json();
      return data.paymentUrl;
    } catch (error) {
      console.error('Error actualizando suscripción:', error);
      throw error;
    }
  }

  /**
   * Pausa una suscripción
   * @param subscriptionId - ID de la suscripción
   * @returns Resultado de la pausa
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${subscriptionId}/pause`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error pausando suscripción: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error pausando suscripción:', error);
      throw error;
    }
  }

  /**
   * Reanuda una suscripción pausada
   * @param subscriptionId - ID de la suscripción
   * @returns Resultado de la reanudación
   */
  async resumeSubscription(subscriptionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${subscriptionId}/resume`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error reanudando suscripción: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error reanudando suscripción:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de suscripciones
   * @param userId - ID del usuario (opcional para admin)
   * @returns Estadísticas de suscripciones
   */
  async getSubscriptionStats(userId?: string): Promise<SubscriptionStats> {
    try {
      const url = userId 
        ? `${this.baseUrl}/stats?userId=${userId}`
        : `${this.baseUrl}/stats`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo estadísticas: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una suscripción
   * @param subscriptionId - ID de la suscripción
   * @param status - Nuevo estado
   * @returns Resultado de la actualización
   */
  async updateSubscriptionStatus(
    subscriptionId: string, 
    status: SubscriptionStatus
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${subscriptionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error actualizando estado: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error actualizando estado de suscripción:', error);
      throw error;
    }
  }
}

// Instancia singleton de la API
export const subscriptionAPI = new SubscriptionAPI();