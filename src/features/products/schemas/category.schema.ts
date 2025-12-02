import { z } from 'zod';

export const categorySchema = z.object({
    name: z.string().min(2),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;
