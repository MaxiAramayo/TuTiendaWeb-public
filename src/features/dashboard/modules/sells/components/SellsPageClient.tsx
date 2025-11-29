/**
 * Cliente del módulo de ventas - Optimizado para Server/Client Components
 *
 * @module features/dashboard/modules/sells/components/SellsPageClient
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/api/authStore";
import { SellForm } from "./SellForm";
import { SellsModule } from "./SellsModule";
import { Product as ProductDocument } from "@/shared/types/firebase.types";

interface SellsPageClientProps {
  /** ID de venta para mostrar/editar (opcional) */
  sellId?: string;
  /** Modo de la página */
  mode?: "list" | "new" | "edit" | "view";
  /** Productos disponibles */
  products: ProductDocument[];
}

/**
 * Wrapper del cliente para el módulo de ventas optimizado
 */
export const SellsPageClient: React.FC<SellsPageClientProps> = ({
  sellId,
  mode = "list",
  products = [],
}) => {
  const router = useRouter();
  const { user } = useAuthStore();

  // Si no hay usuario o no tiene tiendas, no renderizar nada
  if (!user?.id || !user.storeIds || user.storeIds.length === 0) {
    return <div>Cargando...</div>;
  }

  // Usar el primer storeId del usuario (tienda principal)
  const storeId = user.storeIds[0];

  // Si el modo es lista, mostrar el módulo completo
  if (mode === "list") {
    return <SellsModule initialSellId={sellId} storeId={storeId} />;
  }

  // Para formularios (new, edit, view)
  const readOnly = mode === "view";

  return (
    <div>
      <SellForm
        sellId={sellId}
        storeId={storeId}
        readOnly={readOnly}
        products={products}
        onSuccess={() => {
          // Navegar de vuelta a la lista
          router.push("/dashboard/sells");
        }}
        onCancel={() => {
          // Navegar de vuelta a la lista
          router.push("/dashboard/sells");
        }}
      />
    </div>
  );
};

export default SellsPageClient;
