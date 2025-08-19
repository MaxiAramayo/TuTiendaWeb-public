import DashboardLayout from "@/features/dashboard/layouts/DashboardLayout";

/**
 * Layout de Dashboard - Route Component (Server Component)
 * 
 * Server Component que renderiza el DashboardLayout.
 * La interactividad se maneja dentro de DashboardLayout con "use client".
 * 
 * Beneficios del Server Component:
 * - Mejor SEO y performance inicial
 * - Renderizado del lado del servidor
 * - Delegación de interactividad a componentes específicos
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
