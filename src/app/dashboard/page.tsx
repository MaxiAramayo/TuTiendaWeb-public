import DashboardWelcome from '@/features/dashboard/modules/overview/components/DashboardWelcome';
import { getProducts } from "@/features/products/services/product.service";
import { calculateSalesStats } from "@/features/dashboard/modules/sells/services/sale.service";
import { getServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";

/**
 * Página principal del dashboard
 */
export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const [products, sellStats] = await Promise.all([
    session.storeId ? getProducts(session.storeId) : Promise.resolve([]),
    session.storeId ? calculateSalesStats(session.storeId) : Promise.resolve({
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      todaySales: 0,
      monthSales: 0,
    })
  ]);

  const productStats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length
  };

  return <DashboardWelcome initialStats={productStats} sellStats={sellStats} />;
}
