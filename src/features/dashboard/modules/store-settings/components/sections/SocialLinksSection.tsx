'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ProfileFormData, FormState, SocialLinks, StoreProfile } from '../../types/store.type';
import { updateSocialLinksAction, getProfileAction } from '../../actions/profile.actions';
import { useProfileStore } from '../../stores/profile.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  Instagram, 
  Facebook, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Trash2,
  Save,
  Loader2,
  Share2
} from 'lucide-react';
import { 
  validateInstagramUrl, 
  validateFacebookUrl
} from '../../schemas/profile.schema';

interface SocialLinksSectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  profile?: StoreProfile | null;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

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

export function SocialLinksSection({
  formData,
  formState,
  updateField,
  profile,
  onSave,
  isSaving: externalIsSaving = false,
}: SocialLinksSectionProps) {
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { setProfile } = useProfileStore();

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
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          setProfile(refreshResult.data as StoreProfile);
        }
        toast.success('Redes sociales guardadas correctamente');
      } else {
        toast.error(result.errors?._form?.[0] || 'Error al guardar las redes sociales');
      }
    } catch (error) {
      toast.error('Error al guardar las redes sociales');
    } finally {
      setIsSaving(false);
    }
  }, [profile?.id, formData.instagram, formData.facebook, setProfile]);

  const isCurrentlySaving = isSaving || externalIsSaving;

  const currentSocialLinks = {
    instagram: formData.instagram || '',
    facebook: formData.facebook || ''
  };

  const updateSocialLink = (platform: keyof SocialLinks, url: string) => {
    updateField(platform as keyof ProfileFormData, url);
    const network = SOCIAL_NETWORKS[platform];
    if (network) {
      const isValid = network.validate(url);
      setValidationResults(prev => ({
        ...prev,
        [platform]: isValid
      }));
    }
  };

  const clearSocialLink = (platform: keyof SocialLinks) => {
    updateSocialLink(platform, '');
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado al portapapeles');
    } catch (error) {
      toast.error('Error al copiar el enlace');
    }
  };

  const openLink = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const configuredLinks = Object.entries(currentSocialLinks)
    .filter(([_, url]) => url && url.trim() !== '')
    .map(([platform, url]) => ({ platform: platform as keyof SocialLinks, url }));

  const validLinks = configuredLinks.filter(({ platform, url }) => {
    const network = SOCIAL_NETWORKS[platform];
    return network && network.validate(url);
  });

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Redes Sociales</h3>
          <p className="text-sm text-gray-500 mt-1">Conecta tus redes sociales para mayor alcance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
        <div className="xl:col-span-8 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="w-5 h-5 text-indigo-500" />
                Enlaces a Perfiles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {Object.entries(SOCIAL_NETWORKS).map(([platform, network], index) => {
                const currentUrl = currentSocialLinks[platform as keyof SocialLinks];
                const isValid = validationResults[platform] ?? network.validate(currentUrl);
                const hasUrl = currentUrl && currentUrl.trim() !== '';
                
                return (
                  <div
                    key={platform}
                    className={cn(
                      'border rounded-xl p-5 transition-all',
                      hasUrl 
                        ? isValid 
                          ? `${network.bgColor} ${network.borderColor} shadow-sm` 
                          : 'bg-red-50/50 border-red-200'
                        : 'border-gray-200 bg-gray-50/30'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          'p-2.5 rounded-lg shadow-sm',
                          hasUrl && isValid ? 'bg-white' : 'bg-white border'
                        )}>
                          <network.icon className={cn(
                            'w-5 h-5',
                            hasUrl && isValid ? network.color : 'text-gray-400'
                          )} />
                        </div>
                        <div>
                          <Label className="text-sm font-bold text-gray-900">{network.name}</Label>
                          <p className="text-xs text-gray-500">{network.description}</p>
                        </div>
                      </div>
                      
                      {hasUrl && (
                        <div className="flex items-center bg-white border rounded-md shadow-sm">
                          {isValid && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => copyLink(currentUrl)}
                                className="h-8 px-3 rounded-none rounded-l-md border-r hover:bg-gray-50"
                                title="Copiar enlace"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openLink(currentUrl)}
                                className="h-8 px-3 rounded-none border-r hover:bg-gray-50"
                                title="Abrir enlace"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => clearSocialLink(platform as keyof SocialLinks)}
                            className="h-8 px-3 rounded-none rounded-r-md text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar enlace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                          'bg-white',
                          hasUrl && !isValid && 'border-red-500 focus-visible:ring-red-500'
                        )}
                      />
                      
                      {hasUrl && !isValid && (
                        <div className="flex items-center space-x-1 text-red-600 mt-1.5">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">
                            URL no válida para {network.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="xl:col-span-4 space-y-6">
          <div className="xl:sticky xl:top-6 space-y-6">
          <Card className="border shadow-sm bg-indigo-50/50">
            <CardHeader className="pb-3 border-b border-indigo-100">
              <CardTitle className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                 Estadísticas de Enlaces
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                 <span className="text-sm text-gray-600">Configurados</span>
                 <span className="text-lg font-bold text-gray-900">{configuredLinks.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-indigo-100 shadow-sm">
                 <span className="text-sm text-gray-600">Válidos listos</span>
                 <span className="text-lg font-bold text-green-600">{validLinks.length}</span>
              </div>
              
              <div className="pt-4 border-t border-indigo-100">
                 <h4 className="text-xs font-bold text-indigo-900 mb-2">Consejos</h4>
                 <ul className="text-xs text-indigo-700/80 space-y-2">
                   <li>• Usa URLs completas (incluye https://)</li>
                   <li>• Verifica que los enlaces funcionen antes de guardar</li>
                   <li>• Publica regularmente para atraer a tu audiencia</li>
                 </ul>
              </div>
            </CardContent>
          </Card>

          {formState.errors.socialLinks && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <h4 className="text-sm font-bold text-red-900">Error</h4>
              </div>
              <p className="text-sm text-red-800">{formState.errors.socialLinks}</p>
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSectionSave}
          disabled={isCurrentlySaving || !formState.isDirty}
          className="flex items-center justify-center gap-2 w-full sm:w-auto min-w-[160px] bg-indigo-600 hover:bg-indigo-700"
        >
          {isCurrentlySaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isCurrentlySaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>
    </div>
  );
}

export default SocialLinksSection;
