"use client";

import React, { useState, useMemo } from 'react';
import {
    MoreVertical,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    Package,
    X,
    Tag as TagIcon,
} from 'lucide-react';
import { Product, Category, Tag } from '@/shared/types/firebase.types';
import {
    formatPrice,
    getProductStatusLabel,
    getProductStatusColor,
    getProductMainImage,
} from '../utils/product.utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ImageWithLoader } from '@/features/store/components/ui/ImageWithLoader';
import { ImageGallery } from '@/components/ui/image-gallery';

interface ProductCardProps {
    product: Product;
    storeId: string;
    onEdit?: (product: Product) => void;
    onDelete?: (productId: string) => void;
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
    onToggleStatus,
    onView,
    categories,
    tags
}) => {
    const [showActions, setShowActions] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    const isDesktop = useMediaQuery('(min-width: 768px)');

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
        setShowActions(false);
        setShowDetail(false);
        onEdit?.(product);
    };

    const handleDeleteRequest = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowActions(false);
        setShowDeleteDialog(true);
    };

    const handleDeleteConfirm = () => {
        onDelete?.(product.id);
        setShowDeleteDialog(false);
        setShowDetail(false);
    };

    const handleToggleStatus = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        onToggleStatus?.(product.id, newStatus);
        setShowActions(false);
    };

    const handleToggleStatusFromDetail = () => {
        const newStatus = product.status === 'active' ? 'inactive' : 'active';
        onToggleStatus?.(product.id, newStatus);
        setShowDetail(false);
    };

    const handleCardClick = () => {
        setShowDetail(true);
    };

    /* ------------------------------------------------------------------ */
    /* Product detail content (shared between Dialog and Drawer)           */
    /* ------------------------------------------------------------------ */
    const allImages = product.imageUrls ?? (mainImage ? [mainImage] : []);

    const detailContent = (
        <div className="space-y-4">
            {/* Galería de imágenes */}
            <div className="relative">
                <ImageGallery
                    images={allImages}
                    alt={product.name}
                    aspectRatio="aspect-video"
                    fallback={<Package className="w-12 h-12 text-gray-300" />}
                />
                {/* Badge estado flotante sobre la galería */}
                <div className="absolute top-2 left-2 z-40">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm ${statusColor}`}>
                        {statusLabel}
                    </span>
                </div>
            </div>

            {/* Nombre y precios */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                    <p className="text-xl font-bold text-blue-600 mt-0.5">
                        {formatPrice(product.price, 'ARS')}
                    </p>
                    {product.costPrice != null && (
                        <p className="text-xs text-gray-500 mt-0.5">
                            Costo: {formatPrice(product.costPrice, 'ARS')}
                        </p>
                    )}
                </div>
                {product.stockQuantity != null && (
                    <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className={`text-sm font-bold ${product.stockQuantity === 0 ? 'text-red-600' : product.stockQuantity <= (product.lowStockThreshold ?? 5) ? 'text-amber-600' : 'text-green-600'}`}>
                            {product.stockQuantity} ud.
                        </p>
                    </div>
                )}
            </div>

            {/* Categoría y etiquetas */}
            <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {categoryName}
                </Badge>
                {tagNames.map((name, i) => (
                    <Badge key={i} variant="outline" className="text-green-700 border-green-200 bg-green-50">
                        <TagIcon className="w-3 h-3 mr-1" />
                        {name}
                    </Badge>
                ))}
            </div>

            {/* Descripción */}
            {product.description && (
                <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Descripción</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
                </div>
            )}

            {/* Variantes / Extras */}
            {product.variants && product.variants.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variantes / Extras</p>
                    <div className="space-y-1.5">
                        {product.variants.map((variant) => (
                            <div
                                key={variant.id}
                                className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm"
                            >
                                <span className="text-gray-700">{variant.name}</span>
                                <span className="font-semibold text-blue-600">{formatPrice(variant.price, 'ARS')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const detailActions = (
        <div className="flex gap-2 pt-2">
            <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleToggleStatusFromDetail}
            >
                {product.status === 'active' ? (
                    <><ToggleLeft className="w-4 h-4" />Desactivar</>
                ) : (
                    <><ToggleRight className="w-4 h-4" />Activar</>
                )}
            </Button>
            <Button
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleEdit}
            >
                <Edit className="w-4 h-4" />
                Editar
            </Button>
        </div>
    );

    return (
        <>
            {/* Card */}
            <div
                className="bg-white rounded-md sm:rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group transform hover:scale-[1.02]"
                onClick={handleCardClick}
            >
                {/* Imagen */}
                <div className="relative aspect-square rounded-t-md sm:rounded-t-lg overflow-hidden bg-gray-100">
                    {mainImage ? (
                        <ImageWithLoader
                            src={mainImage}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            containerClassName="w-full h-full"
                            loaderSize="sm"
                            useSkeletonBg
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                        </div>
                    )}

                    {/* Badge estado */}
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

                            {showActions && (
                                <div className="absolute bottom-full right-0 mb-1.5 sm:mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 py-1 z-10 min-w-[120px] sm:min-w-[140px]">
                                    <button
                                        onClick={handleEdit}
                                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center space-x-1.5 sm:space-x-2 transition-colors"
                                    >
                                        <Edit className="w-3 h-3" />
                                        <span>Editar</span>
                                    </button>
                                    <button
                                        onClick={handleToggleStatus}
                                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 flex items-center space-x-1.5 sm:space-x-2 transition-colors"
                                    >
                                        {product.status === 'active' ? (
                                            <><ToggleLeft className="w-3 h-3" /><span>Desactivar</span></>
                                        ) : (
                                            <><ToggleRight className="w-3 h-3" /><span>Activar</span></>
                                        )}
                                    </button>
                                    <hr className="my-1 border-gray-100" />
                                    <button
                                        onClick={handleDeleteRequest}
                                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center space-x-1.5 sm:space-x-2 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contenido */}
                <div className="p-1.5 sm:p-3">
                    <div className="mb-1 sm:mb-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate mb-0.5">
                            {product.name}
                        </h3>
                        <p className="text-sm sm:text-base font-bold text-blue-600">
                            {formatPrice(product.price, 'ARS')}
                        </p>
                    </div>

                    {product.description && (
                        <div className="hidden sm:block mb-2">
                            <p className="text-xs text-gray-600 bg-blue-50 rounded-md p-1.5 border-l-2 border-blue-200 line-clamp-2">
                                {product.description.length > 70
                                    ? `${product.description.substring(0, 70)}...`
                                    : product.description}
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

            {/* ── Delete confirmation ────────────────────────────────────────── */}
            <AlertDialog open={showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El producto <strong>{product.name}</strong> será eliminado permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Product detail modal/drawer ───────────────────────────────── */}
            {isDesktop ? (
                <Dialog open={showDetail} onOpenChange={(open) => !open && setShowDetail(false)}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">{product.name}</DialogTitle>
                        </DialogHeader>
                        {detailContent}
                        {detailActions}
                    </DialogContent>
                </Dialog>
            ) : (
                <Drawer open={showDetail} onOpenChange={(open) => !open && setShowDetail(false)}>
                    <DrawerContent className="max-h-[90vh] flex flex-col">
                        <DrawerHeader className="flex-shrink-0 text-left">
                            <DrawerTitle>{product.name}</DrawerTitle>
                        </DrawerHeader>
                        <div className="flex-1 overflow-y-auto px-4 pb-2">
                            {detailContent}
                        </div>
                        <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t bg-white">
                            {detailActions}
                        </div>
                    </DrawerContent>
                </Drawer>
            )}
        </>
    );
};

export default ProductCard;
