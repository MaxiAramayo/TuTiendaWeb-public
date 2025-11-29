"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '../forms/product-form';
import { updateProductAction } from '../actions/product.actions';
import { Category, Tag, Product } from '@/shared/types/firebase.types';

interface ProductEditViewProps {
    product: Product;
    storeId: string;
    categories: Category[];
    tags: Tag[];
}

export default function ProductEditView({ product, storeId, categories, tags }: ProductEditViewProps) {
    const router = useRouter();

    const handleSave = async (data: any) => {
        const formData = new FormData();
        formData.append('id', product.id);

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'images') {
                (value as File[]).forEach(file => formData.append('images', file));
            } else if (key === 'tags' || key === 'variants' || key === 'existingImageUrls') {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, String(value));
            }
        });

        const result = await updateProductAction(formData);

        if (result.success) {
            toast.success('Producto actualizado exitosamente');
            router.push('/dashboard/products');
            return true;
        } else {
            const errorMsg = result.errors ? Object.values(result.errors).flat().join(', ') : 'Error al actualizar producto';
            toast.error(errorMsg);
            return false;
        }
    };
    // Placeholder for remove image logic if needed, or implement specific action
    const handleRemoveImage = async (productId: string, imageUrl: string) => {
        // Implement removal logic if API supports it, or just update product without the image
        // For now, we can rely on the form handling the new image list state
        return true;
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
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

            <ProductForm
                product={product}
                storeId={storeId}
                onSave={handleSave}
                onCancel={() => router.back()}
                onRemoveImage={handleRemoveImage}
                categories={categories}
                tags={tags}
            />
        </div>
    );
}
