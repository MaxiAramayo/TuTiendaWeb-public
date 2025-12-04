/**
 * Componente de header del perfil
 * 
 * Muestra información general del perfil, acciones principales
 * y estado de guardado
 * 
 * @module features/dashboard/modules/profile/components/sections
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { StoreProfile } from '../../types/store.type';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { 
  ExternalLink, 
  Share2, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatDate, calculateProfileCompleteness } from '../../utils/profile.utils';

/**
 * Props del componente
 */
interface ProfileHeaderProps {
  profile: StoreProfile | null;
  onReset: () => void;
  className?: string;
}

/**
 * Componente de header del perfil
 */
export function ProfileHeader({
  profile,
  onReset,
  className,
}: ProfileHeaderProps) {
  if (!profile) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6', className)}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 sm:h-6 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Obtener estado del perfil
  const getProfileStatus = () => {
    const completeness = calculateProfileCompleteness(profile);
    
    if (completeness >= 80) {
      return {
        status: 'complete',
        label: 'Perfil completo',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      };
    } else if (completeness >= 50) {
      return {
        status: 'partial',
        label: 'Perfil parcial',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      };
    } else {
      return {
        status: 'incomplete',
        label: 'Perfil incompleto',
        color: 'bg-red-100 text-red-800',
        icon: AlertCircle,
      };
    }
  };

  const profileStatus = getProfileStatus();
  const StatusIcon = profileStatus.icon;

  // Generar URL de la tienda
  const storeUrl = `${window.location.origin}/store/${profile.basicInfo.slug}`;

  // Manejar compartir
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile.basicInfo.name,
          text: profile.basicInfo.description || 'Visita mi tienda online',
          url: storeUrl,
        });
      } catch (error) {
        // Fallback a copiar al portapapeles
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  // Copiar al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      // Aquí podrías mostrar un toast de éxito
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}
    >
      {/* Header principal */}
      <div className="p-3 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 sm:space-y-4 lg:space-y-0">
          {/* Información del perfil */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Avatar */}
            <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
              {profile.theme?.logoUrl && (
                <AvatarImage 
                  src={profile.theme.logoUrl} 
                  alt={profile.basicInfo.name}
                />
              )}
              <AvatarFallback className="text-sm sm:text-lg font-semibold bg-blue-100 text-blue-600">
                {profile.basicInfo.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Detalles */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {profile.basicInfo.name}
                </h1>
                
                {/* Estado del perfil */}
                <Badge className={cn('flex items-center space-x-1 mt-1 sm:mt-0 self-start sm:self-auto', profileStatus.color)}>
                  <StatusIcon className="w-2 h-2 sm:w-3 sm:h-3" />
                  <span className="text-xs">{profileStatus.label}</span>
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                <p className="text-xs sm:text-sm text-gray-600 break-words">
                  {profile.basicInfo.description || 'Sin descripción'}
                </p>
                
              </div>
            </div>
          </div>
          
          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Botón de visitar tienda */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(storeUrl, '_blank')}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Visitar tienda</span>
              <span className="sm:hidden">Visitar</span>
            </Button>
            
            {/* Botón de compartir */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
            >
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Compartir</span>
              <span className="sm:hidden">Share</span>
            </Button>
            
            

          </div>
        </div>
      </div>
      
      {/* Barra de progreso */}
      <div className="px-3 sm:px-6 pb-3 sm:pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            Progreso del perfil
          </span>
          <span className="text-xs sm:text-sm text-gray-500">
            {calculateProfileCompleteness(profile)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
          <motion.div
            className={cn(
              'h-1.5 sm:h-2 rounded-full transition-all duration-500',
              calculateProfileCompleteness(profile) >= 80
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : calculateProfileCompleteness(profile) >= 50
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                : 'bg-gradient-to-r from-red-500 to-red-600'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${calculateProfileCompleteness(profile)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
      
      {/* Información adicional */}
      <div className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <div className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
              {profile.basicInfo.type || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">Tipo de tienda</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <div className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
              {profile.subscription?.plan?.toUpperCase() || 'FREE'}
            </div>
            <div className="text-xs text-gray-500">Plan actual</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <div className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
              ARS
            </div>
            <div className="text-xs text-gray-500">Moneda</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <div className="text-sm sm:text-lg font-semibold text-gray-900">
              {profile.metadata.status === 'active' ? '✅' : '❌'}
            </div>
            <div className="text-xs text-gray-500">Estado</div>
          </div>
        </div>
      </div>
      

    </motion.div>
  );
}

export default ProfileHeader;