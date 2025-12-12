/**
 * Página de Carta (Server Component)
 * 
 * Muestra la carta digital de un restaurante/tienda
 * Utiliza Server Components para óptimo rendimiento
 * 
 * @module app/carta/[url]
 */

import ErrorNotFound from "@/features/store/ui/ErrorNotFound";
import { getPublicStoreBySlug as getStoreBySlug, getPublicProducts as getStoreProducts } from "@/features/store/services/public-store.service";
import { Product } from "@/shared/types/store";
import ProductList from "@/features/store/modules/products/components/ProductList";
import ErrorNotAvailable from "@/features/store/ui/ErrorNotAvailable";
import { HeaderWelcome } from "@/features/store/components/HeaderWelcome";
import { StoreThemeProvider } from "@/features/store/components/ThemeProvider";

export default async function Carta({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url } = await params;
  
  // Obtener datos de la tienda
  const storeData = await getStoreBySlug(url);

  // Manejar caso de tienda no encontrada
  if (!storeData) {
    return <ErrorNotFound />;
  }

  // Verificar si la tienda está activa
  const isActive = storeData.subscription?.active !== false && 
                   storeData.suscripcion !== false;
  if (!isActive) {
    return <ErrorNotAvailable />;
  }

  // Obtener productos
  const storeId = storeData.id || storeData.uid || '';
  const products = await getStoreProducts(storeId);

  return (
    <StoreThemeProvider themeData={storeData.theme}>
      <div className="bg-gray-100 h-screen overflow-auto">
        <HeaderWelcome store={storeData} />
        <ProductList products={products} />
      </div>
    </StoreThemeProvider>
  );
}
