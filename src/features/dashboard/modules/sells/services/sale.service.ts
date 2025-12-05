/**
 * Servicio de Ventas - Firebase Admin SDK
 * 
 * Maneja todas las operaciones de base de datos para ventas
 * utilizando Firebase Admin SDK (solo servidor).
 * 
 * @module features/dashboard/modules/sells/services/sell.service
 */

import { adminDb } from '@/lib/firebase/admin';
import { serializeFirestoreData } from '@/shared/utils/firestore-serializer';
import * as admin from 'firebase-admin';
import type { 
  Sale, 
  CreateSaleData, 
  UpdateSaleData, 
  SalesFilter, 
  SalesStats,
  SaleItem 
} from '../schemas/sell.schema';

const COLLECTION = 'sells';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Limpia un objeto removiendo campos undefined para Firestore
 */
function cleanForFirestore<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * Convierte datos de Firestore a tipo Sale
 */
function mapDocToSale(doc: FirebaseFirestore.DocumentSnapshot): Sale {
  const data = doc.data();
  if (!data) throw new Error('Document data is undefined');
  
  return {
    id: doc.id,
    orderNumber: data.orderNumber || '',
    storeId: data.storeId || '',
    source: data.source || 'local',
    customer: {
      name: data.customer?.name || '',
      phone: data.customer?.phone,
      email: data.customer?.email,
    },
    items: (data.items || []).map((item: SaleItem) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      categoryId: item.categoryId || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      variants: item.variants || [],
      notes: item.notes,
    })),
    delivery: {
      method: data.delivery?.method || 'retiro',
      address: data.delivery?.address,
      notes: data.delivery?.notes,
    },
    payment: {
      method: data.payment?.method || 'efectivo',
      total: data.payment?.total || 0,
    },
    totals: {
      subtotal: data.totals?.subtotal || 0,
      discount: data.totals?.discount || 0,
      total: data.totals?.total || 0,
    },
    notes: data.notes,
    metadata: {
      createdAt: data.metadata?.createdAt?.toDate?.() || new Date(),
      updatedAt: data.metadata?.updatedAt?.toDate?.() || new Date(),
    },
  };
}

/**
 * Calcula el total de un item incluyendo variantes
 */
function calculateItemSubtotal(item: SaleItem): number {
  let total = item.unitPrice;
  
  if (item.variants && item.variants.length > 0) {
    total += item.variants.reduce((sum, v) => sum + v.price, 0);
  }
  
  return total * item.quantity;
}

// =============================================================================
// OPERACIONES DE LECTURA
// =============================================================================

/**
 * Obtiene todas las ventas de una tienda con filtros opcionales
 */
export async function getSales(
  storeId: string, 
  filter?: SalesFilter
): Promise<Sale[]> {
  if (!storeId) return [];

  let query: FirebaseFirestore.Query = adminDb
    .collection('stores')
    .doc(storeId)
    .collection(COLLECTION)
    .orderBy('metadata.createdAt', 'desc');

  // Aplicar filtros de fecha
  if (filter?.startDate) {
    query = query.where('metadata.createdAt', '>=', admin.firestore.Timestamp.fromDate(filter.startDate));
  }
  
  if (filter?.endDate) {
    const endDate = new Date(filter.endDate);
    endDate.setHours(23, 59, 59, 999);
    query = query.where('metadata.createdAt', '<=', admin.firestore.Timestamp.fromDate(endDate));
  }
  
  if (filter?.paymentMethod && filter.paymentMethod !== 'all') {
    query = query.where('payment.method', '==', filter.paymentMethod);
  }

  if (filter?.deliveryMethod && filter.deliveryMethod !== 'all') {
    query = query.where('delivery.method', '==', filter.deliveryMethod);
  }

  if (filter?.source && filter.source !== 'all') {
    query = query.where('source', '==', filter.source);
  }
  
  if (filter?.limit) {
    query = query.limit(filter.limit);
  }

  const snapshot = await query.get();
  
  let sales = snapshot.docs.map(mapDocToSale);

  // Filtro por nombre de cliente (local, Firestore no soporta búsqueda de texto)
  if (filter?.customerName) {
    const searchTerm = filter.customerName.toLowerCase();
    sales = sales.filter(sale => 
      sale.customer.name.toLowerCase().includes(searchTerm)
    );
  }

  return serializeFirestoreData(sales);
}

/**
 * Obtiene una venta por ID
 */
export async function getSaleById(
  storeId: string, 
  saleId: string
): Promise<Sale | null> {
  if (!storeId || !saleId) return null;

  const doc = await adminDb
    .collection('stores')
    .doc(storeId)
    .collection(COLLECTION)
    .doc(saleId)
    .get();

  if (!doc.exists) return null;

  return serializeFirestoreData(mapDocToSale(doc));
}

// =============================================================================
// OPERACIONES DE ESCRITURA
// =============================================================================

/**
 * Crea una nueva venta
 */
export async function createSale(
  data: CreateSaleData, 
  storeId: string
): Promise<Sale> {
  if (!storeId) throw new Error('Store ID is required');

  // Calcular totales
  const subtotal = data.items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
  const total = subtotal - (data.totals.discount || 0);

  const saleData = cleanForFirestore({
    orderNumber: data.orderNumber || `ORD-${Date.now()}`,
    storeId,
    source: data.source || 'local',
    customer: {
      name: data.customer.name,
      phone: data.customer.phone || null,
      email: data.customer.email || null,
    },
    items: data.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      categoryId: item.categoryId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: calculateItemSubtotal(item),
      variants: item.variants || [],
      notes: item.notes || null,
    })),
    delivery: {
      method: data.delivery.method,
      address: data.delivery.address || null,
      notes: data.delivery.notes || null,
    },
    payment: {
      method: data.payment.method,
      total,
    },
    totals: {
      subtotal,
      discount: data.totals.discount || 0,
      total,
    },
    notes: data.notes || null,
    metadata: {
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  });

  const docRef = await adminDb
    .collection('stores')
    .doc(storeId)
    .collection(COLLECTION)
    .add(saleData);

  // Actualizar con el ID generado
  await docRef.update({ id: docRef.id });

  const doc = await docRef.get();
  return serializeFirestoreData(mapDocToSale(doc));
}

/**
 * Actualiza una venta existente
 */
export async function updateSale(
  saleId: string,
  data: UpdateSaleData,
  storeId: string
): Promise<Sale> {
  if (!storeId || !saleId) throw new Error('Store ID and Sale ID are required');

  const docRef = adminDb
    .collection('stores')
    .doc(storeId)
    .collection(COLLECTION)
    .doc(saleId);

  // Verificar que existe
  const existingDoc = await docRef.get();
  if (!existingDoc.exists) {
    throw new Error('Sale not found');
  }

  // Construir datos de actualización usando notación de punto
  // para evitar conflictos con campos anidados
  const updateData: Record<string, unknown> = {
    'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
  };

  // Customer - campos individuales
  if (data.customer) {
    if (data.customer.name !== undefined) updateData['customer.name'] = data.customer.name;
    if (data.customer.phone !== undefined) updateData['customer.phone'] = data.customer.phone;
    if (data.customer.email !== undefined) updateData['customer.email'] = data.customer.email;
  }

  // Items - array completo
  if (data.items) {
    const subtotal = data.items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
    updateData['items'] = data.items.map(item => ({
      ...item,
      subtotal: calculateItemSubtotal(item),
    }));
    updateData['totals.subtotal'] = subtotal;
    
    // Calcular total con descuento si existe
    const discount = data.totals?.discount ?? 0;
    const total = subtotal - discount;
    updateData['totals.total'] = total;
    updateData['payment.total'] = total;
  }

  // Delivery - campos individuales
  if (data.delivery) {
    if (data.delivery.method !== undefined) updateData['delivery.method'] = data.delivery.method;
    if (data.delivery.address !== undefined) updateData['delivery.address'] = data.delivery.address;
    if (data.delivery.notes !== undefined) updateData['delivery.notes'] = data.delivery.notes;
  }

  // Payment - campos individuales (evitar sobrescribir payment.total)
  if (data.payment) {
    if (data.payment.method !== undefined) updateData['payment.method'] = data.payment.method;
    // Solo actualizar payment.total si no se actualizó desde items
    if (data.payment.total !== undefined && !data.items) {
      updateData['payment.total'] = data.payment.total;
    }
  }

  // Totals - campos individuales
  if (data.totals) {
    if (data.totals.discount !== undefined) {
      updateData['totals.discount'] = data.totals.discount;
      // Recalcular total si hay descuento pero no hay items nuevos
      if (!data.items) {
        const existingData = existingDoc.data();
        const subtotal = existingData?.totals?.subtotal || 0;
        const newTotal = subtotal - data.totals.discount;
        updateData['totals.total'] = newTotal;
        updateData['payment.total'] = newTotal;
      }
    }
    if (data.totals.subtotal !== undefined && !data.items) {
      updateData['totals.subtotal'] = data.totals.subtotal;
    }
    if (data.totals.total !== undefined && !data.items && data.totals.discount === undefined) {
      updateData['totals.total'] = data.totals.total;
      updateData['payment.total'] = data.totals.total;
    }
  }

  // Source
  if (data.source !== undefined) {
    updateData['source'] = data.source;
  }

  // Notes
  if (data.notes !== undefined) {
    updateData['notes'] = data.notes;
  }

  await docRef.update(updateData);

  const doc = await docRef.get();
  return serializeFirestoreData(mapDocToSale(doc));
}

/**
 * Elimina una venta (soft delete)
 */
export async function deleteSale(
  saleId: string, 
  storeId: string
): Promise<void> {
  if (!storeId || !saleId) throw new Error('Store ID and Sale ID are required');

  await adminDb
    .collection('stores')
    .doc(storeId)
    .collection(COLLECTION)
    .doc(saleId)
    .delete();
}

// =============================================================================
// ESTADÍSTICAS
// =============================================================================

/**
 * Calcula estadísticas de ventas
 */
export async function calculateSalesStats(storeId: string): Promise<SalesStats> {
  if (!storeId) {
    return {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      todaySales: 0,
    };
  }

  const snapshot = await adminDb
    .collection('stores')
    .doc(storeId)
    .collection(COLLECTION)
    .get();

  const sales = snapshot.docs.map(mapDocToSale);
  
  const totalSales = sales.reduce((sum, sale) => sum + sale.totals.total, 0);
  const totalOrders = sales.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  // Ventas de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySales = sales
    .filter(sale => {
      const saleDate = new Date(sale.metadata.createdAt);
      return saleDate >= today;
    })
    .reduce((sum, sale) => sum + sale.totals.total, 0);

  return {
    totalSales,
    totalOrders,
    averageOrderValue,
    todaySales,
  };
}

// =============================================================================
// ALIASES PARA COMPATIBILIDAD
// =============================================================================

export const getSells = getSales;
export const getSellById = getSaleById;
export const createSell = createSale;
export const updateSell = updateSale;
export const deleteSell = deleteSale;
export const calculateSellsStats = calculateSalesStats;
