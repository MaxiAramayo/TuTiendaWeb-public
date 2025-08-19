/**
 * Página principal del dashboard de ventas - Optimizada
 * 
 * Server Component optimizado que maneja ventas con CRUD completo
 * 
 * @module app/dashboard/sells
 */

import { SellsPageClient } from "@/features/dashboard/modules/sells/components/SellsPageClient";

/**
 * Página de dashboard de ventas optimizada (Server Component)
 * 
 * Este componente se renderiza en el servidor para mejor SEO y performance inicial.
 * Incluye funcionalidades completas de CRUD para ventas.
 * 
 * @returns Componente React para la página
 */
export default function SellsPage() {
  return <SellsPageClient />;
}
