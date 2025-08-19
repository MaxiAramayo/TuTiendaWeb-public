"use client";

import { useState, useEffect } from "react";

/**
 * Hook personalizado para detectar media queries
 * 
 * @param query - Media query a detectar
 * @returns Booleano que indica si la media query coincide
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verificar si estamos en el navegador
    if (typeof window !== "undefined") {
      const media = window.matchMedia(query);
      
      // Actualizar el estado inicial
      setMatches(media.matches);

      // Crear un manejador para los cambios en la media query
      const handleChange = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Agregar el listener
      media.addEventListener("change", handleChange);

      // Limpiar el listener al desmontar
      return () => {
        media.removeEventListener("change", handleChange);
      };
    }
    
    // Si no estamos en el navegador, devolvemos false
    return undefined;
  }, [query]);

  return matches;
} 