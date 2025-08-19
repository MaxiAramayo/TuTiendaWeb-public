/**
 * Componente para mostrar el resumen y acciones del carrito
 * 
 * Muestra el total y el botón para proceder al checkout
 * 
 * @module features/store/components/cart
 */

import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

interface CartFooterProps {
  total: number;
  onCheckout: () => void;
}

const CartFooter = ({ total, onCheckout }: CartFooterProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-base font-medium">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
      <Button
        onClick={onCheckout}
        className="w-full h-12 text-base font-medium"
        size="lg"
      >
        <ShoppingBag className="mr-2 h-5 w-5" />
        Proceder al checkout
      </Button>
    </div>
  );
};

export default CartFooter; 