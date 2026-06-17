/**
 * Tests de integración de categorías y tags (Fase 2).
 *
 * Ejercita el service `category.service` (jerarquía de 2 niveles, orden,
 * unicidad, borrado bloqueado por uso) y las acciones relevantes contra
 * Firestore EMULADO, más la lectura de tags.
 *
 * Guía: docs/test/20-integration-guide.md (sección 4 · Categories / Tags).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server-session', () => ({ getServerSession: vi.fn() }));

import { getServerSession } from '@/lib/auth/server-session';
import {
  createCategory,
  updateCategory,
  reorderCategories,
  getCategoryTree,
  deleteCategory,
} from '@/features/products/services/category.service';
import {
  createCategoryAction,
  deleteCategoryAction,
} from '@/features/products/actions/category.actions';
import { getTags } from '@/features/products/services/tag.service';
import { adminDb, clearFirestore } from '../helpers/firebase-emulator';
import { makeProduct, makeSession, TEST_STORE_ID } from '../helpers/factories';

const categoriesCol = () =>
  adminDb().collection('stores').doc(TEST_STORE_ID).collection('categories');
const productsCol = () =>
  adminDb().collection('stores').doc(TEST_STORE_ID).collection('products');
const tagsCol = () =>
  adminDb().collection('stores').doc(TEST_STORE_ID).collection('tags');

/** Atajo: crea una categoría (principal por defecto, o subcategoría con parentId). */
const createCat = (name: string, parentId: string | null = null) =>
  createCategory(TEST_STORE_ID, { name, parentId });

beforeEach(async () => {
  await clearFirestore();
  vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
});

describe('createCategory', () => {
  it('crea una categoría principal con order autoincremental y slug derivado', async () => {
    const first = await createCat('Bebidas');
    const second = await createCat('Comidas');

    expect(first.order).toBe(0);
    expect(second.order).toBe(1);
    expect(first.slug).toBe('bebidas');
    expect(first.parentId).toBeNull();
  });

  it('rechaza un nombre duplicado en el mismo nivel (case-insensitive)', async () => {
    await createCat('Bebidas');
    await expect(createCat('bebidas')).rejects.toThrow(
      'Ya existe una categoría con ese nombre',
    );
  });

  it('crea una subcategoría bajo una principal', async () => {
    const parent = await createCat('Bebidas');
    const sub = await createCat('Gaseosas', parent.id);

    expect(sub.parentId).toBe(parent.id);
  });

  it('permite el mismo nombre de subcategoría bajo padres distintos', async () => {
    const p1 = await createCat('Bebidas');
    const p2 = await createCat('Limpieza');
    await createCat('Pack', p1.id);

    await expect(
      createCat('Pack', p2.id),
    ).resolves.toMatchObject({ name: 'Pack' });
  });

  it('rechaza una tercera profundidad de jerarquía', async () => {
    const parent = await createCat('Bebidas');
    const sub = await createCat('Gaseosas', parent.id);

    await expect(
      createCat('Cola', sub.id),
    ).rejects.toThrow('No se permiten más de 2 niveles de categorías');
  });
});

describe('updateCategory', () => {
  it('renombra y cambia el estado activo', async () => {
    const cat = await createCat('Bebidas');

    const updated = await updateCategory(TEST_STORE_ID, {
      id: cat.id,
      name: 'Bebidas Frías',
      isActive: false,
    });

    expect(updated.name).toBe('Bebidas Frías');
    expect(updated.slug).toBe('bebidas-frias');
    expect(updated.isActive).toBe(false);
  });

  it('lanza error si la categoría no existe', async () => {
    await expect(
      updateCategory(TEST_STORE_ID, { id: 'no-existe', name: 'X' }),
    ).rejects.toThrow('La categoría no existe');
  });
});

describe('reorderCategories', () => {
  it('persiste el nuevo orden y getCategoryTree lo respeta', async () => {
    const a = await createCat('Alfa');
    const b = await createCat('Beta');

    await reorderCategories(TEST_STORE_ID, [
      { id: b.id, order: 0 },
      { id: a.id, order: 1 },
    ]);

    const tree = await getCategoryTree(TEST_STORE_ID);
    expect(tree.map((c) => c.name)).toEqual(['Beta', 'Alfa']);
  });

  it('rechaza un id que no pertenece a la tienda', async () => {
    await expect(
      reorderCategories(TEST_STORE_ID, [{ id: 'fantasma', order: 0 }]),
    ).rejects.toThrow();
  });
});

describe('deleteCategory', () => {
  it('borra una categoría vacía', async () => {
    const cat = await createCat('Vacía');
    await deleteCategory(TEST_STORE_ID, cat.id);

    const snap = await categoriesCol().doc(cat.id).get();
    expect(snap.exists).toBe(false);
  });

  it('bloquea el borrado si la categoría tiene subcategorías', async () => {
    const parent = await createCat('Padre');
    await createCat('Hija', parent.id);

    await expect(deleteCategory(TEST_STORE_ID, parent.id)).rejects.toThrow('CATEGORY_NOT_EMPTY');
  });

  it('bloquea el borrado si la categoría tiene productos', async () => {
    const cat = await createCat('Con Productos');
    await productsCol().add(makeProduct({ categoryId: cat.id }));

    await expect(deleteCategory(TEST_STORE_ID, cat.id)).rejects.toThrow('CATEGORY_NOT_EMPTY');
  });
});

describe('Server Actions · categorías', () => {
  it('createCategoryAction devuelve error de negocio ante nombre duplicado', async () => {
    await createCat('Bebidas');

    const res = await createCategoryAction({ name: 'Bebidas' });
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.errors._form[0]).toContain('Ya existe una categoría');
  });

  it('deleteCategoryAction explica el uso cuando la categoría no está vacía', async () => {
    const parent = await createCat('Padre');
    await createCat('Hija', parent.id);

    const res = await deleteCategoryAction(parent.id);
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.errors._form[0]).toContain('subcategoría(s)');
  });

  it('createCategoryAction rechaza sin sesión', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    const res = await createCategoryAction({ name: 'X' });
    expect(res.success).toBe(false);
  });
});

describe('getTags', () => {
  it('devuelve los tags de la tienda', async () => {
    await tagsCol().doc('t1').set({ name: 'Nuevo', slug: 'nuevo', storeId: TEST_STORE_ID });
    await tagsCol().doc('t2').set({ name: 'Oferta', slug: 'oferta', storeId: TEST_STORE_ID });

    const tags = await getTags(TEST_STORE_ID);
    expect(tags.map((t) => t.name).sort()).toEqual(['Nuevo', 'Oferta']);
  });

  it('devuelve un array vacío cuando no hay tags', async () => {
    expect(await getTags(TEST_STORE_ID)).toEqual([]);
  });
});
