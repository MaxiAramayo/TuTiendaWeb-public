"use client";

import { useCartStore } from "@/features/store/api/cartStore";
import Checkout from "@/features/store/components/checkout/Checkout";
import { useRouter, useParams } from "next/navigation";
import { useStoreClient } from "@/features/store/api/storeclient";
import { useEffect } from "react";
import LoadingSpinner from "@/features/store/components/ui/LoadingSpinner";

export default function CheckoutPage() {
  console.log('🔍 [CheckoutPage] Function start');
  
  const router = useRouter();
  const params = useParams();
  const { items, total } = useCartStore();
  const { store, getStore } = useStoreClient();
  
  // Obtener el slug de la URL
  const slug = params.url as string;
  
  console.log('🔍 [CheckoutPage] Component mounted');
  console.log('🔍 [CheckoutPage] Params:', params);
  console.log('🔍 [CheckoutPage] Slug:', slug);
  console.log('🔍 [CheckoutPage] Store:', store);
  
  // Cargar datos de la tienda directamente con setTimeout
  if (slug && !store) {
    console.log('🔍 [CheckoutPage] About to load store with setTimeout');
    setTimeout(() => {
      console.log('🔍 [CheckoutPage] setTimeout triggered, loading store with slug:', slug);
      getStore(slug);
    }, 100);
  }
  
  console.log('🔍 [CheckoutPage] After store loading logic');
  
  // Mostrar loading mientras se cargan los datos de la tienda
  if (!store) {
    console.log('🔍 [CheckoutPage] Showing loading spinner');
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Cargando datos de la tienda...</span>
      </div>
    );
  }
  
  console.log('🔍 [CheckoutPage] Store loaded, rendering checkout');
  console.log('🔍 [CheckoutPage] Store structure:', {
    contactInfo: store.contactInfo,
    basicInfo: store.basicInfo,
    id: store.id
  });
  
  // Extraer datos de la tienda con la estructura correcta
  const whatsapp = store.contactInfo?.whatsapp || "";
  const name = store.basicInfo?.name || "";
  const uid = store.id || "";

  return (
    <Checkout
      carrito={items}
      total={total}
      whatsapp={whatsapp}
      Name={name}
      uid={uid}
      onBackToCart={() => router.back()} // Vuelve al carrito (Drawer)
      onBackToStore={() => router.push(`/${params.url}`)} // Vuelve a la tienda principal
    />
  );
}