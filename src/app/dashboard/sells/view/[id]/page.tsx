/**
 * Página de Visualización de Venta - View Sell Page
 * 
 * Página dedicada para visualizar los detalles de una venta en modo solo lectura.
 * Utiliza el parámetro dinámico [id] para identificar la venta a mostrar.
 * 
 * @route /dashboard/sells/view/[id]
 */

import { SellsPageClient } from "@/features/dashboard/modules/sells/components/SellsPageClient";

interface ViewSellPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ViewSellPage({ params }: ViewSellPageProps) {
  const { id } = await params;
  return <SellsPageClient sellId={id} mode="view" />;
}

export async function generateMetadata({ params }: ViewSellPageProps) {
  const { id } = await params;
  return {
    title: `Detalle de Venta - ${id}`,
    description: "Ver detalles completos de la venta seleccionada"
  };
}
