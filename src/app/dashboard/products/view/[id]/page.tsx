/**
 * Página para ver detalles de un producto
 * 
 * Muestra información completa del producto en modo solo lectura
 */

"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Product } from '@/shared/types/firebase.types';
import { useProducts } from '@/features/dashboard/modules/products/hooks/useProducts';
import { ArrowLeft, Edit, Copy, Trash2, Eye, EyeOff, Star, StarOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

/**
 * Props de la página de vista
 */
interface ViewProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Página de vista de producto
 * 
 * @param props - Props del componente
 * @returns Componente React
 */
export default function ViewProductPage({ params }: ViewProductPageProps) {
  const router = useRouter();
  const { getProduct, updateProduct, deleteProduct, duplicateProduct } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

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
   * Maneja la edición del producto
   */
  const handleEdit = () => {
    if (!productId) return;
    router.push(`/dashboard/products/edit/${productId}`);
  };

  /**
   * Maneja la duplicación del producto
   */
  const handleDuplicate = async () => {
    if (!productId) return;
    
    try {
      const newProductId = await duplicateProduct(productId);
      if (newProductId) {
        toast.success('Producto duplicado exitosamente');
        router.push(`/dashboard/products/edit/${newProductId}`);
      }
    } catch (error) {
      toast.error('Error al duplicar el producto');
    }
  };

  /**
   * Maneja la eliminación del producto
   */
  const handleDelete = async () => {
    if (!productId) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      const success = await deleteProduct(productId);
      if (success) {
        toast.success('Producto eliminado exitosamente');
        router.push('/dashboard/products');
      }
    } catch (error) {
      toast.error('Error al eliminar el producto');
    }
  };

  /**
   * Maneja el cambio de estado del producto
   */
  const handleToggleStatus = async () => {
    if (!product || !productId) return;

    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      const success = await updateProduct(productId, { status: newStatus as any });
      if (success) {
        setProduct({ ...product, status: newStatus });
        toast.success(`Producto ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`);
      }
    } catch (error) {
      toast.error('Error al actualizar el estado del producto');
    }
  };

  // Función handleToggleFeatured eliminada - no aplica para restaurantes

  /**
   * Formatea el precio para mostrar
   */
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  /**
   * Obtiene el color del badge según el estado
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600 mt-1">Producto para restaurante</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleStatus}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                product.status === 'active'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {product.status === 'active' ? (
                <><EyeOff className="w-4 h-4 mr-2" />Desactivar</>
              ) : (
                <><Eye className="w-4 h-4 mr-2" />Activar</>
              )}
            </button>
            
            {/* Botón de destacado eliminado - no aplica para restaurantes */}
            
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </button>
            
            <button
              onClick={handleDuplicate}
              className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </button>
            
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información básica */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información básica</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <p className="text-gray-900">{product.name}</p>
              </div>
              
              {product.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
              
              {/* shortDescription y tags eliminados - estructura simplificada para restaurantes */}
            </div>
          </div>

          {/* Imágenes */}
          {product.imageUrls && product.imageUrls.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Imágenes</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {product.imageUrls.map((imageUrl, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={imageUrl}
                      alt={`Imagen ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estado y precio */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado y precio</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                  {product.status === 'active' ? 'Activo' : product.status === 'inactive' ? 'Inactivo' : 'Borrador'}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price, 'ARS')}
                </p>
              </div>
              
              {/* Sección de destacado eliminada - no aplica para restaurantes */}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información adicional</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Creado:</span>
                <span className="text-gray-900">
                  {product.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Actualizado:</span>
                <span className="text-gray-900">
                  {product.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </span>
              </div>
              

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}