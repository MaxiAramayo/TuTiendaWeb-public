"use client";

import { DOMAIN_CONFIG, generateStoreUrl } from "@/lib/domain";
import { useState, useEffect } from "react";

interface StorePreviewProps {
  siteName: string;
  className?: string;
}

/**
 * Componente que muestra una vista previa de la URL de la tienda
 * @param siteName - Nombre del sitio
 * @param className - Clases CSS adicionales
 */
export const StorePreview = ({ siteName, className = "" }: StorePreviewProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(siteName.length >= 3);
  }, [siteName]);

  if (!isVisible) return null;

  const fullUrl = generateStoreUrl(siteName);

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-3 mt-2 ${className}`}>
      <p className="text-sm text-green-700">
        <span className="font-medium">Tu tienda estará disponible en:</span>
      </p>
      <p className="text-sm text-green-800 font-mono break-all">
        {fullUrl}
      </p>
    </div>
  );
};

export default StorePreview;
