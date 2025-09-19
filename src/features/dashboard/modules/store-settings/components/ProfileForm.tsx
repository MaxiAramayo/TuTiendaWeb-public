'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/api/authStore';
import { useProfileStore } from '../api/profileStore';
import { ProfileSection } from '../types/store.type';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { AddressSection } from './sections/AddressSection';
import { ScheduleSection } from './sections/ScheduleSection';
import { SocialLinksSection } from './sections/SocialLinksSection';
import { ThemeSection } from './sections/ThemeSection';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { id: 'basic' as ProfileSection, title: 'Información básica', description: 'Datos principales y WhatsApp', icon: '🏪' },
  { id: 'address' as ProfileSection, title: 'Dirección', description: 'Ubicación física', icon: '📍' },
  { id: 'schedule' as ProfileSection, title: 'Horarios', description: 'Días y horarios', icon: '🕒' },
  { id: 'social' as ProfileSection, title: 'Redes sociales', description: 'Instagram y Facebook', icon: '📱' },
  { id: 'theme' as ProfileSection, title: 'Apariencia', description: 'Colores y estilo', icon: '🎨' },
];

interface ProfileFormProps {
  className?: string;
}

export function ProfileForm({ className }: ProfileFormProps) {
  const [activeSection, setActiveSection] = useState<ProfileSection>('basic');
  const { user } = useAuthStore();
  const { storeProfile, isLoading, error, loadStoreProfile } = useProfileStore();

  const [formData, setFormData] = useState({
    // Información básica
    name: '',
    description: '',
    siteName: '',        
    storeType: '',
    whatsapp: '',
    
    // Dirección
    street: '',
    city: '',
    province: '',
    country: '',
    zipCode: '',
    
    // Otros
    schedule: {},
    instagram: '',
    facebook: '',
    theme: {}
  });

  // Cargar perfil al montar
  useEffect(() => {
    if (user?.id && !storeProfile) {
      loadStoreProfile(user.id);
    }
  }, [user?.id, storeProfile, loadStoreProfile]);


  useEffect(() => {
    if (storeProfile) {
      setFormData({
        // Información básica
        name: storeProfile.basicInfo?.name || '',
        description: storeProfile.basicInfo?.description || '',
        siteName: storeProfile.basicInfo?.slug || '',        
        storeType: storeProfile.basicInfo?.type || '',
        whatsapp: storeProfile.basicInfo?.whatsapp || '', 
        
        // Dirección
        street: storeProfile.address?.street || '',
        city: storeProfile.address?.city || '',
        province: storeProfile.address?.province || '',
        country: storeProfile.address?.country || 'Argentina',
        zipCode: storeProfile.address?.zipCode || '',
        
        // Otros
        schedule: storeProfile.schedule || {},
        instagram: storeProfile.socialLinks?.instagram || '',
        facebook: storeProfile.socialLinks?.facebook || '',
        theme: storeProfile.theme || {}
      });
    }
  }, [storeProfile]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Renderizar sección activa
  const renderActiveSection = () => {
    const props = { formData, updateField };

    switch (activeSection) {
      case 'basic': return <BasicInfoSection {...props} />;
      case 'address': return <AddressSection {...props} />;
      case 'schedule': return <ScheduleSection {...props} />;
      case 'social': return <SocialLinksSection {...props} />;
      case 'theme': return <ThemeSection {...props} />;
      default: return <BasicInfoSection {...props} />;
    }
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando tienda...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-6 bg-red-50 border border-red-200 rounded-lg', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar la tienda</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => user?.id && loadStoreProfile(user.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!storeProfile) {
    return (
      <div className={cn('p-6 bg-yellow-50 border border-yellow-200 rounded-lg', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No se encontró la tienda</h3>
          <p className="text-yellow-600">No tienes una tienda asociada a tu cuenta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-7xl mx-auto p-4 space-y-6', className)}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Tienda</h1>
        <p className="text-gray-600">
          Administra la información de <span className="font-medium">{storeProfile.basicInfo?.name || 'tu tienda'}</span>
        </p>
      </div>

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navegación lateral */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-all duration-200',
                  activeSection === section.id
                    ? 'bg-blue-50 border border-blue-200 text-blue-900 shadow-sm'
                    : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{section.icon}</span>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{section.title}</div>
                    <div className="text-xs text-gray-500 truncate">{section.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de la sección */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              {renderActiveSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileForm;