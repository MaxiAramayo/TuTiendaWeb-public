/**
 * Componente para filtrar y buscar ventas
 * 
 * Proporciona controles de filtrado con opciones específicas para el módulo de ventas.
 * 
 * @module features/dashboard/modules/sells/components/SellsFilters
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, FilterIcon, XIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import type { SellsFilterValues, SortOption } from "../schemas/sell.schema";
import { 
  PAYMENT_METHODS_LABELS, 
  DELIVERY_METHODS_LABELS 
} from "../schemas/sell.schema";

// =============================================================================
// TYPES
// =============================================================================

interface SellsFiltersProps {
  /** Función callback cuando se aplican filtros */
  onFiltersChange: (filters: SellsFilterValues) => void;
  /** Función callback cuando se limpia la búsqueda */
  onClearFilters: () => void;
  /** Indica si hay filtros activos */
  hasActiveFilters?: boolean;
  /** Total de resultados encontrados */
  resultsCount?: number;
}

// =============================================================================
// INITIAL VALUES
// =============================================================================

const initialFilters: SellsFilterValues = {
  customerSearch: '',
  paymentMethod: 'all',
  deliveryMethod: 'all',
  sortBy: 'date-desc' as SortOption,
};

// =============================================================================
// COMPONENT
// =============================================================================

export function SellsFilters({
  onFiltersChange,
  onClearFilters,
  hasActiveFilters = false,
  resultsCount
}: SellsFiltersProps) {
  const [filters, setFilters] = useState<SellsFilterValues>(initialFilters);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  const handleFilterChange = (key: keyof SellsFilterValues, value: unknown) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    onClearFilters();
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'customerSearch') return (value as string).trim() !== '';
    if (key === 'startDate' || key === 'endDate') return value !== undefined;
    if (key === 'paymentMethod' || key === 'deliveryMethod') return value !== 'all';
    if (key === 'sortBy') return value !== 'date-desc';
    return false;
  }).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filtros de Ventas
          </CardTitle>
          <div className="flex items-center gap-2">
            {resultsCount !== undefined && (
              <Badge variant="outline">
                {resultsCount} {resultsCount === 1 ? 'resultado' : 'resultados'}
              </Badge>
            )}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Búsqueda por cliente */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Buscar por cliente</label>
          <Input
            type="text"
            placeholder="Nombre del cliente..."
            value={filters.customerSearch}
            onChange={(e) => handleFilterChange('customerSearch', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Filtros en una grilla */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fecha de inicio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Desde</label>
            <Popover 
              open={showDatePicker === 'start'} 
              onOpenChange={(open: boolean) => setShowDatePicker(open ? 'start' : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate ? (
                    format(filters.startDate, "dd 'de' MMMM", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={(date: Date | undefined) => {
                    handleFilterChange('startDate', date);
                    setShowDatePicker(null);
                  }}
                  disabled={(date: Date) => {
                    if (date > new Date() || date < new Date("1900-01-01")) {
                      return true;
                    }
                    return false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Fecha de fin */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Hasta</label>
            <Popover 
              open={showDatePicker === 'end'} 
              onOpenChange={(open: boolean) => setShowDatePicker(open ? 'end' : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate ? (
                    format(filters.endDate, "dd 'de' MMMM", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date: Date | undefined) => {
                    handleFilterChange('endDate', date);
                    setShowDatePicker(null);
                  }}
                  disabled={(date: Date) => {
                    if (date > new Date() || date < new Date("1900-01-01")) {
                      return true;
                    }
                    if (filters.startDate && date < filters.startDate) {
                      return true;
                    }
                    return false;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Método de Pago</label>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) => handleFilterChange('paymentMethod', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los métodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                {Object.entries(PAYMENT_METHODS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Método de entrega */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Método de Entrega</label>
            <Select
              value={filters.deliveryMethod}
              onValueChange={(value) => handleFilterChange('deliveryMethod', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los métodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                {Object.entries(DELIVERY_METHODS_LABELS).map(([key, value]) => (
                  <SelectItem key={key} value={key.toLowerCase()}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ordenamiento */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ordenar por</label>
          <Select
            value={filters.sortBy}
            onValueChange={(value: SortOption) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Fecha (más reciente)</SelectItem>
              <SelectItem value="date-asc">Fecha (más antigua)</SelectItem>
              <SelectItem value="customer-asc">Cliente (A-Z)</SelectItem>
              <SelectItem value="total-desc">Total (mayor a menor)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters && activeFiltersCount === 0}
            className="flex items-center gap-2"
          >
            <XIcon className="h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>

        {/* Tags de filtros activos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.customerSearch && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Cliente: {filters.customerSearch}
                <XIcon 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('customerSearch', '')}
                />
              </Badge>
            )}
            
            {filters.startDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Desde: {format(filters.startDate, "dd/MM/yyyy")}
                <XIcon 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('startDate', undefined)}
                />
              </Badge>
            )}
            
            {filters.endDate && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Hasta: {format(filters.endDate, "dd/MM/yyyy")}
                <XIcon 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('endDate', undefined)}
                />
              </Badge>
            )}
            
            {filters.paymentMethod !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Pago: {filters.paymentMethod}
                <XIcon 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('paymentMethod', 'all')}
                />
              </Badge>
            )}
            
            {filters.deliveryMethod !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Entrega: {filters.deliveryMethod}
                <XIcon 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('deliveryMethod', 'all')}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SellsFilters;
