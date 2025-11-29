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
import { getProducts } from "@/features/products/services/product.service";
import { getServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

/**
 * Página para crear una nueva venta
 */
export default async function NewSellPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.storeId) {
    return <SellsPageClient mode="new" products={[]} />;
  }

  const products = await getProducts(session.storeId);

  return <SellsPageClient mode="new" products={products} />;
}

export async function generateMetadata() {
  return {
    title: "Nueva Venta",
    description: "Crear una nueva venta en el sistema"
  };
}
