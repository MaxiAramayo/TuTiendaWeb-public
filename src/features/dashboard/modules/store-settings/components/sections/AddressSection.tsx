/**
 * Sección de dirección del perfil
 * 
 * Maneja la edición de la dirección física de la tienda
 * con validaciones y sugerencias de autocompletado
 * 
 * @module features/dashboard/modules/profile/components/sections
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProfileStore } from '../../api/profileStore';
import { useAuthStore } from '@/features/auth/api/authStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  MapPin, Building, AlertCircle, Save, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { PROVINCES, COUNTRIES, getCitiesByProvince } from '../../data/geographic.data';
import { 
  validateAddressFields,
  validateSingleField
} from '../../validations/profile.validations';

/**
 * Props del componente
 */
interface AddressSectionProps {
  formData: {
    street: string;
    city: string;
    province: string;
    country: string;
    zipCode: string;
  };
  updateField: (field: string, value: any) => void;
}

/**
 * Componente de sección de dirección
 */
export function AddressSection({ formData, updateField }: AddressSectionProps) {
  const { updateAddress, getSectionState, storeProfile } = useProfileStore();
  const { user } = useAuthStore();
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const sectionState = getSectionState('address');

  // Ciudades disponibles basadas en la provincia seleccionada
  const availableCities = useMemo(() => {
    return formData.province ? getCitiesByProvince(formData.province) : [];
  }, [formData.province]);

  // Dirección completa para preview
  const fullAddress = useMemo(() => {
    const parts = [
      formData.street,
      formData.city,
      formData.province,
      formData.country,
      formData.zipCode
    ].filter(Boolean);
    return parts.join(', ');
  }, [formData.street, formData.city, formData.province, formData.country, formData.zipCode]);

  // Verificar si la dirección está completa
  const isAddressComplete = useMemo(() => {
    return !!(formData.street && formData.city && formData.province);
  }, [formData.street, formData.city, formData.province]);

  // Manejar cambio de campo con validación
  const handleFieldChange = useCallback((field: string, value: string) => {
    updateField(field, value);
    
    // Validar campo individual usando validateSingleField
    const error = validateSingleField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error || '' }));

    // Limpiar ciudad cuando cambia la provincia
    if (field === 'province' && formData.city) {
      const cities = getCitiesByProvince(value);
      if (!cities.includes(formData.city)) {
        updateField('city', '');
        setFormErrors(prev => ({ ...prev, city: '' }));
      }
    }
  }, [updateField, formData.city]);


  // Guardar sección
  const handleSectionSave = useCallback(async () => {
    if (!user?.id || !storeProfile?.id) {
      toast.error('No se pudo identificar la tienda');
      return;
    }
    
    try {
      // Validar todos los campos de dirección
      const validation = validateAddressFields({
        street: formData.street,
        city: formData.city,
        province: formData.province,
        country: formData.country,
        zipCode: formData.zipCode,
      });

      if (!validation.isValid) {
        setFormErrors(validation.errors);
        toast.error('Por favor corrige los errores antes de continuar');
        return;
      }

      setFormErrors({});
      
      const success = await updateAddress(validation.data);
      
      if (success) {
        toast.success('Dirección guardada correctamente');
      } else {
        toast.error('Error al guardar la dirección');
      }
    } catch (err) {
      console.error('Error al guardar dirección:', err);
      toast.error('Error al guardar la dirección');
    }
  }, [user?.id, storeProfile?.id, formData, updateAddress]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dirección</h2>
          <p className="text-sm text-gray-500">Configura la ubicación física de tu tienda</p>
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

      {/* Calle y número */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <Label htmlFor="street" className="flex items-center space-x-2">
          <Building className="w-4 h-4" />
          <span>Calle y número</span>
        </Label>
        <Input
          id="street"
          value={formData.street || ''}
          onChange={(e) => handleFieldChange('street', e.target.value)}
          placeholder="Ej: Av. Corrientes 1234"
          className={cn(formErrors.street && 'border-red-500')}
        />
        {formErrors.street && (
          <p className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-4 h-4" />
            <span>{formErrors.street}</span>
          </p>
        )}
      </motion.div>

      {/* Provincia y Ciudad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Provincia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Label className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Provincia</span>
          </Label>
          <Select
            value={formData.province || ''}
            onValueChange={(value) => handleFieldChange('province', value)}
          >
            <SelectTrigger className={cn(formErrors.province && 'border-red-500')}>
              <SelectValue placeholder="Selecciona tu provincia" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.province && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.province}</span>
            </p>
          )}
        </motion.div>

        {/* Ciudad */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <Label className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Ciudad</span>
          </Label>
          
          {availableCities.length > 0 ? (
            <Select
              value={formData.city || ''}
              onValueChange={(value) => {
                if (value === "other") {
                  // Si selecciona "Otra ciudad", permitir input libre
                  updateField('city', '');
                } else {
                  handleFieldChange('city', value);
                }
              }}
            >
              <SelectTrigger className={cn(formErrors.city && 'border-red-500')}>
                <SelectValue placeholder="Selecciona tu ciudad" />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
                <SelectItem value="other">
                  Otra ciudad...
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={formData.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="Ingresa tu ciudad"
              className={cn(formErrors.city && 'border-red-500')}
            />
          )}
          
          {formErrors.city && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.city}</span>
            </p>
          )}
        </motion.div>
      </div>

      {/* Código postal y País */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Código postal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <Label htmlFor="zipCode">Código postal</Label>
          <Input
            id="zipCode"
            value={formData.zipCode || ''}
            onChange={(e) => handleFieldChange('zipCode', e.target.value)}
            placeholder="1234"
            className={cn(formErrors.zipCode && 'border-red-500')}
          />
          {formErrors.zipCode && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-4 h-4" />
              <span>{formErrors.zipCode}</span>
            </p>
          )}
        </motion.div>

        {/* País */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <Label>País</Label>
          <Select
            value={formData.country || 'Argentina'}
            onValueChange={(value) => handleFieldChange('country', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el país" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country.value} value={country.value}>
                  {country.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      </div>

      {/* Vista previa de la dirección */}
      {fullAddress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={cn(
            'border rounded-lg p-4',
            isAddressComplete 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          )}
        >
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className={cn(
              'w-4 h-4',
              isAddressComplete ? 'text-green-500' : 'text-yellow-500'
            )} />
            <h4 className={cn(
              'text-sm font-medium',
              isAddressComplete ? 'text-green-700' : 'text-yellow-700'
            )}>
              Dirección de tu tienda
            </h4>
          </div>
          
          <p className={cn(
            'text-sm',
            isAddressComplete ? 'text-green-700' : 'text-yellow-700'
          )}>
            {fullAddress}
          </p>
        </motion.div>
      )}

      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-blue-50 border border-blue-100 rounded-lg p-4"
      >
        <h4 className="text-sm font-medium text-blue-700 mb-2">
          📍 ¿Por qué es importante la dirección?
        </h4>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• Los clientes pueden encontrar tu tienda física</li>
          <li>• Permite calcular costos de delivery</li>
          <li>• Mejora la confianza y credibilidad</li>
          <li>• Facilita el retiro en local</li>
        </ul>
      </motion.div>
    </div>
  );
}

export default AddressSection;