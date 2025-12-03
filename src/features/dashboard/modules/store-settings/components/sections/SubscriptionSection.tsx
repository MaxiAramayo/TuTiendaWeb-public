/**
 * Sección de gestión de suscripciones
 * 
 * Implementa CU-STORE-10: Gestionar Suscripciones
 * Permite gestionar períodos de prueba, métodos de pago y renovaciones
 * 
 * @module features/dashboard/modules/store-settings/components/sections
 */

'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { ProfileFormData, FormState, SubscriptionInfo } from '../../types/store.type';
import { updateSubscriptionAction, getProfileAction } from '../../actions/profile.actions';
import { useProfileStore } from '../../stores/profile.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Star,
  Gift,
  RefreshCw,
  DollarSign,
  Sparkles,
  Save,
  Loader2
} from 'lucide-react';

/**
 * Props del componente
 */
interface SubscriptionSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

/**
 * Planes de suscripción disponibles
 */
const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    currency: 'ARS',
    period: 'mes',
    description: 'Perfecto para empezar',
    features: [
      'Hasta 10 productos',
      'Tienda básica',
      'Soporte por email',
      'Estadísticas básicas'
    ],
    limitations: [
      'Sin personalización avanzada',
      'Sin integraciones',
      'Marca de TuTienda visible'
    ],
    color: 'gray',
    icon: Gift
  },
  basic: {
    id: 'basic',
    name: 'Básico',
    price: 2999,
    currency: 'ARS',
    period: 'mes',
    description: 'Para tiendas en crecimiento',
    features: [
      'Hasta 100 productos',
      'Personalización básica',
      'Soporte prioritario',
      'Estadísticas avanzadas',
      'Sin marca de TuTienda'
    ],
    limitations: [
      'Integraciones limitadas'
    ],
    color: 'blue',
    icon: Star,
    popular: false
  },
  pro: {
    id: 'pro',
    name: 'Profesional',
    price: 4999,
    currency: 'ARS',
    period: 'mes',
    description: 'Para tiendas profesionales',
    features: [
      'Productos ilimitados',
      'Personalización completa',
      'Soporte 24/7',
      'Analytics avanzados',
      'Todas las integraciones',
      'API completa',
      'Dominio personalizado'
    ],
    limitations: [],
    color: 'purple',
    icon: Crown,
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Empresarial',
    price: 9999,
    currency: 'ARS',
    period: 'mes',
    description: 'Para grandes empresas',
    features: [
      'Todo del plan Pro',
      'Soporte dedicado',
      'Configuración personalizada',
      'SLA garantizado',
      'Capacitación incluida',
      'Múltiples tiendas'
    ],
    limitations: [],
    color: 'gold',
    icon: Sparkles
  }
};

/**
 * Métodos de pago para suscripciones
 */
const PAYMENT_METHODS = [
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'Tarjetas de crédito y débito',
    icon: CreditCard,
    available: true
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Pagos internacionales',
    icon: CreditCard,
    available: false
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Cuenta PayPal',
    icon: CreditCard,
    available: false
  }
];

/**
 * Componente de sección de suscripciones
 */
export function SubscriptionSection({
  formData,
  formState,
  updateField,
  onSave,
  isSaving = false,
}: SubscriptionSectionProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // Store global
  const setProfile = useProfileStore((state) => state.setProfile);

  // Obtener configuración actual o inicializar
  const subscription = formData.subscription || {
    active: true,
    plan: 'free',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    trialUsed: false
  };

  const currentPlan = SUBSCRIPTION_PLANS[subscription.plan as keyof typeof SUBSCRIPTION_PLANS];
  const isOnTrial = !subscription.trialUsed && subscription.active;
  const trialDaysLeft = subscription.endDate 
    ? Math.max(0, Math.ceil((
        ((subscription.endDate as any).toDate 
          ? (subscription.endDate as any).toDate().getTime() 
          : new Date(subscription.endDate as any).getTime()) - new Date().getTime()
      ) / (1000 * 60 * 60 * 24)))
    : 0;

  /**
   * Guardar y refrescar store global
   */
  const handleSectionSave = useCallback(async () => {
    if (onSave) {
      await onSave();
    }
    
    // Refrescar store global
    startTransition(async () => {
      const result = await getProfileAction();
      if (result.success && result.data) {
        setProfile(result.data);
      }
    });
  }, [onSave, setProfile]);

  /**
   * Actualizar configuración de suscripción
   */
  const updateSubscriptionSettings = (updates: Partial<SubscriptionInfo>) => {
    updateField('subscription', {
      ...subscription,
      ...updates
    });
  };

  /**
   * Iniciar actualización de plan
   */
  const startPlanUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowUpgradeModal(true);
  };

  /**
   * Procesar pago de suscripción
   */
  const processSubscriptionPayment = async (planId: string, paymentMethodId: string) => {
    setProcessingPayment(true);
    
    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actualizar suscripción
      updateSubscriptionSettings({
        plan: planId as 'free' | 'basic' | 'premium' | 'enterprise',
        active: true,
        billing: {
          provider: paymentMethodId as 'mercadopago' | 'stripe',
          autoRenew: true
        }
      });
      
      setShowUpgradeModal(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  /**
   * Cancelar suscripción
   */
  const cancelSubscription = () => {
    updateSubscriptionSettings({
      active: false,
      billing: {
        ...((subscription as any).billing || {}),
        autoRenew: false
      }
    });
  };

  /**
   * Reactivar suscripción
   */
  const reactivateSubscription = () => {
    updateSubscriptionSettings({
      active: true,
      billing: {
        ...((subscription as any).billing || {}),
        autoRenew: true
      }
    });
  };

  /**
   * Renderizar tarjeta de plan
   */
  const renderPlanCard = (plan: any, isCurrent: boolean = false) => {
    const Icon = plan.icon;
    const colorClasses = {
      gray: 'border-gray-200 bg-gray-50',
      blue: 'border-blue-200 bg-blue-50',
      purple: 'border-purple-200 bg-purple-50',
      gold: 'border-yellow-200 bg-yellow-50'
    };

    return (
      <Card className={cn(
        'relative transition-all duration-200 hover:shadow-lg',
        isCurrent ? 'ring-2 ring-blue-500 bg-blue-50/30' : '',
        plan.popular ? 'ring-2 ring-purple-500' : ''
      )}>
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-purple-600 text-white px-3 py-1">
              Más popular
            </Badge>
          </div>
        )}
        
        {isCurrent && (
          <div className="absolute -top-3 right-4">
            <Badge className="bg-blue-600 text-white px-3 py-1">
              Plan actual
            </Badge>
          </div>
        )}

        <CardHeader className="text-center pb-4">
          <div className={cn(
            'w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4',
            colorClasses[plan.color as keyof typeof colorClasses]
          )}>
            <Icon className={cn(
              'w-6 h-6',
              plan.color === 'gray' ? 'text-gray-600' :
              plan.color === 'blue' ? 'text-blue-600' :
              plan.color === 'purple' ? 'text-purple-600' :
              'text-yellow-600'
            )} />
          </div>
          
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <CardDescription>{plan.description}</CardDescription>
          
          <div className="mt-4">
            <div className="text-3xl font-bold">
              {plan.price === 0 ? 'Gratis' : `$${plan.price.toLocaleString()}`}
            </div>
            {plan.price > 0 && (
              <div className="text-sm text-gray-600">por {plan.period}</div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Características */}
            <div>
              <h4 className="font-medium text-sm text-gray-900 mb-2">Incluye:</h4>
              <ul className="space-y-2">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Limitaciones */}
            {plan.limitations.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Limitaciones:</h4>
                <ul className="space-y-2">
                  {plan.limitations.map((limitation: string, index: number) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <AlertTriangle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botón de acción */}
            <div className="pt-4">
              {isCurrent ? (
                <Button disabled className="w-full">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Plan actual
                </Button>
              ) : (
                <Button 
                  onClick={() => startPlanUpgrade(plan.id)}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.price === 0 ? 'Cambiar a gratuito' : 'Actualizar plan'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header con título y botón de guardar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Suscripción</h2>
          <p className="text-sm text-gray-500">Gestiona tu plan y configuración de suscripción</p>
        </div>
        {onSave && (
          <Button
            onClick={handleSectionSave}
            disabled={isSaving || isPending}
            className="flex items-center space-x-2"
          >
            {isSaving || isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving || isPending ? 'Guardando...' : 'Guardar'}</span>
          </Button>
        )}
      </div>
      {/* Estado actual de la suscripción */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5" />
            <span>Estado de tu suscripción</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Plan actual */}
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-medium">Plan actual</p>
              <p className="text-lg font-bold text-blue-600">{currentPlan.name}</p>
            </div>

            {/* Estado */}
            <div className="text-center p-4 border rounded-lg">
              <div className={cn(
              'w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center',
              subscription.active && !isOnTrial ? 'bg-green-100' :
              isOnTrial ? 'bg-orange-100' :
              'bg-red-100'
            )}>
              <CheckCircle2 className={cn(
                'w-6 h-6',
                subscription.active && !isOnTrial ? 'text-green-600' :
                isOnTrial ? 'text-orange-600' :
                'text-red-600'
              )} />
            </div>
            <p className="font-medium">Estado</p>
            <p className={cn(
              'text-lg font-bold',
              subscription.active && !isOnTrial ? 'text-green-600' :
              isOnTrial ? 'text-orange-600' :
              'text-red-600'
            )}>
              {subscription.active && !isOnTrial ? 'Activo' :
               isOnTrial ? 'Prueba' :
               'Cancelado'}
            </p>
            </div>

            {/* Próximo pago */}
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-medium">Próximo pago</p>
              <p className="text-lg font-bold text-purple-600">
                {subscription.endDate 
                  ? new Date(
                      (subscription.endDate as any).toDate 
                        ? (subscription.endDate as any).toDate() 
                        : subscription.endDate
                    ).toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>

            {/* Renovación automática */}
            <div className="text-center p-4 border rounded-lg">
              <div className={cn(
                'w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center',
                (subscription as any).billing?.autoRenew ? 'bg-green-100' : 'bg-gray-100'
              )}>
                <RefreshCw className={cn(
                  'w-6 h-6',
                  (subscription as any).billing?.autoRenew ? 'text-green-600' : 'text-gray-400'
                )} />
              </div>
              <p className="font-medium">Auto-renovación</p>
              <div className="flex items-center justify-center mt-2">
                <Switch
                  checked={(subscription as any).billing?.autoRenew || false}
                  onCheckedChange={(autoRenew) => updateSubscriptionSettings({ 
                    billing: { 
                      ...((subscription as any).billing || {}), 
                      autoRenew 
                    } 
                  })}
                />
              </div>
            </div>
          </div>

          {/* Período de prueba */}
          {isOnTrial && (
            <Alert className="mt-4">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Tu período de prueba termina en {trialDaysLeft} días. 
                Actualiza tu plan para continuar disfrutando de todas las funciones.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Planes disponibles */}
      <div>
        <h3 className="text-xl font-semibold mb-6">Planes disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => 
            renderPlanCard(plan, plan.id === subscription.plan)
          )}
        </div>
      </div>

      {/* Métodos de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Métodos de pago</span>
          </CardTitle>
          <CardDescription>
            Configura tu método de pago preferido para las suscripciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = (subscription as any).billing?.provider === method.id;
              
              return (
                <div
                  key={method.id}
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-all duration-200',
                    method.available 
                      ? 'hover:border-blue-300 hover:bg-blue-50' 
                      : 'opacity-50 cursor-not-allowed',
                    isSelected ? 'border-blue-500 bg-blue-50' : ''
                  )}
                  onClick={() => {
                    if (method.available) {
                      updateSubscriptionSettings({ 
                        billing: { 
                          ...((subscription as any).billing || {}), 
                          provider: method.id as 'mercadopago' | 'stripe'
                        } 
                      });
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={cn(
                      'w-6 h-6',
                      method.available ? 'text-gray-700' : 'text-gray-400'
                    )} />
                    <div>
                      <p className={cn(
                        'font-medium',
                        method.available ? 'text-gray-900' : 'text-gray-500'
                      )}>
                        {method.name}
                      </p>
                      <p className={cn(
                        'text-sm',
                        method.available ? 'text-gray-600' : 'text-gray-400'
                      )}>
                        {method.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
                    )}
                  </div>
                  {!method.available && (
                    <Badge variant="secondary" className="mt-2">
                      Próximamente
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Acciones de suscripción */}
      <Card>
        <CardHeader>
          <CardTitle>Gestionar suscripción</CardTitle>
          <CardDescription>
            Opciones para gestionar tu suscripción actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {!subscription.active ? (
              <Button onClick={reactivateSubscription} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reactivar suscripción
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={cancelSubscription}
                className="flex-1"
              >
                Cancelar suscripción
              </Button>
            )}
            
            <Button variant="outline" className="flex-1">
              <DollarSign className="w-4 h-4 mr-2" />
              Ver historial de pagos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SubscriptionSection;