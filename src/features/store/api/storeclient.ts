import { db } from "@/lib/firebase/client";
import {
  QueryDocumentSnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { create } from "zustand";
import { StoreData } from "@/shared/types/store";

interface userState {
  store: StoreData | null;
  getStore: (slug: string) => void;
  setStore: (store: StoreData) => void;
}

export const useStoreClient = create<userState>((set, get) => ({
  store: null,

  getStore: async (slug: string) => {
    console.log('🔍 [useStoreClient] getStore called with slug:', slug);
    try {
      if (slug) {
        console.log('🔍 [useStoreClient] Creating query for slug:', slug);
        const docRef = collection(db, "stores");
        const q = query(docRef, where("basicInfo.slug", "==", slug));
        console.log('🔍 [useStoreClient] Executing query...');
        const querySnapshot = await getDocs(q);
        console.log('🔍 [useStoreClient] Query completed. Empty?', querySnapshot.empty);
        console.log('🔍 [useStoreClient] Number of docs found:', querySnapshot.docs.length);

        if (!querySnapshot.empty) {
          // Si hay documentos en el resultado de la consulta
          const data = querySnapshot.docs[0].data() as StoreData;
          console.log('🔍 [useStoreClient] Store data found:', data);
          set({ store: data }); // Establece el estado de la tienda con los datos obtenidos
          console.log('🔍 [useStoreClient] Store state updated');
        } else {
          console.log("🔍 [useStoreClient] No existe documento para el slug:", slug);
        }
      } else {
        console.log('🔍 [useStoreClient] No slug provided');
      }
    } catch (err) {
      console.log("🔍 [useStoreClient] Error al obtener la tienda:", err);
    }
  },

  setStore: (store) => set({ store }),
}));
