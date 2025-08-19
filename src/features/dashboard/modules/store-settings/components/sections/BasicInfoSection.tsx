/**
 * Sección de información básica del perfil
 * 
 * Maneja la edición de nombre, descripción, slug, tipo y categoría
 * de la tienda con validaciones en tiempo real
 * 
 * @module features/dashboard/modules/profile/components/sections
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ProfileFormData, FormState, StoreProfile } from '../../types/store.type';
import { useProfileStore, type BasicInfoData } from '../../api/profileStore';
import { useAuthStore } from '@/features/auth/api/authStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { validateSlug as validateSlugZod } from '@shared/validations';
  import { generateSlug } from '../../utils/profile.utils';
  import { debounce } from 'lodash';
import { toast } from 'sonner';

/**
 * Props del componente
 */
interface BasicInfoSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  validateSlug: (slug: string) => Promise<boolean>;
  profile: StoreProfile | null;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

/**
 * Tipos de tienda disponibles
 */
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


/**
 * Componente de sección de información básica
 */
export function BasicInfoSection({
  formData,
  formState,
  updateField,
  validateSlug,
  profile,
  onSave,
  isSaving = false,
}: BasicInfoSectionProps) {
  const { updateBasicInfo, sections } = useProfileStore();
  const { user } = useAuthStore();
  // Toast functions using sonner
  const success = (message: string) => toast.success(message);
  const error = (message: string) => toast.error(message);
  
  // Obtener el estado de guardado de la sección básica
  const basicSectionState = sections.basic || { isSaving: false, isDirty: false, lastSaved: null, error: null };
  const isBasicSaving = basicSectionState.isSaving;
  
  const [slugValidation, setSlugValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
  }>({ isValidating: false, isValid: null, message: '' });
  
  const [autoSlug, setAutoSlug] = useState(true);

  // Validación de slug con debounce
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
         const isUnique = true; // TODO: Implementar verificación de unicidad
        setSlugValidation({
          isValidating: false,
          isValid: isUnique,
          message: isUnique ? 'Disponible' : 'Este nombre ya está en uso',
        });
      } catch (error) {
        setSlugValidation({
          isValidating: false,
          isValid: false,
          message: 'Error al verificar disponibilidad',
        });
      }
    }, 500),
    [validateSlug, profile?.basicInfo.slug]
  );

  // Efecto para validar slug cuando cambia
  useEffect(() => {
    if (formData.siteName) {
      debouncedSlugValidation(formData.siteName);
    }
    
    return () => {
      debouncedSlugValidation.cancel();
    };
  }, [formData.siteName, debouncedSlugValidation]);

  // Manejar cambio de nombre de tienda
  const handleStoreNameChange = useCallback((value: string) => {
    updateField('name', value);
    
    // Auto-generar slug si está habilitado
    if (autoSlug && value) {
      const newSlug = generateSlug(value);
      updateField('siteName', newSlug);
    }
  }, [updateField, autoSlug]);

  // Manejar cambio manual de slug
  const handleSlugChange = useCallback((value: string) => {
    setAutoSlug(false);
    updateField('siteName', value.toLowerCase());
  }, [updateField]);

  // Regenerar slug automáticamente
  const handleRegenerateSlug = useCallback(() => {
    if (formData.name) {
      const newSlug = generateSlug(formData.name);
      updateField('siteName', newSlug);
      setAutoSlug(true);
    }
  }, [formData.name, updateField]);
  
  // Manejar guardado de la sección
  const handleSectionSave = useCallback(async () => {
    if (!user?.id) {
      error('No se pudo identificar al usuario');
      return;
    }
    
    if (!profile?.id) {
      error('No se encontró el perfil de la tienda');
      return;
    }
    
    try {
      const basicData: BasicInfoData = {
        name: formData.name,
        description: formData.description,
        slug: formData.siteName,
        type: formData.storeType,
      };
      
      const result = await updateBasicInfo(profile.id, basicData);
      
      if (result) {
        success('Información básica guardada correctamente');
      } else {
        error('Error al guardar la información. Inténtalo de nuevo.');
      }
    } catch (err) {
      error('Error al guardar la información. Inténtalo de nuevo.');
    }
  }, [user?.id, formData.name, formData.description, formData.siteName, formData.storeType, updateBasicInfo, profile?.id, success, error]);


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header con título y botón de guardar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Información básica</h2>
          <p className="text-xs sm:text-sm text-gray-500">Configura los datos principales de tu tienda</p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={isBasicSaving || !formState.isDirty}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          size="sm"
        >
          {isBasicSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="text-sm">{isBasicSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>

      {/* Nombre de la tienda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <Label htmlFor="name" className="flex items-center space-x-2">
          <Store className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-sm sm:text-base">Nombre de la tienda *</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleStoreNameChange(e.target.value)}
          placeholder="Ej: Mi Tienda Online"
          className={cn(
            'text-sm',
            formState.errors.name && 'border-red-500 focus:border-red-500'
          )}
        />
        {formState.errors.name && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{formState.errors.name}</span>
          </p>
        )}
        <p className="text-xs sm:text-sm text-gray-500">
          Este será el nombre principal de tu tienda que verán los clientes.
        </p>
      </motion.div>

      {/* Descripción */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <Label htmlFor="description" className="text-sm sm:text-base">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => {
            updateField('description', e.target.value);
          }}
          placeholder="Describe tu tienda, productos o servicios..."
          rows={4}
          className={cn(
            'text-sm',
            formState.errors.description && 'border-red-500 focus:border-red-500'
          )}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
          <p className="text-xs sm:text-sm text-gray-500">
            Una buena descripción ayuda a los clientes a entender qué ofreces.
          </p>
          <span className={cn(
            'text-xs sm:text-sm',
            formData.description.length < 50 ? 'text-red-500' : 'text-green-600'
          )}>
            {formData.description.length}/500
          </span>
        </div>
        {formState.errors.description && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{formState.errors.description}</span>
          </p>
        )}
      </motion.div>

      {/* Nombre del sitio (slug) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <Label htmlFor="siteName" className="flex items-center space-x-2">
          <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-sm sm:text-base">Nombre del sitio *</span>
        </Label>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex-1">
            <div className="flex">
              <span className="inline-flex items-center px-2 sm:px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm">
                tutienda.com/
              </span>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="mi-tienda"
                className={cn(
                  'rounded-l-none text-sm',
                  formState.errors.siteName && 'border-red-500 focus:border-red-500',
                  slugValidation.isValid === true && 'border-green-500',
                  slugValidation.isValid === false && 'border-red-500'
                )}
              />
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegenerateSlug}
            disabled={!formData.name}
            className="flex items-center justify-center space-x-1 w-full sm:w-auto"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Regenerar</span>
          </Button>
        </div>
        
        {/* Estado de validación del slug */}
        <div className="flex items-center space-x-2">
          {slugValidation.isValidating && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              <span className="text-xs sm:text-sm">{slugValidation.message}</span>
            </div>
          )}
          
          {slugValidation.isValid === true && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{slugValidation.message}</span>
            </div>
          )}
          
          {slugValidation.isValid === false && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{slugValidation.message}</span>
            </div>
          )}
        </div>
        
        {formState.errors.siteName && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{formState.errors.siteName}</span>
          </p>
        )}
        
        <p className="text-xs sm:text-sm text-gray-500">
          Esta será la URL de tu tienda. Solo letras, números y guiones.
        </p>
      </motion.div>

      {/* Tipo de tienda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <Label className="flex items-center space-x-2">
          <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-sm sm:text-base">Tipo de tienda *</span>
        </Label>
        
        <Select
          value={formData.storeType}
          onValueChange={(value) => {
            updateField('storeType', value);
          }}
        >
          <SelectTrigger className={cn(
            'text-sm',
            formState.errors.storeType && 'border-red-500'
          )}>
            <SelectValue placeholder="Selecciona el tipo de tu tienda" />
          </SelectTrigger>
          <SelectContent>
            {STORE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center space-x-2">
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {formState.errors.storeType && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{formState.errors.storeType}</span>
          </p>
        )}
      </motion.div>


      {/* Preview de la URL */}
      {formData.siteName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4"
        >
          <h4 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">
            Vista previa de tu tienda
          </h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              <span className="text-xs sm:text-sm text-blue-800 font-mono break-all">
                tutienda.com/{formData.siteName}
              </span>
            </div>
            <p className="text-xs text-blue-700">
              Los clientes podrán acceder a tu tienda desde esta URL.
            </p>
          </div>
        </motion.div>
      )}
      

    </div>
  );
}

export default BasicInfoSection;