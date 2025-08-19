/**
 * Utilidades de exportación mejoradas para el módulo de ventas
 * 
 * Funciones optimizadas y tipadas para exportar datos de ventas
 * a diferentes formatos con mejor UX y performance.
 */

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { OptimizedSell as Sell } from '../types/optimized-sell';
import { ExportConfig, ExportResult } from '../types/utils';

/**
 * Exporta ventas a Excel con múltiples hojas y formato profesional
 */
export const exportSellsToExcel = async (
  sells: Sell[],
  config: ExportConfig
): Promise<ExportResult> => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // === HOJA 1: RESUMEN DE VENTAS ===
    const summaryData = sells.map((sell, index) => ({
      'Nº': index + 1,
      'Fecha': format(new Date(sell.date), 'dd/MM/yyyy HH:mm', { locale: es }),
      'Cliente': sell.customerName,
      'Teléfono': sell.customerPhone || 'N/A',
      'Productos': sell.products.length,
      'Total': sell.products.reduce((sum: number, p) => sum + (p.price * p.cantidad), 0),
      'Método Pago': sell.paymentMethod || 'Efectivo',
      'Estado Pago': sell.paymentStatus || 'pending',
      'Entrega': sell.deliveryMethod || 'pickup',
      'Estado': sell.status || 'pending',
      'Canal': sell.source || 'local',
      'Orden': sell.orderNumber || `ORD-${sell.id}`,
      'Notas': sell.notes || ''
    }));
    
    const summaryWS = XLSX.utils.json_to_sheet(summaryData);
    
    // Configurar anchos de columna optimizados
    summaryWS['!cols'] = [
      { wch: 5 },   // Nº
      { wch: 18 },  // Fecha
      { wch: 20 },  // Cliente
      { wch: 15 },  // Teléfono
      { wch: 10 },  // Productos
      { wch: 12 },  // Total
      { wch: 15 },  // Método Pago
      { wch: 12 },  // Estado Pago
      { wch: 12 },  // Entrega
      { wch: 12 },  // Estado
      { wch: 12 },  // Canal
      { wch: 18 },  // Orden
      { wch: 30 }   // Notas
    ];
    
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Resumen Ventas');
    
    // === HOJA 2: DETALLE DE PRODUCTOS (si está habilitado) ===
    if (config.includeProducts) {
      const productDetails: any[] = [];
      
      sells.forEach((sell, sellIndex) => {
        sell.products.forEach((product) => {
          productDetails.push({
            'Venta Nº': sellIndex + 1,
            'Orden': sell.orderNumber || `ORD-${sell.id}`,
            'Fecha': format(new Date(sell.date), 'dd/MM/yyyy', { locale: es }),
            'Cliente': sell.customerName,
            'Producto': product.name,
            'Categoría': product.category || 'Sin categoría',
            'Cantidad': product.cantidad,
            'Precio Unit.': product.price,
            'Subtotal': product.price * product.cantidad,
            'Aclaración': product.aclaracion || '',
            'ID Producto': product.idProduct
          });
        });
      });
      
      const detailWS = XLSX.utils.json_to_sheet(productDetails);
      detailWS['!cols'] = [
        { wch: 8 },   // Venta Nº
        { wch: 18 },  // Orden
        { wch: 12 },  // Fecha
        { wch: 20 },  // Cliente
        { wch: 25 },  // Producto
        { wch: 15 },  // Categoría
        { wch: 8 },   // Cantidad
        { wch: 12 },  // Precio Unit.
        { wch: 12 },  // Subtotal
        { wch: 30 },  // Aclaración
        { wch: 15 }   // ID Producto
      ];
      
      XLSX.utils.book_append_sheet(workbook, detailWS, 'Detalle Productos');
    }
    
    // === HOJA 3: ESTADÍSTICAS (si está habilitado) ===
    if (config.includeStats) {
      const totalRevenue = sells.reduce((sum, sell) => 
        sum + sell.products.reduce((sellSum: number, p) => sellSum + (p.price * p.cantidad), 0), 0
      );
      
      const totalOrders = sells.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Productos más vendidos
      const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
      sells.forEach(sell => {
        sell.products.forEach(product => {
          const key = product.idProduct || product.name;
          if (!productStats[key]) {
            productStats[key] = { name: product.name, quantity: 0, revenue: 0 };
          }
          productStats[key].quantity += product.cantidad;
          productStats[key].revenue += product.price * product.cantidad;
        });
      });
      
      const topProducts = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
      
      // Análisis por canal de venta
      const salesBySource: Record<string, { count: number; revenue: number }> = {};
      sells.forEach(sell => {
        const source = sell.source || 'local';
        const revenue = sell.products.reduce((sum: number, p) => sum + (p.price * p.cantidad), 0);
        
        if (!salesBySource[source]) {
          salesBySource[source] = { count: 0, revenue: 0 };
        }
        salesBySource[source].count += 1;
        salesBySource[source].revenue += revenue;
      });
      
      const statsData = [
        { 'Métrica': 'Total de Ventas', 'Valor': `$${totalRevenue.toFixed(2)}` },
        { 'Métrica': 'Número de Órdenes', 'Valor': totalOrders.toString() },
        { 'Métrica': 'Ticket Promedio', 'Valor': `$${avgOrderValue.toFixed(2)}` },
        { 'Métrica': 'Período', 'Valor': config.dateRange ? 
          `${format(config.dateRange.start, 'dd/MM/yyyy')} - ${format(config.dateRange.end, 'dd/MM/yyyy')}` : 
          'Todas las ventas'
        },
        { 'Métrica': '', 'Valor': '' }, // Separador
        { 'Métrica': '=== TOP PRODUCTOS ===', 'Valor': 'CANTIDAD VENDIDA' },
        ...topProducts.map((product, index) => ({
          'Métrica': `${index + 1}. ${product.name}`,
          'Valor': `${product.quantity} unidades ($${product.revenue.toFixed(2)})`
        })),
        { 'Métrica': '', 'Valor': '' }, // Separador
        { 'Métrica': '=== VENTAS POR CANAL ===', 'Valor': 'ÓRDENES (INGRESOS)' },
        ...Object.entries(salesBySource).map(([source, data]) => ({
          'Métrica': source.toUpperCase(),
          'Valor': `${data.count} órdenes ($${data.revenue.toFixed(2)})`
        }))
      ];
      
      const statsWS = XLSX.utils.json_to_sheet(statsData);
      statsWS['!cols'] = [{ wch: 35 }, { wch: 25 }];
      
      XLSX.utils.book_append_sheet(workbook, statsWS, 'Estadísticas');
    }
    
    // Generar archivo
    const fileName = `ventas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Usar file-saver para mejor compatibilidad
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
    
    return {
      success: true,
      fileName,
      fileUrl: URL.createObjectURL(blob)
    };
    
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Exporta ventas a CSV optimizado para carga rápida
 */
export const exportSellsToCSV = async (
  sells: Sell[],
  includeProducts: boolean = false
): Promise<ExportResult> => {
  try {
    let csvContent = '';
    
    if (includeProducts) {
      // CSV detallado con productos
      const headers = [
        'Fecha',
        'Cliente',
        'Teléfono',
        'Orden',
        'Producto',
        'Cantidad',
        'Precio',
        'Subtotal',
        'Método Pago',
        'Estado Pago',
        'Entrega',
        'Canal',
        'Notas'
      ];
      
      csvContent = headers.join(',') + '\n';
      
      sells.forEach(sell => {
        sell.products.forEach(product => {
          const row = [
            `"${format(new Date(sell.date), 'dd/MM/yyyy HH:mm')}"`,
            `"${sell.customerName}"`,
            `"${sell.customerPhone || 'N/A'}"`,
            `"${sell.orderNumber || `ORD-${sell.id}`}"`,
            `"${product.name}"`,
            product.cantidad,
            product.price,
            product.price * product.cantidad,
            `"${sell.paymentMethod || 'Efectivo'}"`,
            `"${sell.paymentStatus || 'pending'}"`,
            `"${sell.deliveryMethod || 'pickup'}"`,
            `"${sell.source || 'local'}"`,
            `"${sell.notes || ''}"`
          ];
          csvContent += row.join(',') + '\n';
        });
      });
    } else {
      // CSV resumen
      const headers = [
        'Fecha',
        'Cliente',
        'Teléfono',
        'Orden',
        'Total',
        'Método Pago',
        'Estado Pago',
        'Entrega',
        'Canal',
        'Estado',
        'Notas'
      ];
      
      csvContent = headers.join(',') + '\n';
      
      sells.forEach(sell => {
        const total = sell.products.reduce((sum: number, p) => sum + (p.price * p.cantidad), 0);
        const row = [
          `"${format(new Date(sell.date), 'dd/MM/yyyy HH:mm')}"`,
          `"${sell.customerName}"`,
          `"${sell.customerPhone || 'N/A'}"`,
          `"${sell.orderNumber || `ORD-${sell.id}`}"`,
          total.toFixed(2),
          `"${sell.paymentMethod || 'Efectivo'}"`,
          `"${sell.paymentStatus || 'pending'}"`,
          `"${sell.deliveryMethod || 'pickup'}"`,
          `"${sell.source || 'local'}"`,
          `"${sell.status || 'pending'}"`,
          `"${sell.notes || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });
    }
    
    const fileName = `ventas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, fileName);
    
    return {
      success: true,
      fileName,
      fileUrl: URL.createObjectURL(blob)
    };
    
  } catch (error) {
    console.error('Error al exportar a CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

/**
 * Función principal de exportación que delega según el formato
 */
export const exportSells = async (
  sells: Sell[],
  config: ExportConfig
): Promise<ExportResult> => {
  if (sells.length === 0) {
    return {
      success: false,
      error: 'No hay datos para exportar'
    };
  }
  
  switch (config.format) {
    case 'excel':
      return exportSellsToExcel(sells, config);
    case 'csv':
      return exportSellsToCSV(sells, config.includeProducts);
    case 'pdf':
      // Exportación a PDF no implementada
      return {
        success: false,
        error: 'Exportación a PDF no implementada aún'
      };
    default:
      return {
        success: false,
        error: 'Formato de exportación no soportado'
      };
  }
};
