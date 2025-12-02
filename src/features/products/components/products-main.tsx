"use client";

import React, { useState, useCallback, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Download, Upload, Package } from 'lucide-react';
import { Product, Category, Tag } from '@/shared/types/firebase.types';
import ProductGrid from './product-grid';
import ProductDataTable from './product-data-table';
import ProductViewToggle from './product-view-toggle';
import { toast } from 'sonner';
import { deleteProductAction, toggleProductStatusAction } from '../actions/product.actions';

interface ProductsMainProps {
    initialProducts: Product[];
    categories: Category[];
    tags: Tag[];
    storeId: string;
}

const ProductsMain: React.FC<ProductsMainProps> = ({
    initialProducts,
    categories: initialCategories,
    tags: initialTags,
    storeId
}) => {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [tags, setTags] = useState<Tag[]>(initialTags);
    const [viewType, setViewType] = useState<'grid' | 'list'>('list');
    const [searchInput, setSearchInput] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Stats calculation
    const stats = useMemo(() => ({
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        inactiveProducts: products.filter(p => p.status === 'inactive').length,
    }), [products]);

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.name.toLowerCase().includes(searchInput.toLowerCase())
        );
    }, [products, searchInput]);

    const handleCreateProduct = () => {
        router.push('/dashboard/products/new');
    };

    const handleEditProduct = (product: Product) => {
        router.push(`/dashboard/products/edit/${product.id}`);
    };


    const handleDeleteProduct = useCallback(async (productId: string) => {
        startTransition(async () => {
            const result = await deleteProductAction(productId);
            if (result.success) {
                setProducts(prev => prev.filter(p => p.id !== productId));
                toast.success('Producto eliminado exitosamente');
            } else {
                toast.error('Error al eliminar producto');
            }
        });
    }, []);

    const handleToggleStatus = useCallback(async (productId: string, newStatus: 'active' | 'inactive') => {
        startTransition(async () => {
            const result = await toggleProductStatusAction(productId, newStatus);

            if (result.success) {
                setProducts(prev => prev.map(p =>
                    p.id === productId ? { ...p, status: newStatus } : p
                ));

                toast.success(`Producto ${newStatus === 'active' ? 'activado' : 'desactivado'} exitosamente`);
                router.refresh();
            } else {
                toast.error(result.errors?._form?.[0] || 'Error al cambiar estado del producto');
            }
        });
    }, [router]);



    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
                <div className="space-y-4 sm:space-y-8">
                    {/* Header */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                            <div>
                                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-4">
                                    <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl">
                                        <Package className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-4xl font-bold text-gray-900">Productos</h1>
                                        <p className="text-gray-600 text-sm sm:text-lg">
                                            {stats.totalProducts > 0 ? `${stats.totalProducts} producto${stats.totalProducts !== 1 ? 's' : ''} en total` : 'Gestiona tu catálogo de productos'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <button
                                    onClick={handleCreateProduct}
                                    className="inline-flex items-center px-4 py-2 sm:px-8 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Plus className="w-4 h-4 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                                    <span className="hidden sm:inline">Crear Producto</span>
                                    <span className="sm:hidden">Crear</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                        <div className="bg-white p-3 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalProducts}</div>
                                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Total</div>
                                </div>
                                <div className="p-2 sm:p-3 bg-gray-100 rounded-lg sm:rounded-xl">
                                    <Package className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-3 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xl sm:text-3xl font-bold text-green-600">{stats.activeProducts}</div>
                                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Activos</div>
                                </div>
                                <div className="p-2 sm:p-3 bg-green-100 rounded-lg sm:rounded-xl">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-3 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 col-span-2 sm:col-span-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xl sm:text-3xl font-bold text-red-600">{stats.inactiveProducts}</div>
                                    <div className="text-xs sm:text-sm font-semibold text-gray-600 mt-1">Inactivos</div>
                                </div>
                                <div className="p-2 sm:p-3 bg-red-100 rounded-lg sm:rounded-xl">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* To olbar */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3  sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6">
                            <div className="flex-1 max-w-lg">
                                <div className="relative">
                                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar productos por nombre..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm bg-gray-50 focus:bg-white shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 sm:space-x-4">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl border transition-all duration-300 ${showFilters
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-md'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Filtros</span>
                                </button>

                                <ProductViewToggle
                                    currentView={viewType}
                                    onViewChange={setViewType}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grid/ Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {viewType === 'grid' ? (
                            <div className="p-6">
                                <ProductGrid
                                    products={filteredProducts}
                                    storeId={storeId}
                                    loading={isPending}
                                    onEdit={handleEditProduct}
                                    onDelete={handleDeleteProduct}
                                    onToggleStatus={handleToggleStatus}
                                    categories={categories}
                                    tags={tags}
                                />
                            </div>
                        ) : (
                            <div className="p-6">
                                <ProductDataTable
                                    products={filteredProducts}
                                    storeId={storeId}
                                    loading={isPending}
                                    onEdit={handleEditProduct}
                                    onDelete={handleDeleteProduct}
                                    onToggleStatus={handleToggleStatus}
                                    onCreateProduct={handleCreateProduct}
                                    categories={categories}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};

export default ProductsMain;
