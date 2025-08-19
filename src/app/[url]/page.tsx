/**
 * Página principal de la tienda (Server Component Optimizado)
 * 
 * Muestra la tienda completa de un usuario específico basado en su URL amigable
 * Utiliza Server Components para óptimo rendimiento y SEO
 * 
 * @module app/[url]
 */

import { getStoreBySlug, getStoreProducts } from "@/features/store/api/serverStore";
import { Product } from "@/shared/types/store";
import { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";
import ErrorNotFound from "@/features/store/ui/ErrorNotFound";
import ErrorNotAvailable from "@/features/store/ui/ErrorNotAvailable";
import { HeaderWelcome } from '@/features/store/components/HeaderWelcome';
import { StoreThemeProvider } from '@/features/store/components/ThemeProvider';
import ProductList from "@/features/store/modules/products/components/ProductList";
import { StoreSyncProvider } from "@/features/store/StoreSyncProvider";

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
  
  // Usar las nuevas funciones optimizadas del servidor
  const storeData = await getStoreBySlug(url);

  // Manejar caso de tienda no encontrada
  if (!storeData) {
    return <ErrorNotFound />;
  }
  
  // Verificar si la tienda está activa (compatible con ambas estructuras)
  const isActive = (storeData as any).subscription?.active !== false && 
                   (storeData as any).suscripcion !== false;
  if (!isActive) {
    return <ErrorNotAvailable />;
  }

  // Obtener productos de la tienda
  const storeId = (storeData as any).id || storeData.uid;
  const products = await getStoreProducts(storeId) as Product[];

  // Mapear datos de la nueva estructura a la estructura legacy para compatibilidad
  const storeDataAny = storeData as any;
  const mappedStoreData = {
    siteName: storeDataAny.basicInfo?.slug || storeData.siteName || "",
    name: storeDataAny.basicInfo?.name || storeData.name || "",
    descripcion: storeDataAny.basicInfo?.description || storeData.descripcion || "",
    localaddress: storeDataAny.address ? 
      `${storeDataAny.address.street}, ${storeDataAny.address.city}` : 
      storeData.localaddress || "",
    whatsapp: storeDataAny.contactInfo?.whatsapp || storeData.whatsapp || "",
    instagramlink: storeDataAny.socialLinks?.instagram || storeData.instagramlink || "",
    openinghours: storeDataAny.schedule ? 
      "Lun-Dom: Ver horarios" : 
      storeData.openinghours || "",
    urlProfile: storeDataAny.theme?.logoUrl || storeData.urlProfile || "",
    urlPortada: storeDataAny.theme?.bannerUrl || storeData.urlPortada || "",
    uid: storeId || "",
    email: storeDataAny.contactInfo?.email || storeData.email || "",
    suscripcion: storeDataAny.subscription?.active !== false && storeDataAny.suscripcion !== false,
    weeklySchedule: storeDataAny.schedule || undefined
  };

  return (
    <>
      <StoreSyncProvider store={storeData} />
      <StoreThemeProvider>
        <div className="flex flex-col bg-gray-100 min-h-screen gap-6">
          <HeaderWelcome store={mappedStoreData} />
          <ProductList
            products={products}
            name={mappedStoreData.name}
            whatsapp={mappedStoreData.whatsapp}
            menu={false}
            uid={mappedStoreData.uid}
          />
        </div>
      </StoreThemeProvider>
    </>
  );
}
