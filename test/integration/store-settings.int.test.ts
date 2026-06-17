/**
 * Tests de integración de configuración de tienda / perfil (Fase 2).
 *
 * Cubre `profileServerService` (lectura serializada, updates por sección,
 * unicidad de slug case-insensitive) y las Server Actions de perfil contra
 * Firestore EMULADO, incluyendo el merge por notación de punto sin pisar otras
 * secciones.
 *
 * Guía: docs/test/20-integration-guide.md (sección 5 · Store settings).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server-session', () => ({ getServerSession: vi.fn() }));

import { getServerSession } from '@/lib/auth/server-session';
import { profileServerService } from '@/features/dashboard/modules/store-settings/services/server/profile.server-service';
import {
  getProfileAction,
  updateBasicInfoAction,
  updateContactInfoAction,
} from '@/features/dashboard/modules/store-settings/actions/profile.actions';
import { adminDb, clearFirestore } from '../helpers/firebase-emulator';
import { makeStore, makeSession, TEST_STORE_ID } from '../helpers/factories';

const storesCol = () => adminDb().collection('stores');

beforeEach(async () => {
  await clearFirestore();
  vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
  await storesCol().doc(TEST_STORE_ID).set(makeStore());
});

describe('profileServerService · getProfile', () => {
  it('devuelve el perfil con timestamps serializados a string', async () => {
    const profile = await profileServerService.getProfile(TEST_STORE_ID);

    expect(profile).not.toBeNull();
    expect(profile?.basicInfo.name).toBe('Tienda Demo');
    expect(typeof profile?.metadata.createdAt).toBe('string');
    expect(typeof profile?.metadata.updatedAt).toBe('string');
  });

  it('devuelve null si la tienda no existe', async () => {
    expect(await profileServerService.getProfile('no-existe')).toBeNull();
  });
});

describe('profileServerService · updateBasicInfo', () => {
  it('actualiza nombre, descripción, slug (lowercased) y tipo', async () => {
    await profileServerService.updateBasicInfo(TEST_STORE_ID, {
      name: 'Nuevo Nombre',
      description: 'Una descripción suficientemente larga',
      slug: 'Nuevo-Slug',
      type: 'retail',
    });

    const data = (await storesCol().doc(TEST_STORE_ID).get()).data();
    expect(data?.basicInfo.name).toBe('Nuevo Nombre');
    expect(data?.basicInfo.slug).toBe('nuevo-slug'); // normalizado
    expect(data?.basicInfo.type).toBe('retail');
  });
});

describe('profileServerService · isSlugUnique', () => {
  it('es case-insensitive y considera ocupado el slug propio sin exclusión', async () => {
    // demo-store ya tiene slug 'tienda-demo'
    expect(await profileServerService.isSlugUnique('TIENDA-DEMO')).toBe(false);
    expect(await profileServerService.isSlugUnique('slug-libre')).toBe(true);
  });

  it('permite el slug propio cuando se excluye la tienda actual', async () => {
    expect(await profileServerService.isSlugUnique('tienda-demo', TEST_STORE_ID)).toBe(true);
  });
});

describe('updateBasicInfoAction · unicidad de slug', () => {
  it('rechaza un slug ya usado por OTRA tienda', async () => {
    await storesCol().doc('otra-tienda').set(
      makeStore({ id: 'otra-tienda', basicInfo: { name: 'Otra', slug: 'ocupado', description: 'x', type: 'retail' } }),
    );

    const res = await updateBasicInfoAction({
      name: 'Mi Tienda',
      description: 'Descripción larga válida',
      slug: 'ocupado',
      type: 'retail',
    });

    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.errors.slug).toBeDefined();
  });

  it('acepta conservar el slug propio', async () => {
    const res = await updateBasicInfoAction({
      name: 'Mi Tienda',
      description: 'Descripción larga válida',
      slug: 'tienda-demo', // el propio
      type: 'retail',
    });

    expect(res.success).toBe(true);
  });
});

describe('Server Actions · perfil', () => {
  it('getProfileAction devuelve el perfil con sesión válida', async () => {
    const res = await getProfileAction();
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data?.basicInfo.name).toBe('Tienda Demo');
  });

  it('getProfileAction rechaza sin sesión', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    const res = await getProfileAction();
    expect(res.success).toBe(false);
  });

  it('updateContactInfoAction actualiza el whatsapp sin pisar basicInfo', async () => {
    const res = await updateContactInfoAction({ whatsapp: '+5491155556666' });
    expect(res.success).toBe(true);

    const data = (await storesCol().doc(TEST_STORE_ID).get()).data();
    expect(data?.contactInfo.whatsapp).toBe('+5491155556666');
    // El merge por notación de punto no tocó otras secciones.
    expect(data?.basicInfo.name).toBe('Tienda Demo');
  });
});

describe('profileServerService · updateSettings', () => {
  it('actualiza métodos de pago/entrega conservando el resto del documento', async () => {
    await profileServerService.updateSettings(TEST_STORE_ID, {
      paymentMethods: [{ id: 'efectivo', name: 'Efectivo', enabled: false }],
      deliveryMethods: [{ id: 'delivery', name: 'Envío', enabled: true, price: 2500 }],
    });

    const data = (await storesCol().doc(TEST_STORE_ID).get()).data();
    expect(data?.settings.paymentMethods[0].enabled).toBe(false);
    expect(data?.settings.deliveryMethods[0].price).toBe(2500);
    expect(data?.basicInfo.name).toBe('Tienda Demo'); // intacto
  });
});
