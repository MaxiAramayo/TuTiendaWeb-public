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
    // Extras / adicionales con precio. Formato: "Nombre:Precio; Nombre:Precio".
    // Mapea al campo `variants` del producto (precio aditivo en el checkout).
    extras: z
        .string()
        .optional()
        .transform((v, ctx) => {
            const result: { name: string; price: number }[] = [];
            if (!v || !v.trim()) return result;

            const tokens = v
                .split(';')
                .map((t) => t.trim())
                .filter(Boolean);

            for (const token of tokens) {
                // Separar por el ÚLTIMO ':' para tolerar ':' en el nombre.
                const sepIndex = token.lastIndexOf(':');
                const name = sepIndex === -1 ? token.trim() : token.slice(0, sepIndex).trim();
                const priceStr = sepIndex === -1 ? '' : token.slice(sepIndex + 1).trim();
                const price = Number(priceStr);

                if (!name || sepIndex === -1 || priceStr === '' || Number.isNaN(price) || price < 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Extra "${token}" debe tener formato Nombre:Precio con precio numérico >= 0`,
                    });
                    continue;
                }

                result.push({ name, price });
            }

            return result;
        }),
});

export type ProductImportRow = z.infer<typeof productImportRowSchema>;

/**
 * Columnas del Excel de import, derivadas del schema (fuente única de verdad).
 * El orden coincide con el de definición del schema y es el contrato del archivo:
 * lo usan la plantilla del diálogo de import y los fixtures E2E.
 */
export const IMPORT_COLUMNS = Object.keys(
    productImportRowSchema.shape,
) as (keyof ProductImportRow)[];

export type ProductImportRowRaw = {
    nombre?: unknown;
    descripcion?: unknown;
    precio?: unknown;
    costo?: unknown;
    categoria?: unknown;
    subcategoria?: unknown;
    tags?: unknown;
    activo?: unknown;
    extras?: unknown;
};

export type ParsedRowResult =
    | { valid: true; data: ProductImportRow; rowIndex: number }
    | { valid: false; errors: string[]; rowIndex: number; rawName?: string };
