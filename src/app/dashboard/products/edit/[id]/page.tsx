/**
 * Página para editar un producto existente
 * 
 * Muestra el formulario de edición con los datos del producto cargados
 */

"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProductForm } from '@/features/dashboard/modules/products';
import { UpdateProductData, CreateProductData } from '@/features/dashboard/modules/products/types/product.types';
import { Product } from '@/shared/types/firebase.types';
import { useProducts } from '@/features/dashboard/modules/products/hooks/useProducts';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Props de la página de edición
 */
interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página de edición de producto
 * 
 * @param props - Props del componente
 * @returns Componente React
 */
export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const { getProduct, updateProduct, removeProductImage } = useProducts();
  const { user } = useAuthContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  
  // Obtener el storeId del usuario
  const storeId = user?.storeIds?.[0];

  /**
   * Resuelve los params y obtiene el ID del producto
   */
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
    };
    
    resolveParams();
  }, [params]);

  /**
   * Carga los datos del producto al montar el componente
   */
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const productData = await getProduct(productId);
        if (productData) {
          setProduct(productData);
        } else {
          setError('Producto no encontrado');
        }
      } catch (err) {
      setError('Error al cargar el producto');
    } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, getProduct]);

  /**
   * Maneja el envío del formulario de edición
   */
  const handleSubmit = async (data: CreateProductData | UpdateProductData): Promise<boolean> => {
    if (!productId) return false;
    
    try {
      const success = await updateProduct(productId, data as UpdateProductData);
      if (success) {
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

  // Estado de carga
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando producto...</span>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg font-medium mb-2">
            {error || 'Producto no encontrado'}
          </div>
          <button
            onClick={() => router.push('/dashboard/products')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Volver a productos
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
          <h1 className="text-2xl font-bold text-gray-900">Editar producto</h1>
          <p className="text-gray-600 mt-1">
            Modifica la información de &quot;{product.name}&quot;
          </p>
        </div>
      </div>

      {/* Formulario */}
      <ProductForm
        storeId={storeId}
        product={product}
        onSave={handleSubmit}
        onCancel={handleCancel}
        onRemoveImage={removeProductImage}
        loading={false}
      />
    </div>
  );
}