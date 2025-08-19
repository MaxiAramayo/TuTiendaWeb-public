"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatPrice } from "@/features/dashboard/modules/products/utils/product.utils";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/features/store/api/cartStore";
import { useProductModalStore } from "@/features/store/api/productModalStore";
import { Product, Topics } from "@/shared/types/store";

/**
 * Componente modal para visualizar y agregar productos al carrito
 * 
 * @returns {JSX.Element | null} Componente del modal o null si no está montado
 */
export function ProductModal() {
  // Estados locales
  const [quantity, setQuantity] = useState(1);
  const [selectedTopics, setSelectedTopics] = useState<Topics[]>([]);
  const [mounted, setMounted] = useState(false);
  
  // Hooks
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { toast } = useToast();
  
  // Acceder al estado del modal
  const { product, isOpen, closeModal } = useProductModalStore();
  
  // Acceder al estado del carrito
  const { addToCart, openCart } = useCartStore();

  /**
   * Efecto para manejar el montaje y limpieza del componente
   */
  useEffect(() => {
    setMounted(true);
    
    // Reiniciar estado al cerrar el modal
    if (!isOpen) {
      setQuantity(1);
      setSelectedTopics([]);
    }
  }, [isOpen]);

  /**
   * Maneja el cierre del modal y reinicia los estados
   */
  const handleClose = () => {
    setQuantity(1);
    setSelectedTopics([]);
    closeModal();
  };

  /**
   * Maneja el cambio de selección de tópicos
   * 
   * @param {string} topicId - ID del tópico seleccionado
   */
  const handleTopicChange = (topicId: string) => {
    if (!product?.topics) return;
    
    const selectedTopic = product.topics.find(topic => topic.id === topicId);
    if (!selectedTopic) return;
    
    setSelectedTopics(prevTopics => {
      const index = prevTopics.findIndex(topic => topic.id === topicId);
      if (index === -1) {
        return [...prevTopics, selectedTopic];
      }
      return prevTopics.filter(topic => topic.id !== topicId);
    });
  };

  /**
   * Calcula el precio total incluyendo extras y cantidad
   * 
   * @returns {number} Precio total
   */
  const calculateTotalPrice = (): number => {
    if (!product) return 0;
    
    const basePrice = product.price;
    const extrasPrice = selectedTopics.reduce((acc, topic) => acc + topic.price, 0);
    return (basePrice + extrasPrice) * quantity;
  };

  /**
   * Maneja la adición del producto al carrito
   */
  const handleAddToCart = () => {
    if (!product) return;
    
    // Crear un producto modificado que incluya los extras seleccionados
    const productWithExtras: Product = {
      ...product,
      price: product.price + selectedTopics.reduce((acc, topic) => acc + topic.price, 0),
      topics: selectedTopics.length > 0 ? selectedTopics : undefined,
    };
    
    addToCart(productWithExtras, quantity);
    
    toast({
      title: "Producto añadido",
      description: `${product.name} ha sido añadido a tu carrito.`,
    });
    
    handleClose();
  };


  const increaseQuantity = () => setQuantity(prev => prev + 1);

  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  // Si no está montado o no hay producto, no renderizamos nada
  if (!mounted || !product) return null;

  const productContent = (
    <div className="space-y-4">
      {/* Imagen del producto */}
      <div className="relative w-full h-64 rounded-md overflow-hidden">
        {product.imageUrl || product.image ? (
          <Image
            src={(product.imageUrl || product.image) as string}
            alt={product.name}
            className="object-cover"
            fill
          />
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {!product.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Agotado</span>
          </div>
        )}
      </div>

      {/* Información del producto */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{product.name}</h2>
          {product.category && <Badge variant="outline">{product.category}</Badge>}
        </div>
        <p className="text-lg font-bold text-primary mt-1">
          {formatPrice(product.price)}
        </p>
      </div>

      {/* Descripción del producto */}
      <ScrollArea className="h-24">
        <p className="text-sm text-gray-600">{product.description}</p>
      </ScrollArea>

      {/* Extras/Tópicos si existen */}
      {product.topics && product.topics.length > 0 && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Extras</p>
          </div>
          
          <div className="flex flex-col gap-2">
            {product.topics.map((topic) => (
              <div
                key={topic.id}
                className="flex w-full bg-white p-2 rounded-md shadow-sm"
              >
                <input
                  type="checkbox"
                  id={topic.id}
                  onChange={() => handleTopicChange(topic.id)}
                  className="ml-2"
                  checked={selectedTopics.some(t => t.id === topic.id)}
                />
                <div className="flex justify-between w-full px-1">
                  <label htmlFor={topic.id} className="text-gray-600 cursor-pointer">
                    {topic.name}
                  </label>
                  <span className="font-bold text-primary">
                    {formatPrice(topic.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controles de cantidad y botón de agregar al carrito */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={decreaseQuantity}
            disabled={quantity <= 1 || !product.available}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={increaseQuantity}
            disabled={!product.available}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          onClick={handleAddToCart}
          disabled={!product.available}
          className="gap-2"
        >
          <ShoppingCart className="h-4 w-4" />
          {selectedTopics.length > 0 
            ? `Añadir ${formatPrice(calculateTotalPrice())}` 
            : "Añadir al carrito"}
        </Button>
      </div>
    </div>
  );

  // Renderizado condicional según dispositivo
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles del producto</DialogTitle>
            <DialogDescription>
              Información detallada sobre el producto seleccionado
            </DialogDescription>
          </DialogHeader>
          {productContent}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Detalles del producto</DrawerTitle>
          <DrawerDescription>
            Información detallada sobre el producto seleccionado
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          {productContent}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}