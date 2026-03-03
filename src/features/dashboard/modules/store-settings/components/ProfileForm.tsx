/**
 * Componente principal del formulario de perfil
 * 
 * Maneja la edición completa del perfil de la tienda con
 * navegación por secciones y validaciones
 * 
 * @module features/dashboard/modules/profile/components
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '../hooks/useProfile';
import { ProfileSection, StoreProfile } from '../types/store.type';
import { ProfileHeader } from './sections/ProfileHeader';
import { ProfileNavigation } from './sections/ProfileNavigation';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { ContactInfoSection } from './sections/ContactInfoSection';
import { AddressSection } from './sections/AddressSection';
import { ScheduleSection } from './sections/ScheduleSection';
import { SocialLinksSection } from './sections/SocialLinksSection';
import { ThemeSection } from './sections/ThemeSection';
import { PaymentDeliverySection } from './sections/PaymentDeliverySection';

import { SubscriptionSection } from './sections/SubscriptionSection';
import ProfileStats from '../ui/ProfileStats';
import ProfileTips from '../ui/ProfileTips';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

/**
 * Configuración de secciones
 */
const SECTIONS: Array<{
  id: ProfileSection;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'basic',
    title: 'Información básica',
    description: 'Nombre, descripción y categoría de tu tienda',
    icon: '🏪',
  },
  {
    id: 'contact',
    title: 'Contacto',
    description: 'WhatsApp y sitio web',
    icon: '📞',
  },
  {
    id: 'address',
    title: 'Dirección',
    description: 'Ubicación física de tu tienda',
    icon: '📍',
  },
  {
    id: 'schedule',
    title: 'Horarios',
    description: 'Días y horarios de atención',
    icon: '🕒',
  },
  {
    id: 'social',
    title: 'Redes sociales',
    description: 'Instagram y Facebook',
    icon: '📱',
  },
  {
    id: 'theme',
    title: 'Apariencia',
    description: 'Logo, colores y estilo visual',
    icon: '🎨',
  },
  {
    id: 'settings',
    title: 'Pagos y Entrega',
    description: 'Métodos de pago y entrega',
    icon: '💳',
  },

  {
    id: 'subscription',
    title: 'Suscripción',
    description: 'Plan actual y facturación',
    icon: '👑',
  },
];

/**
 * Props del componente
 */
interface ProfileFormProps {
  className?: string;
  onSectionChange?: (section: ProfileSection) => void;
  showStats?: boolean;
  showTips?: boolean;
  /** Datos iniciales del perfil (desde Server Component) */
  initialProfile?: StoreProfile | null;
  /** Email del usuario autenticado (desde Firebase Auth) */
  userEmail?: string;
}

/**
 * Componente principal del formulario de perfil
 */
export function ProfileForm({
  className,
  onSectionChange,
  showStats = true,
  showTips = true,
  initialProfile,
  userEmail,
}: ProfileFormProps) {
  const [activeSection, setActiveSection] = useState<ProfileSection>('basic');
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();
  
  const {
    profile,
    formData,
    formState,
    form,
    isLoading,
    isSaving,
    error,
    updateField,
    saveProfile,
    resetForm,
    setActiveSection: setProfileActiveSection,
  } = useProfile({ initialProfile });

  // Obtener dirtyFields del formulario para tracking por sección
  const { formState: rhfFormState } = form;
  const dirtyFields = rhfFormState.dirtyFields as Record<string, boolean>;

  // Detectar dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Manejar cambio de sección
  const handleSectionChange = (section: ProfileSection) => {
    setActiveSection(section);
    setProfileActiveSection(section);
    onSectionChange?.(section);
  };

  // Manejar guardado manual
  const handleSave = async () => {
    const currentFormData = form.getValues();
    const success = await saveProfile(currentFormData);
    if (success) {
      toast({
        title: 'Perfil guardado',
        description: 'Los cambios se han guardado correctamente',
        variant: 'default',
      });
    }
    // No mostrar toast de error aquí, ya que:
    // - Si hay errores de validación, se muestran en los campos
    // - Si hay errores del servidor, el hook ya muestra el toast
  };

  // Wrapper para onSave que no requiere parámetros
  const handleSectionSave = useCallback(async () => {
    const currentFormData = form.getValues();
    await saveProfile(currentFormData);
  }, [form, saveProfile]);

  // Renderizar sección activa
  const renderActiveSection = () => {
    const sectionProps = {
      formData,
      formState,
      form,
      updateField,
      profile,
      onSave: handleSectionSave,
      isSaving,
    };

    switch (activeSection) {
      case 'basic':
        return <BasicInfoSection {...sectionProps} />;
      case 'contact':
        return <ContactInfoSection {...sectionProps} />;
      case 'address':
        return <AddressSection {...sectionProps} />;
      case 'schedule':
        return <ScheduleSection {...sectionProps} />;
      case 'social':
        return <SocialLinksSection {...sectionProps} />;
      case 'theme':
        return <ThemeSection {...sectionProps} />;
      case 'settings':
        return <PaymentDeliverySection {...sectionProps} />;

      case 'subscription':
        return <SubscriptionSection {...sectionProps} userEmail={userEmail} />;
      default:
        return <BasicInfoSection {...sectionProps} />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('p-6 bg-red-50 border border-red-200 rounded-lg', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar el perfil</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-7xl mx-auto p-2 sm:p-4 space-y-3 sm:space-y-6', className)}>
      {/* Header */}
      <ProfileHeader
        profile={profile}
        onReset={resetForm}
      />

      {/* Stats y Tips */}
      {(showStats || showTips) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {showStats && profile && (
            <ProfileStats
              user={profile as any}
              onEditClick={() => handleSectionChange('basic')}
            />
          )}
          {showTips && profile && (
          <ProfileTips
            user={profile as any}
          />
        )}
        </div>
      )}

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Navegación lateral */}
        {!isMobile && (
          <div className="lg:col-span-1">
            <ProfileNavigation
              sections={SECTIONS}
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              formState={formState}
              dirtyFields={dirtyFields}
            />
          </div>
        )}

        {/* Contenido de la sección */}
        <div className={cn(
          'lg:col-span-3',
          isMobile && 'col-span-1'
        )}>
          {/* Navegación móvil */}
          {isMobile && (
            <div className="mb-3 sm:mb-6">
              <ProfileNavigation
                sections={SECTIONS}
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                formState={formState}
                dirtyFields={dirtyFields}
                variant="mobile"
              />
            </div>
          )}

          {/* Sección activa */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-3 sm:p-4 lg:p-6"
              >
                {/* Título de sección */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-lg sm:text-xl lg:text-2xl">
                      {SECTIONS.find(s => s.id === activeSection)?.icon}
                    </span>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        {SECTIONS.find(s => s.id === activeSection)?.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {SECTIONS.find(s => s.id === activeSection)?.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenido de la sección */}
                {renderActiveSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>


    </div>
  );
}

export default ProfileForm;