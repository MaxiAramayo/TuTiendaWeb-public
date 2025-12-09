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
  
  // Usar las nuevas funciones optimizadas del servidor
  const storeData = await getStoreBySlug(url);

  // Manejar caso de tienda no encontrada
  if (!storeData) {
    return <ErrorNotFound />;
  }

  // Verificar si la tienda está activa
  const storeDataAny = storeData as any;
  const isActive = storeDataAny.subscription?.active !== false && 
                   storeDataAny.suscripcion !== false;
  if (!isActive) {
    return <ErrorNotAvailable />;
  }

  // Obtener productos
  const storeId = storeDataAny.id || storeDataAny.uid;
  const products = await getStoreProducts(storeId) as Product[];

  // Mapear datos para compatibilidad
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
    suscripcion: isActive,
    weeklySchedule: storeDataAny.schedule || undefined
  };

  // Datos del tema
  const themeData = {
    primaryColor: storeDataAny.theme?.primaryColor,
    secondaryColor: storeDataAny.theme?.secondaryColor,
    fontFamily: storeDataAny.theme?.fontFamily,
    buttonStyle: storeDataAny.theme?.buttonStyle
  };

  return (
    <StoreThemeProvider themeData={themeData}>
      <div className="bg-gray-100 h-screen overflow-auto">
        <HeaderWelcome store={mappedStoreData} />
        <ProductList
          products={products}
          name={mappedStoreData.name}
          whatsapp={mappedStoreData.whatsapp}
          menu={true}
          uid={mappedStoreData.uid}
        />
      </div>
    </StoreThemeProvider>
  );
}
