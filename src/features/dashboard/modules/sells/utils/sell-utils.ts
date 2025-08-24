/**
 * Utilidades para el módulo de ventas
 * 
 * Proporciona funciones para cálculos, formateo, filtrado y manipulación 
 * de datos de ventas con soporte completo para estadísticas.
 * 
 * @module features/dashboard/modules/sells/utils
 */

import { 
  OptimizedSell as Sell, 
  ProductInSell as SellProduct,
} from "../types/optimized-sell";
import { 
  DateFormatOptions, 
} from "../types/base";
import {
  PAYMENT_METHODS, 
  SELL_STATUS, 
  DELIVERY_METHODS 
} from "../types/constants";

/**
 * Formatea una fecha utilizando el formato español (Argentina)
 * 
 * @param date - Fecha a formatear
 * @param options - Opciones de formateo
 * @returns Fecha formateada como string
 */
export const formatDate = (date: Date, options: DateFormatOptions = {}): string => {
  const { includeTime = true, short = false, relative = false } = options;
  
  const dateObj = new Date(date);
  
  if (relative) {
    const now = new Date();
    const diffTime = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  }
  
  if (short) {
    return dateObj.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    });
  }
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  
  if (includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
  }
  
  return dateObj.toLocaleString('es-AR', formatOptions);
};

/**
 * Calcula el subtotal de un producto individual incluyendo extras
 * 
 * @param product - Producto del que se calculará el subtotal
 * @returns Subtotal del producto
 */
export const calculateProductTotal = (product: SellProduct): number => {
  let basePrice = product.price;
  
  // Sumar extras/tópicos si existen
  if (product.appliedTopics && product.appliedTopics.length > 0) {
    const extrasTotal = product.appliedTopics.reduce(
      (sum: number, topic: any) => sum + topic.price, 
      0
    );
    basePrice += extrasTotal;
  }
  
  return basePrice * product.cantidad;
};

/**
 * Calcula el total de una venta completa
 * 
 * @param sell - Venta de la que se calculará el total
 * @returns Total de la venta
 */
export const calculateOrderTotal = (sell: Sell): number => {
  // Usar el campo total directamente si existe
  if (sell.total) {
    return sell.total;
  }
  
  // Calcular el total si no está disponible
  return sell.products.reduce(
    (acc: number, product: SellProduct) => acc + calculateProductTotal(product), 
    0
  );
};

/**
 * Calcula los ingresos totales de un conjunto de ventas
 * 
 * @param sells - Lista de ventas
 * @returns Total de ingresos
 */
export const calculateTotalRevenue = (sells: Sell[]): number => {
  return sells.reduce((acc: number, sell: Sell) => {
    // Usar el campo total directamente si existe
    if (sell.total) {
      return acc + sell.total;
    }
    
    // Calcular el total si no está disponible
    return acc + sell.products.reduce((sum: number, product: SellProduct) => {
      let total = product.price * (product.cantidad || 1);
      if (product.appliedTopics && product.appliedTopics.length > 0) {
        total += product.appliedTopics.reduce((topicSum: number, topic: any) => 
          topicSum + (topic.price * (product.cantidad || 1)), 0);
      }
      return sum + total;
    }, 0);
  }, 0);
};

/**
 * Filtra ventas por rango de fechas
 * 
 * @param sells - Lista de ventas a filtrar
 * @param startDate - Fecha de inicio (opcional)
 * @param endDate - Fecha de fin (opcional)
 * @returns Lista de ventas filtradas
 */
export const filterSellsByDateRange = (
  sells: Sell[], 
  startDate: Date | null, 
  endDate: Date | null
): Sell[] => {
  let filtered = [...sells];
  
  if (startDate) {
    filtered = filtered.filter(sell => new Date(sell.date) >= startDate);
  }
  
  if (endDate) {
    filtered = filtered.filter(sell => new Date(sell.date) <= endDate);
  }
  
  return filtered;
};

/**
 * Filtra ventas por término de búsqueda (nombre de cliente)
 * 
 * @param sells - Lista de ventas a filtrar
 * @param searchTerm - Término de búsqueda
 * @returns Lista de ventas filtradas
 */
export const filterSellsBySearchTerm = (
  sells: Sell[], 
  searchTerm: string
): Sell[] => {
  if (!searchTerm) return sells;
  
  return sells.filter(sell => 
    sell.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

/**
 * Agrupa productos de varias ventas por nombre
 * 
 * @param sells - Lista de ventas
 * @returns Mapa de productos agrupados por nombre
 */
export const groupProductsByName = (sells: Sell[]): Record<string, {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  image: string | null;
}> => {
  return sells.reduce((acc, sell: Sell) => {
    sell.products.forEach((product: SellProduct) => {
      if (!acc[product.name]) {
        acc[product.name] = {
          name: product.name,
          totalQuantity: 0,
          totalRevenue: 0,
          image: null // Las ventas no almacenan imágenes, solo snapshot de datos
        };
      }
      acc[product.name].totalQuantity += product.cantidad || 1;
      
      let productTotal = calculateProductTotal(product);
      acc[product.name].totalRevenue += productTotal;
    });
    return acc;
  }, {} as Record<string, {
    name: string;
    totalQuantity: number;
    totalRevenue: number;
    image: string | null;
  }>);
};

/**
 * Ordena una lista de ventas por fecha (de más reciente a más antigua)
 * 
 * @param sells - Lista de ventas a ordenar
 * @returns Lista de ventas ordenadas
 */
export const sortSellsByRecentDate = (sells: Sell[]): Sell[] => {
  return [...sells].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};