/**
 * Página de Edición de Venta - Edit Sell Page
 * 
 * Página dedicada para editar una venta existente con URL limpia.
 * Utiliza el parámetro dinámico [id] para identificar la venta a editar.
 * 
 * @route /dashboard/sells/edit/[id]
 */

import { SellsPageClient } from "@/features/dashboard/modules/sells/components/SellsPageClient";
import { getProducts } from "@/features/products/services/product.service";
import { getServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

interface EditSellPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSellPage({ params }: EditSellPageProps) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.storeId) {
    return <SellsPageClient sellId={id} mode="edit" products={[]} />;
  }

  const products = await getProducts(session.storeId);

  return <SellsPageClient sellId={id} mode="edit" products={products} />;
}

export async function generateMetadata({ params }: EditSellPageProps) {
  const { id } = await params;
  return {
    title: `Editar Venta - ${id}`,
    description: "Editar información de la venta seleccionada"
  };
}
