/**
 * Componente para mostrar mensaje de tienda no disponible
 * 
 * Se muestra cuando la tienda existe pero no está activa o disponible
 * 
 * @module features/store/ui
 */

"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * Componente de error para tienda no disponible
 * 
 * @returns Componente React
 */
const ErrorNotAvailable = () => {
  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen py-12 px-4">
      <div className="p-8 bg-white rounded-2xl flex flex-col items-center justify-center gap-6 shadow-lg max-w-md w-full">
        <Image 
          src="/images/notAvalible/notAvalible.svg" 
          width={300}
          height={300}
          className="w-full max-w-sm"
          alt="Tienda no disponible" 
          priority
        />
        
        <h1 className="text-2xl font-semibold text-gray-800 text-center">
          Tienda temporalmente no disponible
        </h1>
        
        <p className="text-gray-600 text-center">
          Esta tienda no está disponible en este momento. Por favor, intenta más tarde o contacta con el administrador.
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

export default ErrorNotAvailable; 