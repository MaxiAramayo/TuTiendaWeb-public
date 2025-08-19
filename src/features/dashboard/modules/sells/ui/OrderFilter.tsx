/**
 * Filtro de pedidos por antigüedad
 * 
 * Permite filtrar pedidos por recientes o todos
 * 
 * @module features/dashboard/modules/sells/ui
 */

"use client";
import { Calendar } from "lucide-react";

/**
 * Tipo para el filtro de pedidos
 */
export type OrderFilter = "all" | "recent";

/**
 * Props para el componente OrderFilter
 */
interface OrderFilterProps {
  /** Tipo de filtro actual */
  orderFilter: OrderFilter;
  /** Función para cambiar el tipo de filtro */
  setOrderFilter: (filter: OrderFilter) => void;
}

/**
 * Componente para filtrar pedidos por antigüedad
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const OrderFilter: React.FC<OrderFilterProps> = ({ 
  orderFilter, 
  setOrderFilter 
}) => {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Filtro de pedidos">
      <button
        onClick={() => setOrderFilter("all")}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm md:text-base ${
          orderFilter === "all" 
            ? "bg-[#615793] text-white" 
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
        aria-pressed={orderFilter === "all"}
        aria-label="Ver todos los pedidos"
      >
        Todos
      </button>
      <button
        onClick={() => setOrderFilter("recent")}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm md:text-base ${
          orderFilter === "recent" 
            ? "bg-[#615793] text-white" 
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
        aria-pressed={orderFilter === "recent"}
        aria-label="Ver pedidos recientes"
      >
        <Calendar className="w-4 h-4 md:w-5 md:h-5" />
        Recientes
      </button>
    </div>
  );
};

export default OrderFilter; 