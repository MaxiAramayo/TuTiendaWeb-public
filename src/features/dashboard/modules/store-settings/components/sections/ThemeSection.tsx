'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthClient } from '@/features/auth/hooks/use-auth-client';
import { useProfile } from '../../hooks/useProfile';
import { updateThemeAction, getProfileAction } from '../../actions/profile.actions';
import { profileClientService } from '../../services/profile-client.service';
import { useProfileStore } from '../../stores/profile.store';
import {
  ProfileFormData,
  FormState,
  ThemeConfig,
} from '../../types/store.type';
import {
  Palette,
  Type,
  Upload,
  Save,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Componente interno para mostrar imagen con skeleton mientras carga
 */
function ImageWithSkeleton({
  src,
  alt,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative ${className || ''}`}>
      {!isLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${imageClassName || ''}`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}

/**
 * Props para el componente ThemeSection
 */
interface ThemeSectionProps {
  formData: ProfileFormData;
  formState?: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

/**
 * Sets de Colores Recomendados (Paletas Inteligentes)
 */
const THEME_PRESETS = [
  {
    id: 'gastronomic',
    name: 'Gastronómico',
    description: 'Cálido y apetitoso',
    primary: '#EA580C',
    secondary: '#FFF7ED',
    accent: '#1F2937'
  },
  {
    id: 'eco',
    name: 'Eco & Fresco',
    description: 'Natural y saludable',
    primary: '#059669',
    secondary: '#ECFDF5',
    accent: '#064E3B'
  },
  {
    id: 'tech',
    name: 'Tech Moderno',
    description: 'Limpio y digital',
    primary: '#2563EB',
    secondary: '#F3F4F6',
    accent: '#111827'
  },
  {
    id: 'luxury',
    name: 'Lujo Minimal',
    description: 'Elegante y sofisticado',
    primary: '#171717',
    secondary: '#F5F5F4',
    accent: '#CA8A04'
  },
  {
    id: 'feminine',
    name: 'Boutique',
    description: 'Suave y delicado',
    primary: '#db2777',
    secondary: '#fdf2f8',
    accent: '#831843'
  },
  {
    id: 'ocean',
    name: 'Océano',
    description: 'Profundo y confiable',
    primary: '#0284c7',
    secondary: '#f0f9ff',
    accent: '#0c4a6e'
  }
];

/**
 * Opciones de fuentes disponibles
 */
const FONT_OPTIONS = [
  { name: 'Inter (Sans-serif)', value: 'Inter, sans-serif' },
  { name: 'Roboto (Sans-serif)', value: 'Roboto, sans-serif' },
  { name: 'Open Sans (Sans-serif)', value: 'Open Sans, sans-serif' },
  { name: 'Lato (Sans-serif)', value: 'Lato, sans-serif' },
  { name: 'Montserrat (Sans-serif)', value: 'Montserrat, sans-serif' },
  { name: 'Poppins (Sans-serif)', value: 'Poppins, sans-serif' },
  { name: 'Playfair Display (Sans-serif)', value: '"Playfair Display", serif' },
  { name: 'Merriweather (Serif)', value: 'Merriweather, serif' },
];

/**
 * Estilos de botones disponibles
 */
const BUTTON_STYLES = [
  { name: 'Redondeado', value: 'rounded' },
  { name: 'Cuadrado', value: 'square' },
  { name: 'Píldora', value: 'pill' },
];

export function ThemeSection({
  formData,
  formState,
  updateField,
  onSave,
  isSaving = false,
}: ThemeSectionProps) {
  const { user } = useAuthClient();
  const { profile } = useProfile();
  const { setProfile } = useProfileStore();
  const [isSectionSaving, setIsSectionSaving] = useState(false);

  const success = (message: string) => toast.success(message);
  const error = (message: string) => toast.error(message);

  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);

  // Obtener valores actuales del tema con fallbacks seguros
  const currentTheme = formData.theme || {};
  const validStyles = ['modern', 'classic', 'minimal', 'colorful'] as const;
  const validButtonStyles = ['rounded', 'square', 'pill'] as const;

  const themeConfig: ThemeConfig = {
    primaryColor: currentTheme.primaryColor || '#6366f1',
    secondaryColor: currentTheme.secondaryColor || '#8b5cf6',
    accentColor: currentTheme.accentColor || '#8B5CF6',
    fontFamily: currentTheme.fontFamily || 'Inter, sans-serif',
    style: validStyles.includes(currentTheme.style as typeof validStyles[number])
      ? currentTheme.style
      : 'modern',
    buttonStyle: validButtonStyles.includes(currentTheme.buttonStyle as typeof validButtonStyles[number])
      ? currentTheme.buttonStyle
      : 'rounded',
    logoUrl: currentTheme.logoUrl,
    bannerUrl: currentTheme.bannerUrl,
  };

  const handleSectionSave = useCallback(async () => {
    if (!user?.uid) {
      error('No se pudo identificar al usuario');
      return;
    }

    setIsSectionSaving(true);
    try {
      const themeData = {
        logoUrl: themeConfig.logoUrl || '',
        bannerUrl: themeConfig.bannerUrl || '',
        primaryColor: themeConfig.primaryColor || '#6366f1',
        secondaryColor: themeConfig.secondaryColor || '#8b5cf6',
        accentColor: themeConfig.accentColor || '#8B5CF6',
        fontFamily: themeConfig.fontFamily || 'Inter, sans-serif',
        style: themeConfig.style as 'modern' | 'classic' | 'minimal' | 'colorful',
        buttonStyle: themeConfig.buttonStyle as 'rounded' | 'square' | 'pill',
      };

      const result = await updateThemeAction(themeData);

      if (result.success) {
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          setProfile(refreshResult.data as unknown as import('../../types/store.type').StoreProfile);
        }
        success('Tema guardado correctamente');
      } else {
        const errorMsg = result.errors._form?.[0] ||
          Object.values(result.errors).flat()[0] ||
          'Error al guardar el tema. Inténtalo de nuevo.';
        error(errorMsg);
      }
    } catch (err) {
      error('Error al guardar el tema. Inténtalo de nuevo.');
    } finally {
      setIsSectionSaving(false);
    }
  }, [user?.uid, themeConfig, setProfile, success, error]);

  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    updateField(field, value);
  };

  const handleImageSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
      const file = event.target.files?.[0];
      if (!file || !user?.uid) return;

      if (!file.type.startsWith('image/')) {
        error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        error('La imagen debe ser menor a 5MB');
        return;
      }

      try {
        if (type === 'logo') setIsLoadingLogo(true);
        else setIsLoadingBanner(true);

        const currentImageUrl = type === 'logo' ? currentTheme.logoUrl : currentTheme.bannerUrl;
        if (currentImageUrl) {
          try {
            await profileClientService.deleteImage(profile?.id || user.uid, currentImageUrl, type);
          } catch (deleteErr) {
            console.warn(`No se pudo eliminar la imagen anterior de ${type}:`, deleteErr);
          }
        }

        const imageUrl = await profileClientService.uploadImage(
          profile?.id || user.uid,
          file,
          type
        );

        const updatedTheme = {
          ...currentTheme,
          [type === 'logo' ? 'logoUrl' : 'bannerUrl']: imageUrl,
        };

        handleFieldChange('theme', updatedTheme);

        const themeDataToSave = {
          logoUrl: type === 'logo' ? imageUrl : (currentTheme.logoUrl || ''),
          bannerUrl: type === 'banner' ? imageUrl : (currentTheme.bannerUrl || ''),
          primaryColor: currentTheme.primaryColor || '#6366f1',
          secondaryColor: currentTheme.secondaryColor || '#8b5cf6',
          accentColor: currentTheme.accentColor || '#8B5CF6',
          fontFamily: currentTheme.fontFamily || 'Inter, sans-serif',
          style: (currentTheme.style || 'modern') as 'modern' | 'classic' | 'minimal' | 'colorful',
          buttonStyle: (currentTheme.buttonStyle || 'rounded') as 'rounded' | 'square' | 'pill',
        };

        const saveResult = await updateThemeAction(themeDataToSave);

        if (saveResult.success) {
          const refreshResult = await getProfileAction();
          if (refreshResult.success && refreshResult.data) {
            setProfile(refreshResult.data as any);
          }
          success(`${type === 'logo' ? 'Logo' : 'Banner'} subido y guardado correctamente`);
        } else {
          error(`Error al guardar ${type === 'logo' ? 'logo' : 'banner'} en la base de datos`);
        }

        event.target.value = '';
      } catch (err) {
        error(`Error al subir ${type === 'logo' ? 'logo' : 'banner'}. Inténtalo de nuevo.`);
      } finally {
        if (type === 'logo') setIsLoadingLogo(false);
        else setIsLoadingBanner(false);
      }
    },
    [currentTheme, handleFieldChange, profile?.id, user?.uid, success, error, setProfile]
  );

  const removeImage = useCallback(
    async (type: 'logo' | 'banner') => {
      if (!user?.uid) return;

      const imageUrl = type === 'logo' ? themeConfig.logoUrl : themeConfig.bannerUrl;
      if (!imageUrl) return;

      try {
        if (type === 'logo') setIsDeletingLogo(true);
        else setIsDeletingBanner(true);

        await profileClientService.deleteImage(profile?.id || user.uid, imageUrl, type);

        const updatedTheme = {
          ...currentTheme,
          [type === 'logo' ? 'logoUrl' : 'bannerUrl']: '',
        };

        handleFieldChange('theme', updatedTheme);

        const themeDataToSave = {
          logoUrl: type === 'logo' ? '' : (currentTheme.logoUrl || ''),
          bannerUrl: type === 'banner' ? '' : (currentTheme.bannerUrl || ''),
          primaryColor: currentTheme.primaryColor || '#6366f1',
          secondaryColor: currentTheme.secondaryColor || '#8b5cf6',
          accentColor: currentTheme.accentColor || '#8B5CF6',
          fontFamily: currentTheme.fontFamily || 'Inter, sans-serif',
          style: (currentTheme.style || 'modern') as 'modern' | 'classic' | 'minimal' | 'colorful',
          buttonStyle: (currentTheme.buttonStyle || 'rounded') as 'rounded' | 'square' | 'pill',
        };

        const saveResult = await updateThemeAction(themeDataToSave);

        if (saveResult.success) {
          const refreshResult = await getProfileAction();
          if (refreshResult.success && refreshResult.data) {
            setProfile(refreshResult.data as any);
          }
          success(`${type === 'logo' ? 'Logo' : 'Banner'} eliminado correctamente`);
        } else {
          error(`Error al eliminar ${type === 'logo' ? 'logo' : 'banner'} de la base de datos`);
        }
      } catch (err) {
        error(`Error al eliminar ${type === 'logo' ? 'logo' : 'banner'}. Inténtalo de nuevo.`);
      } finally {
        if (type === 'logo') setIsDeletingLogo(false);
        else setIsDeletingBanner(false);
      }
    },
    [themeConfig.logoUrl, themeConfig.bannerUrl, currentTheme, handleFieldChange, profile?.id, user?.uid, success, error, setProfile]
  );

  return (
    <div className='space-y-8 pb-8'>
      <div className='flex flex-col xl:flex-row gap-6'>
      
      {/* Controles de Configuración (Lado Izquierdo) */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4'>
          <div>
            <h3 className='text-2xl font-bold text-gray-900 tracking-tight'>
              Apariencia
            </h3>
            <p className='text-sm text-gray-500 mt-1'>
              Personaliza la marca, colores y estilo de tu tienda.
            </p>
          </div>
        </div>

        {/* Imágenes de Marca */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <ImageIcon className='w-4 h-4 text-indigo-600' />
              Imágenes de Marca
            </CardTitle>
            <CardDescription className="text-xs">
              El logo y banner que verán tus clientes en el catálogo.
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-6 grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Logo */}
            <div className='space-y-4 flex flex-col items-center p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/30'>
              <Label className='text-sm font-semibold text-gray-700 text-center w-full'>Logo de la Tienda</Label>
              
              <input
                id='logo-upload'
                type='file'
                accept='image/*'
                onChange={(e) => handleImageSelect(e, 'logo')}
                className='hidden'
              />

              <div className="relative group cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
                {themeConfig.logoUrl ? (
                  <div className='relative w-32 h-32 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-white'>
                    <ImageWithSkeleton
                      src={themeConfig.logoUrl}
                      alt='Logo'
                      className="w-full h-full"
                      imageClassName="object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className='w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-white text-gray-400 group-hover:bg-gray-50 transition-colors'>
                    <ImageIcon className='w-8 h-8 opacity-50' />
                  </div>
                )}
                {(isLoadingLogo || isDeletingLogo) && (
                  <div className='absolute inset-0 rounded-full bg-white/80 flex items-center justify-center backdrop-blur-sm z-10'>
                    <Loader2 className='w-6 h-6 text-indigo-600 animate-spin' />
                  </div>
                )}
              </div>

              <div className='flex gap-2 w-full justify-center'>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={isLoadingLogo}
                >
                  Cambiar Logo
                </Button>
                {themeConfig.logoUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeImage('logo')}
                    disabled={isDeletingLogo}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Banner */}
            <div className='space-y-4 flex flex-col items-center p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/30'>
              <Label className='text-sm font-semibold text-gray-700 text-center w-full'>Banner Principal</Label>
              
              <input
                id='banner-upload'
                type='file'
                accept='image/*'
                onChange={(e) => handleImageSelect(e, 'banner')}
                className='hidden'
              />

              <div className="relative group cursor-pointer w-full" onClick={() => document.getElementById('banner-upload')?.click()}>
                {themeConfig.bannerUrl ? (
                  <div className='relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white'>
                    <ImageWithSkeleton
                      src={themeConfig.bannerUrl}
                      alt='Banner'
                      className="w-full h-full"
                      imageClassName="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className='w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-white text-gray-400 group-hover:bg-gray-50 transition-colors'>
                    <ImageIcon className='w-8 h-8 opacity-50 mb-2' />
                    <span className="text-xs">1200 x 400px</span>
                  </div>
                )}
                {(isLoadingBanner || isDeletingBanner) && (
                  <div className='absolute inset-0 rounded-lg bg-white/80 flex items-center justify-center backdrop-blur-sm z-10'>
                    <Loader2 className='w-6 h-6 text-indigo-600 animate-spin' />
                  </div>
                )}
              </div>

              <div className='flex gap-2 w-full justify-center'>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => document.getElementById('banner-upload')?.click()}
                  disabled={isLoadingBanner}
                >
                  Cambiar Banner
                </Button>
                {themeConfig.bannerUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeImage('banner')}
                    disabled={isDeletingBanner}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colores */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <Palette className='w-4 h-4 text-pink-500' />
              Colores de la Tienda
            </CardTitle>
            <CardDescription className="text-xs">
              Elige una paleta recomendada o personaliza tus propios colores.
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-6 space-y-8'>
            {/* Paletas Recomendadas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected = 
                  themeConfig.primaryColor === preset.primary &&
                  themeConfig.secondaryColor === preset.secondary &&
                  themeConfig.accentColor === preset.accent;
                
                return (
                  <button
                    key={preset.id}
                    onClick={() =>
                      handleFieldChange('theme', {
                        ...currentTheme,
                        primaryColor: preset.primary,
                        secondaryColor: preset.secondary,
                        accentColor: preset.accent,
                      })
                    }
                    className={cn(
                      'flex flex-col items-start p-3 border rounded-xl transition-all text-left group bg-white relative overflow-hidden',
                      isSelected ? 'border-indigo-600 ring-1 ring-indigo-600 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className='flex items-center w-full h-8 rounded-lg overflow-hidden border border-black/5 mb-3'>
                      <div className='flex-1 h-full' style={{ backgroundColor: preset.primary }} />
                      <div className='flex-1 h-full' style={{ backgroundColor: preset.secondary }} />
                      <div className='flex-1 h-full' style={{ backgroundColor: preset.accent }} />
                    </div>
                    <span className='font-semibold text-xs text-gray-900'>
                      {preset.name}
                    </span>
                    <span className='text-[10px] text-gray-500 mt-0.5 line-clamp-1'>
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-100" />

            {/* Ajustes Manuales */}
            <div className='grid gap-4 sm:grid-cols-3'>
              {/* Color Primario */}
              <div className='space-y-2'>
                <Label className='text-xs font-semibold text-gray-600'>Color Principal</Label>
                <div className='flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg bg-white shadow-sm'>
                  <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border border-black/10">
                    <Input
                      type='color'
                      value={themeConfig.primaryColor}
                      onChange={(e) =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          primaryColor: e.target.value,
                        })
                      }
                      className='absolute -inset-2 w-12 h-12 cursor-pointer p-0 border-0'
                    />
                  </div>
                  <Input
                    type='text'
                    value={themeConfig.primaryColor}
                    onChange={(e) =>
                      handleFieldChange('theme', {
                        ...currentTheme,
                        primaryColor: e.target.value,
                      })
                    }
                    className='font-mono text-xs h-8 border-0 shadow-none focus-visible:ring-0 p-0 uppercase bg-transparent'
                  />
                </div>
              </div>

              {/* Color Secundario */}
              <div className='space-y-2'>
                <Label className='text-xs font-semibold text-gray-600'>Fondo (Secundario)</Label>
                <div className='flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg bg-white shadow-sm'>
                  <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border border-black/10">
                    <Input
                      type='color'
                      value={themeConfig.secondaryColor}
                      onChange={(e) =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          secondaryColor: e.target.value,
                        })
                      }
                      className='absolute -inset-2 w-12 h-12 cursor-pointer p-0 border-0'
                    />
                  </div>
                  <Input
                    type='text'
                    value={themeConfig.secondaryColor}
                    onChange={(e) =>
                      handleFieldChange('theme', {
                        ...currentTheme,
                        secondaryColor: e.target.value,
                      })
                    }
                    className='font-mono text-xs h-8 border-0 shadow-none focus-visible:ring-0 p-0 uppercase bg-transparent'
                  />
                </div>
              </div>

              {/* Color de Acento */}
              <div className='space-y-2'>
                <Label className='text-xs font-semibold text-gray-600'>Texto (Acento)</Label>
                <div className='flex items-center gap-2 p-1.5 border border-gray-200 rounded-lg bg-white shadow-sm'>
                  <div className="relative w-8 h-8 rounded-md overflow-hidden flex-shrink-0 border border-black/10">
                    <Input
                      type='color'
                      value={themeConfig.accentColor}
                      onChange={(e) =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          accentColor: e.target.value,
                        })
                      }
                      className='absolute -inset-2 w-12 h-12 cursor-pointer p-0 border-0'
                    />
                  </div>
                  <Input
                    type='text'
                    value={themeConfig.accentColor}
                    onChange={(e) =>
                      handleFieldChange('theme', {
                        ...currentTheme,
                        accentColor: e.target.value,
                      })
                    }
                    className='font-mono text-xs h-8 border-0 shadow-none focus-visible:ring-0 p-0 uppercase bg-transparent'
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipografía y Botones */}
        <Card className="border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <Type className='w-4 h-4 text-violet-500' />
              Tipografía y Botones
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6 grid grid-cols-1 sm:grid-cols-2 gap-8'>
            <div className='space-y-3'>
              <Label className='text-sm font-semibold text-gray-700'>Fuente de la Tienda</Label>
              <Select
                value={themeConfig.fontFamily}
                onValueChange={(value) =>
                  handleFieldChange('theme', {
                    ...currentTheme,
                    fontFamily: value,
                  })
                }
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder='Selecciona una fuente' />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-3'>
              <Label className='text-sm font-semibold text-gray-700'>Forma de Botones</Label>
              <div className='grid grid-cols-3 gap-2'>
                {BUTTON_STYLES.map((style) => {
                  const isSelected = themeConfig.buttonStyle === style.value;
                  return (
                    <button
                      key={style.value}
                      onClick={() =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          buttonStyle: style.value as
                            | 'rounded'
                            | 'square'
                            | 'pill',
                        })
                      }
                      className={cn(
                        "py-3 px-1 border rounded-lg text-center transition-all flex flex-col items-center gap-2",
                        isSelected ? "border-indigo-600 bg-indigo-50/30 shadow-sm" : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-4 shadow-sm",
                          style.value === 'rounded' ? 'rounded' : 
                          style.value === 'square' ? 'rounded-none' : 'rounded-full'
                        )}
                        style={{ backgroundColor: isSelected ? themeConfig.primaryColor : '#D1D5DB' }}
                      />
                      <span className={cn(
                        "text-[10px] font-medium",
                        isSelected ? "text-indigo-700" : "text-gray-500"
                      )}>
                        {style.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista Previa en Vivo (Sticky Right Column) */}
      <div className="w-full xl:w-[420px] 2xl:w-[460px] flex-shrink-0">
        <div className="sticky top-6">
          <Card className="border-gray-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-indigo-600 text-white p-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              </div>
              <span className="text-xs font-mono text-gray-400">Live Preview</span>
            </CardHeader>
            <CardContent className='p-0'>
              <div
                className='relative w-full h-[500px] flex flex-col transition-colors duration-500 overflow-hidden'
                style={{
                  fontFamily: themeConfig.fontFamily,
                  backgroundColor: themeConfig.secondaryColor
                }}
              >
                {/* Banner Preview */}
                {themeConfig.bannerUrl ? (
                  <div className="h-32 w-full relative">
                    <img src={themeConfig.bannerUrl} className="w-full h-full object-cover" alt="banner preview" />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                ) : (
                  <div className="h-32 w-full relative opacity-50" style={{ backgroundColor: themeConfig.primaryColor }} />
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col px-6 -mt-10 relative z-10">
                  {/* Logo Preview */}
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white overflow-hidden flex-shrink-0 mb-4 mx-auto flex items-center justify-center">
                    {themeConfig.logoUrl ? (
                      <img src={themeConfig.logoUrl} className="w-full h-full object-contain" alt="logo preview" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  <div className="text-center space-y-2 mb-6">
                    <h2 className='text-2xl font-bold tracking-tight' style={{ color: themeConfig.accentColor || '#111827' }}>
                      Mi Tienda Demo
                    </h2>
                    <p className='text-sm opacity-80' style={{ color: themeConfig.accentColor || '#4B5563' }}>
                      La mejor experiencia de compra con productos de calidad.
                    </p>
                  </div>

                  {/* Mock Products Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[1, 2].map(i => (
                      <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-black/5 flex flex-col gap-2">
                        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                           <ImageIcon className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="h-3 w-3/4 rounded bg-gray-200" />
                        <div className="h-4 w-1/2 rounded mt-1" style={{ backgroundColor: themeConfig.primaryColor, opacity: 0.2 }} />
                        <button
                          className={cn(
                            "w-full mt-2 py-1.5 text-[10px] text-white font-medium shadow-sm transition-all",
                            themeConfig.buttonStyle === 'rounded' ? 'rounded-md' :
                            themeConfig.buttonStyle === 'square' ? 'rounded-none' : 'rounded-full'
                          )}
                          style={{ backgroundColor: themeConfig.primaryColor }}
                        >
                          Agregar
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    className={cn(
                      "w-full py-3 text-sm text-white font-medium shadow-md transition-all mt-auto mb-6",
                      themeConfig.buttonStyle === 'rounded' ? 'rounded-lg' :
                      themeConfig.buttonStyle === 'square' ? 'rounded-none' : 'rounded-full'
                    )}
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    Ver todo el catálogo
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
      <div className="flex justify-end mt-8">
        <Button
          onClick={handleSectionSave}
          disabled={isSectionSaving || !formState?.isDirty}
          className='flex items-center justify-center gap-2 min-w-[170px] shadow-sm bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto'
        >
          {isSectionSaving ? (
            <Loader2 className='w-4 h-4 animate-spin' />
          ) : (
            <Save className='w-4 h-4' />
          )}
          <span>{isSectionSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>
    </div>
  );
}
