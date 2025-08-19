/**
 * Componente de filtrado por rango de fechas
 * 
 * Permite filtrar datos por un rango de fechas de inicio y fin
 * 
 * @module features/dashboard/modules/sells/components
 */

"use client";

import React, { useState } from "react";
import { DateFilterProps } from "../types/components";

/**
 * Componente para filtrar por rango de fechas
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const DateFilter: React.FC<DateFilterProps> = ({ onFilterChange }) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  /**
   * Maneja el cambio en el filtro y envía las fechas convertidas
   */
  const handleFilterChange = () => {
    onFilterChange(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
  };

  /**
   * Limpia los filtros de fecha aplicados
   */
  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    onFilterChange(null, null);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6" aria-label="Filtro de fechas">
      <div className="flex-1">
        <label 
          htmlFor="start-date" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Fecha Inicio
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#615793] focus:outline-none"
        />
      </div>
      <div className="flex-1">
        <label 
          htmlFor="end-date" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Fecha Fin
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#615793] focus:outline-none"
        />
      </div>
      <div className="flex flex-col md:flex-row justify-end md:items-end gap-2">
        <button
          onClick={handleFilterChange}
          className="w-full md:w-auto bg-[#615793] text-white px-4 py-2 rounded hover:bg-[#4a4472] transition-colors"
          aria-label="Aplicar filtro de fechas"
        >
          Filtrar
        </button>
        {(startDate || endDate) && (
          <button
            onClick={handleClearFilter}
            className="w-full md:w-auto bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            aria-label="Limpiar filtro de fechas"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
};

export default DateFilter; 