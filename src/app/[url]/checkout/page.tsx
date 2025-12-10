/**
 * Página de Checkout (Server Component)
 * 
 * Obtiene datos de la tienda y configuración en el servidor
 * y pasa los datos al componente cliente de checkout
 * 
 * @module app/[url]/checkout
 */

import { getPublicStoreBySlug, getStoreSettings } from "@/features/store/services/public-store.service";
import { CheckoutContainer } from "@/features/store/components/checkout/CheckoutContainer";
import { StoreThemeProvider } from "@/features/store/components/ThemeProvider";
import ErrorNotFound from "@/features/store/ui/ErrorNotFound";
import ErrorNotAvailable from "@/features/store/ui/ErrorNotAvailable";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url } = await params;

  // Obtener datos de la tienda en el servidor
  const storeData = await getPublicStoreBySlug(url);

  // Manejar caso de tienda no encontrada
  if (!storeData) {
    return <ErrorNotFound />;
  }

  // Verificar si la tienda está activa
  if (!storeData.subscription?.active) {
    return <ErrorNotAvailable />;
  }

  // Obtener configuración de la tienda
  const settings = await getStoreSettings(storeData.id);

  // Preparar datos para el componente cliente
  // Soportar ambas estructuras: nueva (basicInfo, contactInfo) y legacy (name, whatsapp)
  const storeInfo = {
    id: storeData.id,
    name: storeData.basicInfo?.name || storeData.name || '',
    slug: storeData.basicInfo?.slug || storeData.siteName || url,
    whatsapp: storeData.contactInfo?.whatsapp || storeData.whatsapp || '',
    email: storeData.contactInfo?.email || storeData.email || '',
  };

  // Extraer datos del tema para el ThemeProvider
  // Casting a any para soportar propiedades extendidas que pueden existir en la base de datos
  const theme = storeData.theme as Record<string, unknown> | undefined;
  const themeData = {
    primaryColor: theme?.primaryColor as string | undefined,
    secondaryColor: theme?.secondaryColor as string | undefined,
    accentColor: theme?.accentColor as string | undefined,
    fontFamily: theme?.fontFamily as string | undefined,
    buttonStyle: theme?.buttonStyle as string | undefined
  };

  return (
    <StoreThemeProvider themeData={themeData}>
      <CheckoutContainer
        storeInfo={storeInfo}
        settings={settings}
      />
    </StoreThemeProvider>
  );
}
