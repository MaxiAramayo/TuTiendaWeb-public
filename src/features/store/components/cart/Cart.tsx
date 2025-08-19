/**
 * Componente principal del carrito de compras
 * 
 * Muestra la lista de productos, total y acciones del carrito
 * 
 * @module features/store/components/cart
 */

"use client";
import { Topics } from "@/shared/types/store";
import CartItem from "./CartItem";
import CartFooter from "./CartFooter";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CartProps {
  items: {
    id: string;
    idProduct: string;
    name: string;
    description: string;
    price: number;
    cantidad: number;
    image?: string;
    topics?: Topics[];
    availableTopics?: Topics[]; // Para edición de tópicos
  }[];
  total: number;
  onQuantityChange: (id: string, action: "increase" | "decrease") => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClose: () => void;
  onEditTopics?: (id: string, topics: Topics[]) => void;
}

const Cart = ({
  items,
  total,
  onQuantityChange,
  onRemoveItem,
  onCheckout,
  onEditTopics,
}: CartProps) => {
  return (
    <div className="flex flex-col h-full bg-gray-100 max-h-[50vh]">
      {/* Área scrolleable de productos */}
      <ScrollArea className="h-80 rounded-md border">
        <div className="p-4 space-y-4">
          {items.map((item) => (
            <CartItem
              key={item.id}
              product={item}
              onQuantityChange={onQuantityChange}
              onRemove={onRemoveItem}
              onEditTopics={onEditTopics}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Cart; 