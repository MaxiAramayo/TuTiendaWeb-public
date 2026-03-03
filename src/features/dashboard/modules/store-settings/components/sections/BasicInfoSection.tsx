'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { ProfileFormData, FormState, StoreProfile } from '../../types/store.type';
import { updateBasicInfoAction, validateSlugAction, getProfileAction } from '../../actions/profile.actions';
import { useProfileStore } from '../../stores/profile.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Store,
  Tag,
  Globe,
  Save
} from 'lucide-react';
import { validateSlug as validateSlugZod } from '../../schemas/profile.schema';
import { generateSlug } from '../../utils/profile.utils';

interface BasicInfoSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  profile: StoreProfile | null;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

const STORE_TYPES = [
  { value: 'retail', label: 'Tienda minorista', icon: '🏪' },
  { value: 'restaurant', label: 'Restaurante', icon: '🍽️' },
  { value: 'service', label: 'Servicios', icon: '🔧' },
  { value: 'digital', label: 'Productos digitales', icon: '💻' },
  { value: 'fashion', label: 'Moda y ropa', icon: '👕' },
  { value: 'beauty', label: 'Belleza y cuidado', icon: '💄' },
  { value: 'health', label: 'Salud y bienestar', icon: '🏥' },
  { value: 'sports', label: 'Deportes y fitness', icon: '⚽' },
  { value: 'electronics', label: 'Electrónicos', icon: '📱' },
  { value: 'home', label: 'Hogar y jardín', icon: '🏠' },
  { value: 'automotive', label: 'Automotriz', icon: '🚗' },
  { value: 'other', label: 'Otro', icon: '📦' },
];

export function BasicInfoSection({
  formData,
  formState,
  updateField,
  profile,
  onSave,
  isSaving = false,
}: BasicInfoSectionProps) {
  const [isBasicSaving, setIsBasicSaving] = useState(false);
  const { setProfile } = useProfileStore();
  const success = (message: string) => toast.success(message);
  const error = (message: string) => toast.error(message);

  const [slugValidation, setSlugValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
  }>({ isValidating: false, isValid: null, message: '' });

  const [autoSlug, setAutoSlug] = useState(true);

  const debouncedSlugValidation = useMemo(
    () => debounce(async (slug: string) => {
      if (!slug || slug === profile?.basicInfo.slug) {
        setSlugValidation({ isValidating: false, isValid: null, message: '' });
        return;
      }

      if (!validateSlugZod(slug).success) {
        setSlugValidation({
          isValidating: false,
          isValid: false,
          message: 'El slug debe tener entre 3-50 caracteres y solo contener letras, números y guiones',
        });
        return;
      }

      setSlugValidation({ isValidating: true, isValid: null, message: 'Verificando disponibilidad...' });

      try {
        const slugValidationResult = validateSlugZod(slug);
        if (!slugValidationResult.success) {
          setSlugValidation({
            isValidating: false,
            isValid: false,
            message: slugValidationResult.error?.issues[0]?.message || 'Slug inválido'
          });
          return;
        }
        
        const result = await validateSlugAction(slug);
        const isUnique = result.success && result.data?.available;
        
        setSlugValidation({
          isValidating: false,
          isValid: isUnique,
          message: isUnique ? 'Disponible' : 'Este nombre ya está en uso',
        });
      } catch (err) {
        setSlugValidation({
          isValidating: false,
          isValid: false,
          message: 'Error al verificar disponibilidad',
        });
      }
    }, 500),
    [profile?.basicInfo.slug]
  );

  useEffect(() => {
    if (formData.siteName) {
      debouncedSlugValidation(formData.siteName);
    }
    return () => {
      debouncedSlugValidation.cancel();
    };
  }, [formData.siteName, debouncedSlugValidation]);

  const handleStoreNameChange = useCallback((value: string) => {
    updateField('name', value);
    if (autoSlug && value) {
      const newSlug = generateSlug(value);
      updateField('siteName', newSlug);
    }
  }, [updateField, autoSlug]);

  const handleSlugChange = useCallback((value: string) => {
    setAutoSlug(false);
    updateField('siteName', value.toLowerCase());
  }, [updateField]);

  const handleRegenerateSlug = useCallback(() => {
    if (formData.name) {
      const newSlug = generateSlug(formData.name);
      updateField('siteName', newSlug);
      setAutoSlug(true);
    }
  }, [formData.name, updateField]);

  const handleSectionSave = useCallback(async () => {
    if (!profile?.id) {
      error('No se encontró el perfil de la tienda');
      return;
    }

    setIsBasicSaving(true);
    try {
      const storeTypeMap: Record<string, string> = {
        'services': 'service',
      };
      const mappedType = storeTypeMap[formData.storeType] || formData.storeType;

      const basicData = {
        name: formData.name,
        description: formData.description,
        slug: formData.siteName,
        type: mappedType as any,
      };

      const result = await updateBasicInfoAction(basicData);

      if (result.success) {
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          setProfile(refreshResult.data as StoreProfile);
        }
        success('Información básica guardada correctamente');
      } else {
        const errorMsg = result.errors._form?.[0] || 'Error al guardar la información. Inténtalo de nuevo.';
        error(errorMsg);
      }
    } catch (err) {
      error('Error al guardar la información. Inténtalo de nuevo.');
    } finally {
      setIsBasicSaving(false);
    }
  }, [formData, profile?.id, success, error, setProfile]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Información Básica</h3>
          <p className="text-sm text-gray-500 mt-1">Configura los datos principales de tu tienda</p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={isBasicSaving || !formState.isDirty}
          className="flex items-center justify-center gap-2 w-full sm:w-auto min-w-[140px]"
        >
          {isBasicSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isBasicSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="w-5 h-5 text-blue-600" />
            Detalles de la Tienda
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Nombre de la tienda */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Nombre de la tienda *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleStoreNameChange(e.target.value)}
              placeholder="Ej: Mi Tienda Online"
              className={cn(
                'max-w-xl',
                formState.errors.name && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {formState.errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{formState.errors.name}</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              Este será el nombre principal que verán los clientes en el catálogo y recibos.
            </p>
          </div>

          {/* Tipo de tienda */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Tipo de tienda *</Label>
            <div className="max-w-xl">
              <Select
                value={formData.storeType}
                onValueChange={(value) => updateField('storeType', value)}
              >
                <SelectTrigger className={cn(formState.errors.storeType && 'border-red-500')}>
                  <SelectValue placeholder="Selecciona el tipo de tu tienda" />
                </SelectTrigger>
                <SelectContent>
                  {STORE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formState.errors.storeType && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{formState.errors.storeType}</span>
              </p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <div className="flex items-center justify-between max-w-xl">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Descripción</Label>
              <span className={cn(
                'text-xs',
                formData.description.length < 50 ? 'text-amber-600' : 'text-green-600'
              )}>
                {formData.description.length}/500 caracteres
              </span>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe tu tienda, productos o servicios. Una buena descripción ayuda a los clientes a entender qué ofreces..."
              rows={4}
              className={cn(
                'max-w-xl resize-y',
                formState.errors.description && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
            {formState.errors.description && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                <span>{formState.errors.description}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5 text-indigo-500" />
            Enlace de la Tienda
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-sm font-semibold text-gray-700">URL personalizada *</Label>
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="flex flex-1 rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                    tutiendaweb.com.ar/
                  </span>
                  <Input
                    id="siteName"
                    value={formData.siteName}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="mi-tienda"
                    className={cn(
                      'rounded-l-none',
                      formState.errors.siteName && 'border-red-500 focus-visible:ring-red-500',
                      slugValidation.isValid === true && 'border-green-500 focus-visible:ring-green-500',
                      slugValidation.isValid === false && 'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegenerateSlug}
                  disabled={!formData.name}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <RefreshCw className="w-4 h-4" />
                  Auto-generar
                </Button>
              </div>

              {/* Validation Status */}
              <div className="flex items-center gap-2 max-w-xl">
                {slugValidation.isValidating && (
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{slugValidation.message}</span>
                  </div>
                )}
                {slugValidation.isValid === true && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">{slugValidation.message}</span>
                  </div>
                )}
                {slugValidation.isValid === false && (
                  <div className="flex items-center gap-1.5 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{slugValidation.message}</span>
                  </div>
                )}
              </div>
              
              {formState.errors.siteName && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{formState.errors.siteName}</span>
                </p>
              )}
              <p className="text-xs text-gray-500 max-w-xl">
                Este enlace es único y no podrá ser utilizado por otra tienda. Solo se permiten minúsculas, números y guiones medios.
              </p>
            </div>

            {/* Preview Box */}
            {formData.siteName && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 max-w-xl"
              >
                <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-2">
                  Vista Previa del Enlace
                </h4>
                <div className="flex items-center gap-2 text-indigo-700 bg-white border border-indigo-200 py-2 px-3 rounded-lg overflow-hidden">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    tutiendaweb.com.ar/{formData.siteName}
                  </span>
                </div>
                <p className="text-xs text-indigo-600/80 mt-2">
                  Comparte este enlace con tus clientes en redes sociales y WhatsApp.
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default BasicInfoSection;
