/**
 * API Route para crear una nueva suscripción con MercadoPago
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateSubscriptionData } from '@features/dashboard/modules/subscription/types/subscription.types';
import { mercadoPagoService } from '@features/dashboard/modules/subscription/services/mercadopago.service';

/**
 * Interfaz para los datos de creación de suscripción
 */
interface CreateSubscriptionRequest extends CreateSubscriptionData {
  userId: string;
  userEmail: string;
  cardTokenId: string;
}

/**
 * Obtiene el plan único disponible
 */
const getAvailablePlan = () => {
  return {
    id: 'premium-complete',
    name: 'Plan Premium Completo',
    description: 'Acceso completo a todas las funciones de tu tienda online',
    price: 5000,
    currency: 'ARS',
    billingFrequency: 'monthly' as const,
    type: 'premium' as const,
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
  };
};

/**
 * Crea una nueva suscripción
 * @param request - Request de Next.js
 * @returns Response con la suscripción creada
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateSubscriptionRequest = await request.json();
    
    const { userId, planId, userEmail, cardTokenId, autoRenew } = body;

    // Validar campos requeridos
    if (!userId || !planId || !userEmail || !cardTokenId) {
      return NextResponse.json(
        { 
          error: 'userId, planId, userEmail y cardTokenId son requeridos',
          details: 'Para crear una suscripción necesitas proporcionar todos los datos requeridos'
        },
        { status: 400 }
      );
    }

    // Obtener el plan disponible
    const plan = getAvailablePlan();
    
    // Validar que el planId coincida con el plan disponible
    if (planId !== plan.id) {
      return NextResponse.json(
        { 
          error: 'Plan no válido',
          details: `Solo está disponible el plan: ${plan.id}`,
          availablePlan: plan
        },
        { status: 400 }
      );
    }

    // Validar configuración de MercadoPago
    if (!mercadoPagoService.validateConfig()) {
      return NextResponse.json(
        { 
          error: 'Configuración de MercadoPago incompleta',
          details: 'Verifica las variables de entorno de MercadoPago'
        },
        { status: 500 }
      );
    }

    // Crear la suscripción en MercadoPago
    const mercadoPagoResponse = await mercadoPagoService.createSubscription(
      plan,
      { planId, autoRenew },
      userId,
      userEmail,
      cardTokenId
    );

    // Crear respuesta de suscripción
    const subscription = {
      id: mercadoPagoResponse.id,
      userId,
      planId: plan.id,
      plan,
      status: 'pending',
      autoRenew,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      mercadoPagoSubscriptionId: mercadoPagoResponse.id,
      paymentUrl: mercadoPagoResponse.init_point,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return NextResponse.json({
      subscription,
      paymentUrl: mercadoPagoResponse.init_point,
      message: 'Suscripción creada exitosamente. Completa el pago para activarla.'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creando suscripción:', error);
    
    // Manejar errores específicos de MercadoPago
    if (error instanceof Error && error.message.includes('MercadoPago')) {
      return NextResponse.json(
        { 
          error: 'Error en el procesamiento del pago',
          details: error.message
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: 'No se pudo crear la suscripción. Intenta nuevamente.'
      },
      { status: 500 }
    );
  }
}