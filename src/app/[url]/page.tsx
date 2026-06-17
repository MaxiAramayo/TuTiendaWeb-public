/**
 * Página principal de la tienda (Server Component Optimizado)
 * 
 * Muestra la tienda completa de un usuario específico basado en su URL amigable
 * Utiliza Server Components para óptimo rendimiento y SEO
 * 
 * @module app/[url]
 */

import type { Metadata } from "next";
import { getPublicStoreBySlug as getStoreBySlug, getPublicProducts as getStoreProducts, getStoreCategoryOrder } from "@/features/store/services/public-store.service";
import { Product } from "@/shared/types/store";
import ErrorNotFound from "@/features/store/ui/ErrorNotFound";
import ErrorNotAvailable from "@/features/store/ui/ErrorNotAvailable";
import { HeaderWelcome } from '@/features/store/components/HeaderWelcome';
import { StoreThemeProvider } from '@/features/store/components/ThemeProvider';
import { WelcomeModal } from '@/features/store/components/WelcomeModal';
import ProductList from "@/features/store/modules/products/components/ProductList";

/**
 * Metadata por tienda: el título lleva el nombre del comercio y, al compartir
 * el link, el ícono/preview usa el logo del comercio (fallback a TuTiendaWeb).
 *
 * Reutiliza el fetch cacheado de getStoreBySlug, por lo que no agrega lecturas.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ url: string }>;
}): Promise<Metadata> {
  const { url } = await params;
  const store = await getStoreBySlug(url);

  if (!store) {
    return { title: "Tienda no encontrada" };
  }

  const name = store.basicInfo?.name || "Tienda";
  const description =
    store.basicInfo?.description ||
    `Mirá el catálogo de ${name} y hacé tu pedido por WhatsApp.`;
  const logoUrl = store.theme?.logoUrl;

  return {
    title: name,
    description,
    ...(logoUrl ? { icons: { icon: logoUrl } } : {}),
    openGraph: {
      title: name,
      description,
      type: "website",
      ...(logoUrl ? { images: [{ url: logoUrl }] } : {}),
    },
  };
}

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
  const [products, { categoryOrder, subcategoryOrderByParent }] = await Promise.all([
    getStoreProducts(storeId),
    getStoreCategoryOrder(storeId),
  ]);

  return (
    <StoreThemeProvider themeData={storeData.theme} storeType={storeData.basicInfo?.type}>
      <div
        className="flex flex-col min-h-screen gap-6"
        style={{
          backgroundColor: 'var(--store-secondary, #f3f4f6)',
          fontFamily: 'var(--store-font-family, Inter), system-ui, sans-serif'
        }}
      >
        <WelcomeModal storeName={storeData.basicInfo?.name || 'la tienda'} storeId={storeId} />
        <HeaderWelcome store={storeData} />
        <ProductList products={products} categoryOrder={categoryOrder} subcategoryOrderByParent={subcategoryOrderByParent} />
      </div>
    </StoreThemeProvider>
  );
}
