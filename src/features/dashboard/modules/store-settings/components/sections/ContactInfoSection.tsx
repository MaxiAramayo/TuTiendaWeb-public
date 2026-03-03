/**
 * Sección de información de contacto del perfil
 * 
 * Maneja la edición de WhatsApp para contacto directo
 * con validaciones específicas
 * 
 * @module features/dashboard/modules/profile/components/sections
 */

'use client';

import React, { useState, useCallback, useEffect, useRef, useTransition } from 'react';
import { motion } from 'framer-motion';
import { ProfileFormData, FormState, StoreProfile } from '../../types/store.type';
import { updateContactInfoAction, getProfileAction } from '../../actions/profile.actions';
import { useProfileStore } from '../../stores/profile.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SimpleSelect } from '@/components/ui/simple-select';
import { cn } from '@/lib/utils';
import {
  Phone,
  CheckCircle,
  AlertCircle,
  Copy,
  MessageCircle,
  Save,
  Loader2,
  ChevronDown
} from 'lucide-react';
import {
  formatWhatsAppNumber
} from '../../utils/profile.utils';
import { validateWhatsApp } from '../../schemas/profile.schema';
import { toast } from 'sonner';

/**
 * Props del componente
 */
interface ContactInfoSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  profile: StoreProfile | null;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

// Códigos de país disponibles
const COUNTRY_CODES = [
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
];

/**
 * Componente de sección de información de contacto
 */
export function ContactInfoSection({
  formData,
  formState,
  updateField,
  profile,
  onSave,
  isSaving = false,
}: ContactInfoSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [isSectionSaving, setIsSectionSaving] = useState(false);
  const { setProfile } = useProfileStore();
  // Toast functions using sonner
  const success = (message: string) => toast.success(message);
  const error = (message: string) => toast.error(message);

  // Usar useRef para evitar re-renders innecesarios
  const selectedCountryCodeRef = useRef('+54');

  // Calcular formato de WhatsApp sin estado local para evitar loops
  const whatsappFormatted = React.useMemo(() => {
    return formData.whatsapp ? formatWhatsAppNumber(formData.whatsapp) : '';
  }, [formData.whatsapp]);

  // Detectar código de país del número actual
  const currentCountryCode = React.useMemo(() => {
    if (!formData.whatsapp) return '+54';
    const match = formData.whatsapp.match(/^(\+\d{1,4})/);
    return match ? match[1] : '+54';
  }, [formData.whatsapp]);

  // Manejar cambio de WhatsApp
  const handleWhatsAppChange = useCallback((value: string) => {
    // Permitir solo números, espacios, guiones y el símbolo +
    const cleaned = value.replace(/[^\d\s\-+]/g, '');

    // Solo actualizar si el valor realmente cambió
    if (cleaned !== formData.whatsapp) {
      updateField('whatsapp', cleaned);
      // El useEffect se encargará de actualizar whatsappFormatted
    }
  }, [updateField]);

  // Manejar guardado de la sección usando Server Action
  const handleSectionSave = useCallback(async () => {
    if (!profile?.id) {
      error('No se encontró el perfil de la tienda');
      return;
    }

    setIsSectionSaving(true);
    try {
      const contactData = {
        whatsapp: formData.whatsapp,
        website: formData.instagram, // Mapear instagram a website por ahora
      };

      const result = await updateContactInfoAction(contactData);
      
      if (result.success) {
        // Refrescar el store para actualizar todos los componentes
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          setProfile(refreshResult.data as StoreProfile);
        }
        success('Información de contacto guardada correctamente');
      } else {
        const errorMsg = result.errors._form?.[0] || 'Error al guardar la información de contacto. Inténtalo de nuevo.';
        error(errorMsg);
      }
    } catch (err) {
      console.error('Error al guardar contacto:', err);
      error('Error al guardar la información de contacto. Inténtalo de nuevo.');
    } finally {
      setIsSectionSaving(false);
    }
  }, [formData.whatsapp, formData.instagram, profile?.id, success, error, setProfile]);



  // Copiar WhatsApp al portapapeles
  const copyWhatsApp = useCallback(async () => {
    if (whatsappFormatted) {
      try {
        await navigator.clipboard.writeText(whatsappFormatted);
        // Aquí podrías mostrar un toast de éxito
      } catch (error) {
        console.error('Error al copiar:', error);
      }
    }
  }, [whatsappFormatted]);

  // Abrir WhatsApp
  const openWhatsApp = useCallback(() => {
    if (whatsappFormatted) {
      const url = `https://wa.me/${whatsappFormatted.replace(/[^\d]/g, '')}`;
      window.open(url, '_blank');
    }
  }, [whatsappFormatted]);

  // Verificar si WhatsApp es válido
  const isWhatsAppValid = whatsappFormatted && validateWhatsApp(whatsappFormatted).success;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header con título y botón de guardar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Información de contacto</h2>
          <p className="text-xs sm:text-sm text-gray-500">Configura cómo los clientes pueden contactarte</p>
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

      {/* WhatsApp - Diseño Moderno */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <Label htmlFor="whatsapp" className="flex items-center space-x-3 text-base font-medium text-gray-900">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
            <Phone className="w-4 h-4 text-green-600" />
          </div>
          <span>WhatsApp de contacto *</span>
        </Label>

        <div className="space-y-4">
          {/* Input principal mejorado */}
          <div className="relative group">
            <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-xl shadow-sm transition-all duration-300 hover:border-green-300 focus-within:border-green-500 focus-within:shadow-lg focus-within:shadow-green-100">
              {/* Selector de país elegante */}
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
                  className="h-14 pl-4 pr-10 bg-transparent border-0 text-lg font-medium text-gray-700 cursor-pointer focus:outline-none focus:ring-0 appearance-none min-w-[80px]"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code} className="text-base">
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform group-focus-within:rotate-180" />
                <div className="absolute right-0 top-3 bottom-3 w-px bg-gray-200"></div>
              </div>

              {/* Input principal mejorado */}
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
                  'h-14 text-lg border-0 bg-transparent px-4 focus:ring-0 focus:outline-none placeholder:text-gray-400 flex-1',
                  formState.errors.whatsapp && 'text-red-600',
                  isWhatsAppValid && 'text-green-600'
                )}
              />

              {/* Indicador de estado */}
              {formData.whatsapp && (
                <div className="flex-shrink-0 pr-4">
                  {isWhatsAppValid ? (
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Acciones del número y descripción */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 text-sm">
              <div className="flex items-center text-gray-600 mb-3 sm:mb-0">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                <span>Número principal para recibir pedidos de clientes</span>
              </div>
              
              {isWhatsAppValid && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openWhatsApp}
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Probar enlace
                </Button>
              )}
            </div>
          </div>
        </div>

        {formState.errors.whatsapp && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700 font-medium">{formState.errors.whatsapp}</span>
          </motion.div>
        )}
      </motion.div>

      {/* Consejos - Diseño moderno */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-amber-50/50 to-yellow-50/50 border border-amber-100 rounded-lg p-4 shadow-sm"
      >
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center justify-center w-8 h-8 bg-amber-50 rounded-full">
            <span className="text-lg">💡</span>
          </div>
          <h4 className="text-base font-medium text-amber-700">
            Consejos para optimizar tu WhatsApp
          </h4>
        </div>

        <div className="grid gap-2">
          {[
            { icon: '🎯', text: 'El WhatsApp es esencial para recibir pedidos de tus clientes' },
            { icon: '📱', text: 'Usa un número que revises frecuentemente durante el día' },
            { icon: '🌍', text: 'Incluye siempre el código de país (ej: +54 para Argentina)' },
            { icon: '✅', text: 'Verifica que el número sea correcto antes de guardar los cambios' }
          ].map((tip, index) => (
            <div key={index} className="flex items-start space-x-2 p-2 bg-white rounded-lg border border-amber-100">
              <span className="text-sm flex-shrink-0">{tip.icon}</span>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default ContactInfoSection;