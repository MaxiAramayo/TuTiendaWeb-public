/**
 * Store de Perfil de Tienda - Simplificado y sin duplicaciones
 * 
 * Maneja operaciones del perfil usando el profileService existente
 * Elimina toda duplicación de tipos y usa solo los tipos existentes
 * 
 * @module features/dashboard/modules/profile/api/profileStore
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { profileService } from '../services/profile.service';
import { 
  StoreProfile, 
  BasicStoreInfo,
  Address,
  WeeklySchedule,
  SocialLinks,
  ThemeConfig,
} from '../types/store.type';

interface StoreSettingsState {
  // === ESTADO ===
  storeProfile: StoreProfile | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
  sectionLoading: Record<string, boolean>;
  sectionErrors: Record<string, string | null>;

  // === ACCIONES ===
  loadStoreProfile: (userId: string) => Promise<void>;
  updateBasicInfo: (data: Partial<BasicStoreInfo>) => Promise<boolean>;
  updateAddress: (data: Partial<Address>) => Promise<boolean>;
  updateSchedule: (data: Partial<WeeklySchedule>) => Promise<boolean>;
  updateSocialLinks: (data: Partial<SocialLinks>) => Promise<boolean>;
  updateTheme: (data: Partial<ThemeConfig>) => Promise<boolean>;
  
  // === GETTERS ===
  getStoreName: () => string | null;
  getStoreSlug: () => string | null;
  getBasicInfo: () => BasicStoreInfo | null;
  getSectionState: (section: string) => { isSaving: boolean; error: string | null };
  
  // === UTILIDADES ===
  clearError: () => void;
  clearSectionError: (section: string) => void;
  clearStoreProfile: () => void;
}

export const useProfileStore = create<StoreSettingsState>()(
  persist(
    (set, get) => {
      // Helper para actualizar secciones
      const updateSection = async (
        sectionName: string, 
        updateFn: (storeId: string) => Promise<StoreProfile>
      ): Promise<boolean> => {
        const state = get();
        const storeId = state.storeProfile?.id;

        if (!storeId) {
          set(state => ({
            sectionErrors: { ...state.sectionErrors, [sectionName]: 'Tienda no encontrada' }
          }));
          return false;
        }

        set(state => ({
          sectionLoading: { ...state.sectionLoading, [sectionName]: true },
          sectionErrors: { ...state.sectionErrors, [sectionName]: null }
        }));
        
        try {
          const updatedProfile = await updateFn(storeId);
          
          set(state => ({ 
            storeProfile: updatedProfile,
            lastUpdate: Date.now(),
            sectionLoading: { ...state.sectionLoading, [sectionName]: false }
          }));
          
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          set(state => ({
            sectionLoading: { ...state.sectionLoading, [sectionName]: false },
            sectionErrors: { ...state.sectionErrors, [sectionName]: errorMessage }
          }));
          return false;
        }
      };

      return {
        // === ESTADO INICIAL ===
        storeProfile: null,
        isLoading: false,
        error: null,
        lastUpdate: null,
        sectionLoading: {},
        sectionErrors: {},

        // === CARGAR TIENDA ===
        loadStoreProfile: async (userId: string) => {
          const state = get();
          
          // Cache de 5 minutos
          const now = Date.now();
          const CACHE_TTL = 5 * 60 * 1000;
          
          if (state.storeProfile && 
              state.lastUpdate && 
              (now - state.lastUpdate) < CACHE_TTL) {
            console.log('🎯 Tienda desde cache:', state.storeProfile.basicInfo.name);
            return;
          }

          set({ isLoading: true, error: null });
          
          try {
            const store = await profileService.getStoreByUserId(userId);
            
            set({ 
              storeProfile: store,
              lastUpdate: now,
              error: null,
              isLoading: false 
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            set({ 
              storeProfile: null,
              error: errorMessage,
              isLoading: false 
            });
          }
        },

        // === ACTUALIZAR SECCIONES ===
        updateBasicInfo: async (data: Partial<BasicStoreInfo>) => {
          return await updateSection('basicInfo', (storeId) => 
            profileService.updateBasicInfo(storeId, data)
          );
        },

        updateAddress: async (data: Partial<Address>) => {
          return await updateSection('address', (storeId) => 
            profileService.updateAddress(storeId, data)
          );
        },

        updateSchedule: async (data: Partial<WeeklySchedule>) => {
          return await updateSection('schedule', (storeId) => 
            profileService.updateSchedule(storeId, data)
          );
        },

        updateSocialLinks: async (data: Partial<SocialLinks>) => {
          return await updateSection('socialLinks', (storeId) => 
            profileService.updateSocialLinks(storeId, data)
          );
        },

        updateTheme: async (data: Partial<ThemeConfig>) => {
          return await updateSection('theme', (storeId) => 
            profileService.updateTheme(storeId, data)
          );
        },


        // === GETTERS ===
        getStoreName: () => get().storeProfile?.basicInfo?.name || null,
        getStoreSlug: () => get().storeProfile?.basicInfo?.slug || null,
        getBasicInfo: () => get().storeProfile?.basicInfo || null,

        getSectionState: (section: string) => {
          const state = get();
          return {
            isSaving: state.sectionLoading[section] || false,
            error: state.sectionErrors[section] || null
          };
        },

        // === UTILIDADES ===
        clearError: () => set({ error: null }),
        clearSectionError: (section: string) => set(state => ({
          sectionErrors: { ...state.sectionErrors, [section]: null }
        })),
        clearStoreProfile: () => set({ 
          storeProfile: null, 
          lastUpdate: null, 
          error: null,
          sectionErrors: {},
          sectionLoading: {}
        }),
      };
    },
    {
      name: 'store-settings',
      partialize: (state) => ({
        storeProfile: state.storeProfile,
        lastUpdate: state.lastUpdate,
      }),
    }
  )
);
