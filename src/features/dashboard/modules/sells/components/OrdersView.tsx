/**
 * Vista de listado de pedidos
 * 
 * Muestra un listado de pedidos con información resumida y permite seleccionar uno para ver detalles
 * 
 * @module features/dashboard/modules/sells/components
 */

"use client";

import { Sale, DELIVERY_METHODS_LABELS, PAYMENT_METHODS_LABELS } from "../schemas/sell.schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OrdersViewProps {
  /** Lista de ventas a mostrar */
  sells: Sale[];
  /** Función callback cuando se selecciona una venta */
  onSelectSell: (sell: Sale) => void;
  /** Venta actualmente seleccionada */
  selectedSell?: Sale | null;
}

/** Formatea fecha de Firebase Timestamp o Date */
const formatDate = (date: any): string => {
  if (!date) return "Sin fecha";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
};

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
            aria-label={`Pedido de ${sell.customer.name}`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{sell.customer.name}</p>
                <p className="text-sm text-gray-500">{formatDate(sell.metadata.createdAt)}</p>
                <p className="text-xs text-gray-400 mt-1">{DELIVERY_METHODS_LABELS[sell.delivery.method]}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">
                  ${sell.totals.total.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {sell.items.length} producto{sell.items.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs bg-[#f8f2ff] text-[#615793] px-2 py-0.5 rounded mt-1 inline-block">
                  {PAYMENT_METHODS_LABELS[sell.payment.method]}
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