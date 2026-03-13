/**
 * Formulario de checkout
 *
 * Recibe datos de la tienda por props (desde Server Component)
 * Usa React Hook Form + Zod para validación
 * Usa Server Actions para mutaciones
 *
 * @module features/store/components/checkout
 */
"use client";

import React, { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ProductInCart } from "@/shared/types/store";
import type { StoreSettings } from "@/features/store/types/store.types";
import { checkoutFormSchema, type CheckoutFormData } from "../../schemas/checkout.schema";
import { processCheckoutAction } from "../../actions/checkout.actions";
import { useCartStore } from "@/features/store/store/cart.store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useThemeClasses } from "../../hooks/useStoreTheme";
import { formatPrice } from "@/features/products/utils/product.utils";
import {
  CreditCard,
  AlertCircle,
  User,
  Truck,
  MapPin,
  MessageSquare,
  CheckCircle2,
  Banknote,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

interface CheckoutFormProps {
  carrito: ProductInCart[];
  total: number;
  storeId: string;
  storeName: string;
  whatsapp: string;
  storeSettings?: StoreSettings;
  onOrderComplete?: (orderId: string, orderInfo: Record<string, unknown>) => void;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const defaultPaymentMethods = [
  {
    id: "efectivo",
    name: "Efectivo",
    enabled: true,
    instructions: "Pago en efectivo al momento de la entrega",
  },
  { id: "transferencia", name: "Transferencia", enabled: false },
  { id: "mercadopago", name: "MercadoPago", enabled: false },
];

const defaultDeliveryMethods = [
  { id: "retiro", name: "Retiro en local", enabled: true, price: 0, type: "pickup" as const },
  { id: "delivery", name: "Delivery", enabled: true, price: 0, type: "delivery" as const },
];

// Íconos para métodos de pago
const paymentIcons: Record<string, React.ReactNode> = {
  efectivo: <Banknote className="h-4 w-4" />,
  transferencia: <CreditCard className="h-4 w-4" />,
  mercadopago: <Smartphone className="h-4 w-4" />,
};

// Íconos para métodos de entrega
const deliveryIcons: Record<string, React.ReactNode> = {
  retiro: <MapPin className="h-4 w-4" />,
  delivery: <Truck className="h-4 w-4" />,
};

// ============================================================================
// HELPERS
// ============================================================================

/** Elimina duplicados por ID manteniendo el primero encontrado */
function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// ============================================================================
// CARD RADIO — opción seleccionable visual
// ============================================================================

interface CardRadioProps {
  value: string;
  selected: boolean;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

const CardRadio = ({ selected, label, sublabel, icon, onClick }: CardRadioProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full p-3.5 rounded-xl border-2 text-left transition-all duration-150",
      selected
        ? "border-[var(--store-primary)] bg-[var(--store-primary)]/5"
        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
    )}
  >
    {/* Indicador radio */}
    <span
      className={cn(
        "flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
        selected ? "border-[var(--store-primary)]" : "border-gray-300"
      )}
    >
      {selected && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--store-primary)" }}
        />
      )}
    </span>

    {/* Ícono */}
    {icon && (
      <span
        className={cn(
          "flex-shrink-0 transition-colors",
          selected ? "text-[var(--store-primary)]" : "text-gray-400"
        )}
      >
        {icon}
      </span>
    )}

    {/* Texto */}
    <div className="flex-1 min-w-0">
      <span
        className={cn(
          "block text-sm font-medium transition-colors",
          selected ? "text-[var(--store-primary)]" : "text-gray-700"
        )}
      >
        {label}
      </span>
      {sublabel && <span className="block text-xs text-gray-400 mt-0.5">{sublabel}</span>}
    </div>
  </button>
);

// ============================================================================
// SECTION CARD — tarjeta blanca para agrupar campos del formulario
// ============================================================================

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    {children}
  </div>
);

// ============================================================================
// COMPONENT
// ============================================================================

export const CheckoutForm = ({
  carrito,
  total,
  storeId,
  storeName,
  whatsapp,
  storeSettings,
  onOrderComplete,
}: CheckoutFormProps) => {
  const [isPending, startTransition] = useTransition();
  const { clearCart } = useCartStore();
  const themeClasses = useThemeClasses();

  // Configuración con fallbacks + deduplicación para evitar entradas duplicadas en Firestore
  const rawPaymentMethods = storeSettings?.paymentMethods || defaultPaymentMethods;
  const rawDeliveryMethods = storeSettings?.deliveryMethods || defaultDeliveryMethods;

  const enabledPaymentMethods = deduplicateById(rawPaymentMethods.filter((m) => m.enabled));
  const enabledDeliveryMethods = deduplicateById(rawDeliveryMethods.filter((m) => m.enabled));

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      nombre: "",
      formaDeConsumir: enabledDeliveryMethods[0]?.id || "retiro",
      formaDePago: enabledPaymentMethods[0]?.id || "efectivo",
      direccion: "",
      aclaracion: "",
    },
  });

  const formaDePago = watch("formaDePago");
  const formaDeConsumir = watch("formaDeConsumir");

  const selectedPaymentMethod = enabledPaymentMethods.find((m) => m.id === formaDePago);
  const selectedDeliveryMethod = enabledDeliveryMethods.find((m) => m.id === formaDeConsumir);

  const deliveryPrice = selectedDeliveryMethod?.price || 0;
  const finalTotal = total + deliveryPrice;

  // El campo dirección se muestra cuando el método de entrega es delivery
  // Soporta tanto id === 'delivery' como type === 'delivery' para métodos personalizados
  const requiresAddress =
    formaDeConsumir === "delivery" ||
    (selectedDeliveryMethod as any)?.type === "delivery";

  // Limpiar dirección cuando no se requiere
  useEffect(() => {
    if (!requiresAddress) {
      setValue("direccion", "");
    }
  }, [requiresAddress, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    if (!carrito || carrito.length === 0) {
      toast.error("No puedes realizar un pedido sin productos en el carrito");
      return;
    }

    startTransition(async () => {
      const result = await processCheckoutAction({
        storeId,
        formData: data,
        cartItems: carrito,
        subtotal: total,
        deliveryFee: deliveryPrice,
      });

      if (result.success) {
        toast.success("¡Pedido creado exitosamente!");

        const orderInfo = {
          orderId: result.data.orderId,
          orderNumber: result.data.orderNumber,
          customerName: data.nombre,
          deliveryMethod: data.formaDeConsumir,
          paymentMethod: data.formaDePago,
          address: data.direccion || "",
          notes: data.aclaracion || "",
          products: carrito,
          subtotal: total,
          deliveryPrice,
          total: finalTotal,
          whatsappMessage: result.data.whatsappMessage,
          whatsappNumber: result.data.whatsappNumber,
          storeName: result.data.storeName,
        };

        if (onOrderComplete) {
          onOrderComplete(result.data.orderId, orderInfo);
        }
      } else {
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (field === "_form") {
              toast.error(messages[0]);
            } else {
              setError(field as keyof CheckoutFormData, { message: messages[0] });
            }
          });
        }
      }
    });
  });

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, type: "spring", stiffness: 260, damping: 22 },
    }),
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-4">

        {/* ── Nombre ── */}
        <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionCard>
            <Label
              htmlFor="nombre"
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
            >
              <User className="h-4 w-4 text-gray-400" />
              Nombre completo
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: María García"
              className="h-11 bg-gray-50 border-gray-200 focus-visible:ring-[var(--store-primary)] focus-visible:border-[var(--store-primary)]"
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {errors.nombre.message}
              </p>
            )}
          </SectionCard>
        </motion.div>

        {/* ── Forma de entrega ── */}
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionCard>
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Truck className="h-4 w-4 text-gray-400" />
              Forma de entrega
            </Label>
            {enabledDeliveryMethods.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {enabledDeliveryMethods.map((method) => (
                  <CardRadio
                    key={method.id}
                    value={method.id}
                    selected={formaDeConsumir === method.id}
                    label={method.name}
                    sublabel={
                      method.price && method.price > 0
                        ? `+${formatPrice(method.price)}`
                        : "Sin costo adicional"
                    }
                    icon={
                      deliveryIcons[method.id] ||
                      ((method as any).type === "delivery"
                        ? <Truck className="h-4 w-4" />
                        : <MapPin className="h-4 w-4" />)
                    }
                    onClick={() => setValue("formaDeConsumir", method.id as any)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-red-300 bg-red-50 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">No hay métodos de entrega disponibles.</p>
              </div>
            )}
            {errors.formaDeConsumir && (
              <p className="text-xs text-red-500 mt-2">{errors.formaDeConsumir.message}</p>
            )}

            {/* ── Dirección (solo cuando se requiere) ── */}
            <AnimatePresence>
              {requiresAddress && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  className="overflow-hidden"
                >
                  <Label
                    htmlFor="direccion"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
                  >
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Dirección de entrega
                  </Label>
                  <Textarea
                    id="direccion"
                    placeholder="Calle, número, piso, depto, referencias..."
                    className="resize-none bg-gray-50 border-gray-200 focus-visible:ring-[var(--store-primary)]"
                    rows={2}
                    {...register("direccion")}
                  />
                  {errors.direccion && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.direccion.message}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>
        </motion.div>

        {/* ── Forma de pago ── */}
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionCard>
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <CreditCard className="h-4 w-4 text-gray-400" />
              Forma de pago
            </Label>
            {enabledPaymentMethods.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {enabledPaymentMethods.map((method) => (
                    <CardRadio
                      key={method.id}
                      value={method.id}
                      selected={formaDePago === method.id}
                      label={method.name}
                      icon={paymentIcons[method.id] || <CreditCard className="h-4 w-4" />}
                      onClick={() => setValue("formaDePago", method.id as any)}
                    />
                  ))}
                </div>
                <AnimatePresence>
                  {selectedPaymentMethod?.instructions && (
                    <motion.div
                      key="instructions"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong className="font-medium">Instrucciones: </strong>
                          {selectedPaymentMethod.instructions}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="p-3 rounded-lg border border-red-300 bg-red-50 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">No hay métodos de pago disponibles.</p>
              </div>
            )}
            {errors.formaDePago && (
              <p className="text-xs text-red-500 mt-2">{errors.formaDePago.message}</p>
            )}
          </SectionCard>
        </motion.div>

        {/* ── Notas adicionales ── */}
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionCard>
            <Label
              htmlFor="aclaracion"
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3"
            >
              <MessageSquare className="h-4 w-4 text-gray-400" />
              Notas adicionales
              <span className="text-gray-400 font-normal text-xs">(opcional)</span>
            </Label>
            <Textarea
              id="aclaracion"
              placeholder="Preferencias, alergias, instrucciones especiales..."
              className="resize-none bg-gray-50 border-gray-200 focus-visible:ring-[var(--store-primary)]"
              rows={2}
              {...register("aclaracion")}
            />
          </SectionCard>
        </motion.div>

        {/* ── Resumen final ── */}
        <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
          <SectionCard>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumen del pedido</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-700">{formatPrice(total)}</span>
              </div>
              {deliveryPrice > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Envío</span>
                  <span className="font-medium text-gray-700">{formatPrice(deliveryPrice)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center">
                <span className="font-semibold text-gray-800">Total a pagar</span>
                <span
                  className="font-bold text-lg"
                  style={{ color: "var(--store-primary)" }}
                >
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* ── Error general ── */}
        {(enabledPaymentMethods.length === 0 || enabledDeliveryMethods.length === 0) && (
          <div className="p-3 rounded-xl border border-red-300 bg-red-50 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">
              La tienda no tiene métodos de pago o entrega configurados.
            </p>
          </div>
        )}

        {/* ── Botón submit ── */}
        <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible">
          <button
            type="submit"
            disabled={
              isPending ||
              enabledPaymentMethods.length === 0 ||
              enabledDeliveryMethods.length === 0
            }
            className="w-full py-4 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2.5 shadow-md transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--store-primary)" }}
          >
            {isPending ? (
              <>
                <LoadingSpinner size="sm" spinnerOnly className="text-white" />
                <span>Procesando pedido...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar Pedido</span>
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
};
