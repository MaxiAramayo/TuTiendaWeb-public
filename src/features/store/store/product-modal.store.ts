import { create } from 'zustand';
import { Product } from '@/shared/types/store';

interface ProductModalStore {
  // Estado
  product: Product | null;
  isOpen: boolean;
  
  // Acciones
  openModal: (product: Product) => void;
  closeModal: () => void;
}

/**
 * Store para manejar el estado del modal de producto
 */
export const useProductModalStore = create<ProductModalStore>((set) => ({
  // Estado inicial
  product: null,
  isOpen: false,
  
  // Acciones
  openModal: (product) => set({ product, isOpen: true }),
  closeModal: () => set({ isOpen: false })
})); 