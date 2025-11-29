import { z } from 'zod';

// Extraer de validations/product.validations.ts
export const productSchema = z.object({
    name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    price: z.coerce.number().positive('Precio debe ser positivo'),
    categoryId: z.string().min(1, 'Categoría requerida'),
    tags: z.array(z.string()).optional(),
    variants: z.array(z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        isAvailable: z.boolean().optional(),
    })).optional(),
    imageUrl: z.string().url().optional(),
    active: z.boolean().default(true),
});

// Para formularios
export const productFormSchema = productSchema.extend({
    image: z.any().optional(), // FileList en cliente, File en servidor
    active: z.boolean().optional(),
});

// Para actualizaciones parciales
export const productUpdateSchema = productSchema.partial().extend({
    id: z.string().min(1),
});

export type Product = z.infer<typeof productSchema> & { id: string };
export type ProductFormData = z.infer<typeof productFormSchema>;
export type ProductUpdate = z.infer<typeof productUpdateSchema>;
