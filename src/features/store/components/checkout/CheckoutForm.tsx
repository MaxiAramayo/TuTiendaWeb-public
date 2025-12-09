/**
 * Formulario de checkout refactorizado
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
import type { ProductInCart } from "@/shared/types/store";
import type { StoreSettings } from "@/features/store/types/store.types";
import { checkoutFormSchema, type CheckoutFormData } from "../../schemas/checkout.schema";
import { processCheckoutAction } from "../../actions/checkout.actions";
import { useCartStore } from "@/features/store/store/cart.store";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useThemeClasses, useThemeStyles } from "../../hooks/useStoreTheme";
import { CreditCard, AlertCircle, User, Truck, MapPin, MessageSquare, CheckCircle2 } from "lucide-react";
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
  { id: 'efectivo', name: 'Efectivo', enabled: true, instructions: 'Pago en efectivo al momento de la entrega' },
  { id: 'transferencia', name: 'Transferencia bancaria', enabled: false },
  { id: 'mercadopago', name: 'MercadoPago', enabled: false }
];

const defaultDeliveryMethods = [
  { id: 'retiro', name: 'Retiro en local', enabled: true, price: 0 },
  { id: 'delivery', name: 'Delivery', enabled: true, price: 0 }
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Formulario de checkout con validación Zod y Server Actions
 */
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
  const themeStyles = useThemeStyles();

  // Configuración con fallbacks
  const paymentMethods = storeSettings?.paymentMethods || defaultPaymentMethods;
  const deliveryMethods = storeSettings?.deliveryMethods || defaultDeliveryMethods;

  // Filtrar métodos habilitados
  const enabledPaymentMethods = paymentMethods.filter(method => method.enabled);
  const enabledDeliveryMethods = deliveryMethods.filter(method => method.enabled);

  // React Hook Form con Zod
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
      formaDeConsumir: "retiro",
      formaDePago: "efectivo",
      direccion: "",
      aclaracion: "",
    },
  });

  // Observar valores del formulario
  const formaDePago = watch("formaDePago");
  const formaDeConsumir = watch("formaDeConsumir");
  const direccion = watch("direccion");

  // Métodos seleccionados
  const selectedPaymentMethod = enabledPaymentMethods.find(m => m.id === formaDePago);
  const selectedDeliveryMethod = enabledDeliveryMethods.find(m => m.id === formaDeConsumir);

  // Calcular totales
  const deliveryPrice = selectedDeliveryMethod?.price || 0;
  const finalTotal = total + deliveryPrice;

  // Limpiar dirección cuando no es delivery
  useEffect(() => {
    if (formaDeConsumir !== "delivery") {
      setValue("direccion", "");
    }
  }, [formaDeConsumir, setValue]);

  // Handler del submit
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

        // Preparar datos para el ticket
        const orderInfo = {
          orderId: result.data.orderId,
          orderNumber: result.data.orderNumber,
          customerName: data.nombre,
          deliveryMethod: data.formaDeConsumir,
          paymentMethod: data.formaDePago,
          address: data.direccion || '',
          notes: data.aclaracion || '',
          products: carrito,
          subtotal: total,
          deliveryPrice,
          total: finalTotal,
          whatsappMessage: result.data.whatsappMessage,
          whatsappNumber: result.data.whatsappNumber,
          storeName: result.data.storeName,
        };

        // NO limpiar el carrito aquí - se limpiará cuando vuelva a la tienda
        // clearCart();

        // Callback con datos del pedido
        if (onOrderComplete) {
          onOrderComplete(result.data.orderId, orderInfo);
        }
      } else {
        // Manejar errores de validación
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (field === '_form') {
              toast.error(messages[0]);
            } else {
              setError(field as keyof CheckoutFormData, { message: messages[0] });
            }
          });
        }
      }
    });
  });

  return (
    <div className="mb-5 flex flex-col gap-3 mt-5 w-full p-2 md:p-4 bg-white rounded-lg max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h1 className={`text-2xl font-bold ${themeClasses.price.primary}`}>
          Finalizar Pedido
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Completa los datos para confirmar tu pedido
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Campo de nombre */}
        <div className="sm:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <User className={`h-5 w-5 ${themeClasses.accent.primary}`} />
            <label htmlFor="nombre" className={`block text-sm font-medium ${themeClasses.price.secondary}`}>
              Nombre completo
            </label>
          </div>
          <input
            type="text"
            id="nombre"
            className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
            placeholder="Escriba su nombre completo"
            {...register("nombre")}
          />
          {errors.nombre && (
            <span className={`${themeClasses.status.error} text-xs`}>
              {errors.nombre.message}
            </span>
          )}
        </div>

        {/* Campo de forma de consumo */}
        <div className="sm:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className={`h-5 w-5 ${themeClasses.accent.primary}`} />
            <label htmlFor="formaDeConsumir" className={`block text-sm font-medium ${themeClasses.price.secondary}`}>
              Forma de entrega
            </label>
          </div>
          {enabledDeliveryMethods.length > 0 ? (
            <select
              id="formaDeConsumir"
              className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
              {...register("formaDeConsumir")}
            >
              {enabledDeliveryMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name} {method.price && method.price > 0 ? `(+$${method.price})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 rounded-lg border border-red-300 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-red-700 text-sm">
                  No hay métodos de entrega disponibles.
                </p>
              </div>
            </div>
          )}
          {errors.formaDeConsumir && (
            <span className={`${themeClasses.status.error} text-xs`}>
              {errors.formaDeConsumir.message}
            </span>
          )}
        </div>

        {/* Campo de dirección (solo para delivery) */}
        {formaDeConsumir === "delivery" && (
          <div className="sm:col-span-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className={`h-5 w-5 ${themeClasses.accent.primary}`} />
              <label htmlFor="direccion" className={`block text-sm font-medium ${themeClasses.price.secondary}`}>
                Dirección de entrega
              </label>
            </div>
            <textarea
              id="direccion"
              className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
              placeholder="Escriba la dirección completa (calle, número, piso, depto, referencias)"
              {...register("direccion")}
            />
            {errors.direccion && (
              <span className={`${themeClasses.status.error} text-xs`}>
                {errors.direccion.message}
              </span>
            )}
          </div>
        )}

        {/* Campo de forma de pago */}
        <div className="sm:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className={`h-5 w-5 ${themeClasses.accent.primary}`} />
            <label htmlFor="formaDePago" className={`block text-sm font-medium ${themeClasses.price.secondary}`}>
              Forma de Pago
            </label>
          </div>
          {enabledPaymentMethods.length > 0 ? (
            <>
              <select
                id="formaDePago"
                className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
                {...register("formaDePago")}
              >
                {enabledPaymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
              {selectedPaymentMethod?.instructions && (
                <div className={`mt-3 p-3 rounded-lg border ${themeClasses.background.secondary}`}>
                  <p className="text-sm text-gray-600">
                    <strong>Instrucciones:</strong> {selectedPaymentMethod.instructions}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 rounded-lg border border-red-300 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-red-700 text-sm">
                  No hay métodos de pago disponibles.
                </p>
              </div>
            </div>
          )}
          {errors.formaDePago && (
            <span className={`${themeClasses.status.error} text-xs`}>
              {errors.formaDePago.message}
            </span>
          )}
        </div>

        {/* Campo de aclaraciones */}
        <div className="sm:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className={`h-5 w-5 ${themeClasses.accent.primary}`} />
            <label htmlFor="aclaracion" className={`block text-sm font-medium ${themeClasses.price.secondary}`}>
              Aclaración sobre el pedido
            </label>
          </div>
          <textarea
            id="aclaracion"
            className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
            placeholder="Notas adicionales sobre el pedido"
            {...register("aclaracion")}
          />
        </div>

        {/* Resumen del pedido */}
        <div className={`p-4 rounded-lg border ${themeClasses.background.secondary}`}>
          <h4 className={`text-lg font-semibold ${themeClasses.price.secondary} mb-3`}>
            Resumen del pedido
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className={themeClasses.price.primary}>${total}</span>
            </div>
            {deliveryPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Envío:</span>
                <span className={themeClasses.price.primary}>${deliveryPrice}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between text-lg font-semibold">
                <span className={themeClasses.price.secondary}>Total:</span>
                <span className={themeClasses.price.primary}>${finalTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={isPending || enabledPaymentMethods.length === 0 || enabledDeliveryMethods.length === 0}
          className={`${themeClasses.button.primary.base} font-semibold px-4 py-3 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors w-full flex items-center justify-center gap-2`}
          style={themeStyles.button.primary}
        >
          {isPending ? (
            <>
              <LoadingSpinner size="sm" spinnerOnly className="text-white" />
              Procesando pedido...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Confirmar Pedido
            </>
          )}
        </button>

        {(enabledPaymentMethods.length === 0 || enabledDeliveryMethods.length === 0) && (
          <div className="p-3 rounded-lg border border-red-300 bg-red-50 mt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-red-700 text-sm">
                La tienda no tiene métodos de pago o entrega configurados.
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
