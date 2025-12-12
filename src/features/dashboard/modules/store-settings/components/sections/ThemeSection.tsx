'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  X,
  Save,
  Loader2,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

/**
 * Props para el componente ThemeSection
 */
interface ThemeSectionProps {
  /** Datos del formulario */
  formData: ProfileFormData;
  /** Estado del formulario */
  formState?: FormState;
  /** Función para actualizar campos */
  updateField: (field: keyof ProfileFormData, value: any) => void;
  /** Función de guardado */
  onSave?: () => Promise<void>;
  /** Estado de guardado */
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

/**
 * Componente para la configuración del tema y branding
 */
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

  // Estados locales para las imágenes
  const [logoUpload, setLogoUpload] = useState<ImageUpload | null>(null);
  const [bannerUpload, setBannerUpload] = useState<ImageUpload | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [isDeletingBanner, setIsDeletingBanner] = useState(false);

  // Obtener valores actuales del tema con fallbacks seguros
  const currentTheme = formData.theme || {};

  // Validar que style sea un valor permitido
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

  // Guardar cambios de la sección usando Server Action
  const handleSectionSave = useCallback(async () => {
    if (!user?.uid) {
      error('No se pudo identificar al usuario');
      return;
    }

    setIsSectionSaving(true);
    try {
      // Asegurar que style y buttonStyle tengan valores válidos
      const validStyles = ['modern', 'classic', 'minimal', 'colorful'] as const;
      const validButtonStyles = ['rounded', 'square', 'pill'] as const;

      const themeData = {
        logoUrl: themeConfig.logoUrl || '',
        bannerUrl: themeConfig.bannerUrl || '',
        primaryColor: themeConfig.primaryColor || '#6366f1',
        secondaryColor: themeConfig.secondaryColor || '#8b5cf6',
        accentColor: themeConfig.accentColor || '#8B5CF6',
        fontFamily: themeConfig.fontFamily || 'Inter, sans-serif',
        style: (validStyles.includes(themeConfig.style as typeof validStyles[number])
          ? themeConfig.style
          : 'modern') as 'modern' | 'classic' | 'minimal' | 'colorful',
        buttonStyle: (validButtonStyles.includes(themeConfig.buttonStyle as typeof validButtonStyles[number])
          ? themeConfig.buttonStyle
          : 'rounded') as 'rounded' | 'square' | 'pill',
      };

      console.log('Saving theme data:', themeData);
      const result = await updateThemeAction(themeData);

      if (result.success) {
        // Refrescar el perfil desde el servidor para actualizar el store
        const refreshResult = await getProfileAction();
        if (refreshResult.success && refreshResult.data) {
          // Cast al tipo del store (son compatibles pero definidos separadamente)
          setProfile(refreshResult.data as unknown as import('../../types/store.type').StoreProfile);
        }
        success('Tema guardado correctamente');
      } else {
        const errorMsg = result.errors._form?.[0] ||
          Object.values(result.errors).flat()[0] ||
          'Error al guardar el tema. Inténtalo de nuevo.';
        error(errorMsg);
        console.error('Validation errors:', result.errors);
      }
    } catch (err) {
      console.error('Error al guardar tema:', err);
      error('Error al guardar el tema. Inténtalo de nuevo.');
    } finally {
      setIsSectionSaving(false);
    }
  }, [user?.uid, themeConfig, setProfile, success, error]);

  // Función para actualizar campos
  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    updateField(field, value);
  };

  /**
   * Maneja la selección de archivos de imagen con subida inmediata
   */
  const handleImageSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
      const file = event.target.files?.[0];
      if (!file || !user?.uid) return;

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        error('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        error('La imagen debe ser menor a 5MB');
        return;
      }

      try {
        if (type === 'logo') {
          setIsLoadingLogo(true);
        } else {
          setIsLoadingBanner(true);
        }

        // Eliminar imagen anterior si existe
        const currentImageUrl = type === 'logo' ? currentTheme.logoUrl : currentTheme.bannerUrl;
        if (currentImageUrl) {
          try {
            await profileClientService.deleteImage(profile?.id || user.uid, currentImageUrl, type);
          } catch (deleteErr) {
            // Si falla la eliminación, continuamos con la subida de la nueva imagen
            console.warn(`No se pudo eliminar la imagen anterior de ${type}:`, deleteErr);
          }
        }

        // Subir nueva imagen usando el servicio cliente
        const imageUrl = await profileClientService.uploadImage(
          profile?.id || user.uid,
          file,
          type === 'logo' ? 'logo' : 'banner'
        );

        // Actualizar el tema con la nueva URL
        const updatedTheme = {
          ...currentTheme,
          [type === 'logo' ? 'logoUrl' : 'bannerUrl']: imageUrl,
        };

        handleFieldChange('theme', updatedTheme);

        // Guardar automáticamente en la base de datos
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
          // Refrescar el store
          const refreshResult = await getProfileAction();
          if (refreshResult.success && refreshResult.data) {
            setProfile(refreshResult.data as any);
          }
          success(`${type === 'logo' ? 'Logo' : 'Banner'} subido y guardado correctamente`);
        } else {
          error(`Error al guardar ${type === 'logo' ? 'logo' : 'banner'} en la base de datos`);
        }

        // Limpiar el input
        event.target.value = '';
      } catch (err) {
        console.error(`Error al subir ${type}:`, err);
        error(`Error al subir ${type === 'logo' ? 'logo' : 'banner'}. Inténtalo de nuevo.`);
      } finally {
        if (type === 'logo') {
          setIsLoadingLogo(false);
        } else {
          setIsLoadingBanner(false);
        }
      }
    },
    [currentTheme, handleFieldChange, profile?.id, user?.uid, success, error, setProfile]
  );

  /**
   * Elimina una imagen del tema
   */
  const removeImage = useCallback(
    async (type: 'logo' | 'banner') => {
      if (!user?.uid) return;

      const imageUrl = type === 'logo' ? themeConfig.logoUrl : themeConfig.bannerUrl;
      if (!imageUrl) return;

      try {
        if (type === 'logo') {
          setIsDeletingLogo(true);
        } else {
          setIsDeletingBanner(true);
        }

        // Eliminar imagen del storage usando el servicio cliente
        await profileClientService.deleteImage(profile?.id || user.uid, imageUrl, type);

        // Actualizar el tema removiendo la URL
        const updatedTheme = {
          ...currentTheme,
          [type === 'logo' ? 'logoUrl' : 'bannerUrl']: '',
        };

        handleFieldChange('theme', updatedTheme);

        // Guardar automáticamente en la base de datos
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
          // Refrescar el store
          const refreshResult = await getProfileAction();
          if (refreshResult.success && refreshResult.data) {
            setProfile(refreshResult.data as any);
          }
          success(`${type === 'logo' ? 'Logo' : 'Banner'} eliminado correctamente`);
        } else {
          error(`Error al eliminar ${type === 'logo' ? 'logo' : 'banner'} de la base de datos`);
        }
      } catch (err) {
        console.error(`Error al eliminar ${type}:`, err);
        error(`Error al eliminar ${type === 'logo' ? 'logo' : 'banner'}. Inténtalo de nuevo.`);
      } finally {
        if (type === 'logo') {
          setIsDeletingLogo(false);
        } else {
          setIsDeletingBanner(false);
        }
      }
    },
    [themeConfig.logoUrl, themeConfig.bannerUrl, currentTheme, handleFieldChange, profile?.id, user?.uid, success, error, setProfile]
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Tema y Branding
          </h3>
          <p className='text-sm text-gray-500'>
            Personaliza la apariencia visual de tu tienda
          </p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={isSectionSaving || !formState?.isDirty}
          className='flex items-center justify-center space-x-2 w-full sm:w-auto'
          size='sm'
        >
          {isSectionSaving ? (
            <Loader2 className='w-3 h-3 sm:w-4 sm:h-4 animate-spin' />
          ) : (
            <Save className='w-3 h-3 sm:w-4 sm:h-4' />
          )}
          <span className='text-xs sm:text-sm'>{isSectionSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>

      {/* Sección de Imágenes */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ImageIcon className='w-5 h-5' />
            Imágenes de Marca
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Logo */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-medium'>Logo de la Tienda</Label>
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
                  <span className='ml-2'>Subir Logo</span>
                </Button>
                {themeConfig.logoUrl && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => removeImage('logo')}
                    disabled={isDeletingLogo}
                    className='text-red-600 hover:text-red-700'
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
              <div className='relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-full overflow-hidden'>
                <img
                  src={themeConfig.logoUrl}
                  alt='Logo de la tienda'
                  className='w-full h-full object-contain'
                />
                {(isLoadingLogo || isDeletingLogo) && (
                  <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                    <Loader2 className='w-6 h-6 text-white animate-spin' />
                  </div>
                )}
              </div>
            ) : (
              <div className='w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-500'>
                <div className='text-center'>
                  <ImageIcon className='w-8 h-8 mx-auto mb-2' />
                  <p className='text-xs'>Sin logo</p>
                </div>
              </div>
            )}
          </div>

          {/* Banner */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-medium'>Banner de la Tienda</Label>
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
                  <span className='ml-2'>Subir Banner</span>
                </Button>
                {themeConfig.bannerUrl && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => removeImage('banner')}
                    disabled={isDeletingBanner}
                    className='text-red-600 hover:text-red-700'
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
              <div className='relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden'>
                <img
                  src={themeConfig.bannerUrl}
                  alt='Banner de la tienda'
                  className='w-full h-full object-cover'
                />
                {(isLoadingBanner || isDeletingBanner) && (
                  <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                    <Loader2 className='w-6 h-6 text-white animate-spin' />
                  </div>
                )}
              </div>
            ) : (
              <div className='w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500'>
                <div className='text-center'>
                  <ImageIcon className='w-8 h-8 mx-auto mb-2' />
                  <p className='text-xs'>Sin banner</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sección de Colores */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Palette className='w-5 h-5' />
            Esquema de Colores
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-8'>
          {/* Paletas Recomendadas */}
          <div className='space-y-4'>
            <Label className='text-base font-semibold'>Paletas Recomendadas</Label>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
                  className='flex flex-col items-start p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50/10 transition-all text-left group'
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='w-6 h-6 rounded-full border border-black/10' style={{ backgroundColor: preset.primary }} />
                    <div className='w-6 h-6 rounded-full border border-black/10' style={{ backgroundColor: preset.secondary }} />
                    <div className='w-6 h-6 rounded-full border border-black/10' style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span className='font-medium text-gray-900 group-hover:text-blue-700'>
                    {preset.name}
                  </span>
                  <span className='text-xs text-gray-500 mt-1'>
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200" />

          {/* Ajustes Manuales */}
          <div className='space-y-6'>
            <Label className='text-base font-semibold'>Ajustes Manuales</Label>

            <div className='grid gap-6 sm:grid-cols-3'>
              {/* Color Primario */}
              <div className='space-y-3'>
                <Label className='text-sm font-medium'>Color Primario</Label>
                <div className='flex items-center gap-3'>
                  <Input
                    type='color'
                    value={themeConfig.primaryColor}
                    onChange={(e) =>
                      handleFieldChange('theme', {
                        ...currentTheme,
                        primaryColor: e.target.value,
                      })
                    }
                    className='w-12 h-12 p-1 border rounded-lg cursor-pointer'
                  />
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
                      className='font-mono text-sm uppercase'
                      placeholder='#000000'
                    />
                    <p className='text-xs text-gray-500 mt-1'>Color de marca</p>
                  </div>
                </div>
              </div>

              {/* Color Secundario */}
              <div className='space-y-3'>
                <Label className='text-sm font-medium'>Color Secundario</Label>
                <div className='flex items-center gap-3'>
                  <Input
                    type='color'
                    value={themeConfig.secondaryColor}
                    onChange={(e) =>
                      handleFieldChange('theme', {
                        ...currentTheme,
                        secondaryColor: e.target.value,
                      })
                    }
                    className='w-12 h-12 p-1 border rounded-lg cursor-pointer'
                  />
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
                      className='font-mono text-sm uppercase'
                      placeholder='#000000'
                    />
                    <p className='text-xs text-gray-500 mt-1'>Fondos suaves</p>
                  </div>
                </div>
              </div>

              {/* Color de Acento */}
              <div className='space-y-3'>
                <Label className='text-sm font-medium'>Color de Acento</Label>
                <div className='flex items-center gap-3'>
                  <Input
                    type='color'
                    value={themeConfig.accentColor}
                    onChange={(e) =>
                      handleFieldChange('theme', {
                        ...currentTheme,
                        accentColor: e.target.value,
                      })
                    }
                    className='w-12 h-12 p-1 border rounded-lg cursor-pointer'
                  />
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
                      className='font-mono text-sm uppercase'
                      placeholder='#000000'
                    />
                    <p className='text-xs text-gray-500 mt-1'>Textos y detalles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Tipografía */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Type className='w-5 h-5' />
            Tipografía
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-3'>
            <Label className='text-sm font-medium'>Fuente Principal</Label>
            <Select
              value={themeConfig.fontFamily}
              onValueChange={(value) =>
                handleFieldChange('theme', {
                  ...currentTheme,
                  fontFamily: value,
                })
              }
            >
              <SelectTrigger>
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

          {/* Previsualización de Tipografía */}
          <div className='space-y-3'>
            <Label className='text-sm font-medium'>Previsualización</Label>
            <div
              className='p-6 border rounded-xl shadow-sm transition-colors duration-300'
              style={{
                fontFamily: themeConfig.fontFamily,
                backgroundColor: themeConfig.secondaryColor
              }}
            >
              <div className="bg-white/50 p-4 rounded-lg backdrop-blur-sm">
                <h1 className='text-3xl font-bold mb-2' style={{ color: themeConfig.primaryColor }}>
                  Mi Tienda Online
                </h1>
                <h2 className='text-xl font-semibold mb-3' style={{ color: themeConfig.accentColor }}>
                  Productos Destacados
                </h2>
                <p className='text-base mb-6 max-w-lg leading-relaxed' style={{ color: themeConfig.accentColor }}>
                  Descubre nuestra amplia selección de productos de alta calidad.
                  Ofrecemos las mejores marcas con el mejor diseño.
                </p>
                <div className='flex gap-3'>
                  <button
                    className={`px-6 py-2.5 text-white font-medium shadow-sm transition-all hover:opacity-90 active:scale-95 ${themeConfig.buttonStyle === 'rounded'
                      ? 'rounded-md'
                      : themeConfig.buttonStyle === 'square'
                        ? 'rounded-none'
                        : 'rounded-full'
                      }`}
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    Comprar Ahora
                  </button>
                  <button
                    className={`px-6 py-2.5 border-2 font-medium transition-all hover:bg-black/5 active:scale-95 ${themeConfig.buttonStyle === 'rounded'
                      ? 'rounded-md'
                      : themeConfig.buttonStyle === 'square'
                        ? 'rounded-none'
                        : 'rounded-full'
                      }`}
                    style={{
                      borderColor: themeConfig.accentColor,
                      color: themeConfig.accentColor
                    }}
                  >
                    Ver Más
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Estilo de Botones */}
      <Card>
        <CardHeader>
          <CardTitle>Estilo de Botones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
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
                  className={`p-6 border-2 rounded-xl text-center transition-all duration-200 flex flex-col items-center gap-3 group ${isSelected ? 'shadow-md ring-1' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  style={{
                    borderColor: isSelected ? themeConfig.primaryColor : undefined,
                    backgroundColor: isSelected ? `${themeConfig.primaryColor}10` : 'transparent', // 10 = alpha 10%
                    boxShadow: isSelected ? `0 0 0 1px ${themeConfig.primaryColor}` : undefined
                  }}
                >
                  <div
                    className={`w-full max-w-[120px] h-10 text-white text-sm font-medium flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 ${style.value === 'rounded'
                        ? 'rounded-md'
                        : style.value === 'square'
                          ? 'rounded-none'
                          : 'rounded-full'
                      }`}
                    style={{ backgroundColor: themeConfig.primaryColor }}
                  >
                    Botón
                  </div>
                  <span className={`text-sm font-medium ${isSelected ? '' : 'text-gray-600'}`}
                    style={{ color: isSelected ? themeConfig.primaryColor : undefined }}
                  >
                    {style.name}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}