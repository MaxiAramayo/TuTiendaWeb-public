"use client";
import { useEffect } from "react";
import { useStoreClient } from "@/features/store/api/storeclient";
import type { StoreData } from "@/shared/types/store";

interface Props {
  store: StoreData;
}

export const StoreSyncProvider = ({ store }: Props) => {
  const setStore = useStoreClient((state) => state.setStore);

  useEffect(() => {
    if (store) {
      setStore(store);
    }
  }, [store, setStore]);

  return null;
}; 