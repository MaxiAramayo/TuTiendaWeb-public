/**
 * Componente de filtros avanzados para productos
 * 
 * Incluye búsqueda, categorías, rango de precios, ordenamiento y disponibilidad
 * Utiliza el store de Zustand para gestión de estado
 * 
 * @module features/store/components/filters
 */

"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/shared/types/store';
import { useFiltersStore, useActiveFilters } from '@/features/store/store/filters.store';
import { getUniqueCategories, getPriceRange } from '@/features/store/modules/products/utils/product-filter.utils';

interface AdvancedProductFiltersProps {
  products: Product[];
}

/**
 * Componente de filtros avanzados para productos
 */
const AdvancedProductFilters = ({ products }: AdvancedProductFiltersProps) => {
  const [categories, setCategories] = useState<string[]>(['all']);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);

  // Store de filtros
  const {
    searchTerm,
    selectedCategory,
    priceRange,
    sortBy,
    onlyAvailable,
    setSearchTerm,
    setCategory,
    setPriceRange,
    setSortBy,
    toggleAvailability,
    clearFilters,
    resetPriceRange
  } = useFiltersStore();

  // Filtros activos
  const { hasActiveFilters, activeFiltersCount } = useActiveFilters(maxPrice);

  // Extraer categorías únicas y rango de precios de los productos
  useEffect(() => {
    if (!products || !products.length) return;

    const uniqueCategories = getUniqueCategories(products);
    setCategories(['all', ...uniqueCategories]);

    const [, productMaxPrice] = getPriceRange(products);
    setMaxPrice(productMaxPrice);

    // Resetear rango de precios si es necesario
    if (priceRange[1] > productMaxPrice) {
      resetPriceRange(productMaxPrice);
    }
  }, [products, priceRange, resetPriceRange]);

  // Manejar cambio de rango de precios
  const handlePriceRangeChange = (newRange: number[]) => {
    setPriceRange([newRange[0], newRange[1]]);
  };

  // Renderizar filtros para versión escritorio
  const desktopFilters = (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 mt-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Barra de búsqueda - Ocupa ancho completo en móvil, 4 col en desktop */}
        <div className="md:col-span-12 lg:col-span-4">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400 pointer-events-none" size={18} />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-11 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-[var(--store-primary)] focus:ring-[var(--store-primary)] transition-all"
            />
          </div>
        </div>

        {/* Filtros en grilla */}
        <div className="md:col-span-12 lg:col-span-8 flex flex-wrap gap-4 items-center">
          {/* Filtro de categoría */}
          <div className="min-w-[180px] flex-1">
            <Select
              value={selectedCategory}
              onValueChange={setCategory}
            >
              <SelectTrigger className="h-11 bg-white border-gray-200 hover:border-[var(--store-primary)]/50 focus:border-[var(--store-primary)] transition-colors">
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

          {/* Ordenamiento */}
          <div className="min-w-[180px] flex-1">
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger className="h-11 bg-white border-gray-200 hover:border-[var(--store-primary)]/50 focus:border-[var(--store-primary)] transition-colors">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin ordenar</SelectItem>
                <SelectItem value="name">Nombre A-Z</SelectItem>
                <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                <SelectItem value="newest">Más recientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de rango de precios */}
          <Collapsible open={isPriceFilterOpen} onOpenChange={setIsPriceFilterOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="h-11 min-w-[180px] bg-white border-gray-200 hover:bg-gray-50 hover:border-[var(--store-primary)]">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Precio: ${priceRange[0]} - ${priceRange[1]}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="absolute z-30 mt-2 p-4 bg-white border rounded-xl shadow-xl min-w-[300px] animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Rango de precios: ${priceRange[0]} - ${priceRange[1]}
                </Label>
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={maxPrice}
                  min={0}
                  step={50}
                  className="w-full [&_[role=slider]]:bg-[var(--store-primary)] [&_[role=slider]]:border-[var(--store-primary)] [&_.bg-primary]:bg-[var(--store-primary)]"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$0</span>
                  <span>${maxPrice}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Switch de disponibilidad */}
          <div className="flex items-center space-x-2 px-2">
            <Switch
              checked={onlyAvailable}
              onCheckedChange={toggleAvailability}
              className="data-[state=checked]:bg-[var(--store-primary)]"
            />
            <Label htmlFor="availability-filter" className="text-sm font-medium text-gray-700">
              Disponibles
            </Label>
          </div>
        </div>
      </div>

      {/* Indicadores de filtros activos */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-gray-100 animation-fade-in">
          <span className="text-sm text-gray-500 font-medium">Filtros activos:</span>
          <Badge variant="secondary" className="bg-[var(--store-primary)]/10 text-[var(--store-primary)] border-[var(--store-primary)]/20 px-3 py-1">
            {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 px-3 text-xs text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );

  // Renderizar filtros para versión móvil
  const mobileFilters = (
    <div className="md:hidden mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex gap-3 items-center">
        {/* Buscador móvil */}
        <div className="relative flex-grow flex items-center">
          <Search className="absolute left-3 text-gray-400 pointer-events-none" size={18} />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-11 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-[var(--store-primary)] focus:ring-[var(--store-primary)] transition-all"
          />
        </div>

        {/* Botón para abrir panel de filtros */}
        <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative h-11 w-11 flex-shrink-0 border-[var(--store-primary)]"
              style={{
                backgroundColor: 'var(--store-secondary)',
                borderColor: 'var(--store-primary)'
              }}
            >
              <SlidersHorizontal size={18} style={{ color: 'var(--store-primary)' }} />
              {hasActiveFilters && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-[var(--store-primary)] border-none"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-6 overflow-y-auto">
              {/* Filtro de categoría */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Categoría</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={value => {
                    setCategory(value);
                  }}
                >
                  <SelectTrigger className="h-11 bg-white border-gray-200 hover:border-[var(--store-primary)]/50 focus:border-[var(--store-primary)] transition-colors">
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

              {/* Ordenamiento */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Ordenar por</Label>
                <Select
                  value={sortBy}
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="h-11 bg-white border-gray-200 hover:border-[var(--store-primary)]/50 focus:border-[var(--store-primary)] transition-colors">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin ordenar</SelectItem>
                    <SelectItem value="name">Nombre A-Z</SelectItem>
                    <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                    <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                    <SelectItem value="newest">Más recientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rango de precios */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Precio: ${priceRange[0]} - ${priceRange[1]}
                </Label>
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={maxPrice}
                  min={0}
                  step={50}
                  className="w-full [&_[role=slider]]:bg-[var(--store-primary)] [&_[role=slider]]:border-[var(--store-primary)] [&_.bg-primary]:bg-[var(--store-primary)]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$0</span>
                  <span>${maxPrice}</span>
                </div>
              </div>

              {/* Switch de disponibilidad */}
              <div className="flex items-center justify-between">
                <Label htmlFor="mobile-availability" className="text-sm font-medium">
                  Solo productos disponibles
                </Label>
                <Switch
                  checked={onlyAvailable}
                  onCheckedChange={toggleAvailability}
                  className="data-[state=checked]:bg-[var(--store-primary)]"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1 h-11 bg-white border-gray-200 hover:bg-gray-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
                <Button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 h-11 bg-[var(--store-primary)] hover:bg-[var(--store-primary)]/90 text-white"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Aplicar
                </Button>
              </div>
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

export default AdvancedProductFilters;