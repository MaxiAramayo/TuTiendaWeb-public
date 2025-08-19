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
import { OptimizedSell as Sell } from "../types/optimized-sell";
import { calculateProductTotal, calculateOrderTotal, formatDate } from "../utils/sell-utils";

/**
 * Props para el componente SellDetail
 */
interface SellDetailProps {
  /** Datos de la venta a mostrar */
  sell: Sell;
  /** Función para cerrar el diálogo */
  onClose: () => void;
}

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
          <DialogTitle>Detalles del Pedido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Datos básicos del cliente y pedido */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <p className="font-semibold">
                <span className="text-gray-600">Cliente:</span> {sell.customerName}
              </p>
              <p>
                <span className="text-gray-600">Fecha:</span> {formatDate(sell.date)}
              </p>
              <p>
                <span className="text-gray-600">Método de entrega:</span> {sell.deliveryMethod}
              </p>
              <p>
                <span className="text-gray-600">Método de pago:</span> {sell.paymentMethod}
              </p>
            </div>
            {sell.address && (
              <p className="mt-2">
                <span className="text-gray-600">Dirección:</span> {sell.address}
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
              {sell.products.map((product: any, index: number) => (
                <div key={index} className="pt-4 first:pt-0">
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="font-medium">{product.name}</span>
                      {(product.cantidad || 1) > 1 && (
                        <span className="text-sm text-gray-500 ml-2">
                          (x{product.cantidad || 1})
                        </span>
                      )}
                    </div>
                    {(product.cantidad || 1) > 1 ? (
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Precio unitario: ${product.price.toFixed(2)}
                        </div>
                        <div className="font-medium">
                          Subtotal: ${(product.price * (product.cantidad || 1)).toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <span>${product.price.toFixed(2)}</span>
                    )}
                  </div>
                  
                  {/* Sección de Topics/Extras */}
                  {product.appliedTopics && product.appliedTopics.length > 0 && (
                    <div className="ml-4 space-y-1 bg-gray-50 p-2 rounded-md">
                      <p className="text-sm text-gray-600 font-medium">Complementos:</p>
                      {product.appliedTopics.map((topic: any, topicIndex: number) => (
                        <div key={topicIndex} className="flex justify-between text-sm">
                          <span className="text-gray-600">+ {topic.name}</span>
                          {(product.cantidad || 1) > 1 ? (
                            <div className="text-right">
                              <div className="text-gray-500">
                                ${topic.price.toFixed(2)}
                              </div>
                              <div className="font-medium">
                                ${(topic.price * (product.cantidad || 1)).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span>${topic.price.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Subtotal del producto con extras */}
                  <div className="text-right mt-2 text-sm font-medium">
                    Total producto: ${calculateProductTotal(product).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total del pedido */}
          <div className="text-right font-bold pt-4 border-t text-lg">
            Total: ${calculateOrderTotal(sell).toFixed(2)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellDetail; 