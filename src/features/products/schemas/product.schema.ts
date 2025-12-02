import { z } from 'zod';

// Base schema for product data (server/db side mostly)
export const productSchema = z.object({
    name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    price: z.coerce.number().positive('Precio debe ser positivo'),
    costPrice: z.coerce.number().min(0, 'El costo no puede ser negativo').default(0),
    categoryId: z.string().min(1, 'Categoría requerida'),
    tags: z.array(z.string()).default([]),
    variants: z.array(z.object({
        id: z.string(),
        name: z.string().min(1, 'Nombre de variante requerido'),
        price: z.coerce.number().min(0, 'Precio no puede ser negativo'),
        isAvailable: z.boolean().default(true),
    })).default([]),
    hasPromotion: z.boolean().default(false),
    active: z.boolean().default(true),
});

// Schema for the form (client side)
// Handles File objects or existing URL strings
export const productFormSchema = productSchema.extend({
    // We use z.any() for mixed File/String arrays during transition
    // Ideally: z.array(z.union([z.instanceof(File), z.string()]))
    images: z.array(z.any()).default([]),
    // Optional single image field for compatibility if needed, but prefer 'images'
    image: z.any().optional(),
});

// Schema for updates
export const productUpdateSchema = productFormSchema.partial().extend({
    id: z.string().min(1),
});

export type Product = z.infer<typeof productSchema> & { id: string };
export type ProductFormData = z.infer<typeof productFormSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
