import ErrorNotFound from "@/features/store/ui/ErrorNotFound";
import { getStore } from "@/features/store/api/fetchStore";
import { Product } from "@/shared/types/store";
import ProductList from "@/features/store/modules/products/components/ProductList";
import ErrorNotAvailable from "@/features/store/ui/ErrorNotAvailable";
import HeaderWelcome from "@/features/store/components/HeaderWelcome";

export default async function Tienda({
  params,
}: {
  params: Promise<{ url: string }>;
}) {
  const { url } = await params;
  const store = await getStore(url);

  const products = store?.products as Product[];
  if (!store) {
    return <ErrorNotFound />;
  }
  if (store.store.suscripcion == false) {
    return <ErrorNotAvailable />;
  }

  return (
    <div className="bg-gray-100 h-screen overflow-auto">
      <HeaderWelcome 
        store={store.store}
      />
      <ProductList
        products={products}
        name={store?.store.name}
        whatsapp={store?.store.whatsapp}
        menu={true}
        uid={store?.store.uid}
      />
    </div>
  );
}
