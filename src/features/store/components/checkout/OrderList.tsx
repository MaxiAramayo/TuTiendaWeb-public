/**
 * Lista de productos en el checkout
 * 
 * @module features/store/components/checkout
 */
"use client";

import React from "react";
import Image from "next/image";
import type { ProductInCart } from "@/shared/types/store";
import { useThemeClasses, useThemeStyles } from "../../hooks/useStoreTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Package, ShoppingCart } from "lucide-react";

interface OrderListProps {
  carrito: ProductInCart[];
  total: number;
}

export const OrderList = ({ carrito, total }: OrderListProps) => {
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();
  
  // Validaciones defensivas
  const validCarrito = Array.isArray(carrito) ? carrito : [];
  const validTotal = typeof total === 'number' ? total : 0;

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className={`flex items-center justify-center gap-2 text-xl font-bold ${themeClasses.price.primary}`}>
          <ShoppingBag className="w-5 h-5" />
          Resumen del Pedido
        </CardTitle>
        <p className="text-sm text-gray-600">
          {validCarrito.length} {validCarrito.length === 1 ? 'producto' : 'productos'} en tu carrito
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Lista de productos */}
        <div className="space-y-3">
          {validCarrito.map((item, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:shadow-sm ${themeClasses.background.secondary}`}
              style={themeStyles.border.primary}
            >
              {/* Imagen del producto */}
              <div className="relative w-16 h-16 flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded-md"
                    sizes="64px"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full bg-gray-100 flex items-center justify-center rounded-md"><svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path></svg></div>';
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-md">
                    <ShoppingCart className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Información del producto */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-sm ${themeClasses.price.secondary} truncate`}>
                  {item.name || 'Producto'}
                </h3>
                
                {/* Variantes/Topics seleccionados */}
                {item.topics && item.topics.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {item.topics.map((topic, topicIndex) => (
                      <p key={topicIndex} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-gray-400">+</span>
                        {topic.name}
                        <span className="text-gray-400">(+${topic.price})</span>
                      </p>
                    ))}
                  </div>
                )}
                
                {/* Notas/Aclaraciones */}
                {item.aclaracion && (
                  <p className="mt-1 text-xs text-gray-500 italic">
                    Nota: {item.aclaracion}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    <Package className="w-3 h-3 mr-1" />
                    {item.cantidad || 1}
                  </Badge>
                  <span className="text-xs text-gray-600">
                    ${item.price || 0} c/u
                  </span>
                </div>
              </div>
              
              {/* Precio total del item */}
              <div className="text-right">
                <p className={`font-semibold text-lg ${themeClasses.price.primary}`}>
                  ${(() => {
                    const basePrice = item.price || 0;
                    const topicsPrice = item.topics?.reduce((sum, topic) => sum + topic.price, 0) || 0;
                    return (basePrice + topicsPrice) * (item.cantidad || 1);
                  })()}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Total */}
        <div className={`p-4 rounded-lg ${themeClasses.background.secondary}`}
             style={themeStyles.background.primary}>
          <div className="flex justify-between items-center">
            <span className={`text-lg font-semibold ${themeClasses.price.secondary}`}>
              Total del Pedido:
            </span>
            <span className={`text-2xl font-bold ${themeClasses.price.primary}`}>
              ${validTotal}
            </span>
          </div>
        </div>
        
        {/* Información adicional */}
        <div className="text-center text-xs text-gray-600 mt-4">
          Los precios incluyen impuestos. El costo de envío se calculará en el siguiente paso.
        </div>
      </CardContent>
    </Card>
  );
};