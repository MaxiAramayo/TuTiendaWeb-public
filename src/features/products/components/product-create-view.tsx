"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '../forms/product-form';
import { createProductAction } from '../actions/product.actions';
import { Category, Tag } from '@/shared/types/firebase.types';
import { ProductFormData } from '../schemas/product.schema';

interface ProductCreateViewProps {
    storeId: string;
    categories: Category[];
    tags: Tag[];
}

export default function ProductCreateView({ storeId, categories, tags }: ProductCreateViewProps) {
    const router = useRouter();

    const handleSave = async (data: ProductFormData) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'images') {
                if (Array.isArray(value)) {
                    value.forEach((file: any) => {
                        if (file instanceof File) {
                            formData.append('images', file);
                        }
                    });
                }
            } else if (key === 'tags' || key === 'variants') {
                formData.append(key, JSON.stringify(value));
            } else if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        const result = await createProductAction(formData);

        if (result.success) {
            toast.success('Producto creado exitosamente');
            router.push('/dashboard/products');
            return true;
        } else {
            const errorMsg = result.errors ? Object.values(result.errors).flat().join(', ') : 'Error al crear producto';
            toast.error(errorMsg);
            return false;
        }
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
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nuevo Producto</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Completa la información para agregar un nuevo producto a tu catálogo
                    </p>
                </div>
            </div>


            <ProductForm
                storeId={storeId}
                onSave={handleSave}
                onCancel={() => router.back()}
                categories={categories}
                tags={tags}
            />
        </div>
    );
}
