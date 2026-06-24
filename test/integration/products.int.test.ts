/**
 * Tests de integración de productos e import masivo (Fase 2).
 *
 * Cubre el service `product.service` (CRUD), la validación de subcategoría,
 * las Server Actions de toggle/delete (incluyendo limpieza real en Storage
 * emulado) y el import masivo `bulkCreateProducts` / `importProductsAction`
 * (dedupe case-insensitive, topes de categorías/subcategorías y batches de 450).
 *
 * Guía: docs/test/20-integration-guide.md (sección 3 · Products).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server-session', () => ({ getServerSession: vi.fn() }));

import { getServerSession } from '@/lib/auth/server-session';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
} from '@/features/products/services/product.service';
import {
  createCategory,
  isValidSubcategory,
} from '@/features/products/services/category.service';
import { bulkCreateProducts } from '@/features/products/services/product-import.service';
import {
  toggleProductStatusAction,
  deleteProductAction,
} from '@/features/products/actions/product.actions';
import { importProductsAction } from '@/features/products/actions/product-import.actions';
import { MAX_IMPORT_PRODUCTS } from '@/features/products/schemas/product-import.schema';
import type { ProductImportRow } from '@/features/products/schemas/product-import.schema';
import type { ProductImportRowRaw } from '@/features/products/schemas/product-import.schema';
import { adminDb, getAdminApp, clearFirestore } from '../helpers/firebase-emulator';
import { makeProduct, makeSession, TEST_STORE_ID } from '../helpers/factories';

const productsCol = () =>
  adminDb().collection('stores').doc(TEST_STORE_ID).collection('products');
const categoriesCol = () =>
  adminDb().collection('stores').doc(TEST_STORE_ID).collection('categories');

beforeEach(async () => {
  await clearFirestore();
  vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
});

describe('product.service · CRUD', () => {
  it('createProduct persiste con id y timestamps', async () => {
    const product = await createProduct(makeProduct({ name: 'Funda iPhone' }) as never, TEST_STORE_ID);

    expect(product.id).toBeTruthy();
    expect(product.name).toBe('Funda iPhone');
    expect(product.createdAt).toBeDefined();
    expect(product.updatedAt).toBeDefined();

    const snap = await productsCol().doc(product.id).get();
    expect(snap.exists).toBe(true);
  });

  it('updateProduct modifica campos y refresca updatedAt', async () => {
    const product = await createProduct(makeProduct({ price: 1000 }) as never, TEST_STORE_ID);

    const updated = await updateProduct(product.id, { price: 1500 }, TEST_STORE_ID);
    expect(updated.price).toBe(1500);

    const snap = await productsCol().doc(product.id).get();
    expect(snap.data()?.price).toBe(1500);
  });

  it('updateProduct lanza error si el producto no existe', async () => {
    await expect(updateProduct('no-existe', { price: 1 }, TEST_STORE_ID)).rejects.toThrow();
  });

  it('deleteProduct elimina el documento', async () => {
    const product = await createProduct(makeProduct() as never, TEST_STORE_ID);
    await deleteProduct(product.id, TEST_STORE_ID);
    expect(await getProductById(product.id, TEST_STORE_ID)).toBeNull();
  });

  it('deleteProduct lanza error si el producto no existe', async () => {
    await expect(deleteProduct('no-existe', TEST_STORE_ID)).rejects.toThrow();
  });
});

describe('isValidSubcategory', () => {
  it('devuelve true cuando la subcategoría pertenece a la categoría', async () => {
    const parent = await createCategory(TEST_STORE_ID, { name: 'Cargadores', parentId: null });
    const sub = await createCategory(TEST_STORE_ID, { name: 'USB-C', parentId: parent.id });

    expect(await isValidSubcategory(TEST_STORE_ID, parent.id, sub.id)).toBe(true);
  });

  it('devuelve false cuando la subcategoría no pertenece a esa categoría', async () => {
    const parent = await createCategory(TEST_STORE_ID, { name: 'Cargadores', parentId: null });
    const otra = await createCategory(TEST_STORE_ID, { name: 'Cables', parentId: null });
    const sub = await createCategory(TEST_STORE_ID, { name: 'USB-C', parentId: parent.id });

    expect(await isValidSubcategory(TEST_STORE_ID, otra.id, sub.id)).toBe(false);
    expect(await isValidSubcategory(TEST_STORE_ID, parent.id, 'no-existe')).toBe(false);
  });
});

describe('Server Actions · estado y borrado', () => {
  it('toggleProductStatusAction cambia active → inactive', async () => {
    const product = await createProduct(makeProduct({ status: 'active' }) as never, TEST_STORE_ID);

    const res = await toggleProductStatusAction(product.id, 'inactive');
    expect(res.success).toBe(true);

    const snap = await productsCol().doc(product.id).get();
    expect(snap.data()?.status).toBe('inactive');
  });

  it('deleteProductAction borra el documento y su imagen en Storage', async () => {
    // Subir una imagen real al Storage emulado y referenciarla en el producto.
    const bucket = getAdminApp().storage().bucket();
    const filePath = `stores/${TEST_STORE_ID}/products/img-test/foto.jpg`;
    await bucket.file(filePath).save(Buffer.from('fake-image'), {
      metadata: { contentType: 'image/jpeg' },
    });
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    const product = await createProduct(
      makeProduct({ imageUrls: [imageUrl] }) as never,
      TEST_STORE_ID,
    );

    const res = await deleteProductAction(product.id);
    expect(res.success).toBe(true);

    // El documento se fue y la imagen también.
    expect(await getProductById(product.id, TEST_STORE_ID)).toBeNull();
    const [exists] = await bucket.file(filePath).exists();
    expect(exists).toBe(false);
  });

  it('deleteProductAction devuelve error si el producto no existe', async () => {
    const res = await deleteProductAction('no-existe');
    expect(res.success).toBe(false);
  });
});

describe('bulkCreateProducts', () => {
  it('importa creando categorías, subcategorías y tags nuevos', async () => {
    const rows: ProductImportRow[] = [
      makeImportRow({ nombre: 'Coca 500ml', categoria: 'Bebidas', subcategoria: 'Gaseosas', tags: ['Nuevo'] }),
      makeImportRow({ nombre: 'Sprite 500ml', categoria: 'Bebidas', subcategoria: 'Gaseosas', tags: ['Nuevo'] }),
    ];

    const result = await bulkCreateProducts(TEST_STORE_ID, rows);

    expect(result.created).toBe(2);
    expect(result.categoriesCreated).toBe(2); // Bebidas (parent) + Gaseosas (sub)
    expect(result.tagsCreated).toBe(1); // Nuevo

    const snap = await productsCol().get();
    expect(snap.size).toBe(2);
  });

  it('deduplica categorías/subcategorías/tags case-insensitive', async () => {
    const rows: ProductImportRow[] = [
      makeImportRow({ nombre: 'A', categoria: 'Bebidas', subcategoria: 'Gaseosas', tags: ['Nuevo'] }),
      makeImportRow({ nombre: 'B', categoria: 'bebidas', subcategoria: 'gaseosas', tags: ['nuevo'] }),
    ];

    const result = await bulkCreateProducts(TEST_STORE_ID, rows);

    expect(result.created).toBe(2);
    expect(result.categoriesCreated).toBe(2); // una sola Bebidas y una sola Gaseosas
    expect(result.tagsCreated).toBe(1);

    const cats = await categoriesCol().get();
    expect(cats.size).toBe(2);
  });

  it('respeta el tope de categorías principales (50)', async () => {
    // Sembrar 50 categorías principales.
    const batch = adminDb().batch();
    for (let i = 0; i < 50; i++) {
      batch.set(categoriesCol().doc(`cat-${i}`), {
        name: `Categoria ${i}`,
        parentId: null,
        isActive: true,
        storeId: TEST_STORE_ID,
      });
    }
    await batch.commit();

    await expect(
      bulkCreateProducts(TEST_STORE_ID, [makeImportRow({ categoria: 'Una Más' })]),
    ).rejects.toThrow(/50 categorías/);
  });

  it('respeta el tope de subcategorías por padre (30)', async () => {
    const parent = await createCategory(TEST_STORE_ID, { name: 'Padre', parentId: null });
    const batch = adminDb().batch();
    for (let i = 0; i < 30; i++) {
      batch.set(categoriesCol().doc(`sub-${i}`), {
        name: `Sub ${i}`,
        parentId: parent.id,
        isActive: true,
        storeId: TEST_STORE_ID,
      });
    }
    await batch.commit();

    await expect(
      bulkCreateProducts(TEST_STORE_ID, [
        makeImportRow({ categoria: 'Padre', subcategoria: 'Sub Nueva' }),
      ]),
    ).rejects.toThrow(/30 subcategorías/);
  });

  it('escribe en múltiples batches cuando supera 450 operaciones', async () => {
    // 451 productos en una misma categoría → 451 ops de producto + 1 de categoría
    // → cruza el límite de 450 por batch.
    const rows: ProductImportRow[] = Array.from({ length: 451 }, (_, i) =>
      makeImportRow({ nombre: `Producto ${i}`, categoria: 'Masiva' }),
    );

    const result = await bulkCreateProducts(TEST_STORE_ID, rows);
    expect(result.created).toBe(451);

    const count = await productsCol().count().get();
    expect(count.data().count).toBe(451);
  });
});

describe('importProductsAction', () => {
  it('importa las filas válidas y reporta warnings de las inválidas', async () => {
    const rawRows: ProductImportRowRaw[] = [
      { nombre: 'Producto Uno', precio: '100', categoria: 'Cat' },
      { nombre: 'ab', precio: '100', categoria: 'Cat' }, // nombre < 3 → inválida
    ];

    const res = await importProductsAction(rawRows);
    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.created).toBe(1);
    expect(res.data.warnings).toHaveLength(1);
    expect(res.data.warnings[0]).toContain('Fila 3'); // índice + 2
  });

  it('rechaza un archivo vacío', async () => {
    const res = await importProductsAction([]);
    expect(res.success).toBe(false);
  });

  it('rechaza cuando se supera el máximo de filas por archivo', async () => {
    const rawRows: ProductImportRowRaw[] = Array.from({ length: 301 }, () => ({
      nombre: 'Producto',
      precio: '100',
      categoria: 'Cat',
    }));

    const res = await importProductsAction(rawRows);
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.errors._form[0]).toContain('máximo permitido es 300');
  });

  it('rechaza sin sesión', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never);
    const res = await importProductsAction([{ nombre: 'X', precio: '1', categoria: 'Cat' }]);
    expect(res.success).toBe(false);
  });

  it('el tope total backstopea un doble-submit (no excede MAX_IMPORT_PRODUCTS)', async () => {
    // Defensa primaria del doble-submit: el guard `isPending` en el diálogo
    // (product-import-dialog) impide la segunda invocación. Acá se verifica el
    // BACKSTOP del servidor: si dos imports llegaran igual (p. ej. doble-tap que
    // esquiva la UI), el re-chequeo de tope total impide superar el límite y
    // duplicar el lote completo.
    const half = Math.ceil(MAX_IMPORT_PRODUCTS * 0.6); // 0.6+0.6 = 1.2× → excede
    const rawRows: ProductImportRowRaw[] = Array.from({ length: half }, (_, i) => ({
      nombre: `Producto ${i}`,
      precio: '100',
      categoria: 'Importados',
    }));

    const first = await importProductsAction(rawRows);
    expect(first.success).toBe(true);

    const second = await importProductsAction(rawRows);
    expect(second.success).toBe(false);
    if (second.success) return;
    expect(second.errors._form[0]).toMatch(/límite|alcanzó/);

    // El segundo lote no se persistió: la colección quedó en el primer import.
    const count = await productsCol().count().get();
    expect(count.data().count).toBe(half);
  });
});

/** Construye una fila de import ya "parseada" (forma ProductImportRow). */
function makeImportRow(over: Partial<ProductImportRow> = {}): ProductImportRow {
  return {
    nombre: 'Producto',
    descripcion: '',
    precio: 100,
    costo: 0,
    categoria: 'Cat',
    subcategoria: undefined,
    tags: [],
    activo: true,
    extras: [],
    ...over,
  } as ProductImportRow;
}
