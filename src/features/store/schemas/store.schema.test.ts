/**
 * Tests unit de store schemas (Fase 1 · 1A).
 * Foco: whatsapp (+54 transform), URLs IG/FB, slug (doble refine), scheduleSchema
 * (doble refine open<close), hex/time, storeName.
 * Matriz: docs/test/matrices/store.md
 */
import { describe, expect, it } from 'vitest';
import { issueFor } from '../../../../test/helpers/zod';
import {
  whatsappSchema,
  instagramUrlSchema,
  facebookUrlSchema,
  slugSchema,
  storeNameSchema,
  hexColorSchema,
  timeSchema,
  scheduleSchema,
  descriptionSchema,
  emailSchema,
  urlSchema,
  addressSchema,
  coordinatesSchema,
  themeConfigSchema,
  storeBasicInfoSchema,
  socialMediaSchema,
  storeProfileSchema,
  storeTypeSchema,
  validateWhatsApp,
  validateInstagramUrl,
  validateFacebookUrl,
  validateSlug,
  validateStoreName,
  validateDescription,
  validateHexColor,
  validateEmail,
  validateUrl,
  validateTime,
} from './store.schema';

describe('whatsappSchema', () => {
  it('antepone +54 a un número sin prefijo', () => {
    const r = whatsappSchema.safeParse('1112345678');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('+541112345678');
  });

  it('preserva un número que ya tiene +', () => {
    const r = whatsappSchema.safeParse('+5491112345678');
    if (r.success) expect(r.data).toBe('+5491112345678');
  });

  it('rechaza vacío con el mensaje requerido', () => {
    expect(issueFor(whatsappSchema.safeParse(''), '')).toBe('Este campo es obligatorio');
  });

  it.each(['0123456789', 'abc', '+54 9 11 1234'])('rechaza el número inválido "%s"', (n) => {
    expect(issueFor(whatsappSchema.safeParse(n), '')).toBe(
      'Número de WhatsApp inválido. Debe incluir código de país',
    );
  });
});

describe('instagramUrlSchema', () => {
  it('acepta undefined (opcional)', () => {
    expect(instagramUrlSchema.safeParse(undefined).success).toBe(true);
  });

  it.each([
    'https://instagram.com/usuario',
    'https://www.instagram.com/usuario.demo/',
  ])('acepta la URL válida %s', (url) => {
    expect(instagramUrlSchema.safeParse(url).success).toBe(true);
  });

  it('rechaza una URL que no es de Instagram', () => {
    expect(issueFor(instagramUrlSchema.safeParse('https://twitter.com/x'), '')).toBe(
      'URL de Instagram inválida',
    );
  });
});

describe('facebookUrlSchema', () => {
  it('acepta una URL válida de Facebook', () => {
    expect(facebookUrlSchema.safeParse('https://facebook.com/mitienda').success).toBe(true);
  });

  it('rechaza una URL que no es de Facebook', () => {
    expect(issueFor(facebookUrlSchema.safeParse('https://instagram.com/x'), '')).toBe(
      'URL de Facebook inválida',
    );
  });
});

describe('slugSchema', () => {
  it('acepta un slug válido', () => {
    expect(slugSchema.safeParse('tienda-demo').success).toBe(true);
  });

  it('rechaza slug < 3 caracteres', () => {
    expect(issueFor(slugSchema.safeParse('ab'), '')).toBe('Debe contener al menos 3 caracteres');
  });

  it('rechaza slug > 30 caracteres', () => {
    expect(issueFor(slugSchema.safeParse('a'.repeat(31)), '')).toBe('No puede exceder 30 caracteres');
  });

  it('rechaza caracteres inválidos', () => {
    expect(issueFor(slugSchema.safeParse('Tienda'), '')).toBe('Solo letras minúsculas, números y guiones');
  });

  it('rechaza guiones dobles', () => {
    expect(issueFor(slugSchema.safeParse('ti--enda'), '')).toBe('No puede contener guiones dobles');
  });

  it.each(['-tienda', 'tienda-'])('rechaza slug que empieza/termina con guión: "%s"', (slug) => {
    expect(issueFor(slugSchema.safeParse(slug), '')).toBe('No puede empezar o terminar con guión');
  });
});

describe('storeNameSchema', () => {
  it('recorta los espacios', () => {
    const r = storeNameSchema.safeParse('  Mi Tienda  ');
    if (r.success) expect(r.data).toBe('Mi Tienda');
  });

  it('acepta nombre con acentos y ñ', () => {
    expect(storeNameSchema.safeParse('Almacén Doña Ñata').success).toBe(true);
  });

  it('rechaza nombre < 2 caracteres', () => {
    expect(issueFor(storeNameSchema.safeParse('a'), '')).toBe('Debe contener al menos 2 caracteres');
  });

  it('rechaza nombre con números', () => {
    expect(issueFor(storeNameSchema.safeParse('Tienda123'), '')).toBe(
      'El nombre solo puede contener letras y espacios',
    );
  });
});

describe('hexColorSchema', () => {
  it.each(['#FF0000', '#abc'])('acepta el color %s', (c) => {
    expect(hexColorSchema.safeParse(c).success).toBe(true);
  });

  it.each(['FF0000', '#GG0000', '#FF00'])('rechaza el color inválido "%s"', (c) => {
    expect(issueFor(hexColorSchema.safeParse(c), '')).toBe('Color hexadecimal inválido (ej: #FF0000)');
  });
});

describe('timeSchema', () => {
  it.each(['00:00', '9:30', '23:59'])('acepta la hora %s', (t) => {
    expect(timeSchema.safeParse(t).success).toBe(true);
  });

  it.each(['24:00', '12:60', '12-30', '1230'])('rechaza la hora inválida "%s"', (t) => {
    expect(issueFor(timeSchema.safeParse(t), '')).toBe('Formato de hora inválido (HH:MM)');
  });
});

describe('scheduleSchema', () => {
  it('acepta un día cerrado sin horarios', () => {
    expect(scheduleSchema.safeParse({ day: 'monday', isOpen: false }).success).toBe(true);
  });

  it('acepta un día abierto con apertura anterior al cierre', () => {
    const r = scheduleSchema.safeParse({
      day: 'monday',
      isOpen: true,
      openTime: '09:00',
      closeTime: '18:00',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza un día abierto sin horarios', () => {
    const r = scheduleSchema.safeParse({ day: 'monday', isOpen: true });
    expect(issueFor(r, '')).toBe('Horarios de apertura y cierre son requeridos cuando está abierto');
  });

  it('rechaza apertura posterior o igual al cierre', () => {
    const r = scheduleSchema.safeParse({
      day: 'monday',
      isOpen: true,
      openTime: '18:00',
      closeTime: '09:00',
    });
    expect(issueFor(r, '')).toBe('La hora de apertura debe ser anterior a la de cierre');
  });

  it('rechaza un día de la semana inválido', () => {
    const r = scheduleSchema.safeParse({ day: 'lunes', isOpen: false });
    expect(issueFor(r, 'day')).toBe('Día de la semana inválido');
  });
});

describe('sub-schemas adicionales', () => {
  it('descriptionSchema recorta y valida longitud', () => {
    const r = descriptionSchema.safeParse('  Una descripción válida  ');
    if (r.success) expect(r.data).toBe('Una descripción válida');
    expect(descriptionSchema.safeParse('corta').success).toBe(false);
  });

  it('emailSchema normaliza a minúsculas', () => {
    const r = emailSchema.safeParse('ANA@Demo.com');
    if (r.success) expect(r.data).toBe('ana@demo.com');
    expect(emailSchema.safeParse('no-email').success).toBe(false);
  });

  it('urlSchema acepta URL válida o undefined', () => {
    expect(urlSchema.safeParse(undefined).success).toBe(true);
    expect(urlSchema.safeParse('https://x.com').success).toBe(true);
    expect(urlSchema.safeParse('no-url').success).toBe(false);
  });

  it('addressSchema aplica país por defecto Argentina', () => {
    const r = addressSchema.safeParse({ street: 'Calle Falsa 123', city: 'CABA', state: 'BA' });
    if (r.success) expect(r.data.country).toBe('Argentina');
    expect(addressSchema.safeParse({ street: 'x', city: 'CABA', state: 'BA' }).success).toBe(false);
  });

  it('coordinatesSchema valida rangos de lat/long', () => {
    expect(coordinatesSchema.safeParse({ latitude: -34.6, longitude: -58.4 }).success).toBe(true);
    expect(coordinatesSchema.safeParse({ latitude: 100, longitude: 0 }).success).toBe(false);
  });

  it('themeConfigSchema aplica fontFamily por defecto inter', () => {
    const r = themeConfigSchema.safeParse({ primaryColor: '#FF0000' });
    if (r.success) expect(r.data.fontFamily).toBe('inter');
    expect(themeConfigSchema.safeParse({ primaryColor: 'rojo' }).success).toBe(false);
  });

  it('storeBasicInfoSchema valida nombre y slug', () => {
    expect(storeBasicInfoSchema.safeParse({ name: 'Mi Tienda', slug: 'mi-tienda' }).success).toBe(true);
  });

  it('socialMediaSchema acepta redes opcionales', () => {
    expect(socialMediaSchema.safeParse({}).success).toBe(true);
  });

  it('storeProfileSchema acepta perfil mínimo', () => {
    const r = storeProfileSchema.safeParse({ basicInfo: { name: 'Mi Tienda', slug: 'mi-tienda' } });
    expect(r.success).toBe(true);
  });

  it('storeTypeSchema rechaza tipo inválido', () => {
    expect(issueFor(storeTypeSchema.safeParse('teletransporte'), '')).toBe('Tipo de tienda inválido');
  });
});

describe('helpers validate*', () => {
  it('validan entradas correctas como success', () => {
    expect(validateWhatsApp('1112345678').success).toBe(true);
    expect(validateInstagramUrl('https://instagram.com/x').success).toBe(true);
    expect(validateFacebookUrl('https://facebook.com/x').success).toBe(true);
    expect(validateSlug('mi-tienda').success).toBe(true);
    expect(validateStoreName('Mi Tienda').success).toBe(true);
    expect(validateDescription('Una descripción válida').success).toBe(true);
    expect(validateHexColor('#FF0000').success).toBe(true);
    expect(validateEmail('ana@demo.com').success).toBe(true);
    expect(validateUrl('https://x.com').success).toBe(true);
    expect(validateTime('09:30').success).toBe(true);
  });

  it('validan entradas incorrectas como error', () => {
    expect(validateWhatsApp('abc').success).toBe(false);
    expect(validateSlug('Mala').success).toBe(false);
    expect(validateHexColor('rojo').success).toBe(false);
    expect(validateEmail('no-email').success).toBe(false);
    expect(validateTime('99:99').success).toBe(false);
  });
});
