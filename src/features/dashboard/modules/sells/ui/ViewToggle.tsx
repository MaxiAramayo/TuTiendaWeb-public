/**
 * Selector de vista para dashboard de ventas
 * 
 * Permite cambiar entre vista de pedidos y productos vendidos
 * 
 * @module features/dashboard/modules/sells/ui
 */

"use client";
import { ShoppingCart, Package } from "lucide-react";

/**
 * Props para el componente ViewToggle
 */
interface ViewToggleProps {
  /** Modo de vista actual (orders o products) */
  viewMode: "orders" | "products";
  /** Función para cambiar el modo de vista */
  setViewMode: (mode: "orders" | "products") => void;
}

/**
 * Componente para alternar entre vistas de pedidos y productos
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Selector de tipo de vista">
      <button
        onClick={() => setViewMode("orders")}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm md:text-base ${
          viewMode === "orders" 
            ? "bg-[#615793] text-white" 
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
        aria-pressed={viewMode === "orders"}
        aria-label="Ver pedidos"
      >
        <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
        Pedidos
      </button>
      <button
        onClick={() => setViewMode("products")}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm md:text-base ${
          viewMode === "products" 
            ? "bg-[#615793] text-white" 
            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
        aria-pressed={viewMode === "products"}
        aria-label="Ver productos"
      >
        <Package className="w-4 h-4 md:w-5 md:h-5" />
        Productos
      </button>
    </div>
  );
};

export default ViewToggle; 