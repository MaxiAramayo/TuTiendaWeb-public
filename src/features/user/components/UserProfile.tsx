/**
 * Componente de perfil de usuario
 * 
 * @module features/user/components/UserProfile
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore';

import { User } from '@/features/user/user.types';
import { useUserData } from '@/features/user/hooks/useUserData';

/**
 * Schema de validación para actualización de perfil
 */
const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  preferences: z.object({
    language: z.enum(['es', 'en']).optional()
  }).optional()
});

type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

interface UserProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
}

/**
 * Componente para mostrar y editar el perfil del usuario
 */
export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { updateUserData, isLoading } = useUserData();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user.displayName,
      email: user.email,
      preferences: user.preferences || { language: 'es' }
    }
  });

  /**
   * Manejar envío del formulario
   */
  const onSubmit = async (data: UpdateProfileFormValues) => {
    try {
      await updateUserData(user.id, data);
      
      // El toast de éxito ya se muestra en updateUserData
      setIsEditing(false);
      
      // Crear el objeto usuario actualizado para el callback
      const updatedUser = {
        ...user,
        ...data,
        updatedAt: Timestamp.now()
      };
      
      onUpdate?.(updatedUser);
    } catch (error: any) {
      // El toast de error ya se muestra en updateUserData
      console.error('Error al actualizar perfil:', error);
    }
  };

  /**
   * Cancelar edición
   */
  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  /**
   * Formatear fecha
   */
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'No disponible';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Perfil de Usuario
        </h2>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            Editar Perfil
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nombre para mostrar */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre para mostrar
            </label>
            <input
              {...register('displayName')}
              type="text"
              id="displayName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tu nombre"
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              placeholder="tu@email.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              El email no se puede modificar
            </p>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Idioma */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Idioma preferido
            </label>
            <select
              {...register('preferences.language')}
              id="language"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={!isDirty || isLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Información del usuario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre para mostrar
              </label>
              <p className="text-gray-900">{user.displayName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <p className="text-gray-900 capitalize">{user.role}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Idioma preferido
              </label>
              <p className="text-gray-900">
                {user.preferences?.language === 'en' ? 'English' : 'Español'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiendas asociadas
              </label>
              <p className="text-gray-900">{user.storeIds.length} tienda(s)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miembro desde
              </label>
              <p className="text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Información de la cuenta
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">ID de usuario:</span>
                <span className="ml-2 text-gray-600 font-mono">{user.id}</span>
              </div>
              
              <div>
                <span className="font-medium text-gray-700">Última actualización:</span>
                <span className="ml-2 text-gray-600">{formatDate(user.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;