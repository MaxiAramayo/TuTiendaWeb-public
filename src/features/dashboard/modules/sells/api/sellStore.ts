/**
 * Store de Ventas - Dashboard Sells Module
 * 
 * Maneja todas las operaciones relacionadas con la gestión de ventas:
 * - Creación y registro de ventas
 * - Consulta y filtrado de ventas
 * - Cálculo de estadísticas de ventas
 * - Gestión de estado de ventas
 * 
 * @module features/dashboard/modules/sells/api/sellStore
 */

import { create } from "zustand";
import { db } from "@/lib/firebase/client";
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  updateDoc
} from "firebase/firestore";
import { OptimizedSell as Sell } from "../types/optimized-sell";
import { SellsFilter, SellsStats, SellState } from "../types/base";

export const useSellStore = create<SellState>((set, get) => ({
  sells: [],
  isLoading: false,
  isLoadingStats: false,
  error: null,
  stats: null,
  lastDoc: null,
  hasMore: true,

  addSell: async (sell: Sell, storeId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      // Calcular el total de la venta si no está especificado
      const total = sell.total || sell.products.reduce((sum: number, product: any) => 
        sum + (product.price * product.cantidad), 0);
      
      // Limpiar datos para evitar campos undefined
      const cleanSellData = {
        orderNumber: sell.orderNumber || "ORD-" + Date.now(),
        customerName: sell.customerName || '',
        customerPhone: sell.customerPhone || '',
        customerId: sell.customerId || '',
        deliveryMethod: sell.deliveryMethod || 'pickup',
        address: sell.address || '',
        deliveryNotes: sell.deliveryNotes || '',
        paymentMethod: sell.paymentMethod || 'efectivo',
        paymentStatus: sell.paymentStatus || 'pending',
        paidAmount: sell.paidAmount || total,
        status: sell.status || 'pending',
        notes: sell.notes || '',
        source: sell.source || 'local',
        createdBy: sell.createdBy || '',
        products: sell.products.map(product => ({
          id: product.id || '',
          idProduct: product.idProduct || product.id || '',
          name: product.name || '',
          price: product.price || 0,
          cantidad: product.cantidad || 1,
          category: product.category || '',
          aclaracion: product.aclaracion || '',
          appliedTopics: product.appliedTopics || []
        })),
        subtotal: sell.subtotal || total,
        discount: sell.discount || null,
        tax: sell.tax || null,
        total,
        date: Timestamp.fromDate(sell.date instanceof Date ? sell.date : new Date()),
        deliveryDate: sell.deliveryDate && sell.deliveryDate instanceof Date ? Timestamp.fromDate(sell.deliveryDate) : null,
        createdAt: Timestamp.fromDate(new Date())
      };
      
      // Usar addDoc para crear automáticamente el ID del documento
      const sellRef = await addDoc(collection(db, `stores/${storeId}/sells`), cleanSellData);
      
      // Actualizar el documento con el ID generado
      await setDoc(sellRef, { id: sellRef.id }, { merge: true });
      
      const finalSell: Sell = { 
        id: sellRef.id,
        orderNumber: cleanSellData.orderNumber,
        customerName: cleanSellData.customerName,
        customerPhone: cleanSellData.customerPhone,
        customerId: cleanSellData.customerId,
        deliveryMethod: cleanSellData.deliveryMethod,
        address: cleanSellData.address,
        deliveryNotes: cleanSellData.deliveryNotes,
        paymentMethod: cleanSellData.paymentMethod,
        paymentStatus: cleanSellData.paymentStatus,
        paidAmount: cleanSellData.paidAmount,
        status: cleanSellData.status,
        notes: cleanSellData.notes,
        source: cleanSellData.source,
        createdBy: cleanSellData.createdBy,
        products: cleanSellData.products,
        subtotal: cleanSellData.subtotal,
        discount: cleanSellData.discount || undefined,
        tax: cleanSellData.tax || undefined,
        total: cleanSellData.total,
        date: cleanSellData.date instanceof Timestamp ? cleanSellData.date.toDate() : new Date(cleanSellData.date),
        deliveryDate: cleanSellData.deliveryDate ? (cleanSellData.deliveryDate instanceof Timestamp ? cleanSellData.deliveryDate.toDate() : new Date(cleanSellData.deliveryDate)) : undefined,
        updatedAt: new Date()
      };
      
      set((state) => ({
        sells: [finalSell, ...state.sells],
        isLoading: false
      }));
      
      // Venta guardada exitosamente
      return true;
    } catch (error) {
      console.error("Error al guardar la venta:", error);
      set({ 
        error: error instanceof Error ? error.message : "Error al guardar la venta",
        isLoading: false 
      });
      return false;
    }
  },

  getSells: async (storeId: string, filter?: SellsFilter): Promise<boolean> => {
    set({ isLoading: true, error: null, lastDoc: null, hasMore: true });
    
    try {
      let sellsQuery = query(
        collection(db, `stores/${storeId}/sells`),
        orderBy("date", "desc")
      );

      // Aplicar filtros
      if (filter) {
        if (filter.startDate) {
          sellsQuery = query(
            sellsQuery,
            where("date", ">=", Timestamp.fromDate(filter.startDate))
          );
        }
        
        if (filter.endDate) {
          const endDate = new Date(filter.endDate);
          endDate.setHours(23, 59, 59, 999); // Incluir todo el día
          sellsQuery = query(
            sellsQuery,
            where("date", "<=", Timestamp.fromDate(endDate))
          );
        }
        
        if (filter.paymentMethod && filter.paymentMethod !== 'all') {
          sellsQuery = query(sellsQuery, where("paymentMethod", "==", filter.paymentMethod));
        }
        
        if (filter.limit) {
          sellsQuery = query(sellsQuery, limit(filter.limit));
        }
      } else {
        // Límite por defecto
        sellsQuery = query(sellsQuery, limit(20));
      }

      const querySnapshot = await getDocs(sellsQuery);
      
      let sells = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id, // Usar el ID del documento
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
        } as Sell;
      }).filter(sell => !(sell as any).deleted); // Filtrar eliminadas localmente

      // Filtro por nombre de cliente (local, ya que Firestore no soporta búsqueda parcial eficiente)
      if (filter?.customerName) {
        const searchTerm = filter.customerName.toLowerCase();
        sells = sells.filter(sell => 
          sell.customerName?.toLowerCase().includes(searchTerm)
        );
      }

      set({ 
        sells,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
        hasMore: querySnapshot.docs.length === (filter?.limit || 20),
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error("Error al obtener las ventas:", error);
      set({ 
        error: error instanceof Error ? error.message : "Error al obtener las ventas",
        isLoading: false 
      });
      return false;
    }
  },

  loadMoreSells: async (storeId: string, filter?: SellsFilter): Promise<boolean> => {
    const { lastDoc, hasMore, isLoading } = get();
    
    if (!hasMore || isLoading || !lastDoc) return false;
    
    set({ isLoading: true, error: null });
    
    try {
      let sellsQuery = query(
        collection(db, `stores/${storeId}/sells`),
        orderBy("date", "desc"),
        startAfter(lastDoc)
      );

      // Aplicar los mismos filtros que en getSells
      if (filter) {
        if (filter.startDate) {
          sellsQuery = query(
            sellsQuery,
            where("date", ">=", Timestamp.fromDate(filter.startDate))
          );
        }
        
        if (filter.endDate) {
          const endDate = new Date(filter.endDate);
          endDate.setHours(23, 59, 59, 999);
          sellsQuery = query(
            sellsQuery,
            where("date", "<=", Timestamp.fromDate(endDate))
          );
        }
        
        if (filter.paymentMethod && filter.paymentMethod !== 'all') {
          sellsQuery = query(sellsQuery, where("paymentMethod", "==", filter.paymentMethod));
        }
      }
      
      sellsQuery = query(sellsQuery, limit(filter?.limit || 20));

      const querySnapshot = await getDocs(sellsQuery);
      
      let newSells = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
        } as Sell;
      }).filter(sell => !(sell as any).deleted); // Filtrar eliminadas localmente

      // Filtro por nombre de cliente (local)
      if (filter?.customerName) {
        const searchTerm = filter.customerName.toLowerCase();
        newSells = newSells.filter(sell => 
          sell.customerName?.toLowerCase().includes(searchTerm)
        );
      }

      set((state) => ({
        sells: [...state.sells, ...newSells],
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || state.lastDoc,
        hasMore: querySnapshot.docs.length === (filter?.limit || 20),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      console.error("Error al cargar más ventas:", error);
      set({ 
        error: error instanceof Error ? error.message : "Error al cargar más ventas",
        isLoading: false 
      });
      return false;
    }
  },

  calculateStats: async (storeId: string, filter?: SellsFilter): Promise<boolean> => {
    set({ isLoadingStats: true, error: null });
    
    try {
      // Para las estadísticas, obtenemos todas las ventas sin límite
      const result = await get().getSells(storeId, { ...filter, limit: undefined });
      
      if (!result) {
        set({ isLoadingStats: false });
        return false;
      }
      
      const { sells } = get();
      
      // Calcular estadísticas
      const totalSales = sells.reduce((sum, sell) => {
        const sellTotal = sell.products.reduce((productSum, product) => 
          productSum + (product.price * product.cantidad), 0);
        return sum + sellTotal;
      }, 0);
      
      const totalOrders = sells.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
      
      // Ventas de hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySells = sells.filter(sell => {
        const sellDate = new Date(sell.date);
        sellDate.setHours(0, 0, 0, 0);
        return sellDate.getTime() === today.getTime();
      });
      const todaySales = todaySells.reduce((sum, sell) => {
        const sellTotal = sell.products.reduce((productSum, product) => 
          productSum + (product.price * product.cantidad), 0);
        return sum + sellTotal;
      }, 0);
      
      // Ventas del mes
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const monthSells = sells.filter(sell => new Date(sell.date) >= thisMonth);
      const monthSales = monthSells.reduce((sum, sell) => {
        const sellTotal = sell.products.reduce((productSum, product) => 
          productSum + (product.price * product.cantidad), 0);
        return sum + sellTotal;
      }, 0);
      
      // Producto más vendido
      const productCount: Record<string, { name: string; quantity: number }> = {};
      sells.forEach(sell => {
        sell.products.forEach(product => {
          const key = product.idProduct;
          if (productCount[key]) {
            productCount[key].quantity += product.cantidad;
          } else {
            productCount[key] = {
              name: product.name,
              quantity: product.cantidad
            };
          }
        });
      });
      
      const topProduct = Object.values(productCount).reduce((max, current) => 
        current.quantity > (max?.quantity || 0) ? current : max, 
        undefined as { name: string; quantity: number } | undefined
      );
      
      // Cliente más frecuente
      const customerCount: Record<string, number> = {};
      sells.forEach(sell => {
        if (sell.customerName) {
          customerCount[sell.customerName] = (customerCount[sell.customerName] || 0) + 1;
        }
      });
      
      const topCustomerEntry = Object.entries(customerCount).reduce(
        (max, [name, orders]) => {
          if (!max || orders > max[1]) {
            return [name, orders] as [string, number];
          }
          return max;
        },
        null as [string, number] | null
      );
      
      const topCustomer = topCustomerEntry ? {
        name: topCustomerEntry[0],
        orders: topCustomerEntry[1]
      } : undefined;
      
      const stats: SellsStats = {
        totalSales,
        totalOrders,
        averageOrderValue,
        todaySales,
        monthSales,
        topProduct,
        topCustomer
      };
      
      set({ stats, isLoadingStats: false });
      return true;
    } catch (error) {
      console.error("Error al calcular estadísticas:", error);
      set({ 
        error: error instanceof Error ? error.message : "Error al calcular estadísticas",
        isLoadingStats: false 
      });
      return false;
    }
  },

  getSellById: async (storeId: string, sellId: string): Promise<Sell | null> => {
    try {
      const { sells } = get();
      
      // Buscar primero en el estado actual
      const cachedSell = sells.find(sell => sell.id === sellId);
      if (cachedSell) {
        return cachedSell;
      }
      
      // Si no está en caché, buscar en la base de datos
      const sellRef = doc(db, `stores/${storeId}/sells/${sellId}`);
      const sellDoc = await getDoc(sellRef);
      
      if (!sellDoc.exists()) {
        return null;
      }
      
      const data = sellDoc.data();
      return {
        ...data,
        id: sellDoc.id,
        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date)
      } as Sell;
    } catch (error) {
      console.error("Error al obtener venta por ID:", error);
      set({ error: error instanceof Error ? error.message : "Error al obtener la venta" });
      return null;
    }
  },

  // Función deprecada - usar getSellById directamente
  getSell: async (sellId: string, storeId: string): Promise<Sell | null> => {
    return get().getSellById(storeId, sellId);
  },

  updateSell: async (sell: Sell, storeId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      // Calcular el total de la venta
      const total = sell.products.reduce((sum: number, product: any) => 
        sum + (product.price * product.cantidad), 0);
      
      // Limpiar datos para evitar campos undefined - solo campos necesarios
      const cleanSellData = {
        orderNumber: sell.orderNumber,
        customerName: sell.customerName || '',
        customerPhone: sell.customerPhone || '',
        deliveryMethod: sell.deliveryMethod || 'pickup',
        address: sell.address || '',
        deliveryNotes: sell.deliveryNotes || '',
        paymentMethod: sell.paymentMethod || 'efectivo',
        paymentStatus: sell.paymentStatus || 'pending',
        status: sell.status || 'pending',
        notes: sell.notes || '',
        source: sell.source || 'local',
        products: sell.products.map(product => ({
          id: product.id || '',
          idProduct: product.idProduct || product.id || '',
          name: product.name || '',
          price: product.price || 0,
          cantidad: product.cantidad || 1,
          category: product.category || '',
          aclaracion: product.aclaracion || '',
          appliedTopics: product.appliedTopics || []
        })),
        subtotal: sell.subtotal || total,
        discount: sell.discount || null,
        tax: sell.tax || null,
        total,
        date: Timestamp.fromDate(sell.date),
        deliveryDate: sell.deliveryDate ? Timestamp.fromDate(sell.deliveryDate) : null,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      const sellRef = doc(db, `stores/${storeId}/sells/${sell.id}`);
      await updateDoc(sellRef, cleanSellData);
      
      set((state) => ({
        sells: state.sells.map(s => 
          s.id === sell.id ? { ...sell, total, updatedAt: new Date() } : s
        ),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      console.error("Error al actualizar la venta:", error);
      set({ 
        error: error instanceof Error ? error.message : "Error al actualizar la venta",
        isLoading: false 
      });
      return false;
    }
  },

  deleteSell: async (storeId: string, sellId: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      const sellRef = doc(db, `stores/${storeId}/sells/${sellId}`);
      await deleteDoc(sellRef);
      
      set((state) => ({
        sells: state.sells.filter(sell => sell.id !== sellId),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
      set({ 
        error: error instanceof Error ? error.message : "Error al eliminar la venta",
        isLoading: false 
      });
      return false;
    }
  },

  updateSellStatus: async (storeId: string, sellId: string, status: string): Promise<boolean> => {
    set({ isLoading: true, error: null });
    
    try {
      const sellRef = doc(db, `stores/${storeId}/sells/${sellId}`);
      await setDoc(sellRef, { status }, { merge: true });
      
      set((state) => ({
        sells: state.sells.map(sell => 
          sell.id === sellId ? { ...sell, status: status as any } : sell
        ),
        isLoading: false
      }));
      
      return true;
    } catch (error) {
      console.error("Error al actualizar estado de venta:", error);
      set({ 
        error: error instanceof Error ? error.message : "Error al actualizar la venta",
        isLoading: false 
      });
      return false;
    }
  },

  clearState: () => {
    set({
      sells: [],
      error: null,
      stats: null,
      lastDoc: null,
      hasMore: true,
      isLoading: false,
      isLoadingStats: false
    });
  },

  refreshWithFilters: async (storeId: string, filter?: SellsFilter): Promise<boolean> => {
    // Limpiar estado y recargar con filtros
    set({ 
      sells: [], 
      lastDoc: null, 
      hasMore: true 
    });
    
    return await get().getSells(storeId, filter);
  },

  clearError: () => {
    set({ error: null });
  }
}));
