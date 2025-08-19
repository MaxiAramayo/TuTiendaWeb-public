/**
 * Página para crear un nuevo producto
 * 
 * Muestra el formulario de creación de productos
 */

"use client";

import { useRouter } from 'next/navigation';
import { ProductForm } from '@/features/dashboard/modules/products';
import { CreateProductData, UpdateProductData } from '@/features/dashboard/modules/products/types/product.types';
import { useProducts } from '@/features/dashboard/modules/products/hooks/useProducts';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Página de creación de producto
 * 
 * @returns Componente React
 */
export default function NewProductPage() {
  const router = useRouter();
  const { createProduct } = useProducts();
  const { user } = useAuthContext();
  
  // Obtener el storeId del usuario
  const storeId = user?.storeIds?.[0];

  /**
   * Maneja el envío del formulario de creación
   */
  const handleSubmit = async (data: CreateProductData | UpdateProductData): Promise<boolean> => {
    try {
      const productId = await createProduct(data as CreateProductData);
      if (productId) {
        router.push('/dashboard/products');
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  /**
   * Maneja la cancelación del formulario
   */
  const handleCancel = () => {
    router.back();
  };

  // Validar que el usuario tenga una tienda
  if (!storeId) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-2">
            No se encontró una tienda asociada
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a productos
        </button>
        
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Producto</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Completa la información para agregar un nuevo producto a tu catálogo
          </p>
        </div>
      </div>

      {/* Formulario */}
      <ProductForm
        storeId={storeId}
        onSave={handleSubmit}
        onCancel={handleCancel}
        loading={false}
      />
    </div>
  );
}