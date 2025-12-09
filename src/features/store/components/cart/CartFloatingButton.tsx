/**
 * Componente de botón flotante para acceder al carrito
 * 
 * @module features/store/components/cart
 */

"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/store/store/cart.store";
import { formatPrice } from "@/features/products/utils/product.utils";
import { Badge } from "@/components/ui/badge";
import { useThemeClasses, useThemeStyles } from "../../hooks/useStoreTheme";

const CartFloatingButton = () => {
  const { items, total, openCart } = useCartStore();
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();

  if (!items.length) return null;

  return (
    <Button
      onClick={openCart}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-6 rounded-full ${themeClasses.button.primary.base} flex items-center gap-3 min-w-[200px] shadow-md transition-all duration-200 hover:shadow-lg`}
    >
      <div className="relative">
        <ShoppingCart className="h-5 w-5" />
        <span className="absolute -top-2 -right-2">
          <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs font-bold rounded-full bg-[var(--store-secondary)] text-white border-[var(--store-secondary)]">
            {items.length}
          </Badge>
        </span>
      </div>
      <span className="font-medium">Ver Carrito</span>
      <span className="ml-auto font-semibold text-sm">{formatPrice(total)}</span>
    </Button>
  );
};

export default CartFloatingButton;