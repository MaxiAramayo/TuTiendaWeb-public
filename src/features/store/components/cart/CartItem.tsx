/**
 * Componente para mostrar un item individual del carrito
 *
 * Muestra la imagen, nombre, precio y controles de cantidad del producto
 *
 * @module features/store/components/cart
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/features/products/utils/product.utils";
import { ProductInCart, Topics } from "@/shared/types/store";
import { useThemeClasses } from "../../hooks/useStoreTheme";

interface CartItemProps {
  product: {
    id: string;
    name: string;
    price: number;
    cantidad: number;
    image?: string;
    topics?: Topics[];
    availableTopics?: Topics[];
  };
  onQuantityChange: (id: string, action: "increase" | "decrease") => void;
  onRemove: (id: string) => void;
  onEditTopics?: (id: string, topics: Topics[]) => void;
}

const CartItem = ({ product, onQuantityChange, onRemove, onEditTopics }: CartItemProps) => {
  const { id, name, price, cantidad, image, topics, availableTopics } = product;
  // Para editar: mostrar todos los extras disponibles; si no hay, usar los seleccionados
  const editableTopics = (availableTopics && availableTopics.length > 0) ? availableTopics : (topics ?? []);
  const [showTopicsModal, setShowTopicsModal] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Topics[]>(topics || []);
  const [showTopics, setShowTopics] = useState(false);
  const themeClasses = useThemeClasses();

  const handleOpenModal = () => {
    setSelectedTopics(topics || []);
    setShowTopicsModal(true);
  };

  const handleToggleTopic = (topic: Topics) => {
    setSelectedTopics((prev) =>
      prev.some((t) => t.id === topic.id)
        ? prev.filter((t) => t.id !== topic.id)
        : [...prev, topic]
    );
  };

  const handleConfirmTopics = () => {
    if (onEditTopics) onEditTopics(id, selectedTopics);
    setShowTopicsModal(false);
  };

  const topicsTotal = topics?.reduce((sum, t) => sum + t.price, 0) ?? 0;
  const itemTotal = (price + topicsTotal) * cantidad;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
      >
        {/* Imagen del producto */}
        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-gray-300" />
            </div>
          )}
        </div>

        {/* Info + controles */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-800 leading-tight truncate">
              {name}
            </h3>
            {/* Botón eliminar */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0 -mt-0.5"
              onClick={() => onRemove(id)}
              aria-label="Eliminar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Precio unitario */}
          <p className="text-xs text-gray-400 mt-0.5">{formatPrice(price)} c/u</p>

          {/* Tópicos seleccionados (colapsable) + botón editar */}
          {editableTopics.length > 0 && (
            <div className="mt-1">
              {topics && topics.length > 0 && (
                <button
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowTopics((v) => !v)}
                >
                  <span>
                    {topics.length} extra{topics.length !== 1 ? "s" : ""}
                  </span>
                  {showTopics ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              )}
              <AnimatePresence>
                {showTopics && topics && topics.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-1 space-y-0.5"
                  >
                    {topics.map((topic) => (
                      <li key={topic.id} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                        {topic.name}
                        {topic.price > 0 && (
                          <span className="text-gray-400">(+{formatPrice(topic.price)})</span>
                        )}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              {onEditTopics && (
                <button
                  className="text-xs mt-1 font-medium underline underline-offset-2"
                  style={{ color: "var(--store-primary)" }}
                  onClick={handleOpenModal}
                >
                  {topics && topics.length > 0 ? "Editar extras" : "Agregar extras"}
                </button>
              )}
            </div>
          )}

          {/* Cantidad + subtotal */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-gray-100"
                onClick={() => onQuantityChange(id, "decrease")}
              >
                <Minus className="h-3 w-3 text-gray-600" />
              </Button>
              <span className="w-6 text-center text-sm font-semibold text-gray-700">
                {cantidad}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-gray-100"
                onClick={() => onQuantityChange(id, "increase")}
              >
                <Plus className="h-3 w-3 text-gray-600" />
              </Button>
            </div>
            <p className="text-sm font-bold text-gray-900">{formatPrice(itemTotal)}</p>
          </div>
        </div>
      </motion.div>

      {/* Modal de extras con shadcn Dialog */}
      <Dialog open={showTopicsModal} onOpenChange={setShowTopicsModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar extras — {name}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            {editableTopics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`topic-${topic.id}`}
                    checked={selectedTopics.some((t) => t.id === topic.id)}
                    onCheckedChange={() => handleToggleTopic(topic)}
                    className="data-[state=checked]:bg-[var(--store-primary)] data-[state=checked]:border-[var(--store-primary)]"
                  />
                  <Label htmlFor={`topic-${topic.id}`} className="cursor-pointer text-sm">
                    {topic.name}
                  </Label>
                </div>
                {topic.price > 0 && (
                  <span className="text-sm font-medium" style={{ color: "var(--store-primary)" }}>
                    +{formatPrice(topic.price)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowTopicsModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmTopics}
              style={{ backgroundColor: "var(--store-primary)" }}
              className="text-white hover:opacity-90"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CartItem;
