/**
 * Hook personalizado para gestión del perfil de tienda
 * 
 * Proporciona funcionalidades completas para CRUD del perfil,
 * validaciones, estado optimista y sincronización
 * 
 * @module features/dashboard/modules/profile/hooks
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuthClient } from '@/features/auth/hooks/use-auth-client';
import { profileFormSchema, customValidations } from '../validations/profile.validations';
import { ProfileFormData, StoreProfile, FormState } from '../types/store.type';
import { profileService } from '../services/profile.service';
import { calculateProfileCompleteness, profileToFormData, convertPeriodsScheduleToSimple } from '../utils/profile.utils';
// Removed profileLogger import to prevent page reloads

/**
 * Opciones de configuración del hook
 */
interface UseProfileOptions {
  /** Validación en tiempo real */
  realTimeValidation?: boolean;
  /** Estado optimista */
  optimisticUpdates?: boolean;
}

/**
 * Estado del hook useProfile
 */
interface UseProfileState {
  /** Perfil actual */
  profile: StoreProfile | null;
  /** Está cargando */
  isLoading: boolean;
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
 * Acciones disponibles del hook
 */
interface UseProfileActions {
  /** Cargar perfil */
  loadProfile: () => Promise<void>;
  /** Guardar perfil */
  saveProfile: (data: Partial<ProfileFormData>) => Promise<boolean>;
  /** Actualizar campo específico */
  updateField: (field: keyof ProfileFormData, value: any) => void;
  /** Validar slug único */
  validateSlug: (slug: string) => Promise<boolean>;
  /** Subir imagen */
  uploadImage: (file: File, type: 'logo' | 'banner' | 'profile') => Promise<string | null>;
  /** Resetear formulario */
  resetForm: () => void;
  /** Cambiar sección activa */
  setActiveSection: (section: string) => void;
  /** Refrescar datos */
  refresh: () => Promise<void>;
}

/**
 * Hook principal para gestión del perfil
 */
export const useProfile = (options: UseProfileOptions = {}) => {
  const {
    realTimeValidation = false,
    optimisticUpdates = true,
  } = options;

  const { user } = useAuthClient();

  // Estado local
  const [state, setState] = useState<UseProfileState>({
    profile: null,
    isLoading: false,
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

  const { watch, setValue, getValues, formState: { isDirty, errors } } = form;

  /**
   * Actualizar estadísticas del perfil
   */
  const updateStats = useCallback((profile: StoreProfile | null) => {
    if (!profile) return;

    const missingFields = getMissingFields(profile);

    // Manejar diferentes tipos de fecha
    let lastUpdated: Date;
    if (profile.metadata.updatedAt) {
      if (typeof profile.metadata.updatedAt.toDate === 'function') {
        // Es un Timestamp de Firebase
        lastUpdated = profile.metadata.updatedAt.toDate();
      } else if (profile.metadata.updatedAt instanceof Date) {
        // Es un objeto Date
        lastUpdated = profile.metadata.updatedAt;
      } else {
        // Es una fecha en otro formato, crear nueva Date
        lastUpdated = new Date(profile.metadata.updatedAt.toString());
      }
    } else {
      lastUpdated = new Date();
    }

    setState(prev => ({
      ...prev,
      stats: {
        missingFields,
        lastUpdated,
      },
    }));
  }, []);

  /**
   * Cargar perfil del usuario
   */
  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let profile = await profileService.getProfile(user.uid);
      setState(prev => ({ ...prev, profile, isLoading: false }));

      // Actualizar estadísticas inline para evitar dependencias circulares
      if (profile) {
        const missingFields = getMissingFields(profile);
        let lastUpdated: Date;

        if (profile.metadata.updatedAt) {
          if (typeof profile.metadata.updatedAt.toDate === 'function') {
            lastUpdated = profile.metadata.updatedAt.toDate();
          } else if (profile.metadata.updatedAt instanceof Date) {
            lastUpdated = profile.metadata.updatedAt;
          } else {
            lastUpdated = new Date(profile.metadata.updatedAt.toString());
          }
        } else {
          lastUpdated = new Date();
        }

        setState(prev => ({
          ...prev,
          stats: {
            missingFields,
            lastUpdated,
          },
        }));

        // Cargar datos en el formulario
        const formData = profileToFormData(profile);
        // Data converted for form

        // Usar reset para cargar los datos iniciales
        form.reset({
          ...form.getValues(), // Mantener valores por defecto
          ...formData, // Sobrescribir con datos del perfil
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar el perfil';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      toast.error('Error al cargar el perfil', {
        description: errorMessage,
      });
    }
  }, [user?.uid, form]);

  /**
   * Guardar perfil con patrón de rollback mejorado
   */
  const saveProfile = useCallback(async (data: Partial<ProfileFormData>): Promise<boolean> => {
    if (!user?.uid) return false;

    // Saving profile for user
    // Saving profile...

    setState(prev => ({
      ...prev,
      isSaving: true,
      error: null,
      formState: { ...prev.formState, isSaving: true }
    }));

    try {
      // Validar datos usando react-hook-form en lugar de Zod directamente
      // Validating data with react-hook-form
      const isValid = await form.trigger();

      if (!isValid) {
        // Validation failed

        setState(prev => ({
          ...prev,
          isSaving: false,
          formState: { ...prev.formState, isSaving: false }
        }));

        // No mostrar toast, dejar que los errores se muestren en los campos
        return false;
      }

      // Si la validación pasa, usar los datos del formulario
      const validatedData = form.getValues();
      // Data validated successfully

      // Guardar en el servidor
      // Sending data to updateProfile service
      const updatedProfile = await profileService.updateProfile(user.uid, validatedData);
      // Profile updated successfully on server

      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        isSaving: false,
        formState: { ...prev.formState, isSaving: false, isDirty: false }
      }));

      // Actualizar estadísticas inline para evitar dependencias circulares
      if (updatedProfile) {
        const missingFields = getMissingFields(updatedProfile);
        let lastUpdated: Date;

        if (updatedProfile.metadata.updatedAt) {
          if (typeof updatedProfile.metadata.updatedAt.toDate === 'function') {
            lastUpdated = updatedProfile.metadata.updatedAt.toDate();
          } else if (updatedProfile.metadata.updatedAt instanceof Date) {
            lastUpdated = updatedProfile.metadata.updatedAt;
          } else {
            lastUpdated = new Date(updatedProfile.metadata.updatedAt.toString());
          }
        } else {
          lastUpdated = new Date();
        }

        setState(prev => ({
          ...prev,
          stats: {
            missingFields,
            lastUpdated,
          },
        }));
      }

      toast.success('Perfil actualizado', {
        description: 'Los cambios se han guardado correctamente.',
      });

      return true;
    } catch (error) {
      console.error('Error saving profile on server:', error);

      setState(prev => ({
        ...prev,
        isSaving: false,
        formState: { ...prev.formState, isSaving: false }
      }));

      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el perfil';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));

      toast.error('Error del servidor', {
        description: 'Hubo un problema al guardar en el servidor. Inténtalo de nuevo.',
      });

      return false;
    }
  }, [user?.uid, form]);

  /**
   * Actualizar campo específico
   * Maneja tanto campos de primer nivel como campos anidados (ej: 'theme.primaryColor')
   */
  const updateField = useCallback((field: keyof ProfileFormData | string, value: any) => {
    // Updating field for user
    // Updating specific field

    // Si el campo contiene un punto, es un campo anidado
    if (typeof field === 'string' && field.includes('.')) {
      const [parentField, childField] = field.split('.') as [keyof ProfileFormData, string];
      const currentParentValue = getValues(parentField) || {};

      setValue(parentField, {
        ...(typeof currentParentValue === 'object' && currentParentValue !== null ? currentParentValue : {}),
        [childField]: value
      }, { shouldDirty: true, shouldValidate: realTimeValidation });
    } else {
      setValue(field as keyof ProfileFormData, value, { shouldDirty: true, shouldValidate: realTimeValidation });
    }

    setState(prev => ({
      ...prev,
      formState: { ...prev.formState, isDirty: true }
    }));
  }, [setValue, getValues, realTimeValidation]);

  /**
   * Validar slug único
   */
  const validateSlug = useCallback(async (slug: string): Promise<boolean> => {
    // Validating slug for user

    try {
      // Validating slug uniqueness
      const isValid = await customValidations.validateSlugAvailability(slug);

      // Slug validation completed

      return isValid;
    } catch (error) {
      console.error('Error validating slug:', error);
      return false;
    }
  }, []);

  /**
   * Subir imagen
   */
  const uploadImage = useCallback(async (
    file: File,
    type: 'logo' | 'banner' | 'profile'
  ): Promise<string | null> => {
    if (!user?.uid) return null;

    // Uploading image for user

    try {
      // Starting image upload

      const imageUrl = await profileService.uploadImage(user.uid, file, type);

      // Image uploaded successfully

      // Actualizar el perfil con la nueva imagen
      setState(prev => {
        if (prev.profile) {
          const updatedProfile = {
            ...prev.profile,
            theme: {
              ...prev.profile.theme,
              [type === 'logo' ? 'logoUrl' : type === 'banner' ? 'bannerUrl' : 'profileUrl']: imageUrl,
            },
          };
          return { ...prev, profile: updatedProfile };
        }
        return prev;
      });

      toast.success('Imagen subida', {
        description: 'La imagen se ha actualizado correctamente.',
      });

      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen';

      toast.error('Error al subir imagen', {
        description: errorMessage,
      });

      return null;
    }
  }, [user?.uid]);

  /**
   * Resetear formulario
   */
  const resetForm = useCallback(() => {
    // Resetting form for user
    // Resetting form

    form.reset();
    setState(prev => ({
      ...prev,
      formState: {
        ...prev.formState,
        isEditing: false,
        isDirty: false,
        errors: {},
      }
    }));
  }, [form]);

  /**
   * Cambiar sección activa
   */
  const setActiveSection = useCallback((section: string) => {
    // Setting active section for user
    // Changing active section

    setState(prev => ({
      ...prev,
      formState: { ...prev.formState, activeSection: section as any }
    }));
  }, []);

  /**
   * Refrescar datos
   */
  const refresh = useCallback(async () => {
    // Refreshing data for user
    // Refreshing profile data
    await loadProfile();
  }, [loadProfile]);

  // Auto-save functionality removed

  // Cargar perfil al montar
  useEffect(() => {
    if (user?.uid) {
      loadProfile();
    }
  }, [user?.uid, loadProfile]);

  // Actualizar estado del formulario de forma estable con debounce
  const prevErrorsRef = useRef<string>('');
  const prevIsDirtyRef = useRef<boolean>(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpiar timeout anterior
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce la actualización para evitar bucles infinitos
    updateTimeoutRef.current = setTimeout(() => {
      const newErrors = Object.keys(errors).reduce((acc, key) => {
        const errorMessage = errors[key as keyof typeof errors]?.message;
        if (errorMessage) {
          acc[key] = errorMessage;
        }
        return acc;
      }, {} as Record<string, string>);

      const errorsString = JSON.stringify(newErrors);
      const hasErrorsChanged = prevErrorsRef.current !== errorsString;
      const hasDirtyChanged = prevIsDirtyRef.current !== isDirty;

      if (hasErrorsChanged || hasDirtyChanged) {
        setState(prev => ({
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
    }, 100); // Debounce de 100ms

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [isDirty, errors]);

  // Valores computados
  const computedValues = useMemo(() => {
    const completeness = state.profile ? calculateProfileCompleteness(state.profile) : 0;
    return {
      isComplete: completeness >= 90,
      hasChanges: isDirty,
      canSave: isDirty && Object.keys(errors).length === 0,
    };
  }, [state.profile, isDirty, errors]);

  // Observar cambios en los valores del formulario
  const watchedValues = watch();

  return {
    // Estado
    ...state,
    ...computedValues,

    // Formulario
    form,
    watch,
    formData: watchedValues, // Usar valores observados en lugar de getValues()

    // Acciones
    loadProfile,
    saveProfile,
    updateField,
    validateSlug,
    uploadImage,
    resetForm,
    setActiveSection,
    refresh,
  };
};

/**
 * Utilidades auxiliares
 */

// La función profileToFormData se importa desde profile.utils.ts

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

  // Verificar campos requeridos
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

/**
 * Hook simplificado para casos básicos
 */
export const useBasicProfile = () => {
  return useProfile({
    realTimeValidation: true,
    optimisticUpdates: false,
  });
};

/**
 * Hook para formularios con validación en tiempo real
 */
export const useRealtimeProfile = () => {
  return useProfile({
    realTimeValidation: true,
    optimisticUpdates: true,
  });
};