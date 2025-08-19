/**
 * Componente de filtros para productos
 * 
 * Permite buscar, filtrar por categoría y ordenar productos
 * 
 * @module features/store/modules/products/components
 */

"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Product } from '@/shared/types/store';

interface ProductFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  sortByPrice: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  products: Product[];
}

/**
 * Componente de filtros para productos
 */
const ProductFilters = ({
  searchTerm,
  selectedCategory,
  sortByPrice,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  products
}: ProductFiltersProps) => {
  const [categories, setCategories] = useState<string[]>(['all']);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extraer categorías únicas de los productos
  useEffect(() => {
    if (!products || !products.length) return;

    const uniqueCategories = Array.from(
      new Set(products.map(product => product.category || 'Sin categoría'))
    ).filter(category => category !== '') as string[];

    setCategories(['all', ...uniqueCategories]);
  }, [products]);

  // Renderizar filtros para versión escritorio
  const desktopFilters = (
    <div className="flex flex-col md:flex-row gap-4 mb-8 mt-6">
      {/* Buscador */}
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtro de categoría */}
      <div className="w-full md:w-48">
        <Select
          value={selectedCategory}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'Todas las categorías' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ordenamiento por precio */}
      <div className="w-full md:w-48">
        <Select
          value={sortByPrice}
          onValueChange={onSortChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin ordenar</SelectItem>
            <SelectItem value="asc">Precio: menor a mayor</SelectItem>
            <SelectItem value="desc">Precio: mayor a menor</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Renderizar filtros para versión móvil
  const mobileFilters = (
    <div className="md:hidden mb-4">
      <div className="flex gap-2">
        {/* Buscador móvil */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Botón para abrir panel de filtros */}
        <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Filtros">
              <SlidersHorizontal size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="py-4 flex flex-col space-y-4">
              {/* Filtro de categoría */}
              <div>
                <label className="text-sm font-medium mb-1 block">Categoría</label>
                <Select
                  value={selectedCategory}
                  onValueChange={value => {
                    onCategoryChange(value);
                    setIsMobileFilterOpen(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'Todas las categorías' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ordenamiento por precio */}
              <div>
                <label className="text-sm font-medium mb-1 block">Ordenar por</label>
                <Select
                  value={sortByPrice}
                  onValueChange={value => {
                    onSortChange(value);
                    setIsMobileFilterOpen(false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin ordenar</SelectItem>
                    <SelectItem value="asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="desc">Precio: mayor a menor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botón para aplicar filtros */}
              <Button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="mt-auto"
              >
                <Filter className="mr-2 h-4 w-4" />
                Aplicar filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );

  return (
    <>
      {/* Renderizado condicional según dispositivo */}
      <div className="hidden md:block">
        {desktopFilters}
      </div>
      {mobileFilters}
    </>
  );
};

export default ProductFilters; 