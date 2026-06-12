"use client";

import React, { useState, useCallback, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Download, Upload, Package, X } from 'lucide-react';
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
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isPending, startTransition] = useTransition();

    // Categorías principales y subcategorías de la principal seleccionada
    const parentCategories = useMemo(
        () => categories.filter(c => !c.parentId),
        [categories]
    );
    const subcategoriesForSelected = useMemo(
        () => categories.filter(c => c.parentId === selectedCategory),
        [categories, selectedCategory]
    );

    // Cambiar categoría principal: resetear la subcategoría
    const handleCategoryFilterChange = (value: string) => {
        setSelectedCategory(value);
        setSelectedSubcategory('');
    };

    const clearFilters = () => {
        setSearchInput('');
        setSelectedCategory('');
        setSelectedSubcategory('');
        setStatusFilter('all');
    };

    const activeFilterCount =
        (selectedCategory ? 1 : 0) +
        (selectedSubcategory ? 1 : 0) +
        (statusFilter !== 'all' ? 1 : 0);

    // Stats calculation
    const stats = useMemo(() => ({
        totalProducts: products.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        inactiveProducts: products.filter(p => p.status === 'inactive').length,
    }), [products]);

    // Filter products (nombre + categoría + subcategoría + estado)
    const filteredProducts = useMemo(() => {
        const term = searchInput.trim().toLowerCase();
        return products.filter(product => {
            if (term && !product.name.toLowerCase().includes(term)) return false;
            if (selectedCategory && product.categoryId !== selectedCategory) return false;
            if (selectedSubcategory && product.subcategoryId !== selectedSubcategory) return false;
            if (statusFilter !== 'all' && product.status !== statusFilter) return false;
            return true;
        });
    }, [products, searchInput, selectedCategory, selectedSubcategory, statusFilter]);

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
                                    className={`inline-flex items-center px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl border transition-all duration-300 ${showFilters || activeFilterCount > 0
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-md'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    <span className="hidden sm:inline">Filtros</span>
                                    {activeFilterCount > 0 && (
                                        <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-blue-600 rounded-full">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>

                                <ProductViewToggle
                                    currentView={viewType}
                                    onViewChange={setViewType}
                                />
                            </div>
                        </div>

                        {/* Panel de filtros */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {/* Categoría */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Categoría</label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => handleCategoryFilterChange(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        >
                                            <option value="">Todas las categorías</option>
                                            {parentCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Subcategoría */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subcategoría</label>
                                        <select
                                            value={selectedSubcategory}
                                            onChange={(e) => setSelectedSubcategory(e.target.value)}
                                            disabled={!selectedCategory || subcategoriesForSelected.length === 0}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                {!selectedCategory
                                                    ? 'Elegí una categoría'
                                                    : subcategoriesForSelected.length === 0
                                                        ? 'Sin subcategorías'
                                                        : 'Todas las subcategorías'}
                                            </option>
                                            {subcategoriesForSelected.map(sub => (
                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Estado */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estado</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        >
                                            <option value="all">Todos</option>
                                            <option value="active">Activos</option>
                                            <option value="inactive">Inactivos</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-xs text-gray-500">
                                        Mostrando <span className="font-semibold text-gray-700">{filteredProducts.length}</span> de {products.length} productos
                                    </p>
                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5 mr-1" />
                                            Limpiar filtros
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
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
