/**
 * Sección de gestión de suscripciones
 *
 * @module features/dashboard/modules/store-settings/components/sections
 */

'use client';

import React, { useCallback, useTransition, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/lib/firebase/client';
import { useAuth } from '@/features/auth/providers/auth-store-provider';
import { ProfileFormData, FormState, SubscriptionInfo } from '../../types/store.type';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Crown,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  ExternalLink,
  Zap,
  ShieldCheck,
  BarChart3,
  Palette,
  Package,
  HeadphonesIcon,
  AlertCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react';

interface SubscriptionSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  onSave?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  isSaving?: boolean;
  userEmail?: string;
  profile?: {
    id?: string;
    basicInfo?: { name?: string };
    contactInfo?: { whatsapp?: string };
    subscription?: SubscriptionInfo;
  } | null;
}

const PRO_PLAN = {
  id: 'pro',
  name: 'Profesional',
  price: 4999,
  period: 'mes',
  description: 'Todo lo que necesitás para hacer crecer tu negocio online.',
  features: [
    { icon: Package, label: 'Productos ilimitados' },
    { icon: Palette, label: 'Personalización completa de tu tienda' },
    { icon: BarChart3, label: 'Analytics y reportes avanzados' },
    { icon: Zap, label: 'Integración con WhatsApp y redes sociales' },
    { icon: ShieldCheck, label: 'Sin marca de TuTiendaWeb visible' },
    { icon: HeadphonesIcon, label: 'Soporte prioritario' },
  ],
};

/** Mapea paymentStatus a texto legible */
function getPaymentStatusLabel(
  status?: string,
  isCancelledActive?: boolean
): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (status === 'cancelled' && isCancelledActive) {
    return { label: 'Cancelado — vigente', variant: 'secondary' };
  }
  switch (status) {
    case 'authorized': return { label: 'Activo', variant: 'default' };
    case 'pending':    return { label: 'Pago pendiente', variant: 'secondary' };
    case 'paused':     return { label: 'Pausado', variant: 'secondary' };
    case 'cancelled':  return { label: 'Cancelado', variant: 'destructive' };
    case 'expired':    return { label: 'Vencido', variant: 'destructive' };
    default:           return { label: 'Activo', variant: 'default' };
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function SubscriptionSection({
  formData,
  userEmail,
  profile,
  onSave,
  onRefresh,
  isSaving = false,
  formState,
  updateField,
}: SubscriptionSectionProps) {
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [checkingWebhook, startCheckingWebhook] = useTransition();
  const searchParams = useSearchParams();

  const { user } = useAuth();

  // Detectar si MP redirigió de vuelta con un preapproval_id
  const returnedPreapprovalId = searchParams.get('preapproval_id');

  const subscription = profile?.subscription || formData.subscription || {
    active: false,
    plan: 'free' as const,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    trialUsed: false,
  };

  const isPro = subscription.plan === 'pro' && subscription.active;
  const isOnTrial = subscription.plan === 'trial' && subscription.active;
  // Tiene plan pro iniciado pero el webhook aún no confirmó el pago
  const isPendingConfirmation =
    subscription.plan === 'pro' && subscription.paymentStatus === 'pending';

  const endDateMs = subscription.endDate
    ? (subscription.endDate as any).toDate
      ? (subscription.endDate as any).toDate().getTime()
      : new Date(subscription.endDate as string).getTime()
    : 0;

  const graceUntilMs = subscription.graceUntil
    ? (subscription.graceUntil as any).toDate
      ? (subscription.graceUntil as any).toDate().getTime()
      : new Date(subscription.graceUntil as string).getTime()
    : 0;

  // Canceló la renovación automática pero el acceso aún está vigente hasta endDate
  // Usa cancelAtPeriodEnd (soft-cancel) — NO toca paymentStatus
  const isCancelledActive =
    subscription.plan === 'pro' &&
    subscription.active &&
    subscription.cancelAtPeriodEnd === true &&
    endDateMs > Date.now();

  const trialDaysLeft = isOnTrial
    ? Math.max(0, Math.ceil((endDateMs - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const nextPaymentDate = endDateMs
    ? new Date(endDateMs).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const paymentStatusInfo = getPaymentStatusLabel(subscription.paymentStatus, isCancelledActive);
  const isInGracePeriod = graceUntilMs > Date.now();

  const refreshSubscriptionStatus = useCallback(async () => {
    startCheckingWebhook(async () => {
      try {
        const refreshAction = onRefresh ?? onSave;
        await refreshAction?.();
      } catch (error) {
        console.error('Error refrescando suscripcion:', error);
      }
    });
  }, [onRefresh, onSave, startCheckingWebhook]);

  /** Genera el link de MercadoPago y abre en nueva pestaña */
  const handleSubscribe = async () => {
    const defaultPayerEmail =
      subscription.billing?.payerEmail ?? user?.email ?? userEmail ?? '';

    const inputPayerEmail = window.prompt(
      'Ingresá el email de la cuenta compradora de Mercado Pago:',
      defaultPayerEmail
    );

    if (inputPayerEmail === null) {
      return;
    }

    const payerEmail = inputPayerEmail.trim().toLowerCase();

    if (!isValidEmail(payerEmail)) {
      toast.error('Ingresá un email válido de la cuenta compradora.');
      return;
    }

    const paymentWindow = window.open('', '_blank', 'noopener,noreferrer');

    if (!paymentWindow) {
      toast.error('Tu navegador bloqueó la ventana de pago. Habilitá popups e intentá de nuevo.');
      return;
    }

    setProcessingPayment(true);
    try {
      const functions = getFunctions(app, 'southamerica-east1');
      const createSubscription = httpsCallable<
        { storeId: string; userId: string; userEmail: string; plan: string },
        { initPoint: string }
      >(functions, 'createSubscription');

      const storeId = profile?.id ?? '';
      const userId = user?.uid ?? '';

      if (!storeId || !userId) {
        toast.error('No se pudo identificar tu tienda. Intentá recargar la página.');
        paymentWindow.close();
        return;
      }

      const result = await createSubscription({
        storeId,
        userId,
        userEmail: payerEmail,
        plan: PRO_PLAN.id,
      });

      paymentWindow.location.href = result.data.initPoint;
      toast.success('Redirigiendo a MercadoPago...');
      await refreshSubscriptionStatus();
    } catch (error: any) {
      console.error('Error creando suscripcion:', error);
      paymentWindow.close();
      toast.error(error?.message ?? 'No se pudo generar el link de pago. Intentá de nuevo.');
    } finally {
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    if (!returnedPreapprovalId) {
      return;
    }

    const timeout = setTimeout(() => {
      refreshSubscriptionStatus();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [refreshSubscriptionStatus, returnedPreapprovalId]);

  /** WhatsApp para consultas */
  const handleWhatsApp = () => {
    const storeName = profile?.basicInfo?.name || formData.name || 'Sin nombre';
    const email = user?.email ?? userEmail ?? '';
    const planLabel = isPro ? 'Profesional (activo)' : isOnTrial ? 'Período de prueba' : 'Gratuito';

    const text = encodeURIComponent(
      [
        'Hola! Tengo una consulta sobre mi suscripción en TuTiendaWeb.',
        '',
        '*Datos de mi cuenta:*',
        `• Comercio: ${storeName}`,
        email ? `• Email: ${email}` : '',
        `• Plan actual: ${planLabel}`,
      ]
        .filter(Boolean)
        .join('\n')
    );

    window.open(`https://wa.me/5491123456789?text=${text}`, '_blank');
  };

  /** Cancela la suscripción activa llamando a la Firebase Function */
  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    try {
      const functions = getFunctions(app, 'southamerica-east1');
      const cancelSubscription = httpsCallable<
        { storeId: string; userId: string },
        { success: boolean; message: string }
      >(functions, 'cancelSubscription');

      const storeId = profile?.id ?? '';
      const userId = user?.uid ?? '';

      if (!storeId || !userId) {
        toast.error('No se pudo identificar tu tienda. Intentá recargar la página.');
        return;
      }

      const result = await cancelSubscription({ storeId, userId });
      toast.success(result.data.message || 'Suscripción cancelada.');
      await refreshSubscriptionStatus();
    } catch (error: any) {
      console.error('Error cancelando suscripción:', error);
      toast.error(error?.message ?? 'No se pudo cancelar la suscripción. Intentá de nuevo.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  /** Reactiva la suscripción cancelando el soft-cancel (cancelAtPeriodEnd=false) */
  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const functions = getFunctions(app, 'southamerica-east1');
      const reactivateSubscription = httpsCallable<
        { storeId: string; userId: string },
        { success: boolean; message: string }
      >(functions, 'reactivateSubscription');

      const storeId = profile?.id ?? '';
      const userId = user?.uid ?? '';

      if (!storeId || !userId) {
        toast.error('No se pudo identificar tu tienda. Intentá recargar la página.');
        return;
      }

      const result = await reactivateSubscription({ storeId, userId });
      toast.success(result.data.message || 'Suscripción reactivada.');
      await refreshSubscriptionStatus();
    } catch (error: any) {
      console.error('Error reactivando suscripción:', error);
      toast.error(error?.message ?? 'No se pudo reactivar la suscripción. Intentá de nuevo.');
    } finally {
      setReactivating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Suscripción</h2>
        <p className="text-sm text-gray-500 mt-0.5">Gestioná tu plan y facturación</p>
      </div>

      {/* Banner de retorno desde MercadoPago */}
      {returnedPreapprovalId && isPendingConfirmation && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Pago recibido — confirmación en proceso.</strong>{' '}
            MercadoPago está verificando tu pago. Esto puede demorar unos minutos.
            Recargá la página en un momento para ver el estado actualizado.
          </AlertDescription>
        </Alert>
      )}

      {/* Banner si ya está autorizado */}
      {returnedPreapprovalId && isPro && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>¡Suscripción activa!</strong> Tu plan Profesional fue confirmado correctamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Estado actual */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="w-4 h-4 text-purple-600" />
            Estado actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Plan */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</p>
              <p className={cn(
                'text-lg font-bold',
                (isPro || isCancelledActive) ? 'text-purple-600' : 'text-gray-700'
              )}>
                {isPro || isCancelledActive || isPendingConfirmation
                  ? 'Profesional'
                  : isOnTrial
                  ? 'Período de prueba'
                  : 'Gratuito'}
              </p>
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  subscription.active ? (isCancelledActive ? 'bg-orange-400' : 'bg-green-500') : 'bg-gray-400'
                )} />
                <Badge
                  variant={paymentStatusInfo.variant}
                  className={cn(
                    'text-xs font-medium',
                    paymentStatusInfo.variant === 'default' && 'bg-green-100 text-green-800 hover:bg-green-100',
                    paymentStatusInfo.variant === 'secondary' && isCancelledActive && 'bg-orange-100 text-orange-800 hover:bg-orange-100',
                    paymentStatusInfo.variant === 'secondary' && !isCancelledActive && 'bg-orange-100 text-orange-800 hover:bg-orange-100',
                  )}
                >
                  {subscription.paymentStatus === 'pending' ? 'Confirmando...' : paymentStatusInfo.label}
                </Badge>
              </div>
            </div>

            {/* Fecha: "Próximo pago" para activos, "Acceso hasta" para cancelados vigentes */}
            {nextPaymentDate && (isPro || isPendingConfirmation || isCancelledActive) && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {isCancelledActive ? 'Acceso hasta' : 'Próximo pago'}
                </p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">{nextPaymentDate}</p>
                </div>
              </div>
            )}
          </div>

          {/* Alerta de trial */}
          {isOnTrial && (
            <Alert className="mt-4 border-orange-200 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-500" />
              <AlertDescription className="text-orange-700">
                Tu período de prueba vence en <strong>{trialDaysLeft} {trialDaysLeft === 1 ? 'día' : 'días'}</strong>.
                Activá el plan Profesional para no perder el acceso.
              </AlertDescription>
            </Alert>
          )}

           {/* Alerta pago pendiente (sin preapproval_id en URL) */}
            {isPendingConfirmation && !returnedPreapprovalId && (
              <Alert className="mt-4 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-700">
                  Tu pago está pendiente de confirmación por MercadoPago.
                  Si ya completaste el pago, recargá la página en unos minutos.
                </AlertDescription>
              </Alert>
            )}

            {isInGracePeriod && (
              <Alert className="mt-4 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-700">
                  Hubo un problema con tu último pago. Tenés hasta{' '}
                  <strong>{new Date(graceUntilMs).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}</strong>{' '}
                 para renovarla antes de perder el acceso.
               </AlertDescription>
             </Alert>
           )}
         </CardContent>
       </Card>

      {/* Card del plan Pro — solo si no es Pro, no está pendiente y no está cancelado-pero-vigente */}
      {!isPro && !isPendingConfirmation && !isCancelledActive && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Crown className="w-5 h-5 text-purple-600" />
                  Plan {PRO_PLAN.name}
                </CardTitle>
                <CardDescription className="mt-1 text-purple-700/80">
                  {PRO_PLAN.description}
                </CardDescription>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-3xl font-bold text-purple-900">
                  ${PRO_PLAN.price.toLocaleString('es-AR')}
                </p>
                <p className="text-sm text-purple-600">/ {PRO_PLAN.period}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <Separator className="bg-purple-100" />

            {/* Features */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRO_PLAN.features.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <div className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>

            <Separator className="bg-purple-100" />

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button
                type="button"
                onClick={handleSubscribe}
                disabled={processingPayment}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generando link...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Activar plan Profesional
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                Pago seguro vía MercadoPago. Podés cancelar en cualquier momento.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pendiente de confirmación: card informativa */}
      {isPendingConfirmation && (
        <Card className="border-orange-200 bg-orange-50/40">
          <CardContent className="pt-5">
             <div className="flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0 animate-spin" />
                  <div>
                    <p className="font-semibold text-orange-800">Confirmando tu suscripción</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Tu pago fue enviado a MercadoPago y está siendo procesado.
                      Una vez confirmado, tu plan Profesional quedará activo automáticamente.
                      Este proceso puede demorar algunos minutos.
                    </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    onClick={refreshSubscriptionStatus}
                    disabled={checkingWebhook}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    {checkingWebhook ? 'Verificando...' : 'Verificar estado'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                        disabled={cancellingSubscription}
                      >
                        {cancellingSubscription ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            No pagué — cancelar
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿No completaste el pago?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Si no llegaste a pagar o querés intentarlo de nuevo, podés cancelar
                          este intento y empezar desde cero. No se realizó ningún cobro.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Cancelar intento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelado pero vigente: card naranja informativa */}
      {isCancelledActive && (
        <Card className="border-orange-200 bg-orange-50/40">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-orange-800">Renovación automática cancelada</p>
                <p className="text-sm text-orange-700 mt-1">
                  Cancelaste la renovación automática. Seguís teniendo acceso completo a todas las
                  funciones hasta el <strong>{nextPaymentDate}</strong>. Luego tu cuenta pasará al
                  plan gratuito.
                </p>
                <Button
                  type="button"
                  onClick={handleReactivate}
                  disabled={reactivating}
                  size="sm"
                  className="mt-3 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {reactivating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Reactivando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Reactivar suscripción
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Si ya es Pro: confirmación */}
      {isPro && (
        <Card className="border-green-200 bg-green-50/40">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-800">Tu plan Profesional está activo</p>
                <p className="text-sm text-green-700 mt-0.5">
                  Tenés acceso completo a todas las funciones de TuTiendaWeb.
                </p>
                {!isCancelledActive && (
                <div className="mt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        disabled={cancellingSubscription}
                      >
                        {cancellingSubscription ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Cancelar suscripción
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Si cancelás ahora, tu plan Profesional seguirá activo hasta el final del
                          período ya pagado. Luego tu cuenta pasará al plan gratuito.
                          Podés reactivarla cuando quieras.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Sí, cancelar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Soporte vía WhatsApp */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MessageCircle className="w-4 h-4" />
            ¿Tenés dudas sobre tu suscripción?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={handleWhatsApp}
            className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contactar por WhatsApp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SubscriptionSection;
