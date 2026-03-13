/**
 * Sección de métodos de pago y entrega
 *
 * Implementa CU-STORE-08: Configurar Métodos de Pago y Entrega
 * Permite habilitar y configurar métodos de pago y entrega.
 * Regla: siempre debe haber al menos un método activo en cada grupo.
 *
 * @module features/dashboard/modules/store-settings/components/sections
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileFormData, FormState, StoreProfile } from '../../types/store.type';
import { PaymentMethod, DeliveryMethod } from '@/shared/types/firebase.types';
import { updatePaymentDeliveryAction, getProfileAction } from '../../actions/profile.actions';
import { useProfileStore } from '../../stores/profile.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CreditCard,
  Truck,
  DollarSign,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Save,
  Loader2,
  ArrowRightLeft,
  ShoppingBag,
  Lock,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentDeliverySectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  profile?: StoreProfile | null;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

// ============================================================================
// CONFIG
// ============================================================================

const PAYMENT_CONFIG = {
  efectivo: {
    id: 'efectivo',
    name: 'Efectivo',
    description: 'Pago en efectivo al momento de la entrega',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  transferencia: {
    id: 'transferencia',
    name: 'Transferencia',
    description: 'Transferencia bancaria o CBU / alias',
    icon: ArrowRightLeft,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  mercadopago: {
    id: 'mercadopago',
    name: 'MercadoPago',
    description: 'Pagos online — próximamente disponible',
    icon: CreditCard,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
    comingSoon: true,
  },
} as const;

const DELIVERY_CONFIG = {
  retiro: {
    id: 'retiro',
    name: 'Retiro en local',
    description: 'El cliente pasa a retirar el pedido',
    icon: MapPin,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  delivery: {
    id: 'delivery',
    name: 'Delivery',
    description: 'Entrega a domicilio',
    icon: Truck,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
  },
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/** Garantiza que todos los métodos del config estén presentes en el array */
function ensureAllPaymentMethods(existing: PaymentMethod[]): PaymentMethod[] {
  return Object.values(PAYMENT_CONFIG).map((cfg) => {
    const found = existing.find((m) => m.id === cfg.id);
    return found ?? { id: cfg.id, name: cfg.name, enabled: cfg.id === 'efectivo' };
  });
}

function ensureAllDeliveryMethods(existing: DeliveryMethod[]): DeliveryMethod[] {
  return Object.values(DELIVERY_CONFIG).map((cfg) => {
    const found = existing.find((m) => m.id === cfg.id);
    return found ?? { id: cfg.id, name: cfg.name, enabled: cfg.id === 'retiro', price: 0 };
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MethodCardProps {
  enabled: boolean;
  isLastActive: boolean;
  onToggle: (val: boolean) => void;
  icon: React.ElementType;
  name: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
  comingSoon?: boolean;
  extra?: React.ReactNode;
}

function MethodCard({
  enabled,
  isLastActive,
  onToggle,
  icon: Icon,
  name,
  description,
  color,
  bg,
  border,
  dot,
  comingSoon,
  extra,
}: MethodCardProps) {
  const isDisabledToggle = enabled && isLastActive;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all duration-200',
        enabled && !comingSoon ? `${border} ${bg}` : 'border-gray-200 bg-white',
        comingSoon && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Dot indicator */}
        <div className="mt-0.5 flex-shrink-0">
          <div
            className={cn(
              'w-2 h-2 rounded-full mt-1.5 transition-all',
              enabled && !comingSoon ? dot : 'bg-gray-300'
            )}
          />
        </div>

        {/* Icon */}
        <div
          className={cn(
            'p-2 rounded-lg flex-shrink-0',
            enabled && !comingSoon ? bg : 'bg-gray-100'
          )}
        >
          <Icon
            className={cn(
              'w-4 h-4',
              enabled && !comingSoon ? color : 'text-gray-400'
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'font-medium text-sm',
                enabled && !comingSoon ? 'text-gray-900' : 'text-gray-500'
              )}
            >
              {name}
            </span>
            {comingSoon && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                Próximamente
              </Badge>
            )}
            {isDisabledToggle && (
              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                <Lock className="w-2.5 h-2.5" />
                mínimo requerido
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>

          {/* Extra content (e.g. price field for delivery) */}
          <AnimatePresence>
            {extra && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3">{extra}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle */}
        <div className="flex-shrink-0">
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={comingSoon || isDisabledToggle}
            className={cn(isDisabledToggle && 'opacity-50 cursor-not-allowed')}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION WRAPPER
// ============================================================================

function Section({
  icon: Icon,
  title,
  description,
  children,
  hasError,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  hasError?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'p-1.5 rounded-lg',
            hasError ? 'bg-red-50' : 'bg-gray-100'
          )}
        >
          <Icon
            className={cn('w-4 h-4', hasError ? 'text-red-500' : 'text-gray-600')}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PaymentDeliverySection({
  formData,
  formState,
  updateField,
  profile,
  onSave,
  isSaving: externalIsSaving = false,
}: PaymentDeliverySectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { setProfile } = useProfileStore();

  // Normalizar arrays para asegurar que todos los métodos estén presentes
  const paymentMethods = useMemo(
    () => ensureAllPaymentMethods(Array.isArray(formData.paymentMethods) ? formData.paymentMethods : []),
    [formData.paymentMethods]
  );

  const deliveryMethods = useMemo(
    () => ensureAllDeliveryMethods(Array.isArray(formData.deliveryMethods) ? formData.deliveryMethods : []),
    [formData.deliveryMethods]
  );

  const activePaymentCount = useMemo(
    () => paymentMethods.filter((m) => m.enabled).length,
    [paymentMethods]
  );

  const activeDeliveryCount = useMemo(
    () => deliveryMethods.filter((m) => m.enabled).length,
    [deliveryMethods]
  );

  const hasError = activePaymentCount === 0 || activeDeliveryCount === 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const updatePaymentMethod = useCallback(
    (methodId: string, updates: Partial<PaymentMethod>) => {
      const updated = paymentMethods.map((m) =>
        m.id === methodId ? { ...m, ...updates } : m
      );
      updateField('paymentMethods', updated);
    },
    [paymentMethods, updateField]
  );

  const updateDeliveryMethod = useCallback(
    (methodId: string, updates: Partial<DeliveryMethod>) => {
      const updated = deliveryMethods.map((m) =>
        m.id === methodId ? { ...m, ...updates } : m
      );
      updateField('deliveryMethods', updated);
    },
    [deliveryMethods, updateField]
  );

  const handleSave = useCallback(async () => {
    if (!profile?.id) {
      toast.error('No se encontró el perfil');
      return;
    }
    if (hasError) {
      toast.error('Debe haber al menos un método activo en cada grupo');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updatePaymentDeliveryAction({
        paymentMethods,
        deliveryMethods,
      });

      if (result.success) {
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          setProfile(refreshResult.data as StoreProfile);
        }
        toast.success('Configuración guardada correctamente');
      } else {
        toast.error(result.errors?._form?.[0] || 'Error al guardar');
      }
    } catch {
      toast.error('Error al guardar los métodos de pago y entrega');
    } finally {
      setIsSaving(false);
    }
  }, [profile?.id, hasError, paymentMethods, deliveryMethods, setProfile]);

  const isCurrentlySaving = isSaving || externalIsSaving;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Métodos de pago y entrega</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Activá los métodos que querés ofrecer. Siempre debe haber al menos uno activo en cada grupo.
        </p>
      </div>

      {/* Error global */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Cada grupo debe tener al menos un método activo antes de guardar.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Métodos de pago ── */}
      <Section
        icon={CreditCard}
        title="Métodos de pago"
        description="¿Cómo aceptás pagos de tus clientes?"
        hasError={activePaymentCount === 0}
      >
        {paymentMethods.map((method) => {
          const cfg = PAYMENT_CONFIG[method.id as keyof typeof PAYMENT_CONFIG];
          if (!cfg) return null;
          const isLastActive = method.enabled && activePaymentCount === 1;

          return (
            <MethodCard
              key={method.id}
              enabled={method.enabled}
              isLastActive={isLastActive}
              onToggle={(val) => updatePaymentMethod(method.id, { enabled: val })}
              icon={cfg.icon}
              name={cfg.name}
              description={cfg.description}
              color={cfg.color}
              bg={cfg.bg}
              border={cfg.border}
              dot={cfg.dot}
              comingSoon={'comingSoon' in cfg ? cfg.comingSoon : false}
            />
          );
        })}
      </Section>

      {/* Divider */}
      <div className="border-t border-dashed border-gray-200" />

      {/* ── Métodos de entrega ── */}
      <Section
        icon={ShoppingBag}
        title="Métodos de entrega"
        description="¿Cómo llegás a tus clientes?"
        hasError={activeDeliveryCount === 0}
      >
        {deliveryMethods.map((method) => {
          const cfg = DELIVERY_CONFIG[method.id as keyof typeof DELIVERY_CONFIG];
          if (!cfg) return null;
          const isLastActive = method.enabled && activeDeliveryCount === 1;
          const isDelivery = method.id === 'delivery';

          return (
            <MethodCard
              key={method.id}
              enabled={method.enabled}
              isLastActive={isLastActive}
              onToggle={(val) => updateDeliveryMethod(method.id, { enabled: val })}
              icon={cfg.icon}
              name={cfg.name}
              description={cfg.description}
              color={cfg.color}
              bg={cfg.bg}
              border={cfg.border}
              dot={cfg.dot}
              extra={
                method.enabled && isDelivery ? (
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="delivery-price"
                      className="text-xs text-gray-500 whitespace-nowrap"
                    >
                      Costo de envío
                    </Label>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        $
                      </span>
                      <Input
                        id="delivery-price"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        value={method.price ?? ''}
                        onChange={(e) =>
                          updateDeliveryMethod(method.id, {
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="pl-6 h-8 text-sm"
                      />
                    </div>
                    {(!method.price || method.price === 0) && (
                      <span className="text-[10px] text-gray-400">gratis</span>
                    )}
                  </div>
                ) : null
              }
            />
          );
        })}
      </Section>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isCurrentlySaving || hasError}
          size="sm"
          className="flex items-center gap-2 min-w-[140px] bg-gray-900 hover:bg-gray-800"
        >
          {isCurrentlySaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isCurrentlySaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}

export default PaymentDeliverySection;
