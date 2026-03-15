/**
 * Product Templates - Productos ilustrativos por tipo de tienda
 * 
 * Estas cards se muestran read-only durante el onboarding para que
 * el usuario entienda cómo se verá su catálogo. NO se guardan en DB.
 * 
 * Imágenes: URLs de Unsplash (gratuitas, alta calidad).
 * 
 * @module features/onboarding/data/product-templates
 */

export interface ProductTemplate {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryName: string;
  tags: string[];
  variants?: { type: string; value: string }[];
}

export const productTemplates: Record<'restaurant' | 'retail', ProductTemplate> = {
  restaurant: {
    name: 'Hamburguesa Clasica',
    description: 'Pan brioche tostado, carne 180g a la parrilla, lechuga, tomate, queso cheddar y salsa casera.',
    price: 4500,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    categoryName: 'Platos Principales',
    tags: ['Popular', 'Recomendado'],
  },
  retail: {
    name: 'Remera Premium Unisex',
    description: '100% algodon peinado, cuello redondo, corte moderno. Disponible en varios colores y talles.',
    price: 12500,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    categoryName: 'Prendas Basicas',
    tags: ['Nuevo', 'Destacado'],
    variants: [
      { type: 'Color', value: 'Negro' },
      { type: 'Talle', value: 'M' },
    ],
  },
};
