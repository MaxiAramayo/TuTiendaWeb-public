/**
 * Página de productos del dashboard
 * 
 * Muestra la interfaz completa de gestión de productos
 * con funcionalidades de CRUD, filtros y búsqueda.
 */

"use client";

import { useRouter } from 'next/navigation';
import ProductsMain from '@/features/dashboard/modules/products/components/ProductsMain';
import { Product } from '@/shared/types/firebase.types';

/**
 * Página de gestión de productos
 * 
 * @returns Componente React
 */
export default function ProductsPage() {
  const router = useRouter();

  /**
   * Maneja la navegación para crear un nuevo producto
   */
  const handleCreateProduct = () => {
    router.push('/dashboard/products/new');
  };

  /**
   * Maneja la navegación para editar un producto
   */
  const handleEditProduct = (product: Product) => {
    router.push(`/dashboard/products/edit/${product.id}`);
  };

  /**
   * Maneja la navegación para ver detalles de un producto
   */
  const handleViewProduct = (product: Product) => {
    router.push(`/dashboard/products/view/${product.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <ProductsMain
        onCreateProduct={handleCreateProduct}
        onEditProduct={handleEditProduct}
        onViewProduct={handleViewProduct}
      />
    </div>
  );
}