/**
 * Componente principal de checkout que integra la lista de productos y el formulario
 * 
 * @module features/store/components/checkout
 */
"use client";

import React, { useState } from "react";
import { ProductInCart } from "@/shared/types/store";
import { OrderList } from "./OrderList";
import { CheckoutForm } from "./CheckoutForm";
import { OrderTicket } from "./OrderTicket";
import { ArrowLeft } from "lucide-react";
import type { StoreSettings } from "@/features/store/types/store.types";
import { useCartStore } from "@/features/store/store/cart.store";

interface CheckoutProps {
  uid: string;
  carrito: ProductInCart[];
  total: number;
  whatsapp: string;
  Name: string;
  storeSettings?: StoreSettings;
  onBackToCart: () => void;
  onBackToStore: () => void;
}

/**
 * Componente principal de checkout que integra la lista de productos, el formulario y la navegación
 */
const Checkout = ({
  carrito,
  total,
  whatsapp,
  Name,
  uid,
  storeSettings,
  onBackToCart,
  onBackToStore,
}: CheckoutProps) => {
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const { clearCart } = useCartStore();

  const handleOrderComplete = (orderId: string, orderInfo: any) => {
    setOrderData(orderInfo);
    setOrderCompleted(true);
  };

  const handleBackToStore = () => {
    setOrderCompleted(false);
    setOrderData(null);
    // Limpiar el carrito antes de volver a la tienda
    clearCart();
    onBackToStore();
  };

  // Si el pedido está completado, mostrar el ticket
  if (orderCompleted && orderData) {
    return (
      <OrderTicket
        orderData={orderData}
        onBackToStore={handleBackToStore}
      />
    );
  }

  // Mostrar el checkout normal
  return (
    <div
      className="max-w-2xl mx-auto p-4 min-h-screen flex flex-col gap-6"
      style={{
        backgroundColor: 'var(--store-secondary, #f9fafb)',
        fontFamily: 'var(--store-font-family, Inter), system-ui, sans-serif'
      }}
    >
      <div className="flex items-center mb-2">
        <button
          onClick={onBackToCart}
          className="p-2 bg-white shadow-md rounded-xl hover:bg-gray-100 focus:bg-gray-200 transition-all duration-200 active:scale-90 outline-none border border-gray-200"
          aria-label="Volver"
          style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}
        >
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
      </div>
      <h1
        className="text-2xl font-bold text-center mb-2"
        style={{ color: 'var(--store-accent)' }}
      >
        Resumen de tu pedido
      </h1>
      <OrderList carrito={carrito} total={total} />
      <CheckoutForm
        carrito={carrito}
        total={total}
        storeId={uid}
        storeName={Name}
        whatsapp={whatsapp}
        storeSettings={storeSettings}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  );
};

export default Checkout;