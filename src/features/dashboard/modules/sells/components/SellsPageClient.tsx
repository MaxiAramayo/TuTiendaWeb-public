/**
 * Cliente del módulo de ventas
 *
 * Wrapper que determina qué vista mostrar (lista, nuevo, editar).
 *
 * @module features/dashboard/modules/sells/components/SellsPageClient
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SellForm } from "./SellForm";
import { SellsModule } from "./SellsModule";
import type { Product, Category } from "@/shared/types/firebase.types";
import type { Sale, SalesStats } from "../schemas/sell.schema";

// =============================================================================
// TYPES
// =============================================================================

interface SellsPageClientProps {
  storeId?: string;
  sellId?: string;
  saleId?: string;
  mode?: "list" | "new" | "edit" | "view";
  products: Product[];
  categories?: Category[];
  initialSells?: Sale[];
  initialStats?: SalesStats;
  sale?: Sale;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function SellsPageClient({
  storeId,
  sellId,
  saleId,
  mode = "list",
  products = [],
  categories = [],
  initialSells = [],
  initialStats,
  sale,
}: SellsPageClientProps) {
  const router = useRouter();
  
  // Usar sellId o saleId para compatibilidad
  const effectiveSaleId = sellId || saleId;

  if (!storeId && mode !== "view") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">No se encontró la tienda.</p>
      </div>
    );
  }

  // Modo lista
  if (mode === "list" && storeId) {
    return (
      <SellsModule 
        storeId={storeId}
        initialSells={initialSells}
        initialStats={initialStats}
      />
    );
  }

  // Modo view (solo lectura)
  if (mode === "view") {
    return (
      <SellForm
        sellId={effectiveSaleId}
        sell={sale}
        storeId={storeId || ""}
        products={products}
        readOnly={true}
        onCancel={() => router.push("/dashboard/sells")}
      />
    );
  }

  // Modos de formulario (new, edit)
  return (
    <SellForm
      sellId={effectiveSaleId}
      sell={sale}
      storeId={storeId || ""}
      products={products}
      onSuccess={() => router.push("/dashboard/sells")}
      onCancel={() => router.push("/dashboard/sells")}
    />
  );
}

export default SellsPageClient;
