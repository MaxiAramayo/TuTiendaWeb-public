/**
 * Componente para mostrar badges de tags de productos
 * 
 * @module features/store/components/ui/ProductTagBadge
 */

'use client';

import React from 'react';
import { ProductTag } from '@/shared/types/firebase.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tag, Star, Zap, Heart, Gift, Sparkles } from 'lucide-react';

/**
 * Props del componente ProductTagBadge
 */
interface ProductTagBadgeProps {
  tag: ProductTag;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  showIcon?: boolean;
  className?: string;
  onClick?: (tag: ProductTag) => void;
  interactive?: boolean;
}

/**
 * Mapeo de iconos por nombre
 */
const ICON_MAP = {
  tag: Tag,
  star: Star,
  zap: Zap,
  heart: Heart,
  gift: Gift,
  sparkles: Sparkles,
} as const;

/**
 * Obtiene el componente de icono basado en el nombre
 */
const getIconComponent = (iconName?: string) => {
  if (!iconName) return Tag;
  return ICON_MAP[iconName as keyof typeof ICON_MAP] || Tag;
};

/**
 * Calcula el contraste de color para determinar el color del texto
 */
const getContrastColor = (backgroundColor: string): string => {
  // Convertir hex a RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcular luminancia
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retornar color basado en luminancia
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Componente ProductTagBadge
 */
export const ProductTagBadge: React.FC<ProductTagBadgeProps> = ({
  tag,
  size = 'md',
  variant = 'default',
  showIcon = true,
  className,
  onClick,
  interactive = false
}) => {
  const IconComponent = getIconComponent(tag.icon);
  
  // Determinar colores
  const backgroundColor = tag.color || '#6b7280';
  const textColor = tag.textColor || getContrastColor(backgroundColor);
  
  // Clases de tamaño
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };
  
  // Tamaños de icono
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };
  
  // Estilos dinámicos
  const dynamicStyles = {
    backgroundColor: variant === 'filled' ? backgroundColor : 'transparent',
    color: variant === 'filled' ? textColor : backgroundColor,
    borderColor: backgroundColor,
  };
  
  // Clases base
  const baseClasses = cn(
    'inline-flex items-center rounded-full font-medium transition-all duration-200',
    sizeClasses[size],
    {
      'border': variant === 'outline',
      'border-2': variant === 'outline',
      'cursor-pointer hover:scale-105 hover:shadow-md': interactive || onClick,
      'hover:opacity-80': interactive || onClick,
    },
    className
  );
  
  // Manejar click
  const handleClick = () => {
    if (onClick) {
      onClick(tag);
    }
  };
  
  return (
    <Badge
      className={baseClasses}
      style={dynamicStyles}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {showIcon && (
        <IconComponent 
          size={iconSizes[size]} 
          className="flex-shrink-0"
          aria-hidden="true"
        />
      )}
      <span className="truncate">{tag.name}</span>
    </Badge>
  );
};

/**
 * Componente para mostrar múltiples tags
 */
interface ProductTagListProps {
  tags: ProductTag[];
  maxTags?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  showIcon?: boolean;
  className?: string;
  onTagClick?: (tag: ProductTag) => void;
  interactive?: boolean;
  showMoreText?: string;
}

export const ProductTagList: React.FC<ProductTagListProps> = ({
  tags,
  maxTags = 3,
  size = 'md',
  variant = 'default',
  showIcon = true,
  className,
  onTagClick,
  interactive = false,
  showMoreText = '+{count} más'
}) => {
  if (!tags || tags.length === 0) {
    return null;
  }
  
  const visibleTags = tags.slice(0, maxTags);
  const remainingCount = tags.length - maxTags;
  
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visibleTags.map((tag) => (
        <ProductTagBadge
          key={tag.id}
          tag={tag}
          size={size}
          variant={variant}
          showIcon={showIcon}
          onClick={onTagClick}
          interactive={interactive}
        />
      ))}
      
      {remainingCount > 0 && (
        <Badge 
          className={cn(
            'inline-flex items-center rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-300',
            {
              'text-xs px-2 py-0.5': size === 'sm',
              'text-sm px-2.5 py-1': size === 'md',
              'text-base px-3 py-1.5': size === 'lg',
              'cursor-pointer hover:bg-gray-200': interactive
            }
          )}
          onClick={() => {
            if (interactive && onTagClick) {
              // Mostrar todos los tags restantes o abrir modal
              console.log('Mostrar más tags:', tags.slice(maxTags));
            }
          }}
        >
          {showMoreText.replace('{count}', remainingCount.toString())}
        </Badge>
      )}
    </div>
  );
};

/**
 * Componente para tag destacado (featured)
 */
interface FeaturedTagBadgeProps extends Omit<ProductTagBadgeProps, 'variant'> {
  animated?: boolean;
}

export const FeaturedTagBadge: React.FC<FeaturedTagBadgeProps> = ({
  tag,
  size = 'md',
  showIcon = true,
  className,
  onClick,
  interactive = false,
  animated = true
}) => {
  return (
    <ProductTagBadge
      tag={tag}
      size={size}
      variant="filled"
      showIcon={showIcon}
      className={cn(
        'shadow-lg border-2 border-white',
        {
          'animate-pulse': animated,
          'hover:animate-none': interactive || onClick
        },
        className
      )}
      onClick={onClick}
      interactive={interactive}
    />
  );
};

/**
 * Hook para filtrar productos por tags
 */
export const useTagFiltering = () => {
  const filterProductsByTag = (products: any[], tagId: string) => {
    return products.filter(product => 
      product.tagIds?.includes(tagId) || 
      product.productTags?.some((tag: ProductTag) => tag.id === tagId)
    );
  };
  
  const filterProductsByTags = (products: any[], tagIds: string[]) => {
    return products.filter(product => 
      tagIds.some(tagId => 
        product.tagIds?.includes(tagId) || 
        product.productTags?.some((tag: ProductTag) => tag.id === tagId)
      )
    );
  };
  
  const getProductTags = (product: any): ProductTag[] => {
    return product.productTags || [];
  };
  
  return {
    filterProductsByTag,
    filterProductsByTags,
    getProductTags
  };
};

export default ProductTagBadge;