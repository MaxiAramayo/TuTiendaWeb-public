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
  
  // Usar las nuevas funciones optimizadas del servidor
  const storeData = await getStoreBySlug(url);

  // Manejar caso de tienda no encontrada
  if (!storeData) {
    return <ErrorNotFound />;
  }
  
  // Verificar si la tienda está activa (compatible con ambas estructuras)
  const storeDataAny = storeData as any;
  const isActive = storeDataAny.subscription?.active !== false && 
                   storeDataAny.suscripcion !== false;
  if (!isActive) {
    return <ErrorNotAvailable />;
  }

  // Obtener productos de la tienda
  const storeId = storeDataAny.id || storeDataAny.uid;
  const products = await getStoreProducts(storeId) as Product[];

  // Mapear datos de la nueva estructura a la estructura legacy para compatibilidad
  const mappedStoreData = {
    siteName: storeDataAny.basicInfo?.slug || storeDataAny.siteName || "",
    name: storeDataAny.basicInfo?.name || storeDataAny.name || "",
    descripcion: storeDataAny.basicInfo?.description || storeDataAny.descripcion || "",
    localaddress: storeDataAny.address ? 
      `${storeDataAny.address.street}, ${storeDataAny.address.city}` : 
      storeDataAny.localaddress || "",
    whatsapp: storeDataAny.contactInfo?.whatsapp || storeDataAny.whatsapp || "",
    instagramlink: storeDataAny.socialLinks?.instagram || storeDataAny.instagramlink || "",
    openinghours: storeDataAny.schedule ? 
      "Lun-Dom: Ver horarios" : 
      storeDataAny.openinghours || "",
    urlProfile: storeDataAny.theme?.logoUrl || storeDataAny.urlProfile || "",
    urlPortada: storeDataAny.theme?.bannerUrl || storeDataAny.urlPortada || "",
    uid: storeId || "",
    email: storeDataAny.contactInfo?.email || storeDataAny.email || "",
    suscripcion: storeDataAny.subscription?.active !== false && storeDataAny.suscripcion !== false,
    weeklySchedule: storeDataAny.schedule || undefined
  };

  // Extraer datos del tema para el ThemeProvider
  const themeData = {
    primaryColor: storeDataAny.theme?.primaryColor,
    secondaryColor: storeDataAny.theme?.secondaryColor,
    fontFamily: storeDataAny.theme?.fontFamily,
    buttonStyle: storeDataAny.theme?.buttonStyle
  };

  return (
    <StoreThemeProvider themeData={themeData}>
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
  );
}
