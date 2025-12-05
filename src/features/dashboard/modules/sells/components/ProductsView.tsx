/**
 * Vista de productos vendidos
 * 
 * Muestra estadísticas de productos vendidos agrupados por nombre
 * 
 * @module features/dashboard/modules/sells/components
 */

"use client";

import { DollarSign, ShoppingCart, Search } from "lucide-react";
import { useState, useMemo } from "react";
import Image from "next/image";
import { Sale, SaleItem } from "../schemas/sell.schema";

interface ProductsViewProps {
  /** Lista de ventas para analizar productos */
  sells: Sale[];
}

interface ProductStat {
  name: string;
  productId: string;
  totalQuantity: number;
  totalRevenue: number;
  image?: string;
}

/** Agrupa productos por nombre y calcula estadísticas */
const groupProductsByName = (sales: Sale[]): Record<string, ProductStat> => {
  const stats: Record<string, ProductStat> = {};

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const key = item.productId;
      if (stats[key]) {
        stats[key].totalQuantity += item.quantity;
        stats[key].totalRevenue += item.subtotal;
      } else {
        stats[key] = {
          name: item.productName,
          productId: item.productId,
          totalQuantity: item.quantity,
          totalRevenue: item.subtotal,
        };
      }
    });
  });

  return stats;
};

/**
 * Componente para mostrar productos vendidos con estadísticas
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const ProductsView: React.FC<ProductsViewProps> = ({ sells }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Agrupar productos por nombre
  const productStats = useMemo(() => groupProductsByName(sells), [sells]);

  // Filtrar y ordenar productos por cantidad
  const sortedProducts = useMemo(() => 
    Object.values(productStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [productStats, searchTerm]
  );

  return (
    <div className="space-y-6" aria-label="Estadísticas de productos vendidos">
      <h1 className="text-xl font-bold">Productos más vendidos</h1>
      
      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 rounded border focus:outline-none focus:ring-2 focus:ring-[#615793]"
          aria-label="Buscar producto"
        />
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
          aria-hidden="true"
        />
      </div>

      {/* Lista de productos */}
      {sortedProducts.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500 font-medium">No hay productos para mostrar</p>
          <p className="text-gray-400 text-sm mt-2">
            Prueba ajustando los filtros o realiza algunas ventas
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedProducts.map((product, index) => (
            <div 
              key={product.productId || index} 
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              aria-label={`Estadísticas de ${product.name}`}
            >
              <div className="flex items-start gap-3 mb-3">
                {product.image && (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Cantidad:</span>
                      </div>
                      <span className="font-semibold">{product.totalQuantity}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Subtotal:</span>
                      </div>
                      <span className="font-semibold">${product.totalRevenue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsView; 