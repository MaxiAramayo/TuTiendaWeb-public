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
import { ProfileFormData, FormState, SocialLinks, StoreProfile } from '../../types/store.type';
import { updateSocialLinksAction, getProfileAction } from '../../actions/profile.actions';
import { useProfileStore } from '../../stores/profile.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Instagram, 
  Facebook, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Eye,
  Trash2,
  Save,
  Loader2
} from 'lucide-react';
import { 
  validateInstagramUrl, 
  validateFacebookUrl
} from '@shared/validations';

/**
 * Props del componente
 */
interface SocialLinksSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  profile?: StoreProfile | null;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

/**
 * Configuración de redes sociales
 */
const SOCIAL_NETWORKS = {
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    placeholder: 'https://instagram.com/tu_usuario',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    validate: (url: string) => validateInstagramUrl(url).success,
    description: 'Perfil de Instagram de tu tienda'
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    placeholder: 'https://facebook.com/tu_pagina',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    validate: (url: string) => validateFacebookUrl(url).success,
    description: 'Página de Facebook de tu tienda'
  }
};

/**
 * Componente de sección de redes sociales
 */
export function SocialLinksSection({
  formData,
  formState,
  updateField,
  profile,
  onSave,
  isSaving: externalIsSaving = false,
}: SocialLinksSectionProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { setProfile } = useProfileStore();

  // Handler propio para guardar y actualizar el store
  const handleSectionSave = useCallback(async () => {
    if (!profile?.id) {
      toast.error('No se encontró el perfil');
      return;
    }

    setIsSaving(true);
    try {
      const socialData = {
        instagram: formData.instagram || '',
        facebook: formData.facebook || ''
      };

      const result = await updateSocialLinksAction(socialData);

      if (result.success) {
        // Refrescar el store con los datos actualizados
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          setProfile(refreshResult.data as StoreProfile);
        }
        toast.success('Redes sociales guardadas correctamente');
      } else {
        toast.error(result.errors?._form?.[0] || 'Error al guardar las redes sociales');
      }
    } catch (error) {
      console.error('Error saving social links:', error);
      toast.error('Error al guardar las redes sociales');
    } finally {
      setIsSaving(false);
    }
  }, [profile?.id, formData.instagram, formData.facebook, setProfile]);

  const isCurrentlySaving = isSaving || externalIsSaving;

  // Obtener enlaces sociales actuales
  const currentSocialLinks = {
    instagram: formData.instagram || '',
    facebook: formData.facebook || ''
  };

  // Actualizar enlace social
  const updateSocialLink = (platform: keyof SocialLinks, url: string) => {
    updateField(platform as keyof ProfileFormData, url);
    
    // Validar URL
    const network = SOCIAL_NETWORKS[platform];
    if (network) {
      const isValid = network.validate(url);
      setValidationResults(prev => ({
        ...prev,
        [platform]: isValid
      }));
    }
  };

  // Limpiar enlace social
  const clearSocialLink = (platform: keyof SocialLinks) => {
    updateSocialLink(platform, '');
  };

  // Copiar enlace al portapapeles
  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // Aquí podrías mostrar un toast de éxito
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  // Abrir enlace en nueva pestaña
  const openLink = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Obtener enlaces configurados
  const configuredLinks = Object.entries(currentSocialLinks)
    .filter(([_, url]) => url && url.trim() !== '')
    .map(([platform, url]) => ({ platform: platform as keyof SocialLinks, url }));

  // Obtener enlaces válidos
  const validLinks = configuredLinks.filter(({ platform, url }) => {
    const network = SOCIAL_NETWORKS[platform];
    return network && network.validate(url);
  });

  return (
    <div className="space-y-6">
      {/* Header con título y botón de guardar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Instagram className="w-5 h-5" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Redes sociales</h2>
            <p className="text-sm text-gray-500">Conecta tus redes sociales para mayor alcance</p>
          </div>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={isCurrentlySaving}
          className="flex items-center space-x-2"
        >
          {isCurrentlySaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isCurrentlySaving ? 'Guardando...' : 'Guardar'}</span>
        </Button>
      </div>

      {/* Resumen de enlaces configurados */}
      {configuredLinks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <h4 className="text-sm font-medium text-green-900">
              {validLinks.length} de {configuredLinks.length} enlaces configurados correctamente
            </h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {configuredLinks.map(({ platform, url }) => {
              const network = SOCIAL_NETWORKS[platform];
              const isValid = network.validate(url);
              
              return (
                <Badge
                  key={platform}
                  variant={isValid ? 'default' : 'destructive'}
                  className="flex items-center space-x-1"
                >
                  <network.icon className="w-3 h-3" />
                  <span>{network.name}</span>
                  {isValid && <CheckCircle className="w-3 h-3" />}
                  {!isValid && <AlertCircle className="w-3 h-3" />}
                </Badge>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Configuración de redes sociales */}
      <div className="space-y-4">
        {Object.entries(SOCIAL_NETWORKS).map(([platform, network], index) => {
          const currentUrl = currentSocialLinks[platform as keyof SocialLinks];
          const isValid = validationResults[platform] ?? network.validate(currentUrl);
          const hasUrl = currentUrl && currentUrl.trim() !== '';
          
          return (
            <motion.div
              key={platform}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'border rounded-lg p-4 transition-all',
                hasUrl 
                  ? isValid 
                    ? `${network.bgColor} ${network.borderColor}` 
                    : 'bg-red-50 border-red-200'
                  : 'border-gray-200 bg-gray-50'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    hasUrl && isValid ? network.bgColor : 'bg-gray-100'
                  )}>
                    <network.icon className={cn(
                      'w-4 h-4',
                      hasUrl && isValid ? network.color : 'text-gray-500'
                    )} />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">{network.name}</Label>
                    <p className="text-xs text-gray-500">{network.description}</p>
                  </div>
                </div>
                
                {hasUrl && (
                  <div className="flex items-center space-x-1">
                    {isValid && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(currentUrl)}
                          className="p-1 h-auto"
                          title="Copiar enlace"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openLink(currentUrl)}
                          className="p-1 h-auto"
                          title="Abrir enlace"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => clearSocialLink(platform as keyof SocialLinks)}
                      className="p-1 h-auto text-red-600 hover:text-red-700"
                      title="Eliminar enlace"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Input
                  value={currentUrl}
                  onChange={(e) => updateSocialLink(platform as keyof SocialLinks, e.target.value)}
                  placeholder={network.placeholder}
                  className={cn(
                    hasUrl && !isValid && 'border-red-500 focus:border-red-500'
                  )}
                />
                
                {hasUrl && !isValid && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">
                      URL no válida para {network.name}
                    </span>
                  </div>
                )}
                
                {hasUrl && isValid && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">
                      Enlace válido de {network.name}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Vista previa de enlaces */}
      {validLinks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="border rounded-lg p-4 bg-white"
        >
          <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Vista previa en tu tienda</span>
          </h4>
          
          <div className="flex flex-wrap gap-3">
            {validLinks.map(({ platform, url }) => {
              const network = SOCIAL_NETWORKS[platform];
              
              return (
                <Button
                  key={platform}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openLink(url)}
                  className={cn(
                    'flex items-center space-x-2 transition-all hover:scale-105',
                    network.color
                  )}
                >
                  <network.icon className="w-4 h-4" />
                  <span>{network.name}</span>
                  <ExternalLink className="w-3 h-3" />
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
        transition={{ delay: 0.8 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📱 Consejos para redes sociales
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Usa URLs completas (incluye https://)</li>
          <li>• Verifica que los enlaces funcionen correctamente</li>
          <li>• Mantén tus perfiles actualizados</li>
          <li>• Usa las mismas imágenes de perfil en todas las redes</li>
          <li>• Publica contenido regularmente</li>
          <li>• Responde a los comentarios y mensajes</li>
        </ul>
      </motion.div>

      {/* Estadísticas */}
      {configuredLinks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {configuredLinks.length}
            </div>
            <div className="text-xs text-gray-500">Enlaces configurados</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-900">
              {validLinks.length}
            </div>
            <div className="text-xs text-green-600">Enlaces válidos</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-900">
              {Math.round((validLinks.length / Object.keys(SOCIAL_NETWORKS).length) * 100)}%
            </div>
            <div className="text-xs text-blue-600">Completitud</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-semibold text-purple-900">
              {Object.keys(SOCIAL_NETWORKS).length - configuredLinks.length}
            </div>
            <div className="text-xs text-purple-600">Por configurar</div>
          </div>
        </motion.div>
      )}

      {/* Errores de validación */}
      {formState.errors.socialLinks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-medium text-red-900">Errores en redes sociales</h4>
          </div>
          <p className="text-sm text-red-800">{formState.errors.socialLinks}</p>
        </motion.div>
      )}
    </div>
  );
}

export default SocialLinksSection;