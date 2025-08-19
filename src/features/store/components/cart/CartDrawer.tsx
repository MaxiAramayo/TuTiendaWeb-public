/**
 * Componente que maneja la visualización del carrito en diferentes dispositivos
 * 
 * En desktop muestra un modal, en mobile muestra un drawer
 * 
 * @module features/store/components/cart
 */
"use client"

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
import Cart from "./Cart";
import { useCartStore } from "@/features/store/api/cartStore";
import { formatearItemsCarrito } from "./CartUtils";
import { ShoppingBag, X } from "lucide-react";
import { formatPrice } from "@/features/dashboard/modules/products/utils/product.utils";
import { useRouter, useParams } from "next/navigation";

/**
 * Componente que renderiza el carrito de compras
 * 
 * @returns {JSX.Element | null} Componente del carrito o null si no está montado
 */
const CartDrawer = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const params = useParams();

  // Acceder al estado y acciones del carrito
  const {
    items,
    isOpen,
    total,
    closeCart,
    updateQuantity,
    removeFromCart,
    updateTopics
  } = useCartStore();

  // Obtener datos de la tienda desde algún contexto o prop global
  // Aquí deberías obtener whatsapp, name, uid, etc. según tu estructura
  // Por ejemplo:
  // const { whatsapp, name, uid } = useStoreContext();
  // Para este ejemplo, los dejo como placeholders:
  const whatsapp = "";
  const name = "";
  const uid = "";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) return null;

  const cartItems = formatearItemsCarrito(items);

  /**
   * Maneja el cambio de cantidad de un item en el carrito
   * 
   * @param {string} id - ID del item a modificar
   * @param {"increase" | "decrease"} action - Acción a realizar
   */
  const handleQuantityChange = (id: string, action: "increase" | "decrease") => {
    const item = items.find(item => item.id === id);
    if (!item) return;

    const newQuantity = action === "increase"
      ? item.cantidad + 1
      : Math.max(0, item.cantidad - 1);

    if (newQuantity === 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  // Maneja la edición de tópicos de un item en el carrito
  const handleEditTopics = (id: string, topics: any[]) => {
    updateTopics(id, topics);
  };

  // Maneja el checkout: cierra el carrito y navega a la página de checkout
  const handleCheckout = () => {
    closeCart();
    router.push(`/${params.url}/checkout`);
  };

  // Contenido del carrito
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

  // Footer con total y acciones
  const cartFooter = (
    <DialogFooter>
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between text-base font-medium">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <Button
          className="w-full h-12 text-base font-medium"
          size="lg"
          onClick={handleCheckout}
        >
          Proceder al checkout
        </Button>
        <DialogClose asChild>
          <Button variant="outline" className="w-full">Cerrar</Button>
        </DialogClose>
      </div>
    </DialogFooter>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeCart()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Carrito</DialogTitle>
            <DialogDescription>
              Visualiza y gestiona los productos de tu carrito
            </DialogDescription>
          </DialogHeader>
          {cartContent}
          {cartFooter}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} dismissible onOpenChange={(open) => !open && closeCart()}>
      <DrawerContent className="max-h-[95%]">
        <DrawerHeader>
          <DrawerTitle>Carrito</DrawerTitle>
          <DrawerDescription>
            Visualiza y gestiona los productos de tu carrito
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          {cartContent}
        </div>
        <DrawerFooter>
          <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-between text-base font-medium">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Button
              className="w-full h-12 text-base font-medium"
              size="lg"
              onClick={handleCheckout}
            >
              Proceder al checkout
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cerrar</Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;