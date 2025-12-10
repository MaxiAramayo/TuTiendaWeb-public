/**
 * Componente de tarjeta individual de producto
 * 
 * Muestra la información básica de un producto en la lista de productos
 * 
 * @module features/store/modules/products/components
 */

"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { ProductCardProps } from '@/shared/types/store';
import { useCartStore } from '@/features/store/store/cart.store';
import { useStoreToast } from '../../../components/ui/FeedbackToast';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ProductTagList } from '../../../components/ui/ProductTagBadge';
import { useThemeClasses, useThemeStyles } from '../../../hooks/useStoreTheme';

/**
 * Componente de tarjeta de producto
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
const ProductCard = ({ product, onOpenModal }: ProductCardProps) => {
  // Estado para controlar errores y carga de imágenes
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Acceder al estado del carrito
  const { addToCart, openCart } = useCartStore();
  const { showCart, messages } = useStoreToast();

  // Hooks del tema
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();

  /**
   * Maneja la adición rápida al carrito
   * 
   * @param {React.MouseEvent} e - Evento del click
   */

  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Agregar el producto sin tópicos
    const productWithoutTopics = { ...product };
    delete productWithoutTopics.topics;
    addToCart(productWithoutTopics, 1);

    showCart(messages.PRODUCT_ADDED, {
      action: {
        label: 'Ver carrito',
        onClick: () => openCart()
      }
    });
  };

  // Usar la imagen correcta (compatibilidad con distintas propiedades)
  const imageUrl = product.imageUrl || product.image;

  return (
    <Card
      className="w-full overflow-hidden cursor-pointer transition-all duration-300 bg-white border-gray-200 hover:border-[var(--store-secondary)] hover:shadow-lg"
      onClick={() => onOpenModal(product)}
    >
      <div className="flex items-center">
        {/* Imagen del producto a la izquierda */}
        <div className="relative h-20 w-20 flex-shrink-0 m-2 overflow-hidden rounded-md">
          {imageUrl ? (
            <>
              {/* Skeleton loader mientras carga la imagen */}
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              <Image
                src={imageUrl as string}
                alt={product.name}
                fill
                className={`object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                loading="lazy"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                sizes="(max-width: 768px) 80px, 80px"
              />
            </>
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-gray-400" />
            </div>
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Agotado</span>
            </div>
          )}
        </div>

        {/* Contenido del producto a la derecha */}
        <div className="flex-grow p-3 flex flex-col justify-between">
          <div>
            <h3 className="font-medium line-clamp-1 text-base pr-2">{product.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {product.description}
            </p>

            {/* Tags del producto */}
            {product.productTags && product.productTags.length > 0 && (
              <div className="mt-1.5">
                <ProductTagList
                  tags={product.productTags}
                  maxTags={2}
                  size="sm"
                  variant="outline"
                  showIcon={false}
                  className="gap-1"
                />
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-1">
            <p className={`font-bold text-base ${themeClasses.price.primary}`}>
              ${product.price}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className={`p-1 h-8 w-8 rounded-full ${themeClasses.background.primary} hover:bg-[var(--store-primary)]/90 transition-all duration-300 hover:scale-110 shadow-sm`}
              disabled={product.available === false}
              onClick={handleQuickAddToCart}
              title="Añadir al carrito"
            >
              <ShoppingCart className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;