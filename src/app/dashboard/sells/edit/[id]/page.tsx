/**
 * Página de Edición de Venta - Edit Sell Page
 * 
 * Página dedicada para editar una venta existente con URL limpia.
 * Utiliza el parámetro dinámico [id] para identificar la venta a editar.
 * 
 * @route /dashboard/sells/edit/[id]
 */

import { SellsPageClient } from "@/features/dashboard/modules/sells/components/SellsPageClient";

interface EditSellPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSellPage({ params }: EditSellPageProps) {
  const { id } = await params;
  return <SellsPageClient sellId={id} mode="edit" />;
}

export async function generateMetadata({ params }: EditSellPageProps) {
  const { id } = await params;
  return {
    title: `Editar Venta - ${id}`,
    description: "Editar información de la venta seleccionada"
  };
}
