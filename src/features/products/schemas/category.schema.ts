import { z } from 'zod';

/**
 * Validación del nombre de categoría (reutilizada en create/update).
 * - Trim automático (no se guardan espacios al inicio/fin).
 * - Entre 2 y 60 caracteres ya recortados.
 * - Debe contener al menos una letra o número (rechaza nombres solo de símbolos
 *   o espacios, que generarían un slug vacío).
 */
const categoryName = z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(60, 'El nombre no puede superar los 60 caracteres')
    .refine((v) => /[a-zA-Z0-9À-ÿ]/.test(v), 'El nombre debe contener letras o números');

const categoryDescription = z
    .string()
    .trim()
    .max(200, 'La descripción no puede superar los 200 caracteres')
    .optional();

/**
 * Schema base de categoría — fuente única de verdad.
 *
 * Jerarquía de 2 niveles via auto-referencia:
 * - `parentId: null`  -> categoría principal
 * - `parentId: <id>`  -> subcategoría (el padre debe ser una principal)
 */
export const categorySchema = z.object({
    name: categoryName,
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug inválido'),
    description: categoryDescription,
    parentId: z.string().min(1).nullable().default(null),
    isActive: z.boolean().default(true),
});

/**
 * Datos de entrada para crear una categoría desde el cliente.
 * El slug se deriva del nombre en el servidor.
 */
export const createCategorySchema = z.object({
    name: categoryName,
    description: categoryDescription,
    parentId: z.string().min(1).nullable().default(null),
});

/**
 * Datos de entrada para actualizar una categoría.
 * Todos los campos opcionales salvo el id; el slug se re-deriva si cambia el nombre.
 */
export const updateCategorySchema = z.object({
    id: z.string().min(1),
    name: categoryName.optional(),
    description: categoryDescription,
    parentId: z.string().min(1).nullable().optional(),
    isActive: z.boolean().optional(),
});

export type Category = z.infer<typeof categorySchema> & { id: string };
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
