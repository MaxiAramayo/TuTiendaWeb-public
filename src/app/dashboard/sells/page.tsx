/**
 * Página principal del dashboard de ventas - Optimizada
 * 
 * Server Component optimizado que maneja ventas con CRUD completo
 * 
 * @module app/dashboard/sells
 */

import { SellsPageClient } from "@/features/dashboard/modules/sells/components/SellsPageClient";
import { getProducts } from "@/features/products/services/product.service";
import { getServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

/**
 * Página de dashboard de ventas optimizada (Server Component)
 * 
 * Este componente se renderiza en el servidor para mejor SEO y performance inicial.
 * Incluye funcionalidades completas de CRUD para ventas.
 * 
 * @returns Componente React para la página
 */
export default async function SellsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Si no hay storeId en la sesión, redirigir o manejar error
  if (!session.storeId) {
    // Podríamos redirigir a una página de selección de tienda o mostrar un error
    // Por ahora asumimos que si está logueado tiene storeId o lo manejamos en el cliente
    return <SellsPageClient products={[]} />;
  }

  const products = await getProducts(session.storeId);

  return <SellsPageClient products={products} />;
}
