/**
 * Página de Visualización de Venta - View Sell Page
 * 
 * Página dedicada para visualizar los detalles de una venta en modo solo lectura.
 * Utiliza el parámetro dinámico [id] para identificar la venta a mostrar.
 * 
 * @route /dashboard/sells/view/[id]
 */

import { SellsPageClient } from "@/features/dashboard/modules/sells/components/SellsPageClient";
import { getProducts } from "@/features/products/services/product.service";
import { getServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

interface ViewSellPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ViewSellPage({ params }: ViewSellPageProps) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.storeId) {
    return <SellsPageClient sellId={id} mode="view" products={[]} />;
  }

  const products = await getProducts(session.storeId);

  return <SellsPageClient sellId={id} mode="view" products={products} />;
}

export async function generateMetadata({ params }: ViewSellPageProps) {
  const { id } = await params;
  return {
    title: `Detalle de Venta - ${id}`,
    description: "Ver detalles completos de la venta seleccionada"
  };
}
