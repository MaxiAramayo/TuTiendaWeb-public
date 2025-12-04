/**
 * Componente de navegación del perfil
 * 
 * Proporciona navegación entre las diferentes secciones del perfil
 * con indicadores de estado y progreso
 * 
 * @module features/dashboard/modules/profile/components/sections
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ProfileSection, FormState } from '../../types/store.type';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, Circle } from 'lucide-react';

/**
 * Props del componente
 */
interface ProfileNavigationProps {
  sections: Array<{
    id: ProfileSection;
    title: string;
    description: string;
    icon: string;
  }>;
  activeSection: ProfileSection;
  onSectionChange: (section: ProfileSection) => void;
  formState: FormState;
  /** Campos modificados (dirty) del formulario - opcional para tracking por sección */
  dirtyFields?: Record<string, boolean>;
  variant?: 'desktop' | 'mobile';
  className?: string;
}

/**
 * Mapeo de campos del formulario a secciones
 */
const FIELD_TO_SECTION_MAP: Record<string, ProfileSection> = {
  // Información básica
  name: 'basic',
  description: 'basic',
  siteName: 'basic',
  storeType: 'basic',
  category: 'basic',
  slug: 'basic',
  type: 'basic',
  
  // Contacto
  whatsapp: 'contact',
  website: 'contact',
  email: 'contact',
  phone: 'contact',
  
  // Dirección
  street: 'address',
  city: 'address',
  province: 'address',
  country: 'address',
  zipCode: 'address',
  
  // Horarios
  schedule: 'schedule',
  openingHours: 'schedule',
  
  // Redes sociales
  instagram: 'social',
  facebook: 'social',
  socialLinks: 'social',
  
  // Tema
  theme: 'theme',
  primaryColor: 'theme',
  secondaryColor: 'theme',
  accentColor: 'theme',
  logoUrl: 'theme',
  bannerUrl: 'theme',
  fontFamily: 'theme',
  style: 'theme',
  
  // Configuración de pagos y entrega
  paymentMethods: 'settings',
  deliveryMethods: 'settings',
  currency: 'settings',
  
  // Suscripción
  subscription: 'subscription',
};

/**
 * Componente de navegación del perfil
 */
export function ProfileNavigation({
  sections,
  activeSection,
  onSectionChange,
  formState,
  dirtyFields = {},
  variant = 'desktop',
  className,
}: ProfileNavigationProps) {
  // Calcular qué secciones tienen campos modificados
  const getDirtySections = useCallback((): Set<ProfileSection> => {
    const dirtySections = new Set<ProfileSection>();
    
    Object.keys(dirtyFields).forEach(field => {
      if (dirtyFields[field]) {
        // Buscar el campo base (sin índices de array como [0])
        const baseField = field.split('.')[0].replace(/\[\d+\]/g, '');
        const section = FIELD_TO_SECTION_MAP[baseField];
        if (section) {
          dirtySections.add(section);
        }
      }
    });
    
    return dirtySections;
  }, [dirtyFields]);

  // Memoizar estados de secciones basado en formState y dirtyFields
  const sectionStatuses = useMemo(() => {
    const dirtySections = getDirtySections();
    
    return sections.reduce((acc, section) => {
      const sectionErrors = formState.errors[section.id];
      const hasErrors = sectionErrors && (typeof sectionErrors === 'string' ? sectionErrors.length > 0 : Object.keys(sectionErrors).length > 0);
      const isSectionDirty = dirtySections.has(section.id);
      
      let status: 'error' | 'modified' | 'clean' = 'clean';
      if (hasErrors) {
        status = 'error';
      } else if (isSectionDirty) {
        status = 'modified';
      }
      
      acc[section.id] = status;
      return acc;
    }, {} as Record<ProfileSection, 'error' | 'modified' | 'clean'>);
  }, [sections, formState.errors, getDirtySections]);
  
  // Obtener estado de una sección desde el cache memoizado
  const getSectionStatus = useCallback((sectionId: ProfileSection) => {
    return sectionStatuses[sectionId] || 'clean';
  }, [sectionStatuses]);
  
  // Calcular progreso basado en secciones completadas
  const progress = useMemo(() => {
    const completedSections = Object.values(sectionStatuses).filter(status => status !== 'error').length;
    return (completedSections / sections.length) * 100;
  }, [sectionStatuses, sections.length]);

  // Renderizar indicador de estado
  const renderStatusIcon = (sectionId: ProfileSection, size: 'sm' | 'md' = 'md') => {
    const status = getSectionStatus(sectionId);
    const iconClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
    
    switch (status) {
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'modified':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      default:
        return <Circle className={`${iconClass} text-gray-400`} />;
    }
  };

  // Versión móvil (horizontal)
  if (variant === 'mobile') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex overflow-x-auto pb-2 space-x-1 sm:space-x-2 scrollbar-hide">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const status = getSectionStatus(section.id);
            
            return (
              <motion.button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'flex-shrink-0 flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-sm sm:text-base">{section.icon}</span>
                <span className="whitespace-nowrap truncate max-w-[80px] sm:max-w-none">{section.title}</span>
                {!isActive && renderStatusIcon(section.id, 'sm')}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Versión desktop (vertical)
  return (
    <div className={cn('space-y-2', className)}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Configuración del perfil
        </h3>
        
        <nav className="space-y-1">
          {sections.map((section, index) => {
            const isActive = activeSection === section.id;
            const status = getSectionStatus(section.id);
            
            return (
              <motion.button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'w-full flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg text-left transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 border border-blue-200 text-blue-900'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Icono y estado */}
                <div className="flex-shrink-0 flex items-center space-x-1 sm:space-x-2">
                  <span className="text-base sm:text-lg">{section.icon}</span>
                  {renderStatusIcon(section.id, 'sm')}
                </div>
                
                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={cn(
                      'text-xs sm:text-sm font-medium truncate',
                      isActive ? 'text-blue-900' : 'text-gray-900'
                    )}>
                      {section.title}
                    </h4>
                    
                    {/* Indicador activo */}
                    {isActive && (
                      <motion.div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"
                        layoutId="activeIndicator"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </div>
                  
                  <p className={cn(
                    'text-xs mt-1 truncate',
                    isActive ? 'text-blue-700' : 'text-gray-500'
                  )}>
                    {section.description}
                  </p>
                  
                  {/* Indicador de errores */}
                  {status === 'error' && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertCircle className="w-2 h-2 sm:w-3 sm:h-3 text-red-500" />
                      <span className="text-xs text-red-600">
                        Requiere atención
                      </span>
                    </div>
                  )}
                  
                  {/* Indicador de cambios */}
                  {status === 'modified' && (
                    <div className="flex items-center space-x-1 mt-1">
                      <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 text-green-500" />
                      <span className="text-xs text-green-600">
                        Modificado
                      </span>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </nav>
        
        {/* Progreso general */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Progreso del perfil
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 sm:h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileNavigation;