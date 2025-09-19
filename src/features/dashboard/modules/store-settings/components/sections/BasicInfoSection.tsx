/**
 * Sección de información básica del perfil
 * 
 * Maneja la edición de nombre, descripción, slug, tipo y categoría
 * de la tienda con validaciones en tiempo real
 * 
 * @module features/dashboard/modules/profile/components/sections
 */

'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useProfileStore } from '../../api/profileStore';
import { BasicStoreInfo } from '../../types/store.type';
import { useAuthStore } from '@/features/auth/api/authStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, Loader2, RefreshCw, Store, Tag, Globe, Save, Phone, CheckCircle, ChevronDown } from 'lucide-react';
import { generateSlug, formatWhatsAppNumber } from '../../utils/profile.utils';
import { toast } from 'sonner';
import { profileService } from '../../services/profile.service';
import { COUNTRY_CODES } from '../../data/geographic.data';

import { 
  StoreType,
  validateBasicInfoFields,
  validateSingleField,
  validateWhatsApp
} from '../../validations/profile.validations';

interface BasicInfoSectionProps {
  formData: {
    name: string;
    description: string;
    siteName: string;
    storeType: string;
    whatsapp: string;
  };
  updateField: (field: string, value: any) => void;
}

const STORE_TYPE_OPTIONS = [
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

export function BasicInfoSection({ formData, updateField }: BasicInfoSectionProps) {
  const { updateBasicInfo, getSectionState, storeProfile } = useProfileStore();
  const { user } = useAuthStore();
  
  const [autoSlug, setAutoSlug] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const selectedCountryCodeRef = useRef('+54');

  const sectionState = getSectionState('basicInfo');

  // Formato de WhatsApp
  const whatsappFormatted = useMemo(() => {
    return formData.whatsapp ? formatWhatsAppNumber(formData.whatsapp) : '';
  }, [formData.whatsapp]);

  // Código de país actual
  const currentCountryCode = useMemo(() => {
    if (!formData.whatsapp) return '+54';
    const match = formData.whatsapp.match(/^(\+\d{1,4})/);
    return match ? match[1] : '+54';
  }, [formData.whatsapp]);

  // Manejar cambios de campos con validación simple
  const handleFieldChange = useCallback((field: string, value: string) => {
    updateField(field, value);
    
    // Validar campo individual (sin verificación de slug único)
    const error = validateSingleField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error || '' }));

    // Auto-generar slug para nombre
    if (field === 'name' && autoSlug && value) {
      const newSlug = generateSlug(value);
      updateField('siteName', newSlug);
      // Limpiar error de slug cuando se auto-genera
      setFormErrors(prev => ({ ...prev, siteName: '' }));
    }
  }, [updateField, autoSlug]);

  // Manejar cambio de slug
  const handleSlugChange = useCallback((value: string) => {
    setAutoSlug(false);
    const cleanValue = value.toLowerCase();
    updateField('siteName', cleanValue);
    
    // Validar slug (sin verificación de unicidad)
    const error = validateSingleField('siteName', cleanValue);
    setFormErrors(prev => ({ ...prev, siteName: error || '' }));
  }, [updateField]);

  // Regenerar slug
  const handleRegenerateSlug = useCallback(() => {
    if (formData.name) {
      const newSlug = generateSlug(formData.name);
      updateField('siteName', newSlug);
      setAutoSlug(true);
      setFormErrors(prev => ({ ...prev, siteName: '' }));
    }
  }, [formData.name, updateField]);

  // Manejar WhatsApp
  const handleWhatsAppChange = useCallback((value: string) => {
    const cleaned = value.replace(/[^\d\s\-+]/g, '');
    if (cleaned !== formData.whatsapp) {
      handleFieldChange('whatsapp', cleaned);
    }
  }, [formData.whatsapp, handleFieldChange]);

  // Guardar sección con validación completa
  const handleSectionSave = useCallback(async () => {
    if (!user?.id || !storeProfile?.id) {
      toast.error('No se pudo identificar la tienda');
      return;
    }
    
    try {
      // Validar todos los campos incluyendo verificación de slug único
      const validation = await validateBasicInfoFields(
        {
          name: formData.name,
          description: formData.description,
          siteName: formData.siteName,
          storeType: formData.storeType,
          whatsapp: formData.whatsapp,
        },
        // Función para verificar slug único usando el servicio
        (slug, excludeStoreId) => profileService.isSlugUnique(slug, excludeStoreId),
        storeProfile.id // Excluir la tienda actual
      );

      if (!validation.isValid) {
        setFormErrors(validation.errors);
        toast.error('Por favor corrige los errores antes de continuar');
        return;
      }

      setFormErrors({});
      
      // Guardar datos validados
      const basicData: Partial<BasicStoreInfo> = {
        name: validation.data.name,
        description: validation.data.description,
        slug: validation.data.siteName,
        type: validation.data.storeType as StoreType,
        whatsapp: validation.data.whatsapp,
      };
      
      const success = await updateBasicInfo(basicData);
      
      if (success) {
        toast.success('Información básica guardada correctamente');
      } else {
        toast.error('Error al guardar la información');
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      toast.error('Error al guardar la información');
    }
  }, [user?.id, storeProfile?.id, formData, updateBasicInfo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Información básica</h2>
          <p className="text-sm text-gray-500">Configura los datos principales de tu tienda</p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={sectionState.isSaving}
          className="flex items-center space-x-2"
          size="sm"
        >
          {sectionState.isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{sectionState.isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
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
          <Store className="w-4 h-4" />
          <span>Nombre de la tienda *</span>
        </Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder="Ej: Mi Tienda Online"
          className={cn(formErrors.name && 'border-red-500')}
        />
        {formErrors.name && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>{formErrors.name}</span>
          </p>
        )}
      </motion.div>

      {/* Descripción */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Describe tu tienda, productos o servicios..."
          rows={4}
          className={cn(formErrors.description && 'border-red-500')}
        />
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {(formData.description || '').length}/500 caracteres
          </p>
          {formErrors.description && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.description}</span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Nombre del sitio (slug) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <Label htmlFor="siteName" className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <span>Nombre del sitio *</span>
        </Label>
        
        <div className="flex space-x-2">
          <div className="flex-1">
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                tutienda.com/
              </span>
              <Input
                id="siteName"
                value={formData.siteName || ''}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="mi-tienda"
                className={cn(
                  'rounded-l-none',
                  formErrors.siteName && 'border-red-500'
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
            title="Regenerar desde el nombre"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        {formErrors.siteName && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>{formErrors.siteName}</span>
          </p>
        )}
      </motion.div>

      {/* Tipo de tienda */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <Label className="flex items-center space-x-2">
          <Tag className="w-4 h-4" />
          <span>Tipo de tienda *</span>
        </Label>
        
        <Select
          value={formData.storeType || ''}
          onValueChange={(value) => handleFieldChange('storeType', value)}
        >
          <SelectTrigger className={cn(formErrors.storeType && 'border-red-500')}>
            <SelectValue placeholder="Selecciona el tipo de tu tienda" />
          </SelectTrigger>
          <SelectContent>
            {STORE_TYPE_OPTIONS.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center space-x-2">
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {formErrors.storeType && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>{formErrors.storeType}</span>
          </p>
        )}
      </motion.div>

      {/* WhatsApp */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <Label htmlFor="whatsapp" className="flex items-center space-x-2">
          <Phone className="w-4 h-4" />
          <span>WhatsApp de contacto *</span>
        </Label>
        
        <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-lg shadow-sm transition-all duration-300 hover:border-green-300 focus-within:border-green-500">
          {/* Selector de país */}
          <div className="relative flex-shrink-0">
            <select
              value={currentCountryCode}
              onChange={(e) => {
                const value = e.target.value;
                selectedCountryCodeRef.current = value;
                if (!formData.whatsapp || formData.whatsapp.trim() === '') {
                  updateField('whatsapp', value + ' ');
                } else {
                  const numberWithoutCode = formData.whatsapp.replace(/^\+\d{1,4}\s*/, '');
                  updateField('whatsapp', value + ' ' + numberWithoutCode);
                }
              }}
              className="h-12 pl-3 pr-8 bg-transparent border-0 text-sm font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-0 appearance-none"
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <div className="absolute right-0 top-2 bottom-2 w-px bg-gray-200"></div>
          </div>
          
          {/* Input principal */}
          <Input
            id="whatsapp"
            value={formData.whatsapp ? formData.whatsapp.replace(/^\+\d{1,4}\s*/, '') : ''}
            onChange={(e) => {
              const value = e.target.value;
              const fullNumber = selectedCountryCodeRef.current + ' ' + value;
              handleWhatsAppChange(fullNumber);
            }}
            placeholder="Ej: 9 11 1234-5678"
            className={cn(
              'h-12 border-0 bg-transparent px-3 focus:ring-0 focus:outline-none placeholder:text-gray-400 flex-1',
              formErrors.whatsapp && 'text-red-600'
            )}
          />
          
          {/* Indicador de estado */}
          {formData.whatsapp && (
            <div className="flex-shrink-0 pr-3">
              {!formErrors.whatsapp ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          )}
        </div>
        
        {formErrors.whatsapp && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>{formErrors.whatsapp}</span>
          </p>
        )}
        
        {/* Formato sugerido */}
        {whatsappFormatted && whatsappFormatted !== formData.whatsapp && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-700 mb-1">Formato sugerido:</p>
            <p className="text-sm font-mono text-blue-700 bg-white px-2 py-1 rounded border">
              {whatsappFormatted}
            </p>
          </div>
        )}
      </motion.div>

      {/* Preview de la URL */}
      {formData.siteName && !formErrors.siteName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Vista previa de tu tienda
          </h4>
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800 font-mono">
              tutienda.com/{formData.siteName}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default BasicInfoSection;