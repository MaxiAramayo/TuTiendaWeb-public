/**
 * API Route para obtener los planes de suscripción disponibles
 */

import { NextResponse } from 'next/server';
import { SubscriptionPlan, PlanType, BillingFrequency } from '@features/dashboard/modules/subscription/types/subscription.types';

/**
 * Plan de suscripción único para la tienda
 * Precio: $5000 ARS mensuales con acceso completo a todas las funciones
 */
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'premium-complete',
    name: 'Plan Premium Completo',
    description: 'Acceso completo a todas las funciones de tu tienda online',
    price: 5000,
    currency: 'ARS',
    billingFrequency: 'monthly' as BillingFrequency,
    type: 'premium' as PlanType,
    features: [
      'Productos ilimitados',
      'Órdenes ilimitadas',
      'Analytics completos y reportes avanzados',
      'Dominio personalizado incluido',
      'Integración completa con WhatsApp Business',
      'QR Menu personalizable',
      'Soporte prioritario 24/7',
      'API completa para integraciones',
      'Múltiples métodos de pago',
      'Gestión de inventario avanzada',
      'Marketing y promociones',
      'Backup automático de datos'
    ],
    maxProducts: 9999,
    maxOrders: 9999,
    hasAnalytics: true,
    hasCustomDomain: true,
    hasWhatsAppIntegration: true,
    isPopular: true
  }
];

/**
 * Obtiene todos los planes de suscripción disponibles
 * @returns Response con los planes disponibles
 */
export async function GET() {
  try {
    // Retornar todos los planes disponibles
    return NextResponse.json(SUBSCRIPTION_PLANS, { status: 200 });
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}