/**
 * Tipos específicos para usuario
 * 
 * @module features/user/user.types
 */

import { Timestamp } from "firebase/firestore";
import { StoreProfile } from '@/features/dashboard/modules/store-settings/types/store.type';

/**
 * Usuario del sistema (datos completos de Firestore)
 */
export interface User {
  /** ID único del usuario */
  id: string;
  /** Email del usuario */
  email: string;
  /** Nombre para mostrar */
  displayName: string;
  /** Rol del usuario */
  role: 'owner';
  /** IDs de las tiendas asociadas al usuario */
  storeIds: string[];
  /** Preferencias del usuario */
  preferences?: {
    language?: 'es' | 'en';
  };
  /** Fecha de creación */
  createdAt: Timestamp;
  /** Fecha de última actualización */
  updatedAt: Timestamp;
}



/**
 * Estado del store de usuario
 */
export interface UserState {
  user: User | null;
  stores: StoreProfile[];
  isLoading: boolean;
  error: string | null;
}