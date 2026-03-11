import DashboardWelcome from '@/features/dashboard/modules/overview/components/DashboardWelcome';
import { getProducts } from "@/features/products/services/product.service";
import { calculateSalesStats } from "@/features/dashboard/modules/sells/services/sale.service";
import { getServerSession } from "@/lib/auth/server-session";
import { redirect } from "next/navigation";
import { findStoreIdByUserId, getStoreOnboardingState } from '@/lib/auth/store-session';

/**
 * Página principal del dashboard
 */
export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const storeId = session.storeId || await findStoreIdByUserId(session.userId);

  if (!storeId) {
    redirect('/onboarding');
  }

  const onboarding = await getStoreOnboardingState(storeId);
  if (!onboarding.completed) {
    redirect('/onboarding');
  }

  const [products, sellStats] = await Promise.all([
    storeId ? getProducts(storeId) : Promise.resolve([]),
    storeId ? calculateSalesStats(storeId) : Promise.resolve({
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
