"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
    MoreVertical,
    Edit,
    Trash2,
    Copy,
    ToggleLeft,
    ToggleRight,
    Package
} from 'lucide-react';
import { Product, Category, Tag } from '@/shared/types/firebase.types';
import {
    formatPrice,
    getProductStatusLabel,
    getProductStatusColor,
    getProductMainImage,
    generateProductSummary
} from '../utils/product.utils';

interface ProductCardProps {
    product: Product;
    storeId: string;
    onEdit?: (product: Product) => void;
    onDelete?: (productId: string) => void;
    onDuplicate?: (productId: string) => void;
    onToggleStatus?: (productId: string, status: 'active' | 'inactive') => void;
    onView?: (product: Product) => void;
    categories: Category[];
    tags: Tag[];
}

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    storeId,
    onEdit,
    onDelete,
    onDuplicate,
    onToggleStatus,
    onView,
    categories,
    tags
}) => {
    const [showActions, setShowActions] = useState(false);
    const [imageError, setImageError] = useState(false);

    const categoryName = useMemo(() => {
        const category = categories.find(c => c.id === product.categoryId);
        return category?.name || 'Sin categoría';
    }, [categories, product.categoryId]);

    const tagNames = useMemo(() => {
        if (!product.tags) return [];
        return product.tags.map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            return tag?.name || `Tag ${tagId}`;
        });
    }, [tags, product.tags]);

    const mainImage = getProductMainImage(product);
    const statusLabel = getProductStatusLabel(product.status);
    const statusColor = getProductStatusColor(product.status);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(product);
        setShowActions(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            onDelete?.(product.id);
        }
        setShowActions(false);
    };

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDuplicate?.(product.id);
        setShowActions(false);
    };

    const handleToggleStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        onToggleStatus?.(product.id, newStatus);
        setShowActions(false);
    };

    const handleCardClick = () => {
        onView?.(product);
    };

    return (
        <div
            className="bg-white rounded-md sm:rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group transform hover:scale-[1.02]"
            onClick={handleCardClick}
        >
            {/* Imagen del producto */}
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-md sm:rounded-t-lg overflow-hidden">
                {mainImage && !imageError ? (
                    <Image
                        src={mainImage}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                )}

                {/* Badge de estado */}
                <div className="absolute top-1 sm:top-1.5 left-1 sm:left-1.5">
                    <span className={`inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${statusColor}`}>
                        {statusLabel}
                    </span>
                </div>

                {/* Menú de acciones */}
                <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(!showActions);
                            }}
                            className="bg-white rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-xl transform hover:scale-110"
                        >
                            <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                        </button>

                        {/* Menú desplegable */}
                        {showActions && (
                            <div className="absolute bottom-full right-0 mb-1.5 sm:mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-10 min-w-[120px] sm:min-w-[140px] backdrop-blur-sm">
                                <button
                                    onClick={handleEdit}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-1.5 sm:space-x-2 transition-colors duration-200"
                                >
                                    <Edit className="w-3 h-3" />
                                    <span>Editar</span>
                                </button>

                                <button
                                    onClick={handleDuplicate}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center space-x-1.5 sm:space-x-2 transition-colors duration-200"
                                >
                                    <Copy className="w-3 h-3" />
                                    <span>Duplicar</span>
                                </button>

                                <button
                                    onClick={handleToggleStatus}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 flex items-center space-x-1.5 sm:space-x-2 transition-colors duration-200"
                                >
                                    {product.status === 'active' ? (
                                        <>
                                            <ToggleLeft className="w-3 h-3" />
                                            <span>Desactivar</span>
                                        </>
                                    ) : (
                                        <>
                                            <ToggleRight className="w-3 h-3" />
                                            <span>Activar</span>
                                        </>
                                    )}
                                </button>

                                <hr className="my-1 border-gray-100" />

                                <button
                                    onClick={handleDelete}
                                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center space-x-1.5 sm:space-x-2 transition-colors duration-200"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Eliminar</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido de la tarjeta */}
            <div className="p-1.5 sm:p-3">
                <div className="mb-1 sm:mb-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate mb-0.5">
                        {product.name}
                    </h3>
                    <p className="text-sm sm:text-base font-bold text-blue-600">
                        {formatPrice(product.price, 'ARS')}
                    </p>
                </div>

                {product.shortDescription && (
                    <div className="hidden sm:block mb-2">
                        <p className="text-xs text-gray-600 bg-blue-50 rounded-md p-1.5 border-l-2 border-blue-200 line-clamp-2">
                            {product.shortDescription}
                        </p>
                    </div>
                )}

                <div className="mb-1 sm:mb-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-full">
                        {categoryName}
                    </span>
                </div>

                {tagNames.length > 0 && (
                    <div className="hidden sm:block mb-2">
                        <div className="flex flex-wrap gap-1">
                            {tagNames.slice(0, 2).map((tagName, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-800"
                                >
                                    {tagName}
                                </span>
                            ))}
                            {tagNames.length > 2 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                    +{tagNames.length - 2} más
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
