import { GenericPageSkeleton } from "@/features/dashboard/components/DashboardSkeleton";

// loading.tsx aplica a /dashboard y TODAS las sub-rutas sin loading.tsx propio.
// GenericPageSkeleton es neutro — funciona para cualquier página del panel.
export default function DashboardLoading() {
  return (
    <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
      <GenericPageSkeleton />
    </div>
  );
}
