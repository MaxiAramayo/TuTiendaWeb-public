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
import { getCategories } from "@/features/products/services/category.service";
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
    return <SellsPageClient storeId="" mode="new" products={[]} />;
  }

  // Cargar productos y categorías en paralelo
  const [products, categories] = await Promise.all([
    getProducts(session.storeId),
    getCategories(session.storeId),
  ]);

  return (
    <SellsPageClient 
      storeId={session.storeId} 
      mode="new" 
      products={products}
      categories={categories}
    />
  );
}

export async function generateMetadata() {
  return {
    title: "Nueva Venta",
    description: "Crear una nueva venta en el sistema"
  };
}
