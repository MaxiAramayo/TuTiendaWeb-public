/**
 * Store global para el perfil de la tienda
 * 
 * Centraliza el estado del perfil para que todos los componentes
 * (TopBar, ProfileStats, etc.) se actualicen cuando se guarda.
 * 
 * NOTA: No se usa persistencia porque los datos deben venir frescos
 * del servidor en cada carga de página.
 * 
 * @module features/dashboard/modules/store-settings/stores
 */

import { create } from 'zustand';
import type { StoreProfile } from '../types/store.type';

/**
 * Estado del store
 */
interface ProfileStoreState {
  /** Perfil actual de la tienda (datos guardados) */
  profile: StoreProfile | null;
  /** Indica si se está cargando el perfil */
  isLoading: boolean;
  /** Indica si se está guardando */
  isSaving: boolean;
  /** Error actual */
  error: string | null;
  /** Última actualización */
  lastUpdated: Date | null;
}

/**
 * Acciones del store
 */
interface ProfileStoreActions {
  /** Establece el perfil (usado después de cargar o guardar) */
  setProfile: (profile: StoreProfile | null) => void;
  /** Actualiza campos específicos del perfil */
  updateProfile: (updates: Partial<StoreProfile>) => void;
  /** Establece el estado de carga */
  setLoading: (isLoading: boolean) => void;
  /** Establece el estado de guardado */
  setSaving: (isSaving: boolean) => void;
  /** Establece un error */
  setError: (error: string | null) => void;
  /** Limpia el store (logout) */
  clear: () => void;
}

type ProfileStore = ProfileStoreState & ProfileStoreActions;

/**
 * Estado inicial
 */
const initialState: ProfileStoreState = {
  profile: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastUpdated: null,
};

/**
 * Store del perfil SIN persistencia
 * Los datos siempre vienen frescos del servidor
 */
export const useProfileStore = create<ProfileStore>()(
  (set, get) => ({
    ...initialState,

    setProfile: (profile) => {
      set({ 
        profile, 
        lastUpdated: new Date(),
        error: null,
      });
    },

    updateProfile: (updates) => {
      const current = get().profile;
      if (!current) return;

      set({
        profile: {
          ...current,
          ...updates,
          // Merge nested objects
          basicInfo: {
            ...current.basicInfo,
            ...(updates.basicInfo || {}),
          },
          contactInfo: {
            ...current.contactInfo,
            ...(updates.contactInfo || {}),
          },
          theme: {
            ...current.theme,
            ...(updates.theme || {}),
          },
          address: updates.address !== undefined 
            ? { ...current.address, ...updates.address }
            : current.address,
          socialLinks: updates.socialLinks !== undefined
            ? { ...current.socialLinks, ...updates.socialLinks }
            : current.socialLinks,
        },
        lastUpdated: new Date(),
      });
    },

    setLoading: (isLoading) => set({ isLoading }),

    setSaving: (isSaving) => set({ isSaving }),

    setError: (error) => set({ error }),

    clear: () => set(initialState),
  })
);

/**
 * Selectores para optimizar re-renders
 */
export const useProfileName = () => 
  useProfileStore((state) => state.profile?.basicInfo?.name);

export const useProfileLogo = () => 
  useProfileStore((state) => state.profile?.theme?.logoUrl);

export const useProfileBasicInfo = () => 
  useProfileStore((state) => state.profile?.basicInfo);

export const useProfileTheme = () => 
  useProfileStore((state) => state.profile?.theme);

export const useProfileSubscription = () => 
  useProfileStore((state) => state.profile?.subscription);

export const useIsProfileLoading = () => 
  useProfileStore((state) => state.isLoading);

export const useIsProfileSaving = () => 
  useProfileStore((state) => state.isSaving);
