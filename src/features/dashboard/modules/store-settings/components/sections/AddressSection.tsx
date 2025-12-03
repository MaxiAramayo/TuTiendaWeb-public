/**
 * Sección de dirección del perfil
 * 
 * Maneja la edición de la dirección física de la tienda
 * con validaciones y sugerencias de autocompletado
 * 
 * @module features/dashboard/modules/profile/components/sections
 */

'use client';

import React, { useState, useCallback, useTransition } from 'react';
import { motion } from 'framer-motion';
import { ProfileFormData, FormState, StoreProfile } from '../../types/store.type';
import { updateAddressAction } from '../../actions/profile.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleSelect } from '@/components/ui/simple-select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Navigation,
  Building,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Copy,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Props del componente
 */
interface AddressSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  profile: StoreProfile | null;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

/**
 * Provincias de Argentina
 */
const PROVINCES = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
  'Ciudad Autónoma de Buenos Aires'
];

/**
 * Ciudades principales por provincia (muestra)
 */
const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría', 'Pergamino'],
  'Córdoba': ['Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María', 'San Francisco'],
  'Santa Fe': ['Santa Fe', 'Rosario', 'Rafaela', 'Venado Tuerto', 'Reconquista'],
  'Mendoza': ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Maipú', 'Luján de Cuyo'],
  'Ciudad Autónoma de Buenos Aires': ['CABA'],
  // Agregar más según necesidad
};

/**
 * Componente de sección de dirección
 */
export function AddressSection({
  formData,
  formState,
  updateField,
  profile,
  onSave,
  isSaving = false,
}: AddressSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [isSectionSaving, setIsSectionSaving] = useState(false);
  // Toast functions using sonner
  const success = (message: string) => toast.success(message);
  const error = (message: string) => toast.error(message);

  const [addressValidation, setAddressValidation] = useState<{
    isComplete: boolean;
    missingFields: string[];
  }>({ isComplete: false, missingFields: [] });

  // Validar completitud de la dirección
  const validateAddress = useCallback(() => {
    const requiredFields = [
      { field: 'street', label: 'Calle' },
      { field: 'city', label: 'Ciudad' },
      { field: 'province', label: 'Provincia' },
    ];

    const missingFields = requiredFields
      .filter(({ field }) => !formData[field as keyof ProfileFormData] ||
        (formData[field as keyof ProfileFormData] as string).trim() === '')
      .map(({ label }) => label);

    const isComplete = missingFields.length === 0;

    setAddressValidation({ isComplete, missingFields });
    return isComplete;
  }, [formData]);

  // Efecto para validar cuando cambian los campos
  React.useEffect(() => {
    validateAddress();
  }, [validateAddress]);

  // Obtener ciudades disponibles para la provincia seleccionada
  const availableCities = formData.province
    ? CITIES_BY_PROVINCE[formData.province] || []
    : [];

  // Generar dirección completa
  const getFullAddress = useCallback(() => {
    const parts = [
      formData.street,
      formData.city,
      formData.province,
      formData.country,
      formData.zipCode
    ].filter(Boolean);

    return parts.join(', ');
  }, [formData.street, formData.city, formData.province, formData.country, formData.zipCode]);

  // Copiar dirección al portapapeles
  const copyAddress = useCallback(async () => {
    const fullAddress = getFullAddress();
    if (fullAddress) {
      try {
        await navigator.clipboard.writeText(fullAddress);
        success('Dirección copiada al portapapeles');
      } catch (err) {
        console.error('Error al copiar:', err);
        error('Error al copiar la dirección');
      }
    }
  }, [getFullAddress, success, error]);

  // Abrir en Google Maps
  const openInMaps = useCallback(() => {
    const fullAddress = getFullAddress();
    if (fullAddress) {
      const encodedAddress = encodeURIComponent(fullAddress);
      const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(url, '_blank');
    }
  }, [getFullAddress]);

  // Guardar cambios de la sección usando Server Action
  const handleSectionSave = useCallback(async () => {
    if (!profile?.id) {
      error('No se encontró el perfil de la tienda');
      return;
    }

    setIsSectionSaving(true);
    try {
      const addressData = {
        street: formData.street || '',
        city: formData.city || '',
        province: formData.province || '',
        country: formData.country || '',
        zipCode: formData.zipCode || ''
      };

      const result = await updateAddressAction(addressData);
      
      if (result.success) {
        success('Dirección guardada correctamente');
      } else {
        const errorMsg = result.errors._form?.[0] || 'Error al guardar la dirección. Inténtalo de nuevo.';
        error(errorMsg);
      }
    } catch (err) {
      console.error('Error al guardar dirección:', err);
      error('Error al guardar la dirección. Inténtalo de nuevo.');
    } finally {
      setIsSectionSaving(false);
    }
  }, [formData.street, formData.city, formData.province, formData.country, formData.zipCode, profile?.id, success, error]);

  // Función para marcar la sección como dirty cuando cambian los campos
  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    updateField(field, value);
    // markSectionDirty('address'); // Removed to prevent infinite re-renders
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header con título y botón de guardar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Dirección</h2>
          <p className="text-xs sm:text-sm text-gray-500">Configura la ubicación física de tu tienda</p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={isSectionSaving || !formState.isDirty}
          className="flex items-center justify-center space-x-2 w-full sm:w-auto"
          size="sm"
        >
          {isSectionSaving ? (
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Save className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          <span className="text-xs sm:text-sm">{isSectionSaving ? 'Guardando...' : 'Guardar cambios'}</span>
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
          <Building className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="text-sm sm:text-base">Calle y número *</span>
        </Label>
        <Input
          id="street"
          value={formData.street}
          onChange={(e) => handleFieldChange('street', e.target.value)}
          placeholder="Ej: Av. Corrientes 1234"
          className={cn(
            'text-sm',
            formState.errors.street && 'border-red-500 focus:border-red-500'
          )}
        />
        {formState.errors.street && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{formState.errors.street}</span>
          </p>
        )}
        <p className="text-xs sm:text-sm text-gray-500">
          Dirección completa donde se encuentra tu tienda.
        </p>
      </motion.div>

      {/* Ciudad y Provincia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Provincia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Label className="flex items-center space-x-2">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-sm sm:text-base">Provincia *</span>
          </Label>
          <SimpleSelect
            value={formData.province || ''}
            onChange={(e) => {
              const value = e.target.value;
              handleFieldChange('province', value);
              // Reset city when province changes
              if (formData.city && !CITIES_BY_PROVINCE[value]?.includes(formData.city)) {
                handleFieldChange('city', '');
              }
            }}
            className={cn(
              'text-sm',
              formState.errors.province && 'border-red-500'
            )}
            placeholder="Selecciona tu provincia"
            options={PROVINCES.map((province) => ({
              value: province,
              label: province
            }))}
          />
          {formState.errors.province && (
            <p className="text-xs sm:text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{formState.errors.province}</span>
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
          <Label htmlFor="city" className="flex items-center space-x-2">
            <Building className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-sm sm:text-base">Ciudad *</span>
          </Label>

          {availableCities.length > 0 ? (
            <SimpleSelect
              value={formData.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              className={cn(
                'text-sm',
                formState.errors.city && 'border-red-500'
              )}
              placeholder="Selecciona tu ciudad"
              options={[
                ...availableCities.map((city) => ({
                  value: city,
                  label: city
                })),
                {
                  value: "other",
                  label: "Otra ciudad..."
                }
              ]}
            />
          ) : (
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              placeholder="Ingresa tu ciudad"
              className={cn(
                'text-sm',
                formState.errors.city && 'border-red-500 focus:border-red-500'
              )}
            />
          )}

          {formState.errors.city && (
            <p className="text-xs sm:text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{formState.errors.city}</span>
            </p>
          )}
        </motion.div>
      </div>

      {/* Código postal y País */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Código postal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <Label htmlFor="zipCode" className="text-sm sm:text-base">Código postal</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => handleFieldChange('zipCode', e.target.value)}
            placeholder="1234"
            className={cn(
              'text-sm',
              formState.errors.zipCode && 'border-red-500 focus:border-red-500'
            )}
          />
          {formState.errors.zipCode && (
            <p className="text-xs sm:text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{formState.errors.zipCode}</span>
            </p>
          )}
          <p className="text-xs sm:text-sm text-gray-500">
            Opcional, pero ayuda con las entregas.
          </p>
        </motion.div>

        {/* País */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <Label className="text-sm sm:text-base">País</Label>
          <SimpleSelect
            value={formData.country || ''}
            onChange={(e) => handleFieldChange('country', e.target.value)}
            placeholder="Selecciona el país"
            className="text-sm"
            options={[
              { value: "Argentina", label: "🇦🇷 Argentina" },
              { value: "Chile", label: "🇨🇱 Chile" },
              { value: "Uruguay", label: "🇺🇾 Uruguay" },
              { value: "Paraguay", label: "🇵🇾 Paraguay" },
              { value: "Bolivia", label: "🇧🇴 Bolivia" },
              { value: "Brasil", label: "🇧🇷 Brasil" }
            ]}
          />
        </motion.div>
      </div>

      {/* Vista previa de la dirección */}
      {(formData.street || formData.city || formData.province) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={cn(
            'border rounded-lg p-2 sm:p-3',
            addressValidation.isComplete
              ? 'bg-green-50/50 border-green-100'
              : 'bg-yellow-50/50 border-yellow-100'
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">
                <div className="flex items-center space-x-2">
                  <MapPin className={cn(
                    'w-3 h-3',
                    addressValidation.isComplete ? 'text-green-500' : 'text-yellow-500'
                  )} />
                  <h4 className={cn(
                    'text-xs font-medium',
                    addressValidation.isComplete ? 'text-green-700' : 'text-yellow-700'
                  )}>
                    Dirección de tu tienda
                  </h4>
                </div>
              </div>

              <p className={cn(
                'text-xs mb-2 break-all',
                addressValidation.isComplete ? 'text-green-700' : 'text-yellow-700'
              )}>
                {getFullAddress() || 'Dirección incompleta'}
              </p>

              {!addressValidation.isComplete && (
                <p className="text-xs text-yellow-600">
                  Faltan: {addressValidation.missingFields.join(', ')}
                </p>
              )}
            </div>

            {addressValidation.isComplete && (
              <div className="flex space-x-1 w-full sm:w-auto justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyAddress}
                  className="flex items-center space-x-1 flex-1 sm:flex-none"
                >
                  <Copy className="w-3 h-3" />
                  <span className="text-xs sm:hidden">Copiar</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openInMaps}
                  className="flex items-center space-x-1 flex-1 sm:flex-none"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="text-xs sm:hidden">Mapas</span>
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-blue-50/50 border border-blue-100 rounded-lg p-3"
      >
        <h4 className="text-xs font-medium text-blue-700 mb-2">
          📍 ¿Por qué es importante la dirección?
        </h4>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Los clientes pueden encontrar tu tienda física</li>
          <li>• Permite calcular costos de delivery</li>
          <li>• Mejora la confianza y credibilidad</li>
          <li>• Facilita el retiro en local</li>
          <li>• Ayuda con el SEO local</li>
        </ul>
      </motion.div>

      {/* Consejos de ubicación */}
      {addressValidation.isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-green-50/50 border border-green-100 rounded-lg p-3"
        >
          <h4 className="text-xs font-medium text-green-700 mb-2">
            ✅ Dirección configurada correctamente
          </h4>
          <div className="text-xs text-green-600 space-y-2">
            <p>Tu dirección está completa y lista para:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Navigation className="w-3 h-3" />
                <span>Cálculo de delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <Building className="w-3 h-3" />
                <span>Retiro en local</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3" />
                <span>Búsquedas locales</span>
              </div>
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-3 h-3" />
                <span>Integración con mapas</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}


    </div>
  );
}

export default AddressSection;