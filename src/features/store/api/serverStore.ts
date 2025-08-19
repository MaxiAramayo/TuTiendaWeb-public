/**
 * Server-side data fetching para Store feature
 * 
 * Funciones optimizadas para Server Components que manejan
 * datos públicos de tiendas (páginas sin autenticación).
 * 
 * @module features/store/api/serverStore
 */

import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { StoreData, Product } from "@/shared/types/store";
import { Product as FirebaseProduct, Category } from "@/shared/types/firebase.types";
import { cache } from "react";

/**
 * Serializa campos Timestamp de Firebase a strings ISO de forma recursiva
 * 
 * @param obj - Objeto que puede contener campos Timestamp
 * @returns Objeto con campos Timestamp serializados
 */
function serializeTimestamps(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Si es un array, serializar cada elemento
  if (Array.isArray(obj)) {
    return obj.map(item => serializeTimestamps(item));
  }
  
  const serialized = { ...obj };
  
  // Serializar todos los campos que pueden ser Timestamp
  Object.keys(serialized).forEach(key => {
    const value = serialized[key];
    
    // Si es un Timestamp de Firebase, convertir a ISO string
    if (value && typeof value === 'object' && value.toDate) {
      serialized[key] = value.toDate().toISOString();
    }
    // Si es un objeto anidado, serializar recursivamente
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      serialized[key] = serializeTimestamps(value);
    }
    // Si es un array, serializar cada elemento
    else if (Array.isArray(value)) {
      serialized[key] = value.map(item => serializeTimestamps(item));
    }
  });
  
  return serialized;
}

/**
 * Obtiene datos básicos de una tienda por slug (Server Side)
 * Utilizada en páginas públicas de tienda para SEO optimizado
 * 
 * @param slug - Slug único de la tienda almacenado en basicInfo.slug
 * @returns Datos de la tienda o null si no existe
 */
export const getStoreBySlug = cache(async (slug: string): Promise<StoreData | null> => {
  try {
    if (!slug) return null;

    const storesRef = collection(db, "stores");
    const q = query(storesRef, where("basicInfo.slug", "==", slug));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const storeDoc = querySnapshot.docs[0];
    const storeData = storeDoc.data() as any;

    // Serializar todos los campos Timestamp para Server Components
    return serializeTimestamps(storeData) as StoreData;
  } catch (error) {
    console.error("Error al obtener tienda por slug:", error);
    return null;
  }
});

/**
 * Obtiene categorías activas de una tienda por ID (Server Side)
 * 
 * @param storeId - ID de la tienda
 * @returns Map de categoryId -> nombre de categoría
 */
export const getStoreCategories = cache(async (storeId: string): Promise<Map<string, string>> => {
  try {
    if (!storeId) return new Map();

    const categoriesRef = collection(db, `stores/${storeId}/categories`);
    const q = query(categoriesRef, where("isActive", "==", true));
    const querySnapshot = await getDocs(q);

    const categoriesMap = new Map<string, string>();
    querySnapshot.forEach((doc) => {
      const categoryData = doc.data() as Category;
      categoriesMap.set(doc.id, categoryData.name);
    });

    return categoriesMap;
  } catch (error) {
    console.error("Error al obtener categorías de tienda:", error);
    return new Map();
  }
});

/**
 * Obtiene productos públicos de una tienda por ID (Server Side)
 * Utilizada en páginas de catálogo público
 * 
 * @param storeId - ID de la tienda
 * @returns Array de productos visibles o array vacío si hay error
 */
export const getStoreProducts = cache(async (storeId: string): Promise<Product[]> => {
  try {
    if (!storeId) return [];

    // Obtener categorías primero para mapear nombres
    const categoriesMap = await getStoreCategories(storeId);

    const productsRef = collection(db, `stores/${storeId}/products`);
    const q = query(productsRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);

    const products: Product[] = [];
    querySnapshot.forEach((doc) => {
      const productData = doc.data() as FirebaseProduct;
      
      // Obtener nombre de categoría o usar el ID si no se encuentra
      const categoryName = categoriesMap.get(productData.categoryId) || productData.categoryId || "Sin categoría";
      
      // Mapear de la estructura Firebase a la estructura legacy
      const mappedProduct: Product = {
        idProduct: doc.id,
        name: productData.name,
        description: productData.description || productData.shortDescription || "",
        price: productData.price,
        image: productData.imageUrls?.[0] || "",
        imageUrl: productData.imageUrls?.[0] || "",
        category: categoryName,
        available: productData.status === "active",
        tags: productData.tags || [],
        stock: productData.stockQuantity || 0,
        topics: []
      };
      
      // Serializar campos Timestamp del producto
      const serializedProduct = serializeTimestamps(mappedProduct);
      products.push(serializedProduct as Product);
    });

    return products;
  } catch (error) {
    console.error("Error al obtener productos de tienda:", error);
    return [];
  }
});
