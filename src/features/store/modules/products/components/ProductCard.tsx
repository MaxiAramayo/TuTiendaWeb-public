"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { ProductCardProps } from '@/shared/types/store';
import { useCartStore } from '@/features/store/store/cart.store';
import { useStoreToast } from '../../../components/ui/FeedbackToast';
import { ProductTagList } from '../../../components/ui/ProductTagBadge';
import { useThemeClasses } from '../../../hooks/useStoreTheme';
import { ImageWithLoader } from "../../../components/ui/ImageWithLoader";

const ProductCard = ({ product, onOpenModal }: ProductCardProps) => {
  const { addToCart, openCart } = useCartStore();
  const { showCart, messages } = useStoreToast();
  const themeClasses = useThemeClasses();

  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const imageUrl = product.imageUrl || product.image;

  return (
    <Card
      className="w-full overflow-hidden cursor-pointer transition-all duration-300 bg-white border-gray-200 hover:border-[var(--store-secondary)] hover:shadow-lg"
      onClick={() => onOpenModal(product)}
    >
      <div className="flex items-center">
        {/* Imagen del producto a la izquierda */}
        <div className="relative h-20 w-20 flex-shrink-0 m-2 overflow-hidden rounded-md bg-gray-50">
          {imageUrl ? (
            <ImageWithLoader
              src={imageUrl as string}
              alt={product.name}
              fill
              className="object-cover"
              containerClassName="w-full h-full"
              loaderSize="sm"
              useSkeletonBg={true}
              sizes="(max-width: 768px) 80px, 80px"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-gray-300" />
            </div>
          )}
          {!product.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <span className="text-white font-bold text-xs">Agotado</span>
            </div>
          )}
        </div>

        {/* Contenido del producto a la derecha */}
        <div className="flex-grow p-3 flex flex-col justify-between">
          <div>
            <h3
              className="font-semibold line-clamp-1 text-base pr-2"
              style={{ color: 'var(--store-accent)' }}
            >
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
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
