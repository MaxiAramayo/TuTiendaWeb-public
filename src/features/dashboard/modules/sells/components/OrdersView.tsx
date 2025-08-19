/**
 * Vista de listado de pedidos
 * 
 * Muestra un listado de pedidos con información resumida y permite seleccionar uno para ver detalles
 * 
 * @module features/dashboard/modules/sells/components
 */

"use client";
import { OptimizedSell as Sell } from "../types/optimized-sell";
import { calculateOrderTotal, formatDate } from "../utils/sell-utils";
import { OrdersViewProps } from "../types/components";

/**
 * Componente para mostrar una lista de pedidos
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const OrdersView: React.FC<OrdersViewProps> = ({ 
  sells, 
  onSelectSell 
}) => {
  return (
    <div className="grid gap-4" aria-label="Lista de pedidos">
      {sells.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500 font-medium">No hay pedidos para mostrar</p>
          <p className="text-gray-400 text-sm mt-2">Prueba ajustando los filtros o añade nuevos pedidos</p>
        </div>
      ) : (
        sells.map((sell) => (
          <div 
            key={sell.id}
            onClick={() => onSelectSell(sell)}
            className="bg-white p-4 rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow border border-gray-100"
            aria-label={`Pedido de ${sell.customerName}`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{sell.customerName}</p>
                <p className="text-sm text-gray-500">{formatDate(sell.date)}</p>
                <p className="text-xs text-gray-400 mt-1">{sell.deliveryMethod}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  ${calculateOrderTotal(sell).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {sell.products.length} producto{sell.products.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs bg-[#f8f2ff] text-[#615793] px-2 py-0.5 rounded mt-1 inline-block">
                  {sell.paymentMethod}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default OrdersView; 