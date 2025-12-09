/**
 * Contenedor de Checkout (Client Component)
 * 
 * Maneja el estado del carrito (cliente) y renderiza el checkout
 * Recibe datos de la tienda desde el Server Component padre
 * 
 * @module features/store/components/checkout
 */
"use client";

import { useRouter, useParams } from "next/navigation";
import { useCartStore } from "@/features/store/store/cart.store";
import Checkout from "./Checkout";
import type { StoreSettings } from "@/features/store/types/store.types";

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  whatsapp: string;
  email: string;
}

interface CheckoutContainerProps {
  storeInfo: StoreInfo;
  settings: StoreSettings;
}

/**
 * Contenedor del checkout que conecta el estado del carrito (cliente)
 * con los datos de la tienda (servidor)
 */
export function CheckoutContainer({ storeInfo, settings }: CheckoutContainerProps) {
  const router = useRouter();
  const params = useParams();
  const { items, total } = useCartStore();

  // Si no hay items en el carrito, redirigir a la tienda
  if (items.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen gap-4 p-4">
        <p className="text-gray-600 text-center">
          Tu carrito está vacío. Agrega productos para continuar con la compra.
        </p>
        <button
          onClick={() => router.push(`/${params.url}`)}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  return (
    <Checkout
      carrito={items}
      total={total}
      whatsapp={storeInfo.whatsapp}
      Name={storeInfo.name}
      uid={storeInfo.id}
      storeSettings={settings}
      onBackToCart={() => router.back()}
      onBackToStore={() => router.push(`/${params.url}`)}
    />
  );
}
