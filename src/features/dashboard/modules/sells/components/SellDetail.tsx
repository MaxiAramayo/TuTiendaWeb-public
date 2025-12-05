/**
 * Detalle expandido de una venta
 * 
 * Muestra toda la información detallada de una venta seleccionada
 * 
 * @module features/dashboard/modules/sells/components
 */

"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sale, DELIVERY_METHODS_LABELS, PAYMENT_METHODS_LABELS } from "../schemas/sell.schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Props para el componente SellDetail
 */
interface SellDetailProps {
  /** Datos de la venta a mostrar */
  sell: Sale;
  /** Función para cerrar el diálogo */
  onClose: () => void;
}

/** Formatea fecha de Firebase Timestamp o Date */
const formatDate = (date: any): string => {
  if (!date) return "Sin fecha";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
};

/** Calcula el total de un item */
const calculateItemTotal = (item: { unitPrice: number; quantity: number; variants?: { price: number }[] }): number => {
  const variantsTotal = item.variants?.reduce((sum, v) => sum + v.price, 0) || 0;
  return (item.unitPrice + variantsTotal) * item.quantity;
};

/**
 * Componente de detalle de una venta individual
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const SellDetail: React.FC<SellDetailProps> = ({ sell, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles del Pedido #{sell.orderNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Datos básicos del cliente y pedido */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <p className="font-semibold">
                <span className="text-gray-600">Cliente:</span> {sell.customer.name}
              </p>
              {sell.customer.phone && (
                <p>
                  <span className="text-gray-600">Teléfono:</span> {sell.customer.phone}
                </p>
              )}
              <p>
                <span className="text-gray-600">Fecha:</span> {formatDate(sell.metadata.createdAt)}
              </p>
              <p>
                <span className="text-gray-600">Método de entrega:</span> {DELIVERY_METHODS_LABELS[sell.delivery.method]}
              </p>
              <p>
                <span className="text-gray-600">Método de pago:</span> {PAYMENT_METHODS_LABELS[sell.payment.method]}
              </p>
            </div>
            {sell.delivery.address && (
              <p className="mt-2">
                <span className="text-gray-600">Dirección:</span> {sell.delivery.address}
              </p>
            )}
            {sell.notes && (
              <div className="mt-2 bg-yellow-50 p-2 rounded">
                <p className="text-gray-700 italic">
                  <span className="text-gray-600 not-italic">Notas:</span> {sell.notes}
                </p>
              </div>
            )}
          </div>

          {/* Lista de productos */}
          <div>
            <h4 className="font-semibold mb-2 text-lg">Productos:</h4>
            <div className="space-y-4 divide-y divide-gray-200">
              {sell.items.map((item, index) => (
                <div key={index} className="pt-4 first:pt-0">
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="font-medium">{item.productName}</span>
                      {item.quantity > 1 && (
                        <span className="text-sm text-gray-500 ml-2">
                          (x{item.quantity})
                        </span>
                      )}
                    </div>
                    {item.quantity > 1 ? (
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Precio unitario: ${item.unitPrice.toFixed(2)}
                        </div>
                        <div className="font-medium">
                          Subtotal: ${item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <span>${item.unitPrice.toFixed(2)}</span>
                    )}
                  </div>
                  
                  {/* Sección de Variantes/Extras */}
                  {item.variants && item.variants.length > 0 && (
                    <div className="ml-4 space-y-1 bg-gray-50 p-2 rounded-md">
                      <p className="text-sm text-gray-600 font-medium">Complementos:</p>
                      {item.variants.map((variant, variantIndex) => (
                        <div key={variantIndex} className="flex justify-between text-sm">
                          <span className="text-gray-600">+ {variant.name}</span>
                          <span>${variant.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notas del producto */}
                  {item.notes && (
                    <div className="ml-4 mt-2 bg-yellow-50 p-2 rounded-md">
                      <p className="text-sm text-gray-600 italic">
                        <span className="not-italic font-medium">Nota:</span> {item.notes}
                      </p>
                    </div>
                  )}
                  
                  {/* Subtotal del item con extras */}
                  <div className="text-right mt-2 text-sm font-medium">
                    Total producto: ${calculateItemTotal(item).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales del pedido */}
          <div className="border-t pt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${sell.totals.subtotal.toFixed(2)}</span>
            </div>
            {sell.totals.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento:</span>
                <span>-${sell.totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${sell.totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellDetail; 