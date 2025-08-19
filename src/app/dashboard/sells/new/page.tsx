/**
 * Página de Nueva Venta - New Sell Page
 * 
 * Página dedicada para crear una nueva venta con URL limpia.
 * Proporciona un formulario limpio para registrar ventas.
 * 
 * @route /dashboard/sells/new
 */

import React from "react";
import { SellsPageClient } from "@/features/dashboard/modules/sells/components/SellsPageClient";

/**
 * Página para crear una nueva venta
 */
export default function NewSellPage() {
  return <SellsPageClient mode="new" />;
}

export async function generateMetadata() {
  return {
    title: "Nueva Venta",
    description: "Crear una nueva venta en el sistema"
  };
}
