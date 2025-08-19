/**
 * Buscador de clientes para ventas
 * 
 * Permite buscar pedidos por nombre de cliente
 * 
 * @module features/dashboard/modules/sells/ui
 */

"use client";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Props para el componente CustomerSearch
 */
interface CustomerSearchProps {
  /** Función que se ejecuta al cambiar el término de búsqueda */
  onSearch: (searchTerm: string) => void;
}

/**
 * Componente para buscar clientes por nombre
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const CustomerSearch: React.FC<CustomerSearchProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Aplica el término de búsqueda con un pequeño retraso para evitar 
  // demasiadas actualizaciones mientras el usuario escribe
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, onSearch]);

  return (
    <div className="relative mb-4">
      <input
        type="text"
        placeholder="Buscar por nombre de cliente..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 pl-10 rounded border focus:outline-none focus:ring-2 focus:ring-[#615793]"
        aria-label="Buscar cliente"
      />
      <Search 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
        aria-hidden="true"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Limpiar búsqueda"
        >
          <span className="sr-only">Limpiar</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default CustomerSearch; 