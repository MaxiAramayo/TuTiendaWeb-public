/**
 * Hook para gestión del perfil de tienda - Server Actions Version
 * 
 * Usa Server Actions para mutaciones y Zustand store para estado global.
 * El store solo se actualiza cuando se guarda exitosamente.
 * 
 * @module features/dashboard/modules/store-settings/hooks
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useAuthClient } from '@/features/auth/hooks/use-auth-client';
import { profileFormSchema } from '../schemas/profile.schema';
import type { ProfileFormData } from '../schemas/profile.schema';
import type { FormState, StoreProfile, ProfileSection } from '../types/store.type';
import { 
  getProfileAction,
  updateProfileAction, 
  validateSlugAction 
} from '../actions/profile.actions';
import { calculateProfileCompleteness, profileToFormData } from '../utils/profile.utils';
import { useProfileStore } from '../stores/profile.store';

/**
 * Opciones de configuración del hook
 */
interface UseProfileOptions {
  /** Validación en tiempo real */
  realTimeValidation?: boolean;
  /** Datos iniciales (pasados desde Server Component) */
  initialProfile?: StoreProfile | null;
}

/**
 * Estado local del formulario (no se persiste)
 */
interface UseProfileFormState {
  /** Está guardando */
  isSaving: boolean;
  /** Error actual */
  error: string | null;
  /** Estadísticas del perfil */
  stats: {
    missingFields: string[];
    lastUpdated: Date | null;
  };
  /** Estado del formulario */
  formState: FormState;
}

/**
 * Hook principal para gestión del perfil usando Server Actions + Zustand Store
 */
export const useProfile = (options: UseProfileOptions = {}) => {
  const {
    realTimeValidation = false,
    initialProfile = null,
  } = options;

  const { user } = useAuthClient();
  
  // Store global de Zustand - se actualiza solo al guardar
  const { 
    profile: storeProfile, 
    setProfile, 
    isLoading: storeIsLoading,
  } = useProfileStore();

  // Usar perfil del store o el inicial
  const profile = storeProfile || initialProfile;

  // Estado local del formulario (no persistido)
  const [formLocalState, setFormLocalState] = useState<UseProfileFormState>({
    isSaving: false,
    error: null,
    stats: {
      missingFields: [],
      lastUpdated: null,
    },
    formState: {
      isEditing: false,
      isSaving: false,
      isDirty: false,
      errors: {},
      activeSection: 'basic',
    },
  });

  // Estado de carga local
  const [isLoading, setIsLoading] = useState(!profile);

  // Configuración del formulario
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema) as any,
    mode: realTimeValidation ? 'onChange' : 'onSubmit',
    defaultValues: {
      name: '',
      description: '',
      siteName: '',
      storeType: 'other',
      whatsapp: '',
      country: 'Argentina',
      currency: 'ARS',
      language: 'es',
      schedule: {
        monday: { closed: true, periods: [] },
        tuesday: { closed: true, periods: [] },
        wednesday: { closed: true, periods: [] },
        thursday: { closed: true, periods: [] },
        friday: { closed: true, periods: [] },
        saturday: { closed: true, periods: [] },
        sunday: { closed: true, periods: [] }
      },
    },
  });

  const { watch, setValue, getValues, formState: { isDirty, errors }, reset } = form;

  /**
   * Cargar perfil del usuario usando Server Action
   */
  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    setFormLocalState(prev => ({ ...prev, error: null }));

    try {
      const result = await getProfileAction();
      
      if (!result.success) {
        const errorMsg = result.errors._form?.[0] || 'Error al cargar el perfil';
        setFormLocalState(prev => ({ ...prev, error: errorMsg }));
        setIsLoading(false);
        return;
      }

      const loadedProfile = result.data as StoreProfile | null;
      
      // Actualizar el store global
      if (loadedProfile) {
        setProfile(loadedProfile);
        
        // Actualizar estadísticas locales
        const missingFields = getMissingFields(loadedProfile);
        const lastUpdated = loadedProfile.metadata?.updatedAt 
          ? new Date(loadedProfile.metadata.updatedAt)
          : new Date();

        setFormLocalState(prev => ({
          ...prev,
          stats: { missingFields, lastUpdated },
        }));

        // Cargar datos en el formulario - reset completo con los datos del perfil
        const formData = profileToFormData(loadedProfile);
        reset(formData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar el perfil';
      setFormLocalState(prev => ({ ...prev, error: errorMessage }));
      setIsLoading(false);
      toast.error('Error al cargar el perfil', { description: errorMessage });
    }
  }, [user?.uid, setProfile, reset, getValues]);

  /**
   * Guardar perfil usando Server Action
   */
  const saveProfile = useCallback(async (data: Partial<ProfileFormData>): Promise<boolean> => {
    setFormLocalState(prev => ({
      ...prev,
      isSaving: true,
      error: null,
      formState: { ...prev.formState, isSaving: true }
    }));

    try {
      // Validar datos usando react-hook-form
      const isValid = await form.trigger();
      if (!isValid) {
        setFormLocalState(prev => ({
          ...prev,
          isSaving: false,
          formState: { ...prev.formState, isSaving: false }
        }));
        return false;
      }

      const validatedData = form.getValues();

      // Usar Server Action
      const result = await updateProfileAction(validatedData);
      
      if (!result.success) {
        // Mapear errores a los campos
        Object.entries(result.errors).forEach(([field, messages]) => {
          if (field !== '_form') {
            form.setError(field as keyof ProfileFormData, { message: messages[0] });
          }
        });
        
        const formError = result.errors._form?.[0];
        if (formError) {
          toast.error('Error al guardar', { description: formError });
        }
        
        setFormLocalState(prev => ({
          ...prev,
          isSaving: false,
          formState: { ...prev.formState, isSaving: false }
        }));
        return false;
      }

      // ✅ ÉXITO: Recargar el perfil y actualizar el store
      const refreshResult = await getProfileAction();
      if (refreshResult.success && refreshResult.data) {
        const updatedProfile = refreshResult.data as StoreProfile;
        // Actualizar el store global - esto hará que TopBar, Stats, etc. se actualicen
        setProfile(updatedProfile);
        
        // Reset del formulario con los nuevos valores para limpiar isDirty
        const newFormData = profileToFormData(updatedProfile);
        reset(newFormData);
      }

      setFormLocalState(prev => ({
        ...prev,
        isSaving: false,
        formState: { ...prev.formState, isSaving: false, isDirty: false }
      }));

      toast.success('Perfil actualizado', {
        description: 'Los cambios se han guardado correctamente.',
      });

      return true;
    } catch (error) {
      console.error('Error saving profile:', error);

      setFormLocalState(prev => ({
        ...prev,
        isSaving: false,
        formState: { ...prev.formState, isSaving: false }
      }));

      toast.error('Error del servidor', {
        description: 'Hubo un problema al guardar. Inténtalo de nuevo.',
      });

      return false;
    }
  }, [form, setProfile, reset]);

  /**
   * Actualizar campo específico
   */
  const updateField = useCallback((field: keyof ProfileFormData | string, value: any) => {
    if (typeof field === 'string' && field.includes('.')) {
      const [parentField, childField] = field.split('.') as [keyof ProfileFormData, string];
      const currentParentValue = getValues(parentField) || {};

      setValue(parentField, {
        ...(typeof currentParentValue === 'object' && currentParentValue !== null ? currentParentValue : {}),
        [childField]: value
      } as any, { shouldDirty: true, shouldValidate: realTimeValidation });
    } else {
      setValue(field as keyof ProfileFormData, value, { shouldDirty: true, shouldValidate: realTimeValidation });
    }

    setFormLocalState(prev => ({
      ...prev,
      formState: { ...prev.formState, isDirty: true }
    }));
  }, [setValue, getValues, realTimeValidation]);

  /**
   * Validar slug único usando Server Action
   */
  const validateSlug = useCallback(async (slug: string): Promise<boolean> => {
    try {
      const result = await validateSlugAction(slug);
      return result.success && result.data.available;
    } catch (error) {
      console.error('Error validating slug:', error);
      return false;
    }
  }, []);

  /**
   * Resetear formulario a los valores del store
   */
  const resetForm = useCallback(() => {
    if (profile) {
      const formData = profileToFormData(profile);
      reset(formData);
    } else {
      reset();
    }
    setFormLocalState(prev => ({
      ...prev,
      formState: {
        ...prev.formState,
        isEditing: false,
        isDirty: false,
        errors: {},
      }
    }));
  }, [profile, reset]);

  /**
   * Cambiar sección activa
   */
  const setActiveSection = useCallback((section: string) => {
    setFormLocalState(prev => ({
      ...prev,
      formState: { ...prev.formState, activeSection: section as ProfileSection }
    }));
  }, []);

  /**
   * Refrescar datos
   */
  const refresh = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Cargar perfil al montar si no hay datos
  useEffect(() => {
    if (user?.uid && !profile) {
      loadProfile();
    } else if (profile && !storeProfile) {
      // Si hay initialProfile pero no está en el store, agregarlo
      setProfile(profile);
      // También inicializar el formulario con estos datos
      const formData = profileToFormData(profile);
      reset(formData);
    }
  }, [user?.uid, profile, storeProfile, loadProfile, setProfile, reset]);

  // Sincronizar formulario cuando cambia el perfil del store
  const prevStoreProfileRef = useRef<StoreProfile | null>(null);
  const isFirstSyncRef = useRef(true);
  
  useEffect(() => {
    // Sincronizar si el perfil cambió O si es el primer sync con datos
    const shouldSync = storeProfile && (
      prevStoreProfileRef.current !== storeProfile || 
      isFirstSyncRef.current
    );
    
    if (shouldSync) {
      const formData = profileToFormData(storeProfile);
      reset(formData);
      
      const missingFields = getMissingFields(storeProfile);
      const lastUpdated = storeProfile.metadata?.updatedAt
        ? new Date(storeProfile.metadata.updatedAt)
        : new Date();
      
      setFormLocalState(prev => ({
        ...prev,
        stats: { missingFields, lastUpdated },
      }));
      
      setIsLoading(false);
      isFirstSyncRef.current = false;
    }
    prevStoreProfileRef.current = storeProfile;
  }, [storeProfile, reset]);

  // Actualizar estado del formulario con debounce
  const prevErrorsRef = useRef<string>('');
  const prevIsDirtyRef = useRef<boolean>(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const newErrors = Object.keys(errors).reduce((acc, key) => {
        const errorField = errors[key as keyof typeof errors];
        const errorMessage = typeof errorField?.message === 'string' 
          ? errorField.message 
          : undefined;
        if (errorMessage) {
          acc[key] = errorMessage;
        }
        return acc;
      }, {} as Record<string, string>);

      const errorsString = JSON.stringify(newErrors);
      const hasErrorsChanged = prevErrorsRef.current !== errorsString;
      const hasDirtyChanged = prevIsDirtyRef.current !== isDirty;

      if (hasErrorsChanged || hasDirtyChanged) {
        setFormLocalState(prev => ({
          ...prev,
          formState: {
            ...prev.formState,
            isDirty,
            errors: newErrors,
          }
        }));

        prevErrorsRef.current = errorsString;
        prevIsDirtyRef.current = isDirty;
      }
    }, 100);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [isDirty, errors]);

  // Valores computados
  const computedValues = useMemo(() => {
    const completeness = profile ? calculateProfileCompleteness(profile) : 0;
    return {
      isComplete: completeness >= 90,
      hasChanges: isDirty,
      canSave: isDirty && Object.keys(errors).length === 0,
    };
  }, [profile, isDirty, errors]);

  // Observar cambios en los valores del formulario
  const watchedValues = watch();

  return {
    // Estado del store (datos guardados)
    profile,
    isLoading: isLoading || storeIsLoading,
    
    // Estado local del formulario
    isSaving: formLocalState.isSaving,
    error: formLocalState.error,
    stats: formLocalState.stats,
    formState: formLocalState.formState,
    
    // Valores computados
    ...computedValues,

    // Formulario
    form,
    watch,
    formData: watchedValues,

    // Acciones
    loadProfile,
    saveProfile,
    updateField,
    validateSlug,
    resetForm,
    setActiveSection,
    refresh,
  };
};

/**
 * Obtiene los campos faltantes del perfil
 */
function getMissingFields(profile: StoreProfile): string[] {
  const required = [
    { field: 'basicInfo.name', label: 'Nombre de la tienda' },
    { field: 'basicInfo.description', label: 'Descripción' },
    { field: 'contactInfo.whatsapp', label: 'WhatsApp' },
  ];

  const missing: string[] = [];

  required.forEach(({ field, label }) => {
    const value = getNestedValue(profile, field);
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missing.push(label);
    }
  });

  return missing;
}

/**
 * Obtiene un valor anidado de un objeto
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
