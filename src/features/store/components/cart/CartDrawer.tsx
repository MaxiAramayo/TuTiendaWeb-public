/**
 * Componente que maneja la visualización del carrito en diferentes dispositivos
 *
 * En desktop muestra un modal, en mobile muestra un drawer
 *
 * @module features/store/components/cart
 */
"use client";

import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import Cart from "./Cart";
import { useCartStore } from "@/features/store/store/cart.store";
import { formatearItemsCarrito } from "./CartUtils";
import { formatPrice } from "@/features/products/utils/product.utils";
import { useRouter, useParams } from "next/navigation";

const CartDrawer = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const params = useParams();

  const {
    items,
    isOpen,
    total,
    closeCart,
    updateQuantity,
    removeFromCart,
    updateTopics,
  } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  const cartItems = formatearItemsCarrito(items);

  const handleQuantityChange = (id: string, action: "increase" | "decrease") => {
    const item = items.find((item) => item.id === id);
    if (!item) return;
    const newQuantity =
      action === "increase" ? item.cantidad + 1 : Math.max(0, item.cantidad - 1);
    if (newQuantity === 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleEditTopics = (id: string, topics: any[]) => {
    updateTopics(id, topics);
  };

  const handleCheckout = () => {
    closeCart();
    router.push(`/${params.url}/checkout`);
  };

  const cartContent = (
    <Cart
      items={cartItems}
      total={total}
      onQuantityChange={handleQuantityChange}
      onRemoveItem={removeFromCart}
      onCheckout={handleCheckout}
      onClose={closeCart}
      onEditTopics={handleEditTopics}
    />
  );

  const checkoutFooter = (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium text-gray-500">Total</span>
        <span className="text-lg font-bold" style={{ color: "var(--store-primary)" }}>
          {formatPrice(total)}
        </span>
      </div>
      <Button
        className="w-full h-12 text-base font-semibold text-white rounded-xl"
        size="lg"
        onClick={handleCheckout}
        style={{ backgroundColor: "var(--store-primary)" }}
      >
        Proceder al checkout
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeCart()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Tu carrito</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Revisá y ajustá los productos antes de continuar
            </DialogDescription>
          </DialogHeader>
          {cartContent}
          <DialogFooter>{checkoutFooter}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} dismissible onOpenChange={(open) => !open && closeCart()}>
      <DrawerContent className="max-h-[95%]">
        <DrawerHeader>
          <DrawerTitle className="text-lg font-semibold">Tu carrito</DrawerTitle>
          <DrawerDescription className="text-sm text-gray-500">
            Revisá y ajustá los productos antes de continuar
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 overflow-y-auto">{cartContent}</div>
        <DrawerFooter>{checkoutFooter}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;
