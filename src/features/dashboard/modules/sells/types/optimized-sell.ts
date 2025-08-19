/**
 * Interfaces optimizadas para registro de ventas
 * Enfocadas en velocidad de registro y datos esenciales
 */

/**
 * Producto optimizado para registro de ventas
 * Solo almacena snapshot del momento de venta + datos esenciales
 */
export interface ProductInSell {
  // === IDENTIFICACIÓN ===
  id: string;                    // ID único en la venta
  idProduct: string;             // Referencia al producto original
  
  // === SNAPSHOT DEL MOMENTO DE VENTA ===
  name: string;                  // Nombre puede cambiar después
  price: number;                 // Precio puede cambiar después
  category?: string;             // Para reportes y análisis
  
  // === DATOS ESPECÍFICOS DE LA VENTA ===
  cantidad: number;              // Cantidad vendida
  aclaracion?: string;           // Personalización del cliente
  
  // === EXTRAS APLICADOS (solo si se usaron) ===
  appliedTopics?: {
    id: string;
    name: string;
    price: number;
  }[];
}

/**
 * Interfaz optimizada para registro de ventas
 * Enfocada en velocidad de registro y datos esenciales
 */
export interface OptimizedSell {
  // === IDENTIFICACIÓN ===
  id: string;
  orderNumber?: string;          // ✅ Número de orden visible para cliente
  
  // === TEMPORAL ===
  date: Date;                    // ✅ CRÍTICO - Fecha de creación
  deliveryDate?: Date;           // ✅ Para entregas programadas
  
  // === CLIENTE ===
  customerName: string;
  customerPhone?: string;        // ✅ CRÍTICO para contacto
  customerId?: string;           // ✅ Cliente recurrente
  
  // === PRODUCTOS ===
  products: ProductInSell[];
  
  // === TOTALES ===
  subtotal: number;              // ✅ Sin descuentos ni extras
  discount?: {                   // ✅ Descuentos aplicados
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  tax?: {                        // ✅ Para facturación
    rate: number;
    amount: number;
  };
  total: number;                 // ✅ Total final
  
  // === LOGÍSTICA ===
  deliveryMethod: 'pickup' | 'delivery' | 'shipping';
  address?: string;
  deliveryNotes?: string;        // ✅ Instrucciones específicas
  
  // === PAGO ===
  paymentMethod: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  paidAmount?: number;           // ✅ Para pagos parciales
  
  // === ESTADO Y SEGUIMIENTO ===
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  statusHistory?: {              // ✅ Para trazabilidad
    status: string;
    date: Date;
    notes?: string;
  }[];
  
  // === METADATOS ===
  notes?: string;
  source?: 'web' | 'whatsapp' | 'instagram' | 'local';  // ✅ Canal de venta
  createdBy?: string;            // ✅ Usuario que registró
  updatedAt?: Date;
}
