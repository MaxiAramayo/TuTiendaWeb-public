/**
 * Componente de ticket de pedido post-compra
 * 
 * @module features/store/components/checkout
 */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  MessageCircle, 
  Copy, 
  ArrowLeft, 
  Clock, 
  MapPin, 
  CreditCard, 
  Truck,
  Phone,
  Store,
  Receipt
} from "lucide-react";
import { useThemeClasses, useThemeStyles } from "../../hooks/useStoreTheme";
import { useStoreToast } from "../ui/FeedbackToast";
import type { ProductInCart } from "@/shared/types/store";

interface OrderTicketProps {
  orderData: {
    orderId: string;
    customerName: string;
    products: ProductInCart[];
    subtotal: number;
    deliveryPrice: number;
    total: number;
    deliveryMethod: string | { name: string };
    paymentMethod: string | { name: string; instructions?: string };
    address?: string;
    notes?: string;
    whatsappMessage: string;
    whatsappNumber: string;
    storeName: string;
    date?: Date;
  };
  onBackToStore: () => void;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({ 
  orderData, 
  onBackToStore 
}) => {
  const router = useRouter();
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();
  const { showOrder, showError } = useStoreToast();
  const [isResending, setIsResending] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Validaciones defensivas para prevenir errores
  const {
    orderId = `order-${Date.now()}`,
    customerName = 'Cliente',
    deliveryMethod = 'pickup',
    paymentMethod = 'cash',
    address = '',
    notes = '',
    products = [],
    subtotal = 0,
    deliveryPrice = 0,
    total = 0,
    whatsappMessage = '',
    whatsappNumber = '',
    storeName = 'Mi Tienda',
    date = new Date()
  } = orderData || {};
  
  // Asegurar que products sea un array válido
  const items = Array.isArray(products) ? products : [];
  
  // Normalizar deliveryMethod y paymentMethod
  const normalizedDeliveryMethod = typeof deliveryMethod === 'string' 
    ? { name: deliveryMethod } 
    : deliveryMethod;
  const normalizedPaymentMethod = typeof paymentMethod === 'string' 
    ? { name: paymentMethod } 
    : paymentMethod;

  const handleResendWhatsApp = async () => {
    setIsResending(true);
    try {
      // Abrir WhatsApp sin duplicar la venta (ya está guardada)
      if (whatsappNumber && whatsappMessage) {
        // Formatear número correctamente para enlaces internacionales
        // El número ya viene limpio desde CheckoutForm, solo eliminar espacios
        const cleanNumber = whatsappNumber.replace(/\s+/g, '');
        window.open(
          `https://wa.me/${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`
        );
      }
      
      showOrder("Mensaje reenviado a WhatsApp", {
        duration: 3000
      });
    } catch (error) {
      console.error("Error al reenviar mensaje:", error);
      showError("Error al reenviar mensaje", {
        duration: 3000
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setHasCopied(true);
      showOrder("Mensaje copiado al portapapeles", {
        duration: 2000
      });
      setTimeout(() => setHasCopied(false), 2000);
    } catch (error) {
      showError("Error al copiar mensaje", {
        duration: 2000
      });
    }
  };

  const handleBackToStore = () => {
    if (onBackToStore) {
      onBackToStore();
    } else {
      router.push("/");
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Abrir WhatsApp automáticamente al montar el componente
  useEffect(() => {
    if (whatsappNumber && whatsappMessage) {
      const cleanNumber = whatsappNumber.replace(/\s+/g, '');
      // Pequeño delay para asegurar que el componente se renderizó
      const timer = setTimeout(() => {
        window.open(
          `https://wa.me/${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`,
          '_blank'
        );
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []); // Solo ejecutar una vez al montar

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header de confirmación */}
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center`}
                   style={themeStyles.background.primary}>
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.price.primary}`}>
                  ¡Pedido Confirmado!
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Tu pedido #{orderId} ha sido enviado exitosamente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del pedido */}
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${themeClasses.price.secondary}`}>
              <Receipt className="w-5 h-5" />
              Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Store className={`w-4 h-4 ${themeClasses.accent.primary}`} />
                  <span className="text-sm text-gray-600">Tienda:</span>
                </div>
                <p className={`font-medium ${themeClasses.price.secondary}`}>
                  {storeName}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${themeClasses.accent.primary}`} />
                  <span className="text-sm text-gray-600">Fecha:</span>
                </div>
                <p className={`font-medium ${themeClasses.price.secondary}`}>
                  {formatDate(date)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Cliente */}
            <div className="space-y-2">
              <h4 className={`font-semibold ${themeClasses.price.secondary}`}>Cliente</h4>
              <p className="text-gray-600">{customerName}</p>
            </div>

            <Separator />

            {/* Método de entrega */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Truck className={`w-4 h-4 ${themeClasses.accent.primary}`} />
                <h4 className={`font-semibold ${themeClasses.price.secondary}`}>Método de entrega</h4>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{normalizedDeliveryMethod?.name}</span>
                {deliveryPrice > 0 && (
                  <Badge variant="secondary">${deliveryPrice}</Badge>
                )}
              </div>
              {address && (
                <div className="flex items-start gap-2 mt-2">
                  <MapPin className={`w-4 h-4 ${themeClasses.accent.primary} mt-0.5`} />
                  <p className="text-sm text-gray-600">{address}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Método de pago */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className={`w-4 h-4 ${themeClasses.accent.primary}`} />
                <h4 className={`font-semibold ${themeClasses.price.secondary}`}>Método de pago</h4>
              </div>
              <p className="text-gray-600">{normalizedPaymentMethod?.name}</p>
              {normalizedPaymentMethod?.instructions && (
                <div className={`p-3 rounded-lg border ${themeClasses.background.secondary}`}>
                  <p className="text-sm text-gray-600">
                    <strong>Instrucciones:</strong> {normalizedPaymentMethod.instructions}
                  </p>
                </div>
              )}
            </div>

            {notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className={`font-semibold ${themeClasses.price.secondary}`}>Comentarios</h4>
                  <p className="text-sm text-gray-600">{notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Productos */}
        <Card>
          <CardHeader>
            <CardTitle className={themeClasses.price.secondary}>Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className={`font-medium ${themeClasses.price.secondary}`}>
                      {item.name || 'Producto'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Cantidad: {item.cantidad || 1}
                    </p>
                  </div>
                  <p className={`font-medium ${themeClasses.price.primary}`}>
                    ${(item.price || 0) * (item.cantidad || 1)}
                  </p>
                </div>
              ))}
              
              <Separator />
              
              {/* Totales */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className={themeClasses.price.primary}>${subtotal}</span>
                </div>
                {deliveryPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Envío:</span>
                    <span className={themeClasses.price.primary}>${deliveryPrice}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span className={themeClasses.price.secondary}>Total:</span>
                  <span className={themeClasses.price.primary}>${total}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  Tu pedido ha sido enviado por WhatsApp. Si no recibiste el mensaje o necesitas reenviarlo, 
                  puedes usar los botones de abajo.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleResendWhatsApp}
                  disabled={isResending}
                  className={`flex-1 ${themeClasses.button.primary.base}`}
                  style={themeStyles.button.primary}
                >
                  {isResending ? (
                    "Reenviando..."
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reenviar a WhatsApp
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleCopyMessage}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className={`w-4 h-4 mr-2 ${hasCopied ? 'text-green-500' : ''}`} />
                  {hasCopied ? 'Copiado!' : 'Copiar mensaje'}
                </Button>
              </div>
              
              <Button
                onClick={handleBackToStore}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a la tienda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderTicket