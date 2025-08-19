/**
 * Layout para el módulo de ventas del dashboard
 * 
 * Proporciona la estructura base y contexto común para todas las páginas de ventas
 * 
 * @module app/dashboard/sells
 */

import React from "react";

interface SellsLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout del módulo de ventas
 * 
 * @param props - Props del layout
 * @returns Layout component
 */
export default function SellsLayout({ children }: SellsLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        {children}
      </div>
    </div>
  );
}
