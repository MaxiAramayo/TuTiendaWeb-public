import DashboardWelcome from '@/features/dashboard/modules/overview/components/DashboardWelcome';
import { getProducts } from "@/features/products/services/product.service";
import { getServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

/**
 * Página principal del dashboard
 */
export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const products = session.storeId ? await getProducts(session.storeId) : [];

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length
  };

  return <DashboardWelcome initialStats={stats} />;
}
