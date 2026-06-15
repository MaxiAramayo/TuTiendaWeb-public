/**
 * Tests unit de profile schemas (Fase 1 · 1A).
 * Foco: imageUploadSchema (File + MIME + 5MB), whatsapp flexible, slug (lowercase),
 * profileFormSchema.
 * Matriz: docs/test/matrices/profile.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../../../test/helpers/zod';
import {
  imageUploadSchema,
  whatsappSchema,
  slugSchema,
  profileFormSchema,
  basicInfoSchema,
  contactInfoSchema,
  addressSchema,
  socialLinksSchema,
  themeConfigSchema,
  weeklyScheduleSchema,
  dailyScheduleSchema,
  paymentMethodSchema,
  deliveryMethodSchema,
  slugValidationSchema,
  validateWhatsApp,
  validateInstagramUrl,
  validateFacebookUrl,
  validateSlug,
} from './profile.schema';

/** Construye un File con un tamaño controlado para los tests de límite. */
function makeFile({ type = 'image/png', size = 1024 } = {}): File {
  const file = new File(['contenido'], 'imagen.png', { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('imageUploadSchema', () => {
  it('acepta un PNG válido de menos de 5MB', () => {
    expect(imageUploadSchema.safeParse({ file: makeFile(), type: 'logo' }).success).toBe(true);
  });

  it('rechaza un valor que no es File', () => {
    const r = imageUploadSchema.safeParse({ file: 'no-soy-archivo', type: 'logo' });
    expect(issueFor(r, 'file')).toBe('Debe seleccionar un archivo');
  });

  it('rechaza un MIME no permitido', () => {
    const r = imageUploadSchema.safeParse({ file: makeFile({ type: 'application/pdf' }), type: 'logo' });
    expect(issueFor(r, 'file')).toBe('Solo se permiten archivos JPG, PNG o WebP');
  });

  it('rechaza un archivo de más de 5MB', () => {
    const r = imageUploadSchema.safeParse({ file: makeFile({ size: 6 * 1024 * 1024 }), type: 'logo' });
    expect(issueFor(r, 'file')).toBe('El archivo no puede superar los 5MB');
  });

  it('acepta exactamente 5MB (borde)', () => {
    const r = imageUploadSchema.safeParse({ file: makeFile({ size: 5 * 1024 * 1024 }), type: 'banner' });
    expect(r.success).toBe(true);
  });

  it('rechaza un tipo de imagen inválido', () => {
    expect(imageUploadSchema.safeParse({ file: makeFile(), type: 'avatar' }).success).toBe(false);
  });
});

describe('whatsappSchema (flexible)', () => {
  it.each([
    '+54 9 11 1234-5678',
    '+5491112345678',
    '1112345678',
    '011-1234-5678',
  ])('acepta el formato "%s"', (n) => {
    expect(whatsappSchema.safeParse(n).success).toBe(true);
  });

  it('rechaza menos de 8 caracteres', () => {
    expect(issueFor(whatsappSchema.safeParse('12345'), '')).toBe('Debe tener al menos 8 caracteres');
  });

  it('rechaza más de 25 caracteres', () => {
    expect(issueFor(whatsappSchema.safeParse('1'.repeat(26)), '')).toBe('No puede superar los 25 caracteres');
  });

  it('rechaza un número con letras', () => {
    expect(issueFor(whatsappSchema.safeParse('abcd12345'), '')).toBe(
      'Ingrese un número de WhatsApp válido (ej: +54 9 11 1234-5678)',
    );
  });
});

describe('slugSchema', () => {
  it('normaliza a minúsculas y recorta', () => {
    const r = slugSchema.safeParse('mi-tienda');
    if (r.success) expect(r.data).toBe('mi-tienda');
  });

  it('rechaza slug < 3 caracteres', () => {
    expect(issueFor(slugSchema.safeParse('ab'), '')).toBe('Debe tener al menos 3 caracteres');
  });

  it.each(['Tienda', 'mi tienda', 'mi--tienda', '-tienda'])('rechaza slug inválido "%s"', (slug) => {
    expect(issueFor(slugSchema.safeParse(slug), '')).toBe('Solo letras minúsculas, números y guiones');
  });
});

describe('profileFormSchema', () => {
  const valid = {
    name: 'Mi Tienda',
    description: 'Una descripción suficientemente larga',
    siteName: 'mi-tienda',
    storeType: 'retail' as const,
    whatsapp: '+5491112345678',
  };

  it('acepta un perfil mínimo válido y aplica defaults', () => {
    const r = profileFormSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.country).toBe('Argentina');
      expect(r.data.currency).toBe('ARS');
      expect(r.data.language).toBe('es');
    }
  });

  it('rechaza name < 2 caracteres', () => {
    expect(issueFor(profileFormSchema.safeParse({ ...valid, name: 'a' }), 'name')).toBe(
      'Debe tener al menos 2 caracteres',
    );
  });

  it('rechaza description < 10 caracteres', () => {
    expect(issueFor(profileFormSchema.safeParse({ ...valid, description: 'corta' }), 'description')).toBe(
      'Debe tener al menos 10 caracteres',
    );
  });

  it('rechaza un tipo de tienda inválido', () => {
    expect(profileFormSchema.safeParse({ ...valid, storeType: 'teletransporte' }).success).toBe(false);
  });
});

describe('sub-schemas adicionales', () => {
  it('basicInfoSchema valida nombre, descripción, slug y tipo', () => {
    const r = basicInfoSchema.safeParse({
      name: 'Mi Tienda',
      description: 'Descripción suficientemente larga',
      slug: 'mi-tienda',
      type: 'retail',
    });
    expect(r.success).toBe(true);
    expect(basicInfoSchema.safeParse({ name: 'a', description: 'x', slug: 'x', type: 'retail' }).success).toBe(false);
  });

  it('contactInfoSchema acepta contacto válido', () => {
    expect(contactInfoSchema.safeParse({ whatsapp: '+5491112345678' }).success).toBe(true);
  });

  it('addressSchema aplica país por defecto', () => {
    const r = addressSchema.safeParse({});
    if (r.success) expect(r.data.country).toBe('Argentina');
  });

  it('socialLinksSchema acepta strings vacíos', () => {
    expect(socialLinksSchema.safeParse({ instagram: '', facebook: '' }).success).toBe(true);
  });

  it('themeConfigSchema aplica defaults de estilo', () => {
    const r = themeConfigSchema.safeParse({});
    if (r.success) {
      expect(r.data.style).toBe('modern');
      expect(r.data.buttonStyle).toBe('rounded');
    }
  });

  it('dailyScheduleSchema y weeklyScheduleSchema aplican defaults', () => {
    const day = dailyScheduleSchema.safeParse({});
    if (day.success) {
      expect(day.data.closed).toBe(false);
      expect(day.data.periods).toEqual([]);
    }
    const week = weeklyScheduleSchema.safeParse({
      monday: {}, tuesday: {}, wednesday: {}, thursday: {}, friday: {}, saturday: {}, sunday: {},
    });
    expect(week.success).toBe(true);
  });

  it('paymentMethodSchema y deliveryMethodSchema validan estructura', () => {
    expect(paymentMethodSchema.safeParse({ id: 'efectivo', name: 'Efectivo', enabled: true }).success).toBe(true);
    expect(deliveryMethodSchema.safeParse({ id: 'retiro', name: 'Retiro', enabled: true }).success).toBe(true);
  });

  it('slugValidationSchema valida el slug', () => {
    expect(slugValidationSchema.safeParse({ slug: 'mi-tienda' }).success).toBe(true);
    expect(slugValidationSchema.safeParse({ slug: 'A B' }).success).toBe(false);
  });
});

describe('helpers validate*', () => {
  it('validan entradas correctas e incorrectas', () => {
    expect(validateWhatsApp('+5491112345678').success).toBe(true);
    expect(validateWhatsApp('abc12345').success).toBe(false);
    expect(validateInstagramUrl('https://instagram.com/x').success).toBe(true);
    expect(validateFacebookUrl('https://facebook.com/x').success).toBe(true);
    expect(validateSlug('mi-tienda').success).toBe(true);
    expect(validateSlug('Mala').success).toBe(false);
  });
});
