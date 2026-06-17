/**
 * Tests de integración de autenticación y custom claims (Fase 2).
 *
 * A diferencia de las otras suites, aquí NO se mockea la sesión: se ejercita el
 * flujo real de claims contra el emulador de Auth (`adminAuth`), el armado de
 * `getServerSession` a partir de un ID token real (minteado vía REST del
 * emulador) y los servicios de usuario en Firestore.
 *
 * Guía: docs/test/20-integration-guide.md (sección 6 · Auth / claims).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Estado de cookie mutable compartido con el mock de next/headers.
const cookieState = vi.hoisted(() => ({ value: undefined as string | undefined }));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === 'session' && cookieState.value ? { value: cookieState.value } : undefined,
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

import {
  setUserClaims,
  getUserClaims,
  updateUserClaims,
  revokeUserTokens,
} from '@/features/auth/services/server/auth.service';
import { getServerSession } from '@/lib/auth/server-session';
import {
  createUserInFirestore,
  getUserFromFirestore,
  getOrCreateUserFromGoogle,
} from '@/features/user/services/user.service';
import { registerAction, checkSlugAvailabilityAction } from '@/features/auth/actions/auth.actions';
import { adminDb, adminAuth, clearFirestore, clearAuth } from '../helpers/firebase-emulator';
import { makeStore } from '../helpers/factories';

const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const API_KEY = 'fake-api-key';

/** Crea un usuario en el emulador de Auth vía REST y devuelve sus tokens. */
async function signUp(email: string, password = 'Password1') {
  const res = await fetch(
    `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  return (await res.json()) as { localId: string; idToken: string; refreshToken: string };
}

/** Refresca un ID token (recoge claims actualizados después de setUserClaims). */
async function refreshIdToken(refreshToken: string): Promise<string> {
  const res = await fetch(`http://${AUTH_HOST}/securetoken.googleapis.com/v1/token?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  });
  return ((await res.json()) as { id_token: string }).id_token;
}

beforeEach(async () => {
  await clearFirestore();
  await clearAuth();
  cookieState.value = undefined;
});

describe('Custom claims (Auth emulado)', () => {
  it('setea y lee claims', async () => {
    const user = await adminAuth().createUser({ email: 'claims@test.com' });
    await setUserClaims(user.uid, { storeId: 's1', role: 'owner' });

    expect(await getUserClaims(user.uid)).toEqual({ storeId: 's1', role: 'owner' });
  });

  it('actualiza claims haciendo merge con los existentes', async () => {
    const user = await adminAuth().createUser({ email: 'claims2@test.com' });
    await setUserClaims(user.uid, { storeId: 's1', role: 'owner' });

    await updateUserClaims(user.uid, { role: 'admin' });

    expect(await getUserClaims(user.uid)).toEqual({ storeId: 's1', role: 'admin' });
  });

  it('revoca tokens sin lanzar', async () => {
    const user = await adminAuth().createUser({ email: 'claims3@test.com' });
    await expect(revokeUserTokens(user.uid)).resolves.toBeUndefined();
  });
});

describe('getServerSession', () => {
  it('arma la sesión con storeId/role desde los claims del token', async () => {
    const { localId, refreshToken } = await signUp('session@test.com');
    await setUserClaims(localId, { storeId: 'store-x', role: 'owner' });
    cookieState.value = await refreshIdToken(refreshToken);

    const session = await getServerSession();
    expect(session?.userId).toBe(localId);
    expect(session?.storeId).toBe('store-x');
    expect(session?.role).toBe('owner');
  });

  it('hace fallback a Firestore cuando el token no tiene storeId en claims', async () => {
    const { localId, idToken } = await signUp('fallback@test.com');
    await adminDb()
      .collection('stores')
      .doc('store-fallback')
      .set(makeStore({ metadata: { ownerId: localId } }));
    cookieState.value = idToken;

    const session = await getServerSession();
    expect(session?.storeId).toBe('store-fallback');
    expect(session?.role).toBeNull();
  });

  it('devuelve null sin cookie de sesión', async () => {
    expect(await getServerSession()).toBeNull();
  });

  it('devuelve null con un token inválido', async () => {
    cookieState.value = 'token-invalido';
    expect(await getServerSession()).toBeNull();
  });
});

describe('user.service', () => {
  it('crea y lee un usuario en Firestore', async () => {
    await createUserInFirestore('u-fs', {
      email: 'fs@test.com',
      displayName: 'Usuario FS',
      role: 'user',
    });

    const user = await getUserFromFirestore('u-fs');
    expect(user?.email).toBe('fs@test.com');
    expect(user?.displayName).toBe('Usuario FS');
  });

  it('getUserFromFirestore devuelve null si no existe', async () => {
    expect(await getUserFromFirestore('no-existe')).toBeNull();
  });

  it('getOrCreateUserFromGoogle crea una vez y es idempotente', async () => {
    const decoded = {
      uid: 'g1',
      email: 'g@test.com',
      name: 'Goo Gle',
      picture: 'https://x/p.png',
    } as never;

    await getOrCreateUserFromGoogle(decoded);
    await getOrCreateUserFromGoogle(decoded); // segunda vez: no duplica

    const all = await adminDb().collection('users').get();
    expect(all.size).toBe(1);
    expect(all.docs[0].id).toBe('g1');
  });
});

describe('registerAction', () => {
  it('registra un usuario nuevo en Auth y Firestore', async () => {
    const fd = new FormData();
    fd.set('email', 'nuevo@test.com');
    fd.set('password', 'Password1');
    fd.set('displayName', 'Nuevo Usuario');

    const res = await registerAction(null, fd);
    expect(res.success).toBe(true);
    if (!res.success) return;

    const user = await getUserFromFirestore(res.data.userId);
    expect(user?.email).toBe('nuevo@test.com');
  });

  it('rechaza un email ya registrado', async () => {
    await adminAuth().createUser({ email: 'dup@test.com', password: 'Password1' });

    const fd = new FormData();
    fd.set('email', 'dup@test.com');
    fd.set('password', 'Password1');
    fd.set('displayName', 'Duplicado');

    const res = await registerAction(null, fd);
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.errors.email).toBeDefined();
  });

  it('rechaza una contraseña débil (sin mayúscula ni número)', async () => {
    const fd = new FormData();
    fd.set('email', 'weak@test.com');
    fd.set('password', 'password');
    fd.set('displayName', 'Débil');

    const res = await registerAction(null, fd);
    expect(res.success).toBe(false);
  });
});

describe('checkSlugAvailabilityAction', () => {
  it('devuelve disponible para un slug libre', async () => {
    const res = await checkSlugAvailabilityAction('slug-libre');
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.isAvailable).toBe(true);
  });

  it('devuelve no disponible para un slug ya tomado', async () => {
    await adminDb()
      .collection('stores')
      .doc('store-slug')
      .set(makeStore({ basicInfo: { name: 'X', slug: 'tomado', description: 'x', type: 'retail' } }));

    const res = await checkSlugAvailabilityAction('tomado');
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data.isAvailable).toBe(false);
  });

  it('rechaza un slug con formato inválido', async () => {
    const res = await checkSlugAvailabilityAction('AB'); // mayúsculas y muy corto
    expect(res.success).toBe(false);
  });
});
