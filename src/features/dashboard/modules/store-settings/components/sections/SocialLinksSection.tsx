/**
 * Sección de redes sociales del perfil
 * 
 * Maneja la configuración de enlaces a redes sociales
 * con validaciones y vista previa
 * 
 * @module features/dashboard/modules/profile/components/sections
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useProfileStore } from '../../api/profileStore';
import { useAuthStore } from '@/features/auth/api/authStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Instagram, 
  Facebook, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  validateSocialFields,
  validateSingleField
} from '../../validations/profile.validations';

/**
 * Props del componente - CORREGIDO
 */
interface SocialLinksSectionProps {
  formData: {
    instagram: string;
    facebook: string;
  };
  updateField: (field: string, value: any) => void;
}

/**
 * Configuración de redes sociales
 */
const SOCIAL_PLATFORMS = [
  {
    key: 'instagram' as const,
    name: 'Instagram',
    icon: Instagram,
    placeholder: 'https://instagram.com/tu_usuario',
    color: 'text-pink-600',
    description: 'Perfil de Instagram de tu tienda'
  },
  {
    key: 'facebook' as const,
    name: 'Facebook',
    icon: Facebook,
    placeholder: 'https://facebook.com/tu_pagina',
    color: 'text-blue-600',
    description: 'Página de Facebook de tu tienda'
  }
];

export function SocialLinksSection({ formData, updateField }: SocialLinksSectionProps) {
  const { updateSocialLinks, getSectionState, storeProfile } = useProfileStore();
  const { user } = useAuthStore();
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const sectionState = getSectionState('social');

  // Manejar cambio de campo con validación
  const handleFieldChange = useCallback((field: string, value: string) => {
    updateField(field, value);
    
    // Validar campo individual
    const error = validateSingleField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: error || '' }));
  }, [updateField]);

  // Abrir enlace en nueva pestaña
  const openLink = useCallback((url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Guardar sección
  const handleSectionSave = useCallback(async () => {
    if (!user?.id || !storeProfile?.id) {
      toast.error('No se pudo identificar la tienda');
      return;
    }
    
    try {
      // Validar todos los campos
      const validation = validateSocialFields({
        instagram: formData.instagram,
        facebook: formData.facebook,
      });

      if (!validation.isValid) {
        setFormErrors(validation.errors);
        toast.error('Por favor corrige los errores antes de continuar');
        return;
      }

      setFormErrors({});
      
      const success = await updateSocialLinks(validation.data);
      
      if (success) {
        toast.success('Enlaces sociales guardados correctamente');
      } else {
        toast.error('Error al guardar los enlaces');
      }
    } catch (err) {
      console.error('Error al guardar enlaces sociales:', err);
      toast.error('Error al guardar los enlaces sociales');
    }
  }, [user?.id, storeProfile?.id, formData, updateSocialLinks]);

  // Contar enlaces válidos
  const validLinksCount = SOCIAL_PLATFORMS.filter(platform => {
    const url = formData[platform.key];
    return url && url.trim() && !validateSingleField(platform.key, url);
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Redes sociales</h2>
          <p className="text-sm text-gray-500">Conecta tus redes sociales para mayor alcance</p>
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

      {/* Estadísticas rápidas */}
      {validLinksCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              {validLinksCount} red{validLinksCount !== 1 ? 'es' : ''} social{validLinksCount !== 1 ? 'es' : ''} configurada{validLinksCount !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>
      )}

      {/* Formularios de redes sociales */}
      <div className="space-y-4">
        {SOCIAL_PLATFORMS.map((platform, index) => {
          const currentUrl = formData[platform.key] || '';
          const hasUrl = currentUrl.trim() !== '';
          const hasError = formErrors[platform.key];
          const isValid = hasUrl && !hasError;
          
          return (
            <motion.div
              key={platform.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <Label className="flex items-center space-x-2">
                <platform.icon className={cn('w-4 h-4', platform.color)} />
                <span>{platform.name}</span>
                {isValid && <CheckCircle className="w-4 h-4 text-green-500" />}
              </Label>
              
              <div className="relative">
                <Input
                  value={currentUrl}
                  onChange={(e) => handleFieldChange(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                  className={cn(hasError && 'border-red-500')}
                />
                
                {/* Botón para abrir enlace */}
                {isValid && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openLink(currentUrl)}
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    title="Abrir enlace"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              {/* Error */}
              {hasError && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{hasError}</span>
                </p>
              )}
              
              {/* Descripción */}
              <p className="text-xs text-gray-500">{platform.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Vista previa */}
      {validLinksCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border rounded-lg p-4 bg-gray-50"
        >
          <h4 className="text-sm font-medium mb-3">Vista previa en tu tienda</h4>
          
          <div className="flex gap-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const url = formData[platform.key];
              const isValid = url && url.trim() && !validateSingleField(platform.key, url);
              
              if (!isValid) return null;
              
              return (
                <Button
                  key={platform.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openLink(url)}
                  className={cn('flex items-center space-x-1', platform.color)}
                >
                  <platform.icon className="w-4 h-4" />
                  <span>{platform.name}</span>
                </Button>
              );
            })}
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            Así se verán los enlaces en tu tienda online
          </p>
        </motion.div>
      )}

      {/* Consejos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📱 Consejos para redes sociales
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Usa URLs completas (incluye https://)</li>
          <li>• Verifica que los enlaces funcionen</li>
          <li>• Mantén tus perfiles actualizados</li>
          <li>• Responde a comentarios y mensajes</li>
        </ul>
      </motion.div>
    </div>
  );
}

export default SocialLinksSection;