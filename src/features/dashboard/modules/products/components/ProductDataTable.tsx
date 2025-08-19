/**
 * Componente de tabla de datos para productos
 * 
 * Muestra productos en formato de tabla profesional sin imágenes,
 * con funcionalidades de ordenamiento, filtrado y acciones.
 * 
 * @module features/dashboard/modules/products/components
 */

"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';
import { Product } from '@/shared/types/firebase.types';
import { formatPrice } from '../utils/product.utils';
import { categoriesService } from '../api/categories.service';

/**
 * Tipos para el ordenamiento
 */
type SortField = 'name' | 'price' | 'category' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

/**
 * Props del componente ProductDataTable
 */
interface ProductDataTableProps {
  /** Lista de productos */
  products: Product[];
  /** ID de la tienda */
  storeId: string;
  /** Estado de carga */
  loading?: boolean;
  /** Función para editar producto */
  onEdit?: (product: Product) => void;
  /** Función para eliminar producto */
  onDelete?: (productId: string) => void;
  /** Función para duplicar producto */
  onDuplicate?: (productId: string) => void;
  /** Función para cambiar estado */
  onToggleStatus?: (productId: string, status: 'active' | 'inactive') => void;
  /** Función para ver producto */
  onView?: (product: Product) => void;
  /** Función para crear producto */
  onCreateProduct?: () => void;
}

/**
 * Componente de tabla de datos para productos
 */
const ProductDataTable: React.FC<ProductDataTableProps> = ({
  products,
  storeId,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onView,
  onCreateProduct
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc'
  });
  
  // Estado para nombres de categorías
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});

  /**
   * Carga los nombres de las categorías
   */
  useEffect(() => {
    const loadCategoryNames = async () => {
      if (!storeId || !products.length) return;

      const categoryIds = Array.from(new Set(products.filter(p => p.categoryId).map(p => p.categoryId)));
      if (!categoryIds.length) return;

      const names: Record<string, string> = {};
      
      await Promise.all(
        categoryIds.map(async (categoryId) => {
          try {
            const category = await categoriesService.getCategoryById(storeId, categoryId);
            if (category) {
              names[categoryId] = category.name;
            }
          } catch (error) {
            names[categoryId] = categoryId; // Fallback al ID
          }
        })
      );
      
      setCategoryNames(names);
    };

    loadCategoryNames();
  }, [storeId, products]);

  /**
   * Maneja el ordenamiento por columna
   */
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  /**
   * Productos ordenados
   */
  const sortedProducts = useMemo(() => {
    if (!products.length) return [];

    return [...products].sort((a, b) => {
      const { field, direction } = sortConfig;
      let aValue: any;
      let bValue: any;

      switch (field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;

        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'category':
          aValue = a.categoryId?.toLowerCase() || '';
          bValue = b.categoryId?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds * 1000 : 0;
          bValue = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds * 1000 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, sortConfig]);

  /**
   * Renderiza el icono de ordenamiento
   */
  const renderSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-4 h-4" /> : 
      <ArrowDown className="w-4 h-4" />;
  };

  /**
   * Renderiza el badge de estado
   */
  const renderStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-red-100 text-red-800 border-red-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      draft: 'Borrador'
    };

    return (
      <Badge 
        variant="outline" 
        className={variants[status as keyof typeof variants] || variants.draft}
      >
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="space-y-2 sm:space-y-4">
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Producto</TableHead>
                <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Precio</TableHead>
                <TableHead className="text-xs sm:text-sm hidden md:table-cell">Categoría</TableHead>
                <TableHead className="text-xs sm:text-sm">Estado</TableHead>
                <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Fecha</TableHead>
                <TableHead className="text-xs sm:text-sm text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="py-2 sm:py-4">
                    <div className="space-y-2">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-2 sm:h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-16 sm:w-20" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-2 sm:py-4">
                    <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-20 sm:w-24" />
                  </TableCell>
                  <TableCell className="py-2 sm:py-4">
                    <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-12 sm:w-16" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-2 sm:py-4">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-16 sm:w-20" />
                  </TableCell>
                  <TableCell className="py-2 sm:py-4">
                    <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-6 sm:w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Estado vacío
  if (!products.length) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <Package className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
        <h3 className="mt-2 text-sm sm:text-base font-semibold text-gray-900">No hay productos</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Comienza creando tu primer producto.
        </p>
        {onCreateProduct && (
          <div className="mt-4 sm:mt-6">
            <Button onClick={onCreateProduct} className="text-sm sm:text-base">
              Crear producto
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4">
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold text-xs sm:text-sm">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 text-xs sm:text-sm font-semibold hover:bg-transparent"
                >
                  Producto
                  {renderSortIcon('name')}
                </Button>
              </TableHead>

              <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('price')}
                  className="h-auto p-0 text-xs sm:text-sm font-semibold hover:bg-transparent"
                >
                  Precio
                  {renderSortIcon('price')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('category')}
                  className="h-auto p-0 text-xs sm:text-sm font-semibold hover:bg-transparent"
                >
                  Categoría
                  {renderSortIcon('category')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('status')}
                  className="h-auto p-0 text-xs sm:text-sm font-semibold hover:bg-transparent"
                >
                  Estado
                  {renderSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('createdAt')}
                  className="h-auto p-0 text-xs sm:text-sm font-semibold hover:bg-transparent"
                >
                  Fecha
                  {renderSortIcon('createdAt')}
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-xs sm:text-sm text-right">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.map((product) => (
              <TableRow key={product.id} className="hover:bg-gray-50/50">
                <TableCell className="py-2 sm:py-4">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900 text-xs sm:text-sm">
                      {product.name}
                    </div>
                    {product.shortDescription && (
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {product.shortDescription}
                      </div>
                    )}
                    {/* Mostrar precio en móvil */}
                    <div className="sm:hidden">
                      <div className="text-xs font-semibold text-blue-600">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                    {/* Mostrar categoría en móvil */}
                    <div className="md:hidden">
                      {product.categoryId ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {categoryNames[product.categoryId] || product.categoryId}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin categoría</span>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900 text-xs sm:text-sm">
                      {formatPrice(product.price)}
                    </div>
                    {product.costPrice && product.costPrice > 0 && (
                      <div className="text-xs text-gray-500">
                        Costo: {formatPrice(product.costPrice)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell py-2 sm:py-4">
                  {product.categoryId ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                      {categoryNames[product.categoryId] || product.categoryId}
                    </Badge>
                  ) : (
                    <span className="text-gray-400 text-xs">Sin categoría</span>
                  )}
                </TableCell>
                <TableCell className="py-2 sm:py-4">
                  {renderStatusBadge(product.status)}
                </TableCell>
                <TableCell className="hidden lg:table-cell py-2 sm:py-4">
                  <span className="text-xs text-gray-600">
                    {product.createdAt?.toDate?.() 
                      ? product.createdAt.toDate().toLocaleDateString('es-ES')
                      : (product.createdAt as any)?.seconds 
                        ? new Date((product.createdAt as any).seconds * 1000).toLocaleDateString('es-ES')
                        : 'N/A'
                    }
                  </span>
                </TableCell>
                <TableCell className="text-right py-2 sm:py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-6 w-6 sm:h-8 sm:w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 sm:w-48">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(product)} className="text-xs sm:text-sm">
                          <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(product)} className="text-xs sm:text-sm">
                          <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {onDuplicate && (
                        <DropdownMenuItem onClick={() => onDuplicate(product.id)} className="text-xs sm:text-sm">
                          <Copy className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Duplicar
                        </DropdownMenuItem>
                      )}
                      {onToggleStatus && (
                        <DropdownMenuItem 
                          onClick={() => onToggleStatus(
                            product.id, 
                            product.status === 'active' ? 'inactive' : 'active'
                          )}
                          className="text-xs sm:text-sm"
                        >
                          {product.status === 'active' ? (
                            <>
                              <EyeOff className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) {
                              onDelete(product.id);
                            }
                          }}
                          className="text-red-600 focus:text-red-600 text-xs sm:text-sm"
                        >
                          <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Información de resultados */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm text-gray-600 space-y-1 sm:space-y-0">
        <div>
          Mostrando {sortedProducts.length} producto{sortedProducts.length !== 1 ? 's' : ''}
        </div>
        <div className="text-xs sm:text-sm">
          Ordenado por {sortConfig.field === 'name' ? 'nombre' : 
    
                    sortConfig.field === 'price' ? 'precio' :
                    sortConfig.field === 'category' ? 'categoría' :
                    sortConfig.field === 'status' ? 'estado' : 'fecha de creación'} 
        ({sortConfig.direction === 'asc' ? 'ascendente' : 'descendente'})
        </div>
      </div>
    </div>
  );
};

export default ProductDataTable;