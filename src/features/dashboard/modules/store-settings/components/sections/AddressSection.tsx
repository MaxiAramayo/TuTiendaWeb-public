'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProfileFormData, FormState, StoreProfile } from '../../types/store.type';
import { updateAddressAction, getProfileAction } from '../../actions/profile.actions';
import { useProfileStore } from '../../stores/profile.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleSelect } from '@/components/ui/simple-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Navigation,
  Building,
  AlertCircle,
  ExternalLink,
  Copy,
  Save,
  Loader2,
  Map
} from 'lucide-react';
import { toast } from 'sonner';

interface AddressSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  profile: StoreProfile | null;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

const PROVINCES = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 
  'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'Ciudad Autónoma de Buenos Aires'
];

const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Olavarría', 'Pergamino'],
  'Córdoba': ['Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María', 'San Francisco'],
  'Santa Fe': ['Santa Fe', 'Rosario', 'Rafaela', 'Venado Tuerto', 'Reconquista'],
  'Mendoza': ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Maipú', 'Luján de Cuyo'],
  'Ciudad Autónoma de Buenos Aires': ['CABA'],
};

export function AddressSection({
  formData,
  formState,
  updateField,
  profile,
  onSave,
  isSaving = false,
}: AddressSectionProps) {
  const [isSectionSaving, setIsSectionSaving] = useState(false);
  const { setProfile } = useProfileStore();
  const success = (message: string) => toast.success(message);
  const error = (message: string) => toast.error(message);

  const [addressValidation, setAddressValidation] = useState<{
    isComplete: boolean;
    missingFields: string[];
  }>({ isComplete: false, missingFields: [] });

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

  useEffect(() => {
    validateAddress();
  }, [validateAddress]);

  const availableCities = formData.province
    ? CITIES_BY_PROVINCE[formData.province] || []
    : [];

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

  const copyAddress = useCallback(async () => {
    const fullAddress = getFullAddress();
    if (fullAddress) {
      try {
        await navigator.clipboard.writeText(fullAddress);
        success('Dirección copiada al portapapeles');
      } catch (err) {
        error('Error al copiar la dirección');
      }
    }
  }, [getFullAddress, success, error]);

  const openInMaps = useCallback(() => {
    const fullAddress = getFullAddress();
    if (fullAddress) {
      const encodedAddress = encodeURIComponent(fullAddress);
      const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(url, '_blank');
    }
  }, [getFullAddress]);

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
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          setProfile(refreshResult.data as StoreProfile);
        }
        success('Dirección guardada correctamente');
      } else {
        const errorMsg = result.errors._form?.[0] || 'Error al guardar la dirección. Inténtalo de nuevo.';
        error(errorMsg);
      }
    } catch (err) {
      error('Error al guardar la dirección. Inténtalo de nuevo.');
    } finally {
      setIsSectionSaving(false);
    }
  }, [formData, profile?.id, success, error, setProfile]);

  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    updateField(field, value);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Ubicación</h3>
          <p className="text-sm text-gray-500 mt-1">Configura la dirección física de tu tienda</p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={isSectionSaving || !formState.isDirty}
          className="flex items-center justify-center gap-2 w-full sm:w-auto min-w-[140px]"
        >
          {isSectionSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSectionSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-red-500" />
                Dirección Principal
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Calle y número */}
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-semibold text-gray-700">Calle y número *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleFieldChange('street', e.target.value)}
                  placeholder="Ej: Av. Corrientes 1234"
                  className={cn(formState.errors.street && 'border-red-500 focus-visible:ring-red-500')}
                />
                {formState.errors.street && (
                  <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{formState.errors.street}</span>
                  </p>
                )}
              </div>

              {/* País y Provincia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">País</Label>
                  <SimpleSelect
                    value={formData.country || ''}
                    onChange={(e) => handleFieldChange('country', e.target.value)}
                    placeholder="Selecciona el país"
                    options={[
                      { value: "Argentina", label: "🇦🇷 Argentina" },
                      { value: "Chile", label: "🇨🇱 Chile" },
                      { value: "Uruguay", label: "🇺🇾 Uruguay" },
                      { value: "Paraguay", label: "🇵🇾 Paraguay" },
                      { value: "Bolivia", label: "🇧🇴 Bolivia" },
                      { value: "Brasil", label: "🇧🇷 Brasil" }
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Provincia *</Label>
                  <SimpleSelect
                    value={formData.province || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleFieldChange('province', value);
                      if (formData.city && !CITIES_BY_PROVINCE[value]?.includes(formData.city)) {
                        handleFieldChange('city', '');
                      }
                    }}
                    className={cn(formState.errors.province && 'border-red-500')}
                    placeholder="Selecciona tu provincia"
                    options={PROVINCES.map((province) => ({
                      value: province,
                      label: province
                    }))}
                  />
                  {formState.errors.province && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{formState.errors.province}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Ciudad y Código Postal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold text-gray-700">Ciudad *</Label>
                  {availableCities.length > 0 ? (
                    <SimpleSelect
                      value={formData.city || ''}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      className={cn(formState.errors.city && 'border-red-500')}
                      placeholder="Selecciona tu ciudad"
                      options={[
                        ...availableCities.map((city) => ({
                          value: city,
                          label: city
                        })),
                        { value: "other", label: "Otra ciudad..." }
                      ]}
                    />
                  ) : (
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleFieldChange('city', e.target.value)}
                      placeholder="Ingresa tu ciudad"
                      className={cn(formState.errors.city && 'border-red-500 focus-visible:ring-red-500')}
                    />
                  )}
                  {formState.errors.city && (
                    <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{formState.errors.city}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-semibold text-gray-700">Código postal</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                    placeholder="Ej: 1234"
                    className={cn(formState.errors.zipCode && 'border-red-500 focus-visible:ring-red-500')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border shadow-sm overflow-hidden">
             <div className="bg-gray-100 h-32 w-full relative flex items-center justify-center border-b">
               {addressValidation.isComplete ? (
                 <Map className="w-12 h-12 text-gray-300" />
               ) : (
                 <MapPin className="w-10 h-10 text-gray-300" />
               )}
               {addressValidation.isComplete && (
                 <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[1px]">
                   <MapPin className="w-8 h-8 text-red-600 animate-bounce" />
                 </div>
               )}
             </div>
             <CardContent className="pt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-2">Vista Previa</h4>
                <p className={cn(
                  'text-sm min-h-[40px]',
                  addressValidation.isComplete ? 'text-gray-700' : 'text-gray-400 italic'
                )}>
                  {getFullAddress() || 'Completa los campos para ver tu dirección.'}
                </p>

                {!addressValidation.isComplete && formData.street && (
                  <p className="text-xs text-amber-600 mt-2">
                    Faltan: {addressValidation.missingFields.join(', ')}
                  </p>
                )}

                {addressValidation.isComplete && (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAddress}
                      className="flex-1 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1.5" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInMaps}
                      className="flex-1 text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1.5" />
                      Ver Mapa
                    </Button>
                  </div>
                )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AddressSection;
