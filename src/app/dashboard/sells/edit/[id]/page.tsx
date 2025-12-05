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
import { getCategories } from "@/features/products/services/category.service";
import { getSaleById } from "@/features/dashboard/modules/sells/services/sale.service";
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
    return <SellsPageClient storeId="" saleId={id} mode="edit" products={[]} />;
  }

  // Cargar datos en paralelo
  const [products, categories, sale] = await Promise.all([
    getProducts(session.storeId),
    getCategories(session.storeId),
    getSaleById(session.storeId, id),
  ]);

  return (
    <SellsPageClient 
      storeId={session.storeId}
      saleId={id} 
      mode="edit" 
      products={products}
      categories={categories}
      sale={sale || undefined}
    />
  );
}

export async function generateMetadata({ params }: EditSellPageProps) {
  const { id } = await params;
  return {
    title: `Editar Venta - ${id}`,
    description: "Editar información de la venta seleccionada"
  };
}
