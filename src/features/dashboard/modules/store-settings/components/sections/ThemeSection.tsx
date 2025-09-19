'use client';

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/features/auth/api/authStore';
import { useProfileStore } from '../../api/profileStore';
import { ProfileFormData, ThemeConfig } from '../../types/store.type';
import { Palette, Type, Upload, Save, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ThemeSectionProps {
  formData: {
    theme: ThemeConfig;
  };
  updateField: (field: string, value: any) => void;
}

const PRIMARY_COLORS = [
  { name: 'Azul Fuerte', value: '#1E40AF' },
  { name: 'Verde Fuerte', value: '#059669' },
  { name: 'Púrpura Fuerte', value: '#7C3AED' },
  { name: 'Rosa Fuerte', value: '#DB2777' },
  { name: 'Naranja Fuerte', value: '#EA580C' },
  { name: 'Rojo Fuerte', value: '#DC2626' },
];

const FONT_OPTIONS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif' },
];

const BUTTON_STYLES = [
  { name: 'Redondeado', value: 'rounded' },
  { name: 'Cuadrado', value: 'square' },
  { name: 'Píldora', value: 'pill' },
];

export function ThemeSection({ formData, updateField,  }: ThemeSectionProps) {
  const { user } = useAuthStore();
  const { updateTheme, getSectionState, storeProfile } = useProfileStore();
  
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);

  const sectionState = getSectionState('theme');
  
  // Obtener valores actuales del tema
  const currentTheme = formData.theme || {};
  const themeConfig: ThemeConfig = {
    primaryColor: currentTheme.primaryColor || '#6366f1',
    secondaryColor: currentTheme.secondaryColor || '#8b5cf6',
    accentColor: currentTheme.accentColor || '#8B5CF6',
    fontFamily: currentTheme.fontFamily || 'Inter, sans-serif',
    style: currentTheme.style || 'modern',
    buttonStyle: currentTheme.buttonStyle || 'rounded',
    logoUrl: currentTheme.logoUrl,
    bannerUrl: currentTheme.bannerUrl,
  };

  // Guardar cambios de la sección
  const handleSectionSave = useCallback(async () => {
    if (!user?.id || !storeProfile?.id) {
      toast.error('No se pudo identificar la tienda');
      return;
    }
    
    try {
      const success = await updateTheme(themeConfig);
      if (success) {
        toast.success('Tema guardado correctamente');
      }
    } catch (err) {
      console.error('Error al guardar tema:', err);
      toast.error('Error al guardar el tema');
    }
  }, [user?.id, storeProfile?.id, themeConfig, updateTheme]);

  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    updateField(field, value);
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>Tema y Branding</h3>
          <p className='text-sm text-gray-500'>Personaliza la apariencia visual de tu tienda</p>
        </div>
        <Button
          onClick={handleSectionSave}
          disabled={sectionState.isSaving}
          className='flex items-center space-x-2'
          size='sm'
        >
          {sectionState.isSaving ? (
            <Loader2 className='w-4 h-4 animate-spin' />
          ) : (
            <Save className='w-4 h-4' />
          )}
          <span>{sectionState.isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
        </Button>
      </div>

      {/* Sección de Colores */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Palette className='w-5 h-5' />
            Esquema de Colores
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
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
                className='w-16 h-10 p-1 border rounded'
              />
              <Input
                type='text'
                value={themeConfig.primaryColor}
                onChange={(e) =>
                  handleFieldChange('theme', {
                    ...currentTheme,
                    primaryColor: e.target.value,
                  })
                }
                className='flex-1'
                placeholder='#6366f1'
              />
            </div>
            <div className='flex flex-wrap gap-2'>
              {PRIMARY_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() =>
                    handleFieldChange('theme', {
                      ...currentTheme,
                      primaryColor: color.value,
                    })
                  }
                  className='w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors'
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
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
        </CardContent>
      </Card>

      {/* Sección de Estilo de Botones */}
      <Card>
        <CardHeader>
          <CardTitle>Estilo de Botones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-4'>
            {BUTTON_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() =>
                  handleFieldChange('theme', {
                    ...currentTheme,
                    buttonStyle: style.value as 'rounded' | 'square' | 'pill',
                  })
                }
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  themeConfig.buttonStyle === style.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div
                  className={`w-full h-8 bg-blue-500 text-white text-xs flex items-center justify-center ${
                    style.value === 'rounded'
                      ? 'rounded-md'
                      : style.value === 'square'
                      ? 'rounded-none'
                      : 'rounded-full'
                  }`}
                >
                  Botón
                </div>
                <p className='text-sm mt-2'>{style.name}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}