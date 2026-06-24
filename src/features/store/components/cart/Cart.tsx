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
    availableTopics?: Topics[];
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
    <div
      className="flex flex-col h-full max-h-[50vh] rounded-lg"
      style={{ backgroundColor: 'var(--store-secondary, #f9fafb)' }}
    >
      {/* Área scrolleable de productos.
          Se usa un div con overflow nativo (no Radix ScrollArea) porque el
          viewport de ScrollArea envuelve a los hijos en un layout `display:table`
          que hace shrink-to-fit al contenido: un nombre de producto largo expandía
          la fila más allá del 100% y rompía el truncate, empujando el precio fuera
          del panel. Con overflow nativo el ancho queda fijo al contenedor. */}
      <div className="max-h-80 overflow-y-auto rounded-md">
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
      </div>
    </div>
  );
};

export default Cart; 