"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Edit, Copy, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/shared/types/firebase.types';
import { deleteProductAction, updateProductAction, createProductAction } from '../actions/product.actions';
import { formatPrice, getProductStatusColor } from '../utils/product.utils';

interface ProductDetailsViewProps {
    product: Product;
    storeId: string;
}

export default function ProductDetailsView({ product: initialProduct, storeId }: ProductDetailsViewProps) {
    const router = useRouter();
    const [product, setProduct] = useState<Product>(initialProduct);
    const [isPending, setIsPending] = useState(false);

    const handleEdit = () => {
        router.push(`/dashboard/products/edit/${product.id}`);
    };

    const handleDuplicate = async () => {
        setIsPending(true);
        try {
            // Create a copy of the product data
            const formData = new FormData();
            formData.append('name', `${product.name} (Copia)`);
            formData.append('price', product.price.toString());
            formData.append('categoryId', product.categoryId);
            if (product.description) formData.append('description', product.description);
            // Add other fields as needed

            const result = await createProductAction(formData);
            if (result.success) {
                toast.success('Producto duplicado exitosamente');
                router.push(`/dashboard/products/edit/${result.data.id}`);
            } else {
                toast.error('Error al duplicar producto');
            }
        } catch (error) {
            toast.error('Error al duplicar producto');
        } finally {
            setIsPending(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
            return;
        }

        setIsPending(true);
        try {
            const result = await deleteProductAction(product.id);
            if (result.success) {
                toast.success('Producto eliminado exitosamente');
                router.push('/dashboard/products');
            } else {
                toast.error('Error al eliminar el producto');
            }
        } catch (error) {
            toast.error('Error al eliminar el producto');
        } finally {
            setIsPending(false);
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        const formData = new FormData();
        formData.append('id', product.id);
        formData.append('active', (newStatus === 'active').toString());
        // Note: updateProductAction expects 'active' boolean in formData to map to status
        // We need to ensure updateProductAction handles partial updates correctly or we send full data.
        // Our current updateProductAction validates against productUpdateSchema which is partial.

        setIsPending(true);
        try {
            const result = await updateProductAction(formData);
            if (result.success) {
                setProduct({ ...product, status: newStatus });
                toast.success(`Producto ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`);
            } else {
                toast.error('Error al actualizar estado');
            }
        } catch (error) {
            toast.error('Error al actualizar estado');
        } finally {
            setIsPending(false);
        }
    };

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
                        <p className="text-gray-600 mt-1">Detalle del producto</p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleToggleStatus}
                            disabled={isPending}
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${product.status === 'active'
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

                        <button
                            onClick={handleEdit}
                            disabled={isPending}
                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                        </button>

                        <button
                            onClick={handleDuplicate}
                            disabled={isPending}
                            className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicar
                        </button>

                        <button
                            onClick={handleDelete}
                            disabled={isPending}
                            className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información básica</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <p className="text-gray-900">{product.name}</p>
                            </div>

                            {product.description && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                    <p className="text-gray-900 whitespace-pre-wrap">{product.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Images */}
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
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado y precio</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProductStatusColor(product.status)}`}>
                                    {product.status === 'active' ? 'Activo' : product.status === 'inactive' ? 'Inactivo' : 'Borrador'}
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                                <p className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
