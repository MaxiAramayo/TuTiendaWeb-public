/**
 * Página principal del dashboard de ventas - Optimizada
 * 
 * Server Component que carga datos iniciales y los pasa al Client Component.
 * Sigue el patrón Server Actions First de Next.js 15.
 * 
 * @module app/dashboard/sells
 */

import { SellsPageClient } from "@/features/dashboard/modules/sells/components/SellsPageClient";
import { getProducts } from "@/features/products/services/product.service";
import { getSales, calculateSalesStats } from "@/features/dashboard/modules/sells/services/sale.service";
import { getServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

/**
 * Página de dashboard de ventas optimizada (Server Component)
 * 
 * Este componente se renderiza en el servidor para mejor SEO y performance inicial.
 * Carga ventas y productos inicialmente y los pasa al Client Component.
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
    return <SellsPageClient storeId="" products={[]} initialSells={[]} initialStats={undefined} />;
  }

  // Cargar datos en paralelo
  const [products, sells, stats] = await Promise.all([
    getProducts(session.storeId),
    getSales(session.storeId, { limit: 50 }),
    calculateSalesStats(session.storeId),
  ]);

  return (
    <SellsPageClient 
      storeId={session.storeId}
      products={products} 
      initialSells={sells}
      initialStats={stats}
    />
  );
}
