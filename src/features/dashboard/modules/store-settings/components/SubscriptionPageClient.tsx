'use client';

import React, { useCallback, useTransition, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '@/lib/firebase/client';
import { useAuth } from '@/features/auth/providers/auth-store-provider';
import { StoreProfile, SubscriptionInfo } from '../types/store.type';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  ArrowRight
} from 'lucide-react';

interface SubscriptionPageClientProps {
  initialProfile: StoreProfile | null;
  userEmail?: string;
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

export default function SubscriptionPageClient({
  initialProfile: profile,
  userEmail,
}: SubscriptionPageClientProps) {
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [payerEmailInput, setPayerEmailInput] = useState('');
  const [checkingWebhook, startCheckingWebhook] = useTransition();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const returnedPreapprovalId = searchParams.get('preapproval_id');

  const subscription = profile?.subscription || {
    active: false,
    plan: 'free' as const,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    trialUsed: false,
  };

  const isPro = subscription.plan === 'pro' && subscription.active;
  const isOnTrial = subscription.plan === 'trial' && subscription.active;
  const isPendingConfirmation = subscription.plan === 'pro' && subscription.paymentStatus === 'pending';

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
  const suggestedPayerEmail = subscription.billing?.payerEmail ?? user?.email ?? userEmail ?? '';

  useEffect(() => {
    if (!payerEmailInput) {
      setPayerEmailInput(suggestedPayerEmail);
    }
  }, [payerEmailInput, suggestedPayerEmail]);

  const refreshSubscriptionStatus = useCallback(async () => {
    startCheckingWebhook(async () => {
      try {
        router.refresh(); // Refreshes the server component data
      } catch (error) {
        console.error('Error refrescando suscripcion:', error);
      }
    });
  }, [router, startCheckingWebhook]);

  const handleSubscribe = async () => {
    const payerEmail = payerEmailInput.trim().toLowerCase();

    if (!isValidEmail(payerEmail)) {
      toast.error('Ingresá un email válido de la cuenta compradora.');
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
        return;
      }

      const result = await createSubscription({
        storeId,
        userId,
        userEmail: payerEmail,
        plan: PRO_PLAN.id,
      });

      window.location.href = result.data.initPoint;
      toast.success('Redirigiendo a MercadoPago...');
    } catch (error: any) {
      console.error('Error creando suscripcion:', error);
      toast.error(error?.message ?? 'No se pudo generar el link de pago. Intentá de nuevo.');
    } finally {
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    if (!returnedPreapprovalId) return;

    const timeout = setTimeout(() => {
      refreshSubscriptionStatus();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [refreshSubscriptionStatus, returnedPreapprovalId]);

  const handleWhatsApp = () => {
    const storeName = profile?.basicInfo?.name || 'Sin nombre';
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
    <div className="py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-purple-600">
          <Crown className="w-6 h-6" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Suscripción y Plan</h1>
        </div>
        <p className="text-gray-500 text-sm md:text-base max-w-2xl">
          Gestioná el acceso a las funciones avanzadas de tu tienda. Llevá tu negocio al próximo nivel con herramientas profesionales.
        </p>
      </div>

      {/* Banners */}
      <div className="space-y-4">
        {returnedPreapprovalId && isPendingConfirmation && (
          <Alert className="border-blue-200 bg-blue-50/80 shadow-sm">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-800 font-semibold">Confirmando pago</AlertTitle>
            <AlertDescription className="text-blue-700 mt-1">
              MercadoPago está verificando tu transacción. Esto puede demorar unos minutos.
              Recargá la página en un momento para ver el estado actualizado.
            </AlertDescription>
          </Alert>
        )}

        {returnedPreapprovalId && isPro && (
          <Alert className="border-green-200 bg-green-50/80 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 font-semibold">¡Suscripción activa!</AlertTitle>
            <AlertDescription className="text-green-700 mt-1">
              Tu plan Profesional fue confirmado correctamente. ¡Ya podés disfrutar de todas las herramientas!
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Plan Details & Upgrade */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card del plan Pro */}
          {!isPro && !isPendingConfirmation && !isCancelledActive && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-md overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Crown className="w-32 h-32 text-purple-900" />
              </div>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 mb-3 border-none px-3 py-1">
                      Plan Recomendado
                    </Badge>
                    <CardTitle className="text-2xl font-bold text-purple-900">
                      {PRO_PLAN.name}
                    </CardTitle>
                    <CardDescription className="mt-2 text-purple-700/80 text-base max-w-sm">
                      {PRO_PLAN.description}
                    </CardDescription>
                  </div>
                  <div className="sm:text-right flex-shrink-0">
                    <div className="flex items-baseline sm:justify-end">
                      <span className="text-4xl font-extrabold text-purple-900">${PRO_PLAN.price.toLocaleString('es-AR')}</span>
                      <span className="text-lg text-purple-600 font-medium ml-1">/ {PRO_PLAN.period}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <Separator className="bg-purple-200/60" />

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                  {PRO_PLAN.features.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-start gap-3 text-sm text-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-purple-700" />
                      </div>
                      <span className="leading-tight pt-1">{label}</span>
                    </li>
                  ))}
                </ul>

                <Separator className="bg-purple-200/60" />

                <div className="bg-white/60 p-5 rounded-xl border border-purple-100 space-y-4 relative z-10 backdrop-blur-sm">
                  <div className="space-y-2">
                    <label htmlFor="payerEmail" className="text-sm font-semibold text-gray-700">
                      Email de la cuenta en Mercado Pago
                    </label>
                    <Input
                      id="payerEmail"
                      type="email"
                      value={payerEmailInput}
                      onChange={(event) => setPayerEmailInput(event.target.value)}
                      placeholder="comprador@email.com"
                      className="bg-white border-purple-200 focus-visible:ring-purple-500 h-11"
                      autoComplete="email"
                    />
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Necesitamos el email exacto con el que vas a realizar el pago.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={handleSubscribe}
                      disabled={processingPayment}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12 text-base font-medium shadow-sm transition-all"
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generando link de pago...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 mr-2" />
                          Suscribirme con MercadoPago
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-gray-500 mt-3">
                      Renovación automática. Podés cancelar en cualquier momento.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending State */}
          {isPendingConfirmation && (
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-orange-600 animate-spin" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">Pago en proceso</CardTitle>
                    <CardDescription className="text-orange-700/80">
                      Estamos esperando la confirmación de MercadoPago
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-orange-800">
                <p className="text-sm">
                  Tu pago fue enviado y está siendo procesado. Una vez confirmado, tu plan Profesional quedará activo automáticamente.
                  Este proceso puede demorar algunos minutos.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={refreshSubscriptionStatus}
                    disabled={checkingWebhook}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", checkingWebhook && "animate-spin")} />
                    {checkingWebhook ? 'Verificando...' : 'Verificar estado ahora'}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-orange-200 text-orange-700 hover:bg-orange-100"
                        disabled={cancellingSubscription}
                      >
                        {cancellingSubscription ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Cancelar intento
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
                          Sí, cancelar intento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Pro State */}
          {isPro && !isCancelledActive && (
             <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white shadow-md">
             <CardHeader>
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
                   <CheckCircle2 className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                   <CardTitle className="text-green-900 text-xl">¡Plan Profesional Activo!</CardTitle>
                   <CardDescription className="text-green-700/80">
                     Estás aprovechando al máximo TuTiendaWeb
                   </CardDescription>
                 </div>
               </div>
             </CardHeader>
             <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Tenés acceso ilimitado a todas las herramientas de personalización, reportes y ventas de la plataforma.
                </p>
                <div className="bg-white/60 rounded-lg p-4 border border-green-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Próxima facturación</p>
                    <p className="font-semibold text-gray-900">{nextPaymentDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Monto</p>
                    <p className="font-semibold text-gray-900">${PRO_PLAN.price.toLocaleString('es-AR')}</p>
                  </div>
                </div>
             </CardContent>
             <CardFooter className="bg-green-50/50 border-t border-green-100 pt-4 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={cancellingSubscription}
                    >
                      {cancellingSubscription ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Cancelar suscripción'
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Querés cancelar tu suscripción?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Si cancelás ahora, tu plan Profesional seguirá activo hasta el <strong>{nextPaymentDate}</strong> (el final del
                        período ya pagado). Luego tu cuenta pasará al plan gratuito. Podés reactivarla cuando quieras.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Mantener plan</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Sí, cancelar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
             </CardFooter>
           </Card>
          )}

          {/* Cancelled Active State */}
          {isCancelledActive && (
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-orange-900">Suscripción Cancelada</CardTitle>
                    <CardDescription className="text-orange-700/80">
                      La renovación automática está desactivada
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-orange-800 text-sm">
                  Seguís teniendo acceso completo a todas las funciones profesionales hasta el <strong>{nextPaymentDate}</strong>. Luego tu cuenta pasará automáticamente al plan gratuito.
                </p>
                <Button
                  type="button"
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white shadow-sm mt-2"
                >
                  {reactivating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reactivando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Volver a activar la suscripción
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Proceso Explicativo (Solo si no es Pro o está en Trial) */}
          {(!isPro || isOnTrial) && !isPendingConfirmation && !isCancelledActive && (
            <Card className="border-gray-200 shadow-sm bg-gray-50/50">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Cómo funciona</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6 relative">
                  {/* Conector visual para desktop */}
                  <div className="hidden md:block absolute top-6 left-8 right-8 h-0.5 bg-gray-200 z-0"></div>
                  
                  <div className="flex-1 relative z-10 flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-purple-200 flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">1. Prueba Gratis</h4>
                      <p className="text-xs text-gray-500 mt-1">Disfrutá 7 días de todas las funciones sin compromiso.</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 relative z-10 flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-purple-600 flex items-center justify-center shadow-sm shadow-purple-100">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">2. Activación</h4>
                      <p className="text-xs text-gray-500 mt-1">Elegí el plan mensual y pagá seguro con MercadoPago.</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 relative z-10 flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
                      <Zap className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">3. A vender</h4>
                      <p className="text-xs text-gray-500 mt-1">Desbloqueá límites y potenciá tu negocio al máximo.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Column: Status & Support */}
        <div className="lg:col-span-5 space-y-6">
          
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-base text-gray-800">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                Resumen de tu cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan Actual</p>
                  <p className={cn(
                    'text-lg font-bold',
                    (isPro || isCancelledActive) ? 'text-purple-600' : 'text-gray-900'
                  )}>
                    {isPro || isCancelledActive || isPendingConfirmation
                      ? 'Profesional'
                      : isOnTrial
                      ? 'Período de prueba'
                      : 'Gratuito'}
                  </p>
                </div>
                <div className="text-right">
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

              {nextPaymentDate && (isPro || isPendingConfirmation || isCancelledActive) && (
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      {isCancelledActive ? 'Acceso hasta' : 'Próximo cobro'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{nextPaymentDate}</span>
                </div>
              )}

              {isOnTrial && (
                <Alert className="border-orange-200 bg-orange-50/50 py-3">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="text-orange-800 text-sm ml-2">
                    Tu prueba gratis termina en <strong className="font-bold">{trialDaysLeft} {trialDaysLeft === 1 ? 'día' : 'días'}</strong>.
                  </AlertDescription>
                </Alert>
              )}

              {isInGracePeriod && (
                <Alert className="border-red-200 bg-red-50/50 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-800 text-sm ml-2">
                    Problema con tu pago. Tenés hasta el <strong className="font-bold">{new Date(graceUntilMs).toLocaleDateString('es-AR')}</strong> para renovar.
                  </AlertDescription>
                </Alert>
              )}

            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-gray-800">
                <HeadphonesIcon className="w-4 h-4 text-gray-500" />
                ¿Necesitás ayuda?
              </CardTitle>
              <CardDescription>
                Estamos para ayudarte con cualquier duda sobre tu facturación o plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={handleWhatsApp}
                className="w-full border-green-200 bg-green-50/30 text-green-700 hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contactar por WhatsApp
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
