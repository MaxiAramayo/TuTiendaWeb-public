import { z } from 'zod';

export const errorMessages = {
    required: 'Este campo es obligatorio',
    invalid: 'Valor inválido',
    minLength: (min: number) => `Debe contener al menos ${min} caracteres`,
    maxLength: (max: number) => `No puede exceder ${max} caracteres`,
    price: 'El precio debe ser mayor a 0',
    fileSize: 'El archivo es muy grande',
    fileType: 'Tipo de archivo no permitido',
};

/**
 * Esquema para validar dimensiones de imagen
 */
export const imageDimensionsSchema = z.object({
    width: z.number().min(300, 'Ancho mínimo: 300px').max(4000, 'Ancho máximo: 4000px'),
    height: z.number().min(300, 'Alto mínimo: 300px').max(4000, 'Alto máximo: 4000px')
});

/**
 * Esquema para validar archivos de imagen
 */
export const imageFileSchema = z.object({
    file: z.instanceof(File, { message: 'Archivo requerido' }),
    type: z.enum(['avatar', 'cover'], { message: 'Tipo de imagen inválido' })
}).refine(
    (data) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        return allowedTypes.includes(data.file.type);
    },
    { message: errorMessages.fileType }
).refine(
    (data) => {
        const maxSizes = {
            avatar: 2 * 1024 * 1024, // 2MB
            cover: 5 * 1024 * 1024   // 5MB
        };
        return data.file.size <= maxSizes[data.type];
    },
    { message: errorMessages.fileSize }
);

/**
 * Esquema para validar datos básicos de productos
 */
export const productDataSchema = z.object({
    name: z
        .string()
        .min(1, 'El nombre del plato es requerido')
        .max(200, 'El nombre no puede exceder 200 caracteres'),
    description: z
        .string()
        .min(10, 'La descripción debe tener al menos 10 caracteres')
        .max(2000, 'La descripción no puede exceder 2000 caracteres'),
    price: z
        .number()
        .min(0.01, errorMessages.price)
        .max(999999.99, 'El precio no puede exceder 999,999.99'),
    categoryId: z
        .string()
        .min(1, 'La categoría es requerida'),
    status: z
        .enum(['active', 'inactive', 'draft'], {
            errorMap: () => ({ message: 'Estado inválido' })
        })
        .default('active')
});

export type ImageDimensionsInput = z.infer<typeof imageDimensionsSchema>;
export type ImageFileInput = z.infer<typeof imageFileSchema>;
export type ProductDataInput = z.infer<typeof productDataSchema>;
