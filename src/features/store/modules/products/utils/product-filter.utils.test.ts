/**
 * Tests unit de las utilidades de filtrado del catálogo (Fase 5 · lógica crítica).
 *
 * Estas funciones deciden qué ve el cliente en el catálogo público: búsqueda,
 * filtro por categoría/precio/disponibilidad, orden y agrupación. Un bug acá
 * oculta productos o muestra precios mal ordenados.
 *
 * Se usa un helper local con el shape UI `Product` (idProduct/category/available),
 * distinto del factory de Firestore de `test/helpers/factories.ts`.
 */
import { describe, expect, it } from 'vitest';
import type { Product } from '@/shared/types/store';
import {
  filterProductsBySearchTerm,
  filterProductsByCategory,
  sortProductsByPrice,
  groupProductsByCategory,
  groupProductsBySubcategory,
  filterProductsByPriceRange,
  filterProductsByAvailability,
  sortProductsAdvanced,
  applyAdvancedFilters,
  applyProductFilters,
  getUniqueCategories,
  getPriceRange,
  getFilterStats,
  filterProducts,
  productMatchesSearch,
  sortProducts,
} from './product-filter.utils';

let seq = 0;
function makeProduct(over: Partial<Product> = {}): Product {
  seq += 1;
  return {
    idProduct: `p${seq}`,
    name: 'Producto',
    description: 'Descripción',
    price: 1000,
    category: 'Bebidas',
    available: true,
    tags: [],
    ...over,
  };
}

describe('filterProductsBySearchTerm', () => {
  it('devuelve todos los productos cuando el término está vacío o son espacios', () => {
    const products = [makeProduct(), makeProduct()];
    expect(filterProductsBySearchTerm(products, '')).toHaveLength(2);
    expect(filterProductsBySearchTerm(products, '   ')).toHaveLength(2);
  });

  it('filtra por coincidencia en el nombre, ignorando mayúsculas', () => {
    const products = [makeProduct({ name: 'Café Latte' }), makeProduct({ name: 'Agua' })];
    const result = filterProductsBySearchTerm(products, 'café');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Café Latte');
  });
});

describe('productMatchesSearch', () => {
  it('coincide por nombre, descripción, categoría, subcategoría o tag', () => {
    const product = makeProduct({
      name: 'Latte',
      description: 'con leche',
      category: 'Cafés',
      subcategory: 'Calientes',
      tags: ['promo'],
    });
    expect(productMatchesSearch(product, 'latte')).toBe(true);
    expect(productMatchesSearch(product, 'leche')).toBe(true);
    expect(productMatchesSearch(product, 'cafés')).toBe(true);
    expect(productMatchesSearch(product, 'calientes')).toBe(true);
    expect(productMatchesSearch(product, 'promo')).toBe(true);
  });

  it('devuelve true cuando el término es vacío', () => {
    expect(productMatchesSearch(makeProduct(), '  ')).toBe(true);
  });

  it('devuelve false cuando no hay coincidencia', () => {
    expect(productMatchesSearch(makeProduct({ name: 'Agua' }), 'xyz')).toBe(false);
  });
});

describe('filterProductsByCategory', () => {
  it('devuelve todos cuando la categoría es "all"', () => {
    const products = [makeProduct({ category: 'A' }), makeProduct({ category: 'B' })];
    expect(filterProductsByCategory(products, 'all')).toHaveLength(2);
  });

  it('filtra por categoría exacta sin distinguir mayúsculas', () => {
    const products = [makeProduct({ category: 'Bebidas' }), makeProduct({ category: 'Comidas' })];
    const result = filterProductsByCategory(products, 'bebidas');
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Bebidas');
  });
});

describe('filterProductsByPriceRange', () => {
  it('incluye los productos dentro del rango [min, max] inclusive', () => {
    const products = [
      makeProduct({ price: 100 }),
      makeProduct({ price: 500 }),
      makeProduct({ price: 1000 }),
    ];
    const result = filterProductsByPriceRange(products, [500, 1000]);
    expect(result.map((p) => p.price)).toEqual([500, 1000]);
  });
});

describe('filterProductsByAvailability', () => {
  it('devuelve todos cuando onlyAvailable es false', () => {
    const products = [makeProduct({ available: false }), makeProduct({ available: true })];
    expect(filterProductsByAvailability(products, false)).toHaveLength(2);
  });

  it('excluye solo los explícitamente no disponibles (available === false)', () => {
    const products = [
      makeProduct({ available: false }),
      makeProduct({ available: true }),
      makeProduct({ available: undefined }),
    ];
    const result = filterProductsByAvailability(products, true);
    expect(result).toHaveLength(2);
  });
});

describe('sortProductsByPrice', () => {
  it('no muta el array original', () => {
    const products = [makeProduct({ price: 300 }), makeProduct({ price: 100 })];
    const original = [...products];
    sortProductsByPrice(products, 'asc');
    expect(products).toEqual(original);
  });

  it('ordena ascendente y descendente', () => {
    const products = [makeProduct({ price: 300 }), makeProduct({ price: 100 })];
    expect(sortProductsByPrice(products, 'asc').map((p) => p.price)).toEqual([100, 300]);
    expect(sortProductsByPrice(products, 'desc').map((p) => p.price)).toEqual([300, 100]);
  });

  it('devuelve la lista igual cuando no hay criterio', () => {
    const products = [makeProduct({ price: 300 }), makeProduct({ price: 100 })];
    expect(sortProductsByPrice(products, '').map((p) => p.price)).toEqual([300, 100]);
  });
});

describe('sortProductsAdvanced', () => {
  it('respeta el orden original con "none" y "newest"', () => {
    const products = [makeProduct({ price: 300 }), makeProduct({ price: 100 })];
    expect(sortProductsAdvanced(products, 'none')).toBe(products);
    expect(sortProductsAdvanced(products, 'newest').map((p) => p.price)).toEqual([300, 100]);
  });

  it('ordena por precio asc/desc y por nombre', () => {
    const products = [
      makeProduct({ name: 'Zeta', price: 300 }),
      makeProduct({ name: 'Alfa', price: 100 }),
    ];
    expect(sortProductsAdvanced(products, 'price-asc').map((p) => p.price)).toEqual([100, 300]);
    expect(sortProductsAdvanced(products, 'price-desc').map((p) => p.price)).toEqual([300, 100]);
    expect(sortProductsAdvanced(products, 'name').map((p) => p.name)).toEqual(['Alfa', 'Zeta']);
  });
});

describe('sortProducts (legacy SortOption)', () => {
  it('ordena por precio y por nombre en ambas direcciones', () => {
    const products = [
      makeProduct({ name: 'Zeta', price: 300 }),
      makeProduct({ name: 'Alfa', price: 100 }),
    ];
    expect(sortProducts(products, 'price-asc').map((p) => p.price)).toEqual([100, 300]);
    expect(sortProducts(products, 'price-desc').map((p) => p.price)).toEqual([300, 100]);
    expect(sortProducts(products, 'name-asc').map((p) => p.name)).toEqual(['Alfa', 'Zeta']);
    expect(sortProducts(products, 'name-desc').map((p) => p.name)).toEqual(['Zeta', 'Alfa']);
  });

  it('mantiene el orden con "newest" y no muta el original', () => {
    const products = [makeProduct({ name: 'A' }), makeProduct({ name: 'B' })];
    const original = [...products];
    expect(sortProducts(products, 'newest').map((p) => p.name)).toEqual(['A', 'B']);
    expect(products).toEqual(original);
  });
});

describe('groupProductsByCategory', () => {
  it('agrupa por categoría y usa "Sin categoría" cuando falta', () => {
    const products = [
      makeProduct({ category: 'Bebidas' }),
      makeProduct({ category: 'Bebidas' }),
      makeProduct({ category: undefined }),
    ];
    const grouped = groupProductsByCategory(products);
    expect(grouped['Bebidas']).toHaveLength(2);
    expect(grouped['Sin categoría']).toHaveLength(1);
  });
});

describe('groupProductsBySubcategory', () => {
  it('separa los productos con y sin subcategoría', () => {
    const products = [
      makeProduct({ subcategory: 'Calientes' }),
      makeProduct({ subcategory: 'Calientes' }),
      makeProduct({ subcategory: undefined }),
    ];
    const { withoutSubcategory, bySubcategory } = groupProductsBySubcategory(products);
    expect(withoutSubcategory).toHaveLength(1);
    expect(bySubcategory['Calientes']).toHaveLength(2);
  });
});

describe('getUniqueCategories', () => {
  it('devuelve [] para lista vacía o nula', () => {
    expect(getUniqueCategories([])).toEqual([]);
    // @ts-expect-error: probamos el guardia ante null.
    expect(getUniqueCategories(null)).toEqual([]);
  });

  it('devuelve categorías únicas y descarta vacías', () => {
    const products = [
      makeProduct({ category: 'A' }),
      makeProduct({ category: 'A' }),
      makeProduct({ category: 'B' }),
      makeProduct({ category: undefined }),
    ];
    expect(getUniqueCategories(products).sort()).toEqual(['A', 'B']);
  });
});

describe('getPriceRange', () => {
  it('devuelve el rango por defecto para lista vacía', () => {
    expect(getPriceRange([])).toEqual([0, 10000]);
  });

  it('devuelve [min, max] redondeados', () => {
    const products = [
      makeProduct({ price: 99.5 }),
      makeProduct({ price: 1500.2 }),
      makeProduct({ price: 750 }),
    ];
    expect(getPriceRange(products)).toEqual([99, 1501]);
  });
});

describe('getFilterStats', () => {
  it('calcula total, filtrados, porcentaje, categorías y rango', () => {
    const products = [
      makeProduct({ category: 'A', price: 100 }),
      makeProduct({ category: 'B', price: 200 }),
    ];
    const filtered = [products[0]];
    const stats = getFilterStats(products, filtered);
    expect(stats.total).toBe(2);
    expect(stats.filtered).toBe(1);
    expect(stats.percentage).toBe(50);
    expect(stats.categories).toBe(1);
    expect(stats.priceRange).toEqual([100, 100]);
  });

  it('porcentaje es 0 cuando no hay productos', () => {
    expect(getFilterStats([], []).percentage).toBe(0);
  });
});

describe('filterProducts (ProductFilters)', () => {
  const products = [
    makeProduct({ name: 'Café', category: 'Bebidas', price: 500, available: true }),
    makeProduct({ name: 'Té', category: 'Bebidas', price: 300, available: false }),
    makeProduct({ name: 'Torta', category: 'Postres', price: 1200, available: true }),
  ];

  it('sin filtros devuelve todo', () => {
    expect(filterProducts(products, {})).toHaveLength(3);
  });

  it('combina búsqueda, categoría, rango de precio y disponibilidad', () => {
    const result = filterProducts(products, {
      category: 'Bebidas',
      minPrice: 400,
      maxPrice: 1000,
      available: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Café');
  });

  it('descarta por precio mínimo y máximo', () => {
    expect(filterProducts(products, { minPrice: 600 }).map((p) => p.name)).toEqual(['Torta']);
    expect(filterProducts(products, { maxPrice: 400 }).map((p) => p.name)).toEqual(['Té']);
  });
});

describe('applyAdvancedFilters', () => {
  it('aplica la cadena completa y agrupa el resultado', () => {
    const products = [
      makeProduct({ name: 'Café', category: 'Bebidas', price: 500, available: true }),
      makeProduct({ name: 'Té', category: 'Bebidas', price: 300, available: false }),
      makeProduct({ name: 'Torta', category: 'Postres', price: 1200, available: true }),
    ];

    const result = applyAdvancedFilters(products, {
      searchTerm: '',
      selectedCategory: 'Bebidas',
      priceRange: [0, 10000],
      sortBy: 'price-asc',
      onlyAvailable: true,
    });

    expect(result.hasProducts).toBe(true);
    expect(result.totalProducts).toBe(1);
    expect(result.groupedProducts['Bebidas'][0].name).toBe('Café');
  });

  it('marca hasProducts false cuando nada pasa los filtros', () => {
    const result = applyAdvancedFilters([makeProduct({ category: 'A' })], {
      searchTerm: 'inexistente',
      selectedCategory: 'all',
      priceRange: [0, 10000],
      sortBy: 'none',
      onlyAvailable: false,
    });
    expect(result.hasProducts).toBe(false);
    expect(result.totalProducts).toBe(0);
  });
});

describe('applyProductFilters (legacy)', () => {
  it('filtra, ordena y agrupa con FilterOptions', () => {
    const products = [
      makeProduct({ name: 'Café', category: 'Bebidas', price: 500 }),
      makeProduct({ name: 'Torta', category: 'Postres', price: 1200 }),
    ];
    const result = applyProductFilters(products, {
      searchTerm: '',
      selectedCategory: 'Bebidas',
      sortByPrice: 'asc',
    });
    expect(result.hasProducts).toBe(true);
    expect(result.groupedProducts['Bebidas']).toHaveLength(1);
  });
});
