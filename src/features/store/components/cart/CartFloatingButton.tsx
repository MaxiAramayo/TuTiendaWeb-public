/**
 * Componente de botón flotante para acceder al carrito
 *
 * @module features/store/components/cart
 */

"use client";

import { ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/features/store/store/cart.store";
import { formatPrice } from "@/features/products/utils/product.utils";
import { useThemeClasses } from "../../hooks/useStoreTheme";

const CartFloatingButton = () => {
  const { items, total, openCart } = useCartStore();
  const themeClasses = useThemeClasses();

  // Total de unidades (no productos únicos)
  const totalUnits = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    // Wrapper fijo centrado — separado del motion.div para evitar conflicto de transforms
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center pointer-events-none">
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="pointer-events-auto"
          >
            <Button
              onClick={openCart}
              className={`px-5 py-5 rounded-full ${themeClasses.button.primary.base} flex items-center gap-3 min-w-[200px] shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95`}
            >
              {/* Ícono con badge de unidades totales */}
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span
                  className="absolute -top-2.5 -right-2.5 h-5 w-5 flex items-center justify-center text-[11px] font-bold rounded-full bg-white border-2"
                  style={{ color: "var(--store-primary)", borderColor: "var(--store-primary)" }}
                >
                  {totalUnits > 99 ? "99+" : totalUnits}
                </span>
              </div>

              <span className="font-semibold tracking-tight">Ver carrito</span>

              {/* Total destacado */}
              <span className="ml-auto font-bold text-sm bg-black/10 rounded-full px-2.5 py-0.5">
                {formatPrice(total)}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartFloatingButton;
