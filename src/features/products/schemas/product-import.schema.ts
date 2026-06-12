import { z } from 'zod';

export const MAX_IMPORT_PRODUCTS = 300;

export const productImportRowSchema = z.object({
    nombre: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
    descripcion: z.string().optional(),
    precio: z.coerce
        .number({ invalid_type_error: 'Precio debe ser un número' })
        .positive('Precio debe ser mayor a 0'),
    costo: z.coerce
        .number({ invalid_type_error: 'Costo debe ser un número' })
        .min(0, 'Costo no puede ser negativo')
        .default(0),
    categoria: z.string().min(1, 'Categoría requerida'),
    subcategoria: z
        .string()
        .optional()
        .transform((v) => (v === '' || v === null ? undefined : v)),
    tags: z
        .string()
        .optional()
        .transform((v) =>
            v
                ? v
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                : []
        ),
    activo: z
        .string()
        .optional()
        .transform((v) => {
            if (!v) return true;
            return !['no', 'false', '0', 'inactivo'].includes(v.toLowerCase().trim());
        }),
});

export type ProductImportRow = z.infer<typeof productImportRowSchema>;

export type ProductImportRowRaw = {
    nombre?: unknown;
    descripcion?: unknown;
    precio?: unknown;
    costo?: unknown;
    categoria?: unknown;
    subcategoria?: unknown;
    tags?: unknown;
    activo?: unknown;
};

export type ParsedRowResult =
    | { valid: true; data: ProductImportRow; rowIndex: number }
    | { valid: false; errors: string[]; rowIndex: number; rawName?: string };
