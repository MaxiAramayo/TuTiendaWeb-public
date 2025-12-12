/**
 * Página principal de la tienda (Server Component Optimizado)
 * 
 * Muestra la tienda completa de un usuario específico basado en su URL amigable
 * Utiliza Server Components para óptimo rendimiento y SEO
 * 
 * @module app/[url]
 */

import { getPublicStoreBySlug as getStoreBySlug, getPublicProducts as getStoreProducts } from "@/features/store/services/public-store.service";
import { Product } from "@/shared/types/store";
import ErrorNotFound from "@/features/store/ui/ErrorNotFound";
import ErrorNotAvailable from "@/features/store/ui/ErrorNotAvailable";
import { HeaderWelcome } from '@/features/store/components/HeaderWelcome';
import { StoreThemeProvider } from '@/features/store/components/ThemeProvider';
import ProductList from "@/features/store/modules/products/components/ProductList";

/**
 * Página principal de la tienda
 * 
 * @param params - Parámetros de la URL
 * @returns Componente React
 */


export default async function Tienda({
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

  // Obtener productos de la tienda
  const storeId = storeData.id || storeData.uid || '';
  const products = await getStoreProducts(storeId);

  return (
    <StoreThemeProvider themeData={storeData.theme}>
      <div
        className="flex flex-col min-h-screen gap-6"
        style={{
          backgroundColor: 'var(--store-secondary, #f3f4f6)',
          fontFamily: 'var(--store-font-family, Inter), system-ui, sans-serif'
        }}
      >
        <HeaderWelcome store={storeData} />
        <ProductList products={products} />
      </div>
    </StoreThemeProvider>
  );
}
