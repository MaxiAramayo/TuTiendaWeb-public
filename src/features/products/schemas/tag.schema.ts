import { z } from 'zod';

export const tagSchema = z.object({
    name: z.string().min(2),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

export type Tag = z.infer<typeof tagSchema>;
