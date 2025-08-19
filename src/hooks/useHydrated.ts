"use client";

import { useEffect, useState } from "react";

/**
 * Hook para detectar cuando el componente se ha hidratado en el cliente
 * Útil para evitar errores de hidratación cuando el estado inicial
 * del servidor difiere del cliente
 * 
 * @returns true si el componente ya se hidrata en el cliente
 */
export const useHydrated = (): boolean => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
};

export default useHydrated;
