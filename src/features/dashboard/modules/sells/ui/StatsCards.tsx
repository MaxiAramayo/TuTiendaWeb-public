/**
 * Tarjetas de estadísticas para dashboard de ventas
 * 
 * Muestra información resumida sobre pedidos, productos vendidos e ingresos
 * 
 * @module features/dashboard/modules/sells/ui
 */

"use client";
import type { Sale } from "../schemas/sell.schema";
import { ShoppingCart, Package, TrendingUp } from "lucide-react";
import { calculateTotalRevenue } from "../utils/sell.utils";

/**
 * Props para el componente StatsCards
 */
interface StatsCardsProps {
  /** Ventas filtradas para calcular estadísticas */
  filteredSells: Sale[];
}

/**
 * Componente de tarjetas de estadísticas para ventas
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const StatsCards: React.FC<StatsCardsProps> = ({ filteredSells }) => {
  // Calcular estadísticas
  const totalOrders = filteredSells.length;
  const totalProducts = filteredSells.reduce(
    (acc, sell) => acc + sell.items.length, 
    0
  );
  const totalRevenue = calculateTotalRevenue(filteredSells);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
      {/* Tarjeta de total de pedidos */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart 
            className="w-5 h-5 md:w-6 md:h-6 text-[#615793]" 
            aria-hidden="true" 
          />
          <h3 className="font-semibold text-sm md:text-base">Total de Pedidos</h3>
        </div>
        <p className="text-xl md:text-2xl font-bold">{totalOrders}</p>
      </div>

      {/* Tarjeta de productos vendidos */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <Package 
            className="w-5 h-5 md:w-6 md:h-6 text-[#615793]" 
            aria-hidden="true" 
          />
          <h3 className="font-semibold text-sm md:text-base">Productos Vendidos</h3>
        </div>
        <p className="text-xl md:text-2xl font-bold">{totalProducts}</p>
      </div>

      {/* Tarjeta de ingresos totales */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp 
            className="w-5 h-5 md:w-6 md:h-6 text-[#615793]" 
            aria-hidden="true" 
          />
          <h3 className="font-semibold text-sm md:text-base">Ingresos Totales</h3>
        </div>
        <p className="text-xl md:text-2xl font-bold">
          ${totalRevenue.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default StatsCards; 