/**
 * Store para manejar el estado del carrito de compras
 * 
 * @module store/cartStore
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, ProductInCart } from '@/shared/types/store';
import { calcularTotal, editarCantidadCart, eliminarDelCarrito } from '@/features/store/components/cart/CartUtils';

// Tipos para el estado del carrito
interface CartState {
  items: ProductInCart[];
  isOpen: boolean;
  total: number;
  isLoading: boolean;
  error: string | null;
}

// Tipos para las acciones del carrito
interface CartActions {
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  setError: (error: string | null) => void;
  updateTopics: (id: string, newTopics: any[]) => void;
}

// Tipos para los selectores del carrito
interface CartSelectors {
  getTotalItems: () => number;
  isProductInCart: (productId: string) => boolean;
  getProductQuantity: (productId: string) => number;
}

/**
 * Store del carrito de compras
 * Maneja el estado y las acciones relacionadas con el carrito de compras
 */
const useCartStore = create<CartState & CartActions & CartSelectors>()(
  (set, get) => ({
    // Estado inicial
    items: [],
    isOpen: false,
    total: 0,
    isLoading: false,
    error: null,

    // Acciones
    openCart: () => set({ isOpen: true }),
    
    closeCart: () => set({ isOpen: false }),
    
    addToCart: (product: Product, quantity: number = 1) => {
      try {
        set({ isLoading: true, error: null });

        // Validaciones
        if (!product || !product.idProduct) {
          throw new Error('Producto inválido');
        }

        if (quantity < 1) {
          throw new Error('La cantidad debe ser mayor a 0');
        }

        if (typeof product.price !== 'number' || product.price < 0) {
          throw new Error('Precio del producto inválido');
        }

        const { items } = get();

        // Generar un identificador único basado en idProduct y los ids de los tópicos (ordenados)
        const topicsIds = (product.topics && product.topics.length > 0)
          ? product.topics.map(t => t.id).sort().join('-')
          : '';
        const uniqueId = `${product.idProduct}-${topicsIds}`;

        // Buscar si ya existe un producto con la misma combinación de idProduct + tópicos
        const existingItem = items.find(item => {
          if (item.idProduct !== product.idProduct) return false;
          const itemTopicsIds = (item.topics && item.topics.length > 0)
            ? item.topics.map(t => t.id).sort().join('-')
            : '';
          return itemTopicsIds === topicsIds;
        });

        if (existingItem) {
          // Si el producto ya existe con la misma combinación de tópicos, actualizamos la cantidad
          const updatedItems = items.map(item =>
            item === existingItem
              ? { ...item, cantidad: item.cantidad + quantity }
              : item
          );
          set({ 
            items: updatedItems,
            total: calcularTotal(updatedItems),
            isLoading: false
          });
        } else {
          // Si es una combinación nueva, la agregamos como ítem distinto
          const newItem = {
            ...product,
            id: uniqueId, // ID determinista
            cantidad: quantity
          };
          const updatedItems = [...items, newItem];
          set({ 
            items: updatedItems,
            total: calcularTotal(updatedItems),
            isLoading: false
          });
        }
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Error al agregar al carrito',
          isLoading: false 
        });
      }
    },

    updateQuantity: (id: string, quantity: number) => {
      try {
        set({ isLoading: true, error: null });
        if (quantity < 1) {
          throw new Error('La cantidad debe ser mayor a 0');
        }

        const { items } = get();
        const updatedItems = items.map(item => 
          item.id === id ? { ...item, cantidad: quantity } : item
        );
        set({ 
          items: updatedItems,
          total: calcularTotal(updatedItems),
          isLoading: false
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Error al actualizar cantidad',
          isLoading: false 
        });
      }
    },

    removeFromCart: (id: string) => {
      try {
        set({ isLoading: true, error: null });
        const { items } = get();
        const updatedItems = eliminarDelCarrito(id, items);
        set({ 
          items: updatedItems,
          total: calcularTotal(updatedItems),
          isLoading: false
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Error al eliminar del carrito',
          isLoading: false 
        });
      }
    },

    clearCart: () => set({ items: [], total: 0, error: null }),
    
    setError: (error: string | null) => set({ error }),

    // Selectores
    getTotalItems: () => {
      const { items } = get();
      return items.reduce((total, item) => total + item.cantidad, 0);
    },

    isProductInCart: (productId: string) => {
      const { items } = get();
      return items.some(item => item.idProduct === productId);
    },

    getProductQuantity: (productId: string) => {
      const { items } = get();
      const item = items.find(item => item.idProduct === productId);
      return item?.cantidad || 0;
    },

    /**
     * Actualiza los tópicos (extras) de un producto en el carrito
     */
    updateTopics: (id: string, newTopics: any[]) => {
      try {
        set({ isLoading: true, error: null });
        const { items } = get();
        const updatedItems = items.map(item => {
          if (item.id !== id) return item;
          // El price base es el precio original del producto (sin tópicos)
          const basePrice = item.price - (item.topics?.reduce((acc, topic) => acc + (topic.price || 0), 0) || 0);
          const extrasPrice = newTopics.reduce((acc, topic) => acc + (topic.price || 0), 0);
          return {
            ...item,
            topics: newTopics,
            price: basePrice + extrasPrice
          };
        });
        set({
          items: updatedItems,
          total: calcularTotal(updatedItems),
          isLoading: false
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Error al actualizar extras',
          isLoading: false
        });
      }
    },
  })
);

export { useCartStore };
