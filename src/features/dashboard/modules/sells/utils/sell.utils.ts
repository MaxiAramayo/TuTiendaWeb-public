/**
 * Utilidades para el módulo de ventas
 * 
 * @module features/dashboard/modules/sells/utils/sell.utils
 */

import type { Sale, SaleItem, SalesFilterValues } from '../schemas/sell.schema';

// =============================================================================
// TIPOS AUXILIARES
// =============================================================================

interface DateFormatOptions {
  includeTime?: boolean;
  short?: boolean;
  relative?: boolean;
}

interface ProductStats {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

// =============================================================================
// FORMATEO DE FECHAS
// =============================================================================

/**
 * Formatea una fecha utilizando el formato español (Argentina)
 */
export function formatDate(date: Date | string, options: DateFormatOptions = {}): string {
  const { includeTime = true, short = false, relative = false } = options;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
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
}

// =============================================================================
// CÁLCULOS
// =============================================================================

/**
 * Calcula el subtotal de un item incluyendo variantes
 */
export function calculateItemSubtotal(item: SaleItem): number {
  let total = item.unitPrice;
  
  if (item.variants && item.variants.length > 0) {
    total += item.variants.reduce((sum, v) => sum + v.price, 0);
  }
  
  return total * item.quantity;
}

/**
 * Calcula el total de una venta
 */
export function calculateOrderTotal(sale: Sale): number {
  return sale.totals.total;
}

/**
 * Calcula el total de ingresos de múltiples ventas
 */
export function calculateTotalRevenue(sales: Sale[]): number {
  return sales.reduce((acc, sale) => acc + sale.totals.total, 0);
}

/**
 * Agrupa productos por nombre y calcula estadísticas
 */
export function groupProductsByName(sales: Sale[]): Record<string, ProductStats> {
  const productStats: Record<string, ProductStats> = {};
  
  for (const sale of sales) {
    for (const item of sale.items) {
      const key = item.productName.toLowerCase();
      
      if (!productStats[key]) {
        productStats[key] = {
          name: item.productName,
          totalQuantity: 0,
          totalRevenue: 0
        };
      }
      
      productStats[key].totalQuantity += item.quantity;
      productStats[key].totalRevenue += calculateItemSubtotal(item);
    }
  }
  
  return productStats;
}

// =============================================================================
// FILTRADO
// =============================================================================

/**
 * Filtra ventas por término de búsqueda (nombre de cliente)
 */
export function filterBySearchTerm(sales: Sale[], searchTerm: string): Sale[] {
  if (!searchTerm.trim()) return sales;
  
  const term = searchTerm.toLowerCase();
  return sales.filter(sale => 
    sale.customer.name.toLowerCase().includes(term)
  );
}

/**
 * Filtra ventas por rango de fechas
 */
export function filterByDateRange(
  sales: Sale[], 
  startDate?: Date, 
  endDate?: Date
): Sale[] {
  let filtered = [...sales];
  
  if (startDate) {
    filtered = filtered.filter(sale => {
      const saleDate = new Date(sale.metadata.createdAt);
      return saleDate >= startDate;
    });
  }
  
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    filtered = filtered.filter(sale => {
      const saleDate = new Date(sale.metadata.createdAt);
      return saleDate <= endOfDay;
    });
  }
  
  return filtered;
}

/**
 * Aplica todos los filtros a una lista de ventas
 */
export function applyFilters(sales: Sale[], filters: SalesFilterValues): Sale[] {
  let filtered = [...sales];
  
  // Búsqueda por cliente
  if (filters.customerSearch.trim()) {
    filtered = filterBySearchTerm(filtered, filters.customerSearch);
  }
  
  // Rango de fechas
  filtered = filterByDateRange(filtered, filters.startDate, filters.endDate);
  
  // Método de pago
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    filtered = filtered.filter(sale => sale.payment.method === filters.paymentMethod);
  }
  
  // Método de entrega
  if (filters.deliveryMethod && filters.deliveryMethod !== 'all') {
    filtered = filtered.filter(sale => sale.delivery.method === filters.deliveryMethod);
  }
  
  // Ordenamiento
  filtered = sortSales(filtered, filters.sortBy);
  
  return filtered;
}

/**
 * Ordena ventas según criterio
 */
export function sortSales(sales: Sale[], sortBy: SalesFilterValues['sortBy']): Sale[] {
  const sorted = [...sales];
  
  switch (sortBy) {
    case 'date-desc':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.metadata.createdAt);
        const dateB = new Date(b.metadata.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    case 'date-asc':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.metadata.createdAt);
        const dateB = new Date(b.metadata.createdAt);
        return dateA.getTime() - dateB.getTime();
      });
    case 'customer-asc':
      return sorted.sort((a, b) => 
        a.customer.name.localeCompare(b.customer.name)
      );
    case 'total-desc':
      return sorted.sort((a, b) => b.totals.total - a.totals.total);
    default:
      return sorted;
  }
}

// =============================================================================
// EXPORTACIÓN
// =============================================================================

/**
 * Genera datos CSV para exportación
 */
export function generateSalesCSV(sales: Sale[]): string {
  const headers = ['Fecha', 'Cliente', 'Total', 'Método de Pago', 'Método de Entrega'];
  
  const rows = sales.map(sale => [
    new Date(sale.metadata.createdAt).toLocaleString('es-AR'),
    sale.customer.name,
    `$${sale.totals.total.toFixed(2)}`,
    sale.payment.method,
    sale.delivery.method,
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
}

/**
 * Descarga un archivo CSV
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
