import { db } from "@/lib/firebase/client";
import { collection, getDocs, query, where, doc } from "firebase/firestore";
import { Product, StoreData } from "@/shared/types/store";

/**
 * Serializa campos Timestamp de Firebase a strings ISO
 * 
 * @param obj - Objeto que puede contener campos Timestamp
 * @returns Objeto con campos Timestamp serializados
 */
function serializeTimestamps(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const serialized = { ...obj };
  
  // Serializar campos de suscripción
  if (serialized.subscription) {
    const sub = serialized.subscription;
    if (sub.startDate?.toDate) {
      sub.startDate = sub.startDate.toDate().toISOString();
    }
    if (sub.endDate?.toDate) {
      sub.endDate = sub.endDate.toDate().toISOString();
    }
    if (sub.graceUntil?.toDate) {
      sub.graceUntil = sub.graceUntil.toDate().toISOString();
    }
  }
  
  // Serializar campos de metadata
  if (serialized.metadata) {
    const meta = serialized.metadata;
    if (meta.createdAt?.toDate) {
      meta.createdAt = meta.createdAt.toDate().toISOString();
    }
    if (meta.updatedAt?.toDate) {
      meta.updatedAt = meta.updatedAt.toDate().toISOString();
    }
  }
  
  // Serializar signupDate (compatibilidad)
  if (serialized.signupDate?.toDate) {
    serialized.signupDate = serialized.signupDate.toDate().toISOString();
  }
  
  return serialized;
}

export async function getStore(slug: string) {
  if (slug) {
    try {
      const docRef = collection(db, "stores");
      const q = query(docRef, where("basicInfo.slug", "==", slug));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Si hay documentos en el resultado de la consulta
        const data = querySnapshot.docs[0].data() as StoreData;
        const storeId = data.uid;

        // Obtener los productos de la tienda
        const productsRef = collection(db, `stores/${storeId}/products`);
        const productsSnapshot = await getDocs(productsRef);
        const productsData = productsSnapshot.docs.map(
          (doc) => doc.data() as Product
        );

        // Serializar datos de la tienda antes de retornar
        const serializedStore = serializeTimestamps(data);

        // Devolver los datos de la tienda y los productos
        return {
          store: serializedStore,
          products: productsData,
        };
      } else {
        console.log("No existe documento para el slug:", slug);
        return null;
      }
    } catch (error) {
      console.error("Error al obtener los datos de la tienda:", error);
      return null;
    }
  } else {
    console.error("Invalid slug:", slug);
    return null;
  }
}
