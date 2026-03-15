/**
 * Componente para filtrar y buscar ventas
 *
 * @module features/dashboard/modules/sells/components/SellsFilters
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterIcon, XIcon, SearchIcon } from "lucide-react";
import { format } from "date-fns";

import type { SellsFilterValues, SortOption } from "../schemas/sell.schema";
import {
  PAYMENT_METHODS_LABELS,
  DELIVERY_METHODS_LABELS,
} from "../schemas/sell.schema";

// =============================================================================
// TYPES
// =============================================================================

interface SellsFiltersProps {
  onFiltersChange: (filters: SellsFilterValues) => void;
  onClearFilters: () => void;
  hasActiveFilters?: boolean;
  resultsCount?: number;
}

// =============================================================================
// INITIAL VALUES
// =============================================================================

const initialFilters: SellsFilterValues = {
  customerSearch: "",
  paymentMethod: "all",
  deliveryMethod: "all",
  sortBy: "date-desc" as SortOption,
};

// =============================================================================
// COMPONENT
// =============================================================================

export function SellsFilters({
  onFiltersChange,
  onClearFilters,
  hasActiveFilters = false,
  resultsCount,
}: SellsFiltersProps) {
  const [filters, setFilters] = useState<SellsFilterValues>(initialFilters);

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
    if (key === "customerSearch") return (value as string).trim() !== "";
    if (key === "startDate" || key === "endDate") return value !== undefined;
    if (key === "paymentMethod" || key === "deliveryMethod") return value !== "all";
    if (key === "sortBy") return value !== "date-desc";
    return false;
  }).length;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FilterIcon className="h-4 w-4" />
            Filtros
          </CardTitle>
          <div className="flex items-center gap-2">
            {resultsCount !== undefined && (
              <Badge variant="outline" className="text-xs">
                {resultsCount} {resultsCount === 1 ? "resultado" : "resultados"}
              </Badge>
            )}
            {activeFiltersCount > 0 && (
              <Badge className="text-xs">
                {activeFiltersCount} activo{activeFiltersCount !== 1 && "s"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Búsqueda por cliente */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Cliente
          </label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={filters.customerSearch}
              onChange={(e) => handleFilterChange("customerSearch", e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {filters.customerSearch && (
              <button
                type="button"
                onClick={() => handleFilterChange("customerSearch", "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fecha inicio
            </label>
            <DatePicker
              value={filters.startDate}
              onChange={(date) => handleFilterChange("startDate", date)}
              placeholder="Seleccionar fecha"
              disabled={(date) =>
                date > new Date() ||
                (filters.endDate !== undefined && date > filters.endDate)
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fecha fin
            </label>
            <DatePicker
              value={filters.endDate}
              onChange={(date) => handleFilterChange("endDate", date)}
              placeholder="Seleccionar fecha"
              disabled={(date) =>
                date > new Date() ||
                (filters.startDate !== undefined && date < filters.startDate)
              }
            />
          </div>
        </div>

        {/* Métodos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Método de pago
            </label>
            <Select
              value={filters.paymentMethod}
              onValueChange={(v) => handleFilterChange("paymentMethod", v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(PAYMENT_METHODS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Método de entrega
            </label>
            <Select
              value={filters.deliveryMethod}
              onValueChange={(v) => handleFilterChange("deliveryMethod", v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(DELIVERY_METHODS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key.toLowerCase()}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ordenamiento + limpiar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Ordenar por
            </label>
            <Select
              value={filters.sortBy}
              onValueChange={(v: SortOption) => handleFilterChange("sortBy", v)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Más reciente primero</SelectItem>
                <SelectItem value="date-asc">Más antigua primero</SelectItem>
                <SelectItem value="customer-asc">Cliente (A–Z)</SelectItem>
                <SelectItem value="total-desc">Mayor total primero</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters && activeFiltersCount === 0}
            className="h-9 text-muted-foreground hover:text-foreground gap-1.5 shrink-0"
          >
            <XIcon className="h-3.5 w-3.5" />
            Limpiar filtros
          </Button>
        </div>

        {/* Tags activos */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1 border-t">
            {filters.customerSearch && (
              <Badge variant="secondary" className="gap-1 text-xs font-normal">
                {filters.customerSearch}
                <XIcon
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("customerSearch", "")}
                />
              </Badge>
            )}
            {filters.startDate && (
              <Badge variant="secondary" className="gap-1 text-xs font-normal">
                Desde {format(filters.startDate, "dd/MM/yy")}
                <XIcon
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("startDate", undefined)}
                />
              </Badge>
            )}
            {filters.endDate && (
              <Badge variant="secondary" className="gap-1 text-xs font-normal">
                Hasta {format(filters.endDate, "dd/MM/yy")}
                <XIcon
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("endDate", undefined)}
                />
              </Badge>
            )}
            {filters.paymentMethod !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs font-normal">
                {PAYMENT_METHODS_LABELS[filters.paymentMethod] ?? filters.paymentMethod}
                <XIcon
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("paymentMethod", "all")}
                />
              </Badge>
            )}
            {filters.deliveryMethod !== "all" && (
              <Badge variant="secondary" className="gap-1 text-xs font-normal">
                {DELIVERY_METHODS_LABELS[filters.deliveryMethod] ?? filters.deliveryMethod}
                <XIcon
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange("deliveryMethod", "all")}
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
