/**
 * Servicio para integración con MercadoPago
 */

import { 
  CreateSubscriptionData, 
  MercadoPagoSubscriptionResponse,
  SubscriptionPlan 
} from '../types/subscription.types';

/**
 * Configuración de MercadoPago
 */
interface MercadoPagoConfig {
  accessToken: string;
  publicKey: string;
  baseUrl: string;
  webhookUrl: string;
}

/**
 * Clase para manejar la integración con MercadoPago
 */
export class MercadoPagoService {
  private config: MercadoPagoConfig;

  constructor() {
    this.config = {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
      publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '',
      baseUrl: process.env.MERCADOPAGO_BASE_URL || 'https://api.mercadopago.com',
      webhookUrl: process.env.MERCADOPAGO_WEBHOOK_URL || ''
    };
  }

  /**
   * Crea un plan de suscripción en MercadoPago
   * @param plan - Plan de suscripción
   * @returns ID del plan creado
   */
  async createSubscriptionPlan(plan: SubscriptionPlan): Promise<string> {
    try {
      const payload = {
        reason: plan.name,
        auto_recurring: {
          frequency: 1,
          frequency_type: plan.billingFrequency === 'monthly' ? 'months' : 'years',
          repetitions: 12, // 12 meses por defecto
          billing_day: 1, // Día 1 de cada mes
          billing_day_proportional: true,
          transaction_amount: plan.price,
          currency_id: plan.currency.toUpperCase()
        },
        payment_methods_allowed: {
          payment_types: [{}],
          payment_methods: [{}]
        },
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`
      };

      const response = await fetch(`${this.config.baseUrl}/preapproval_plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error creando plan en MercadoPago: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result.id;
    } catch (error) {
      console.error('Error creando plan en MercadoPago:', error);
      throw error;
    }
  }

  /**
   * Crea una suscripción con plan asociado en MercadoPago
   * @param plan - Plan de suscripción
   * @param subscriptionData - Datos de la suscripción
   * @param userId - ID del usuario
   * @param userEmail - Email del usuario
   * @param cardTokenId - Token de la tarjeta
   * @returns Respuesta de MercadoPago
   */
  async createSubscription(
    plan: SubscriptionPlan,
    subscriptionData: CreateSubscriptionData,
    userId: string,
    userEmail: string,
    cardTokenId: string
  ): Promise<MercadoPagoSubscriptionResponse> {
    try {
      // Primero crear el plan si no existe
      const preapprovalPlanId = await this.createSubscriptionPlan(plan);

      const payload = {
        preapproval_plan_id: preapprovalPlanId,
        reason: `Suscripción ${plan.name}`,
        external_reference: `subscription_${userId}_${plan.id}`,
        payer_email: userEmail,
        card_token_id: cardTokenId,
        auto_recurring: {
          frequency: 1,
          frequency_type: plan.billingFrequency === 'monthly' ? 'months' : 'years',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 año
          transaction_amount: plan.price,
          currency_id: plan.currency.toUpperCase()
        },
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
        status: 'authorized'
      };

      const response = await fetch(`${this.config.baseUrl}/preapproval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error de MercadoPago: ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creando suscripción en MercadoPago:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de una suscripción
   * @param subscriptionId - ID de la suscripción en MercadoPago
   * @returns Estado de la suscripción
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/preapproval/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo estado: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo estado de suscripción:', error);
      throw error;
    }
  }

  /**
   * Cancela una suscripción
   * @param subscriptionId - ID de la suscripción en MercadoPago
   * @returns Resultado de la cancelación
   */
  async cancelSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/preapproval/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      });

      if (!response.ok) {
        throw new Error(`Error cancelando suscripción: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      throw error;
    }
  }

  /**
   * Pausa una suscripción
   * @param subscriptionId - ID de la suscripción en MercadoPago
   * @returns Resultado de la pausa
   */
  async pauseSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/preapproval/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'paused'
        })
      });

      if (!response.ok) {
        throw new Error(`Error pausando suscripción: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error pausando suscripción:', error);
      throw error;
    }
  }

  /**
   * Reanuda una suscripción pausada
   * @param subscriptionId - ID de la suscripción en MercadoPago
   * @returns Resultado de la reanudación
   */
  async resumeSubscription(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/preapproval/${subscriptionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'authorized'
        })
      });

      if (!response.ok) {
        throw new Error(`Error reanudando suscripción: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error reanudando suscripción:', error);
      throw error;
    }
  }

  /**
   * Valida la configuración de MercadoPago
   * @returns true si la configuración es válida
   */
  validateConfig(): boolean {
    return !!(this.config.accessToken && this.config.publicKey);
  }

  /**
   * Obtiene la clave pública para el frontend
   * @returns Clave pública de MercadoPago
   */
  getPublicKey(): string {
    return this.config.publicKey;
  }
}

// Instancia singleton del servicio
export const mercadoPagoService = new MercadoPagoService();