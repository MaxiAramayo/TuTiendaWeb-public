/**
 * Componente para mostrar mensaje de tienda no encontrada
 * 
 * Se muestra cuando no se encuentra la tienda solicitada por el usuario
 * 
 * @module features/store/ui
 */

"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * Componente de error para tienda no encontrada
 * 
 * @returns Componente React
 */
const ErrorNotFound = () => {
  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen py-12 px-4">
      <div className="p-8 bg-white rounded-2xl flex flex-col items-center justify-center gap-6 shadow-lg max-w-md w-full">
        <Image 
          src="/images/notfound/notFound.svg" 
          width={300}
          height={300}
          className="w-full max-w-sm"
          alt="Tienda no encontrada" 
          priority
        />
        
        <h1 className="text-2xl font-semibold text-gray-800 text-center">
          No se encontró la tienda
        </h1>
        
        <p className="text-gray-600 text-center">
          La tienda que estás buscando no existe o ha sido eliminada.
        </p>
        
        <Link 
          href="/" 
          className="py-3 px-6 bg-purple-600 hover:bg-purple-700 transition-colors rounded-lg text-white font-medium shadow-md"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default ErrorNotFound; 