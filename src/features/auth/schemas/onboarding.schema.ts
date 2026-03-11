import { z } from 'zod';

export const onboardingBasicInfoSchema = z.object({
  name: z.string().min(2, 'El nombre de la tienda debe tener al menos 2 caracteres'),
  description: z.string().min(10, 'La descripcion debe tener al menos 10 caracteres').max(300, 'Maximo 300 caracteres'),
  whatsapp: z.string().min(8, 'Numero de WhatsApp invalido').max(25, 'Numero de WhatsApp invalido'),
  storeType: z.enum([
    'retail',
    'restaurant',
    'service',
    'digital',
    'fashion',
    'beauty',
    'health',
    'sports',
    'electronics',
    'home',
    'automotive',
    'other',
  ]),
  slug: z.string().min(3, 'La URL debe tener al menos 3 caracteres').max(50).regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
});

export const onboardingDesignSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido').optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido').optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color invalido').optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

export const onboardingProductSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  price: z.coerce.number().optional(),
  categoryName: z.string().optional().default('General'),
  description: z.string().optional(),
});

export const onboardingCompleteSchema = z.object({
  basicInfo: onboardingBasicInfoSchema,
  design: onboardingDesignSchema,
  product: onboardingProductSchema.optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.product && (data.product.name || data.product.price)) {
    if (!data.product.name || data.product.name.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['product', 'name'],
        message: 'El nombre debe tener al menos 3 caracteres si agregas un producto',
      });
    }
    if (!data.product.price || data.product.price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['product', 'price'],
        message: 'El precio debe ser mayor a 0',
      });
    }
  }
});

export type OnboardingBasicInfoInput = z.infer<typeof onboardingBasicInfoSchema>;
export type OnboardingDesignInput = z.infer<typeof onboardingDesignSchema>;
export type OnboardingProductInput = z.infer<typeof onboardingProductSchema>;
export type OnboardingCompleteInput = z.infer<typeof onboardingCompleteSchema>;
