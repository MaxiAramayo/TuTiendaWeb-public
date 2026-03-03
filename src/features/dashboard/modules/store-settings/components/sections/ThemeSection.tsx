'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';

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
 * Interface para subida de imágenes
 */
interface ImageUpload {
  file: File;
  preview: string;
}

/**
 * Sets de Colores Recomendados (Paletas Inteligentes)
 */
const THEME_PRESETS = [
  {
    id: 'gastronomic',
    name: 'Gastronómico & Cálido',
    description: 'Ideal para restaurantes y comida.',
    primary: '#EA580C',
    secondary: '#FFF7ED',
    accent: '#1F2937'
  },
  {
    id: 'eco',
    name: 'Eco & Fresco',
    description: 'Para productos naturales y salud.',
    primary: '#059669',
    secondary: '#ECFDF5',
    accent: '#064E3B'
  },
  {
    id: 'tech',
    name: 'Tech & Moderno',
    description: 'Electrónica y servicios digitales.',
    primary: '#2563EB',
    secondary: '#F3F4F6',
    accent: '#111827'
  },
  {
    id: 'luxury',
    name: 'Lujo & Minimal',
    description: 'Joyería, moda y alta gama.',
    primary: '#171717',
    secondary: '#F5F5F4',
    accent: '#CA8A04'
  }
];

/**
 * Opciones de fuentes disponibles
 */
const FONT_OPTIONS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
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

  // Toast functions using sonner
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
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h3 className='text-xl font-bold text-gray-900'>
            Tema y Branding
          </h3>
          <p className='text-sm text-gray-500 mt-1'>
            Personaliza la apariencia visual de tu tienda y la marca.
          </p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={isSectionSaving || !formState?.isDirty}
          className='flex items-center justify-center gap-2 w-full sm:w-auto min-w-[140px]'
        >
          {isSectionSaving ? (
            <Loader2 className='w-4 h-4 animate-spin' />
          ) : (
            <Save className='w-4 h-4' />
          )}
          <span>{isSectionSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>

      {/* Sección de Imágenes */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <CardTitle className='flex items-center gap-2 text-lg'>
            <ImageIcon className='w-5 h-5 text-blue-600' />
            Imágenes de Marca
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12'>
          {/* Logo */}
          <div className='space-y-4 lg:col-span-4'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-semibold text-gray-700'>Logo de la Tienda</Label>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={isLoadingLogo}
                >
                  {isLoadingLogo ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Upload className='w-4 h-4' />
                  )}
                  <span className='ml-2'>Subir</span>
                </Button>
                {themeConfig.logoUrl && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => removeImage('logo')}
                    disabled={isDeletingLogo}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    {isDeletingLogo ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <Trash2 className='w-4 h-4' />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <input
              id='logo-upload'
              type='file'
              accept='image/*'
              onChange={(e) => handleImageSelect(e, 'logo')}
              className='hidden'
            />

            {themeConfig.logoUrl ? (
              <div className='relative w-32 h-32 border-2 border-dashed border-gray-200 rounded-full overflow-hidden shadow-sm'>
                <ImageWithSkeleton
                  src={themeConfig.logoUrl}
                  alt='Logo de la tienda'
                  className="w-full h-full"
                  imageClassName="object-contain bg-white"
                />
                {(isLoadingLogo || isDeletingLogo) && (
                  <div className='absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm'>
                    <Loader2 className='w-6 h-6 text-white animate-spin' />
                  </div>
                )}
              </div>
            ) : (
              <div className='w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 bg-gray-50'>
                <div className='text-center'>
                  <ImageIcon className='w-8 h-8 mx-auto mb-1 opacity-50' />
                  <p className='text-xs font-medium'>Sin logo</p>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">Recomendado: 512x512px, formato PNG o JPG.</p>
          </div>

          {/* Banner */}
          <div className='space-y-4 lg:col-span-8'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-semibold text-gray-700'>Banner de la Tienda</Label>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => document.getElementById('banner-upload')?.click()}
                  disabled={isLoadingBanner}
                >
                  {isLoadingBanner ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Upload className='w-4 h-4' />
                  )}
                  <span className='ml-2'>Subir</span>
                </Button>
                {themeConfig.bannerUrl && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => removeImage('banner')}
                    disabled={isDeletingBanner}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    {isDeletingBanner ? (
                      <Loader2 className='w-4 h-4 animate-spin' />
                    ) : (
                      <Trash2 className='w-4 h-4' />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <input
              id='banner-upload'
              type='file'
              accept='image/*'
              onChange={(e) => handleImageSelect(e, 'banner')}
              className='hidden'
            />

            {themeConfig.bannerUrl ? (
              <div className='relative w-full h-32 sm:h-40 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden shadow-sm'>
                <ImageWithSkeleton
                  src={themeConfig.bannerUrl}
                  alt='Banner de la tienda'
                  className="w-full h-full"
                  imageClassName="object-cover bg-gray-100"
                />
                {(isLoadingBanner || isDeletingBanner) && (
                  <div className='absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm'>
                    <Loader2 className='w-6 h-6 text-white animate-spin' />
                  </div>
                )}
              </div>
            ) : (
              <div className='w-full h-32 sm:h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 bg-gray-50'>
                <div className='text-center'>
                  <ImageIcon className='w-8 h-8 mx-auto mb-2 opacity-50' />
                  <p className='text-sm font-medium'>Sin banner</p>
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">Recomendado: 1200x400px, formato JPG o WEBP.</p>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Colores */}
      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50/50 border-b pb-4">
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Palette className='w-5 h-5 text-pink-500' />
            Esquema de Colores
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6 space-y-8'>
          {/* Paletas Recomendadas */}
          <div className='space-y-4'>
            <Label className='text-sm font-semibold text-gray-700'>Paletas Recomendadas</Label>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              {THEME_PRESETS.map((preset) => (
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
                  className='flex flex-col items-start p-4 border rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-left group bg-white'
                >
                  <div className='flex items-center gap-1.5 mb-3 w-full'>
                    <div className='flex-1 h-8 rounded-l-md border border-black/5' style={{ backgroundColor: preset.primary }} />
                    <div className='flex-1 h-8 border-y border-black/5' style={{ backgroundColor: preset.secondary }} />
                    <div className='flex-1 h-8 rounded-r-md border border-black/5' style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span className='font-semibold text-sm text-gray-900 group-hover:text-blue-700 transition-colors'>
                    {preset.name}
                  </span>
                  <span className='text-xs text-gray-500 mt-1 line-clamp-2'>
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Ajustes Manuales */}
          <div className='space-y-4'>
            <Label className='text-sm font-semibold text-gray-700'>Ajustes Manuales</Label>
            <div className='grid gap-6 sm:grid-cols-3'>
              {/* Color Primario */}
              <div className='space-y-3 p-4 border rounded-xl bg-gray-50/50'>
                <Label className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Principal</Label>
                <div className='flex items-center gap-3'>
                  <div className="relative w-12 h-12 rounded-lg border shadow-sm overflow-hidden flex-shrink-0">
                    <Input
                      type='color'
                      value={themeConfig.primaryColor}
                      onChange={(e) =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          primaryColor: e.target.value,
                        })
                      }
                      className='absolute -inset-2 w-16 h-16 cursor-pointer p-0 border-0'
                    />
                  </div>
                  <div className='flex-1'>
                    <Input
                      type='text'
                      value={themeConfig.primaryColor}
                      onChange={(e) =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          primaryColor: e.target.value,
                        })
                      }
                      className='font-mono text-sm uppercase h-9'
                      placeholder='#000000'
                    />
                    <p className='text-[11px] text-gray-500 mt-1'>Botones y marca</p>
                  </div>
                </div>
              </div>

              {/* Color Secundario */}
              <div className='space-y-3 p-4 border rounded-xl bg-gray-50/50'>
                <Label className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Fondo / Secundario</Label>
                <div className='flex items-center gap-3'>
                  <div className="relative w-12 h-12 rounded-lg border shadow-sm overflow-hidden flex-shrink-0">
                    <Input
                      type='color'
                      value={themeConfig.secondaryColor}
                      onChange={(e) =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          secondaryColor: e.target.value,
                        })
                      }
                      className='absolute -inset-2 w-16 h-16 cursor-pointer p-0 border-0'
                    />
                  </div>
                  <div className='flex-1'>
                    <Input
                      type='text'
                      value={themeConfig.secondaryColor}
                      onChange={(e) =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          secondaryColor: e.target.value,
                        })
                      }
                      className='font-mono text-sm uppercase h-9'
                      placeholder='#000000'
                    />
                    <p className='text-[11px] text-gray-500 mt-1'>Fondos suaves</p>
                  </div>
                </div>
              </div>

              {/* Color de Acento */}
              <div className='space-y-3 p-4 border rounded-xl bg-gray-50/50'>
                <Label className='text-xs font-semibold text-gray-600 uppercase tracking-wider'>Acento / Texto</Label>
                <div className='flex items-center gap-3'>
                  <div className="relative w-12 h-12 rounded-lg border shadow-sm overflow-hidden flex-shrink-0">
                    <Input
                      type='color'
                      value={themeConfig.accentColor}
                      onChange={(e) =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          accentColor: e.target.value,
                        })
                      }
                      className='absolute -inset-2 w-16 h-16 cursor-pointer p-0 border-0'
                    />
                  </div>
                  <div className='flex-1'>
                    <Input
                      type='text'
                      value={themeConfig.accentColor}
                      onChange={(e) =>
                        handleFieldChange('theme', {
                          ...currentTheme,
                          accentColor: e.target.value,
                        })
                      }
                      className='font-mono text-sm uppercase h-9'
                      placeholder='#000000'
                    />
                    <p className='text-[11px] text-gray-500 mt-1'>Textos y detalles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Tipografía y Botones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b pb-4">
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Type className='w-5 h-5 text-indigo-500' />
              Tipografía
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6 space-y-6'>
            <div className='space-y-3'>
              <Label className='text-sm font-semibold text-gray-700'>Fuente Principal</Label>
              <Select
                value={themeConfig.fontFamily}
                onValueChange={(value) =>
                  handleFieldChange('theme', {
                    ...currentTheme,
                    fontFamily: value,
                  })
                }
              >
                <SelectTrigger className="w-full">
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

            <div className='space-y-3 pt-2'>
              <Label className='text-sm font-semibold text-gray-700'>Estilo de Botones</Label>
              <div className='grid grid-cols-3 gap-3'>
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
                      className={`py-4 px-2 border-2 rounded-xl text-center transition-all duration-200 flex flex-col items-center gap-3 group ${isSelected ? 'shadow-sm bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      style={{
                        borderColor: isSelected ? themeConfig.primaryColor : undefined,
                      }}
                    >
                      <div
                        className={`w-full max-w-[80px] h-8 text-white text-xs font-medium flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${style.value === 'rounded'
                            ? 'rounded-md'
                            : style.value === 'square'
                              ? 'rounded-none'
                              : 'rounded-full'
                          }`}
                        style={{ backgroundColor: isSelected ? themeConfig.primaryColor : '#9CA3AF' }}
                      >
                        Botón
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? '' : 'text-gray-500'}`}
                        style={{ color: isSelected ? themeConfig.primaryColor : undefined }}
                      >
                        {style.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="bg-gray-50/50 border-b pb-4">
            <CardTitle className='flex items-center gap-2 text-lg'>
              <ImageIcon className='w-5 h-5 text-emerald-500' />
              Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-6'>
            <div
              className='relative w-full h-[320px] rounded-xl border border-black/10 shadow-inner overflow-hidden flex flex-col transition-colors duration-500'
              style={{
                fontFamily: themeConfig.fontFamily,
                backgroundColor: themeConfig.secondaryColor
              }}
            >
              {/* Fake header */}
              <div className="h-14 bg-white/60 backdrop-blur-md border-b border-black/5 flex items-center px-4 justify-between shrink-0">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: themeConfig.primaryColor }} />
                   <div className="h-3 w-20 rounded bg-black/10" />
                 </div>
                 <div className="flex gap-3">
                   <div className="h-3 w-10 rounded bg-black/10" />
                   <div className="h-3 w-10 rounded bg-black/10" />
                 </div>
              </div>

              {/* Hero content */}
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 z-10">
                <h1 className='text-3xl font-extrabold tracking-tight mb-3' style={{ color: themeConfig.primaryColor }}>
                  Mi Tienda
                </h1>
                <p className='text-sm mb-6 max-w-[250px] mx-auto opacity-90' style={{ color: themeConfig.accentColor }}>
                  Descubre los mejores productos con calidad garantizada.
                </p>
                <div className='flex flex-col sm:flex-row justify-center gap-3 w-full max-w-[280px]'>
                  <button
                    className={`px-5 py-2.5 text-white text-sm font-medium shadow-md transition-all ${themeConfig.buttonStyle === 'rounded'
                      ? 'rounded-lg'
                      : themeConfig.buttonStyle === 'square'
                        ? 'rounded-none'
                        : 'rounded-full'
                      }`}
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    Ver Catálogo
                  </button>
                  <button
                    className={`px-5 py-2.5 border-2 text-sm font-medium bg-white/30 backdrop-blur-sm transition-all ${themeConfig.buttonStyle === 'rounded'
                      ? 'rounded-lg'
                      : themeConfig.buttonStyle === 'square'
                        ? 'rounded-none'
                        : 'rounded-full'
                      }`}
                    style={{
                      borderColor: themeConfig.primaryColor,
                      color: themeConfig.primaryColor
                    }}
                  >
                    Contactar
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
