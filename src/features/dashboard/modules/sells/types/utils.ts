/**
 * Tipos utilitarios para el módulo de ventas
 * 
 * Define tipos auxiliares para operaciones específicas del dominio de ventas,
 * como exportación, validación y transformación de datos.
 * 
 * @module features/dashboard/modules/sells/types/utils
 */

import { Sells, ProductInCart } from "@/shared/types/store";
import { SellsFilter } from "./base";

/**
 * Configuración para exportar datos de ventas
 */
export interface ExportConfig {
  /** Formato de exportación */
  format: 'csv' | 'excel' | 'pdf';
  /** Incluir detalles de productos */
  includeProducts?: boolean;
  /** Incluir estadísticas */
  includeStats?: boolean;
  /** Rango de fechas personalizado */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Filtros aplicados */
  filters?: SellsFilter;
}

/**
 * Resultado de una operación de exportación
 */
export interface ExportResult {
  /** Indica si la exportación fue exitosa */
  success: boolean;
  /** URL del archivo generado (si aplica) */
  fileUrl?: string;
  /** Nombre del archivo generado */
  fileName?: string;
  /** Error en caso de fallo */
  error?: string;
}

/**
 * Opciones para agrupar ventas
 */
export interface GroupingOptions {
  /** Agrupar por período temporal */
  period?: 'day' | 'week' | 'month' | 'year';
  /** Agrupar por método de pago */
  paymentMethod?: boolean;
  /** Agrupar por método de entrega */
  deliveryMethod?: boolean;
  /** Agrupar por cliente */
  customer?: boolean;
}

/**
 * Resultado de ventas agrupadas
 */
export interface GroupedSells {
  /** Llave del grupo */
  key: string;
  /** Etiqueta legible del grupo */
  label: string;
  /** Ventas en este grupo */
  sells: Sells[];
  /** Total de ventas en el grupo */
  total: number;
  /** Cantidad de órdenes en el grupo */
  count: number;
}

/**
 * Métricas calculadas para un período
 */
export interface SellsMetrics {
  /** Total de ingresos */
  totalRevenue: number;
  /** Cantidad total de órdenes */
  totalOrders: number;
  /** Ticket promedio */
  averageTicket: number;
  /** Crecimiento vs período anterior (porcentaje) */
  growth?: number;
  /** Productos más vendidos */
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  /** Métodos de pago más utilizados */
  paymentMethodsDistribution: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Configuración para validar una venta
 */
export interface SellValidationConfig {
  /** Validar que el cliente existe */
  validateCustomer?: boolean;
  /** Validar que los productos existen y están disponibles */
  validateProducts?: boolean;
  /** Validar que el total coincide */
  validateTotal?: boolean;
  /** Permitir ventas con total cero */
  allowZeroTotal?: boolean;
}

/**
 * Resultado de validación de una venta
 */
export interface SellValidationResult {
  /** Indica si la venta es válida */
  isValid: boolean;
  /** Lista de errores encontrados */
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  /** Warnings no críticos */
  warnings: string[];
}

/**
 * Opciones para buscar ventas
 */
export interface SearchOptions {
  /** Término de búsqueda */
  query: string;
  /** Campos en los que buscar */
  fields?: Array<'customerName' | 'products' | 'notes' | 'id'>;
  /** Búsqueda exacta o parcial */
  exact?: boolean;
  /** Ignorar mayúsculas/minúsculas */
  ignoreCase?: boolean;
  /** Límite de resultados */
  limit?: number;
}

/**
 * Configuración para el sistema de notificaciones de ventas
 */
export interface SellNotificationConfig {
  /** Notificar nuevas ventas */
  notifyNewSells?: boolean;
  /** Notificar cambios de estado */
  notifyStatusChanges?: boolean;
  /** Umbrales para alertas */
  thresholds?: {
    /** Monto mínimo para notificar */
    minAmount?: number;
    /** Tiempo máximo sin ventas (en horas) */
    maxTimeWithoutSells?: number;
  };
}
