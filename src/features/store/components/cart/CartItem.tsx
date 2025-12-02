/**
 * Componente para mostrar un item individual del carrito
 * 
 * Muestra la imagen, nombre, precio y controles de cantidad del producto
 * 
 * @module features/store/components/cart
 */

"use client";
import { ProductInCart, Topics } from "@/shared/types/store";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/features/products/utils/product.utils";
import { useState } from "react";
import { useThemeClasses, useThemeStyles } from "../../hooks/useStoreTheme";

interface CartItemProps {
  product: {
    id: string;
    name: string;
    price: number;
    cantidad: number;
    image?: string;
    topics?: Topics[];
  };
  onQuantityChange: (id: string, action: "increase" | "decrease") => void;
  onRemove: (id: string) => void;
  onEditTopics?: (id: string, topics: Topics[]) => void;
}

/**
 * Componente que representa un item individual en el carrito
 * 
 * @param {CartItemProps} props - Propiedades del componente
 * @returns {JSX.Element} Componente de item del carrito
 */
const CartItem = ({ product, onQuantityChange, onRemove, onEditTopics }: CartItemProps) => {
  const { id, name, price, cantidad, image, topics } = product;
  const [showModal, setShowModal] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Topics[]>(topics || []);
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();

  // Actualiza los tópicos seleccionados al abrir el modal
  const handleOpenModal = () => {
    setSelectedTopics(topics || []);
    setShowModal(true);
  };

  // Maneja el cambio de selección de un tópico
  const handleToggleTopic = (topic: Topics) => {
    setSelectedTopics((prev) => {
      if (prev.some((t) => t.id === topic.id)) {
        return prev.filter((t) => t.id !== topic.id);
      } else {
        return [...prev, topic];
      }
    });
  };

  // Confirma la edición de tópicos
  const handleConfirmTopics = () => {
    if (onEditTopics) {
      onEditTopics(id, selectedTopics);
    }
    setShowModal(false);
  };

  /**
   * Calcula el precio total del item incluyendo cantidad
   * 
   * @returns {number} Precio total
   */
  const calculateItemTotal = (): number => {
    return price * cantidad;
  };

  return (
    <div className="flex items-center py-4 border-b">
      {/* Información del producto */}
      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <h3 className="sm:text-base font-medium text-gray-900 truncate">{name}</h3>
          {/* Mostrar tópicos si existen */}
          {topics && topics.length > 0 && (
            <ul className="text-xs text-gray-600 mt-1 mb-1">
              {topics.map((topic) => (
                <li key={topic.id} className="flex items-center gap-1">
                  <span>• {topic.name}</span>
                  {topic.price > 0 && (
                    <span className={themeClasses.price.primary}>(+{formatPrice(topic.price)})</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-gray-500">
            <span className={`font-medium ${themeClasses.price.primary}`}>
              {formatPrice(price)}
            </span>
          </p>
        </div>

        {/* Botón para editar tópicos solo si existen */}
        {topics && topics.length > 0 && (
          <button
            className={`text-xs ${themeClasses.price.secondary} underline mt-1 mb-2 w-fit hover:opacity-80`}
            onClick={handleOpenModal}
          >
            Editar extras
          </button>
        )}

        {/* Controles de cantidad */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuantityChange(id, "decrease")}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center">{cantidad}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onQuantityChange(id, "increase")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className={`font-medium ${themeClasses.price.primary}`}>
            {formatPrice(calculateItemTotal())}
          </p>
        </div>
      </div>

      {/* Botón de eliminar */}
      <Button
        variant="ghost"
        size="icon"
        className={`ml-4 h-8 w-8 ${themeClasses.status.error} hover:opacity-80`}
        onClick={() => onRemove(id)}
      >
        <span className="sr-only">Eliminar</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </Button>

      {/* Modal para editar tópicos */}
      {showModal && topics && topics.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-4 rounded shadow-md w-80">
            <h4 className="font-semibold mb-2">Editar extras</h4>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleConfirmTopics();
              }}
            >
              <div className="flex flex-col gap-2 mb-2">
                {topics.map((topic) => (
                  <label key={topic.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedTopics.some(t => t.id === topic.id)}
                      onChange={() => handleToggleTopic(topic)}
                    />
                    <span>{topic.name}</span>
                    {topic.price > 0 && (
                      <span className={themeClasses.price.primary}>(+{formatPrice(topic.price)})</span>
                    )}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="text-xs text-gray-500 underline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`text-xs ${themeClasses.price.secondary} underline font-semibold hover:opacity-80`}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartItem;