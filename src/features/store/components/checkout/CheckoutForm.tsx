/**
 * Formulario de checkout para completar el pedido
 * 
 * @module features/store/components/checkout
 */
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import type { ProductInCart, FormCheckoutValues } from "@/shared/types/store";
import type { OptimizedSell } from "@/features/dashboard/modules/sells/types/optimized-sell";
import { formatMessage } from "./utils/formatMessage";
import { nanoid } from "nanoid";
import { useSellStore } from "@/features/dashboard/modules/sells/api/sellStore";
import { useStoreClient } from "@/features/store/api/storeclient";
import { Timestamp } from "firebase/firestore";
import DeliveryEstimation from "./DeliveryEstimation";
import { useStoreToast } from "../ui/FeedbackToast";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useThemeClasses, useThemeStyles } from "../../hooks/useStoreTheme";
import { useStoreSettings } from "../../hooks/useStoreSettings";
import { CreditCard, AlertCircle, User, Truck, MapPin, MessageSquare, CheckCircle2 } from "lucide-react";

interface CheckoutFormProps {
  carrito: ProductInCart[];
  total: number;
  onOrderComplete?: (orderId: string, orderInfo: any) => void;
}

/**
 * Componente de formulario para el checkout
 * Maneja la recolección de datos del cliente y el envío del pedido
 */
export const CheckoutForm = ({
  carrito,
  total,
  onOrderComplete,
}: CheckoutFormProps) => {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<FormCheckoutValues>({
    defaultValues: {
      nombre: "",
      formaDeConsumir: "delivery",
      formaDePago: "",
      direccion: "",
      aclaracion: "",
    },
  });
  
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();
  const { settings, loading: settingsLoading } = useStoreSettings();
  
  // Debug logs temporales
  console.log('🔍 [CheckoutForm] Settings:', settings);
  console.log('🔍 [CheckoutForm] PaymentMethods:', settings?.paymentMethods);
  console.log('🔍 [CheckoutForm] DeliveryMethods:', settings?.deliveryMethods);
  console.log('🔍 [CheckoutForm] Loading:', settingsLoading);
  
  // Filtrar métodos de pago y entrega habilitados
  const enabledPaymentMethods = settings?.paymentMethods?.filter(method => method.enabled) || [];
  const enabledDeliveryMethods = settings?.deliveryMethods?.filter(method => method.enabled) || [];
  
  console.log('🔍 [CheckoutForm] EnabledPaymentMethods:', enabledPaymentMethods);
  console.log('🔍 [CheckoutForm] EnabledDeliveryMethods:', enabledDeliveryMethods);
  
  // Observar valores del formulario
  const formaDePago = watch("formaDePago");
  const formaDeConsumir = watch("formaDeConsumir");
  const direccion = watch("direccion");
  
  // Observar los métodos seleccionados
  const selectedPaymentMethod = enabledPaymentMethods.find(method => method.id === formaDePago);
  const selectedDeliveryMethod = enabledDeliveryMethods.find(method => method.id === formaDeConsumir);

  // Obtener datos de la tienda desde el store global
  const { store } = useStoreClient();
  
  // Debug logs para store
  console.log('🔍 [CheckoutForm] Store:', store);
  console.log('🔍 [CheckoutForm] Store UID:', store?.uid);
  
  // Extraer datos de la tienda con fallbacks seguros
  const whatsapp = store?.contactInfo?.whatsapp || "";
  const StoreName = store?.basicInfo?.name || "";
  const uid = store?.id || "";


  
  // Hook para notificaciones
  const { showOrder, showError, messages } = useStoreToast();

  // Calcular precio de entrega y total final
  const deliveryPrice = selectedDeliveryMethod?.price || 0;
  const finalTotal = total + deliveryPrice;

  // Efecto para limpiar la dirección cuando se cambia a método sin entrega
  useEffect(() => {
    if (selectedDeliveryMethod && selectedDeliveryMethod.id !== "delivery") {
      setValue("direccion", "");
    }
  }, [selectedDeliveryMethod, setValue]);

  // Hooks deben estar al inicio del componente
  const { addSell } = useSellStore();

  // Si no hay datos de la tienda o está cargando configuración, mostrar loading
  if (!store || settingsLoading) {
    return (
      <div className="mb-5 flex flex-col gap-3 mt-5 w-full p-2 md:p-4 bg-white rounded-lg">
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">
            {!store ? 'Cargando datos de la tienda...' : 'Cargando configuración...'}
          </span>
        </div>
      </div>
    );
  }



  const onSubmit: SubmitHandler<FormCheckoutValues> = async (data) => {
    const { nombre, formaDeConsumir, direccion, formaDePago, aclaracion } = data;

    // Validar que el carrito no esté vacío
    if (!carrito || carrito.length === 0) {
      showError("No puedes realizar un pedido sin productos en el carrito", {
        duration: 4000
      });
      return;
    }

    // Validar que todos los campos requeridos estén completos
    if (!nombre || !formaDeConsumir || !formaDePago) {
      showError("Por favor completa todos los campos requeridos", {
        duration: 4000
      });
      return;
    }

    try {
      // Generar ID único para el pedido
      const orderId = nanoid(6);
      
      const mensaje = formatMessage({
        nombre,
        Name: StoreName,
        carrito,
        total: finalTotal,
        deliveryPrice,
        formaDeConsumir,
        direccion,
        formaDePago,
        aclaracion,
      });

      const sell: OptimizedSell = {
        id: orderId,
        orderNumber: `ORD-${orderId}`,
        products: carrito.map(product => ({
          id: product.id,
          idProduct: product.idProduct,
          name: product.name,
          price: product.price,
          category: product.category || '',
          cantidad: product.cantidad,
          aclaracion: product.aclaracion || '',
          appliedTopics: product.topics?.map(topic => ({
            id: topic.id,
            name: topic.name,
            price: topic.price
          })) || []
        })),
        date: new Date(),
        customerName: nombre,
        customerPhone: '', // Se puede agregar después si es necesario
        deliveryMethod: formaDeConsumir as 'pickup' | 'delivery' | 'shipping',
        address: direccion || '',
        paymentMethod: formaDePago,
        paymentStatus: 'pending' as const,
        status: 'pending' as const,
        subtotal: total,
        total: finalTotal,
        notes: aclaracion || "",
        source: 'web' as const
      };

      // Guardar la venta en Firebase
      const sellResult = await addSell(sell, uid);
      
      if (!sellResult) {
        throw new Error('Error al guardar la venta en Firebase');
      }
      
      // Mostrar notificación de éxito
      showOrder(messages.ORDER_CREATED, {
        duration: 3000
      });
      
      // Preparar datos del pedido para el ticket con validaciones defensivas
      // Formatear número de WhatsApp correctamente para enlaces internacionales
      // Si el número ya tiene código de país (+54), no duplicarlo
      let cleanWhatsappNumber = whatsapp?.replace(/\s+/g, '') || '';
      
      // Si el número ya comienza con +, usarlo tal como está (sin el +)
      if (cleanWhatsappNumber.startsWith('+')) {
        cleanWhatsappNumber = cleanWhatsappNumber.substring(1);
      } else if (!cleanWhatsappNumber.startsWith('54')) {
        // Solo agregar 54 si no está presente
        cleanWhatsappNumber = `54${cleanWhatsappNumber}`;
      }
      
      const orderInfo = {
        orderId: orderId || `order-${Date.now()}`,
        customerName: nombre || 'Cliente',
        deliveryMethod: formaDeConsumir || 'pickup',
        paymentMethod: formaDePago || 'cash',
        address: direccion || '',
        notes: aclaracion || '',
        products: Array.isArray(carrito) ? carrito : [],
        subtotal: typeof total === 'number' ? total : 0,
        deliveryPrice: typeof deliveryPrice === 'number' ? deliveryPrice : 0,
        total: typeof finalTotal === 'number' ? finalTotal : 0,
        whatsappMessage: mensaje || '',
        whatsappNumber: cleanWhatsappNumber,
        storeName: StoreName || 'Mi Tienda'
      };
      
      // Si hay callback, usarlo para navegar al ticket
      if (onOrderComplete) {
        onOrderComplete(orderId, orderInfo);
      } else {
        // Fallback: abrir WhatsApp directamente
        window.open(
          `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(mensaje)}`
        );
        
        // Notificación adicional sobre el envío
        setTimeout(() => {
          showOrder(messages.ORDER_SENT, {
            duration: 4000
          });
        }, 1000);
      }
      
    } catch (error) {
      console.error("Error al guardar la venta:", error);
      showError(messages.ORDER_ERROR, {
        duration: 5000
      });
    }
  };

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
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Campo de nombre */}
        <div className="sm:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <User className={`h-5 w-5 ${themeClasses.accent.primary}`} />
            <label
              htmlFor="nombre"
              className={`block text-sm font-medium ${themeClasses.price.secondary}`}
            >
              Nombre completo
            </label>
          </div>
          <div className="mt-2">
            <input
              type="text"
              id="nombre"
              className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
              placeholder="Escriba su nombre completo"
              {...register("nombre", { required: "Este campo es requerido" })}
            />
            {errors.nombre && (
              <span className={`${themeClasses.status.error} text-xs`}>
                {errors.nombre.message}
              </span>
            )}
          </div>
        </div>

      {/* Campo de forma de consumo */}
      <div className="sm:col-span-4">
        <div className="flex items-center gap-2 mb-3">
          <Truck className={`h-5 w-5 ${themeClasses.accent.primary}`} />
          <label
            htmlFor="formaDeConsumir"
            className={`block text-sm font-medium ${themeClasses.price.secondary}`}
          >
            Forma de consumir
          </label>
        </div>
        <div className="mt-2">
          {enabledDeliveryMethods.length > 0 ? (
            <>
              <select
                id="formaDeConsumir"
                className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
                {...register("formaDeConsumir", { required: "Este campo es requerido" })}
              >
                <option value="">Seleccione una opción</option>
                {enabledDeliveryMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name} {method.price && method.price > 0 ? `(+$${method.price})` : ''}
                  </option>
                ))}
              </select>
              
              {/* Información del método seleccionado se muestra solo en el resumen */}
            </>
          ) : (
            <div className={`p-3 rounded-lg border border-red-300 bg-red-50`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-red-700 text-sm">
                  No hay métodos de entrega disponibles. Contacta con la tienda.
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
      </div>

      {/* Campo de dirección (condicional) */}
      {selectedDeliveryMethod && selectedDeliveryMethod.id === "delivery" && (
        <div className="sm:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className={`h-5 w-5 ${themeClasses.accent.primary}`} />
            <label
              htmlFor="direccion"
              className={`block text-sm font-medium ${themeClasses.price.secondary}`}
            >
              Dirección de entrega
            </label>
          </div>
          <div className="mt-2">
            <textarea
              id="direccion"
              className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
              placeholder="Escriba la dirección completa de entrega (calle, número, piso, depto, referencias)"
              {...register("direccion", { 
                required: selectedDeliveryMethod?.id === "delivery" ? "Este campo es requerido" : false 
              })}
            />
            {errors.direccion && (
              <span className={`${themeClasses.status.error} text-xs`}>
                {errors.direccion.message}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Componente de estimación de tiempo de entrega */}
      {formaDeConsumir && (
        <DeliveryEstimation
          deliveryMethod={selectedDeliveryMethod?.id === 'delivery' ? 'delivery' : 'take'}
          address={direccion}
          orderTotal={finalTotal}
        />
      )}

          {/* Campo de forma de pago */}
          <div className="sm:col-span-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className={`h-5 w-5 ${themeClasses.accent.primary}`} />
              <label
                htmlFor="formaDePago"
                className={`block text-sm font-medium ${themeClasses.price.secondary}`}
              >
                Forma de Pago
              </label>
            </div>
            <div className="mt-2">
              {enabledPaymentMethods.length > 0 ? (
                <>
                  <select
                    id="formaDePago"
                    className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
                    {...register("formaDePago", { required: "Este campo es requerido" })}
                  >
                    <option value="">Seleccione una opción</option>
                    {enabledPaymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* Mostrar instrucciones del método seleccionado */}
                  {selectedPaymentMethod && selectedPaymentMethod.instructions && (
                    <div className={`mt-3 p-3 rounded-lg border ${themeClasses.background.secondary}`}>
                      <p className="text-sm text-gray-600">
                        <strong>Instrucciones:</strong> {selectedPaymentMethod.instructions}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className={`p-3 rounded-lg border border-red-300 bg-red-50`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-red-700 text-sm">
                      No hay métodos de pago disponibles. Contacta con la tienda.
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
          </div>

        {/* Campo de aclaraciones */}
        <div className="sm:col-span-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className={`h-5 w-5 ${themeClasses.accent.primary}`} />
            <label
              htmlFor="aclaracion"
              className={`block text-sm font-medium ${themeClasses.price.secondary}`}
            >
              Aclaración sobre el pedido
            </label>
          </div>
          <div className="mt-2">
            <textarea
              id="aclaracion"
              className={`block w-full border-0 bg-transparent py-2 pl-2 text-gray-600 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset ${themeClasses.accent.primary}`}
              placeholder="Escriba cualquier aclaración sobre el pedido, entrega o preparación"
              {...register("aclaracion")}
            />
          </div>
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
        <div className="flex flex-row justify-between w-full">
          <button
            type="submit"
            disabled={isSubmitting || enabledPaymentMethods.length === 0 || enabledDeliveryMethods.length === 0}
            className={`${themeClasses.button.primary.base} font-semibold px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors w-full flex-1 flex items-center justify-center gap-2`}
            style={themeStyles.button.primary}
          >
            {isSubmitting ? (
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
        </div>
        
        {(enabledPaymentMethods.length === 0 || enabledDeliveryMethods.length === 0) && (
          <div className={`p-3 rounded-lg border border-red-300 bg-red-50 mt-4`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-red-700 text-sm">
                La tienda no tiene métodos de pago o entrega configurados. Contacta directamente con la tienda.
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};