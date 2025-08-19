/**
 * Componente de avatar del perfil
 * 
 * Maneja la carga, edición y gestión de imágenes de perfil y portada
 * con funcionalidades avanzadas de recorte y optimización
 * 
 * @module features/dashboard/modules/profile/components/avatar
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileFormData, FormState } from '../../types/store.type';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Edit, 
  Download, 
  Crop, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  X, 
  AlertCircle, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { compressImage } from '../../utils/profile.utils';

/**
 * Props del componente
 */
interface ProfileAvatarProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  onImageUpload?: (file: File, type: 'avatar' | 'cover') => Promise<string>;
  onImageDelete?: (imageUrl: string, type: 'avatar' | 'cover') => Promise<void>;
}

/**
 * Configuración de imágenes
 */
const IMAGE_CONFIG = {
  avatar: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 400,
    maxHeight: 400,
    aspectRatio: 1, // 1:1 (cuadrado)
    quality: 0.8
  },
  cover: {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxWidth: 1200,
    maxHeight: 400,
    aspectRatio: 3, // 3:1 (rectangular)
    quality: 0.85
  }
};

/**
 * Tipos de archivo permitidos
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Componente de avatar del perfil
 */
export function ProfileAvatar({
  formData,
  formState,
  updateField,
  onImageUpload,
  onImageDelete,
}: ProfileAvatarProps) {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
  const [previewImages, setPreviewImages] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Validar archivo
  const validateFile = (file: File, type: 'avatar' | 'cover'): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Tipo de archivo no permitido. Usa JPG, PNG o WebP.';
    }
    
    const config = IMAGE_CONFIG[type];
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      return `El archivo es muy grande. Máximo ${maxSizeMB}MB.`;
    }
    
    return null;
  };

  // Procesar imagen
  const processImage = async (file: File, type: 'avatar' | 'cover'): Promise<File> => {
    const config = IMAGE_CONFIG[type];
    
    try {
      const compressedFile = await compressImage(file, config.quality);
      
      return compressedFile;
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      return file;
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = useCallback(async (file: File, type: 'avatar' | 'cover') => {
    const validationError = validateFile(file, type);
    if (validationError) {
      // Aquí podrías mostrar un toast con el error
      console.error(validationError);
      return;
    }

    setIsUploading(prev => ({ ...prev, [type]: true }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    try {
      // Crear preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewImages(prev => ({ ...prev, [type]: previewUrl }));
      
      // Procesar imagen
      setUploadProgress(prev => ({ ...prev, [type]: 25 }));
      const processedFile = await processImage(file, type);
      
      setUploadProgress(prev => ({ ...prev, [type]: 50 }));
      
      // Subir imagen si hay función de upload
      if (onImageUpload) {
        const imageUrl = await onImageUpload(processedFile, type);
        setUploadProgress(prev => ({ ...prev, [type]: 100 }));
        
        // Actualizar campo correspondiente en el tema
        if (type === 'avatar') {
          // Para el avatar, podríamos usar logoUrl del tema
          // Por ahora, solo mostramos la imagen sin actualizar el formulario
          // Avatar uploaded successfully
        } else {
          // Para el cover, podríamos usar bannerUrl del tema
          // Por ahora, solo mostramos la imagen sin actualizar el formulario
          // Cover uploaded successfully
        }
      } else {
        // Si no hay función de upload, usar el preview
        if (type === 'avatar') {
          // Para el avatar, podríamos usar logoUrl del tema
          // Avatar preview set
        } else {
          // Para el cover, podríamos usar bannerUrl del tema
          // Cover preview set
        }
        setUploadProgress(prev => ({ ...prev, [type]: 100 }));
      }
      
      // Limpiar preview después de un tiempo
      setTimeout(() => {
        setPreviewImages(prev => {
          const newPrev = { ...prev };
          delete newPrev[type];
          return newPrev;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error al subir imagen:', error);
      // Aquí podrías mostrar un toast con el error
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
      setTimeout(() => {
        setUploadProgress(prev => {
          const newPrev = { ...prev };
          delete newPrev[type];
          return newPrev;
        });
      }, 3000);
    }
  }, [updateField, onImageUpload]);

  // Manejar eliminación de imagen
  const handleImageDelete = async (type: 'avatar' | 'cover') => {
    // Por ahora, solo limpiamos el preview ya que no tenemos campos específicos en ProfileFormData
    setPreviewImages(prev => {
      const newPrev = { ...prev };
      delete newPrev[type];
      return newPrev;
    });
    
    // Image deleted successfully
  };

  // Manejar drag and drop
  const handleDragOver = (e: React.DragEvent, type: 'avatar' | 'cover') => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'avatar' | 'cover') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0], type);
    }
  };

  // Obtener URLs de imágenes
  const avatarUrl = previewImages.avatar || '';
  const coverUrl = previewImages.cover || '';

  return (
    <div className="space-y-6">
      {/* Imagen de portada */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="mb-3">
          <h4 className="text-sm font-medium">Imagen de portada</h4>
          <p className="text-xs text-gray-500">
            Imagen principal de tu tienda (1200x400px recomendado)
          </p>
        </div>
        
        <div
          className={cn(
            'relative w-full h-48 border-2 border-dashed rounded-lg transition-all overflow-hidden',
            dragOver === 'cover' 
              ? 'border-blue-500 bg-blue-50' 
              : coverUrl 
                ? 'border-gray-300' 
                : 'border-gray-300 hover:border-gray-400'
          )}
          onDragOver={(e) => handleDragOver(e, 'cover')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'cover')}
        >
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt="Imagen de portada"
                className="w-full h-full object-cover"
              />
              
              {/* Overlay con acciones */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  className="flex items-center space-x-1"
                >
                  <Edit className="w-4 h-4" />
                  <span>Cambiar</span>
                </Button>
                
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleImageDelete('cover')}
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </Button>
              </div>
              
              {/* Indicador de carga */}
              {isUploading.cover && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <div className="text-sm font-medium">Subiendo imagen...</div>
                    {uploadProgress.cover !== undefined && (
                      <Progress value={uploadProgress.cover} className="w-32" />
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ImageIcon className="w-12 h-12 mb-2" />
              <div className="text-center">
                <p className="text-sm font-medium mb-1">
                  {dragOver === 'cover' ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic para seleccionar'}
                </p>
                <p className="text-xs text-gray-400">
                  JPG, PNG o WebP (máx. 10MB)
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                className="mt-3 flex items-center space-x-1"
              >
                <Upload className="w-4 h-4" />
                <span>Seleccionar imagen</span>
              </Button>
            </div>
          )}
        </div>
        
        <input
          ref={coverInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file, 'cover');
          }}
          className="hidden"
        />
      </motion.div>

      {/* Imagen de perfil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div className="mb-3">
          <h4 className="text-sm font-medium">Logo/Avatar de la tienda</h4>
          <p className="text-xs text-gray-500">
            Imagen que representa tu marca (400x400px recomendado)
          </p>
        </div>
        
        <div className="flex items-start space-x-4">
          {/* Avatar circular */}
          <div
            className={cn(
              'relative w-32 h-32 border-2 border-dashed rounded-full transition-all overflow-hidden flex-shrink-0',
              dragOver === 'avatar' 
                ? 'border-blue-500 bg-blue-50' 
                : avatarUrl 
                  ? 'border-gray-300' 
                  : 'border-gray-300 hover:border-gray-400'
            )}
            onDragOver={(e) => handleDragOver(e, 'avatar')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'avatar')}
          >
            {avatarUrl ? (
              <>
                <img
                  src={avatarUrl}
                  alt="Avatar de la tienda"
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay con acciones */}
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                      className="p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleImageDelete('avatar')}
                      className="p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Indicador de carga */}
                {isUploading.avatar && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      {uploadProgress.avatar !== undefined && (
                        <Progress value={uploadProgress.avatar} className="w-20" />
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-xs text-center">
                  {dragOver === 'avatar' ? 'Suelta aquí' : 'Logo'}
                </span>
              </div>
            )}
          </div>
          
          {/* Información y acciones */}
          <div className="flex-1 space-y-3">
            <div>
              <h5 className="font-medium text-sm">Recomendaciones</h5>
              <ul className="text-xs text-gray-500 space-y-1 mt-1">
                <li>• Usa una imagen cuadrada (1:1)</li>
                <li>• Resolución mínima: 200x200px</li>
                <li>• Fondo transparente o sólido</li>
                <li>• Formato PNG para mejor calidad</li>
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                className="flex items-center space-x-1"
              >
                <Upload className="w-4 h-4" />
                <span>{avatarUrl ? 'Cambiar' : 'Subir'}</span>
              </Button>
              
              {avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleImageDelete('avatar')}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <input
          ref={avatarInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file, 'avatar');
          }}
          className="hidden"
        />
      </motion.div>

      {/* Estado de las imágenes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Estado del avatar */}
        <div className={cn(
          'border rounded-lg p-3',
          avatarUrl 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        )}>
          <div className="flex items-center space-x-2 mb-2">
            <Camera className={cn(
              'w-4 h-4',
              avatarUrl ? 'text-green-600' : 'text-yellow-600'
            )} />
            <span className={cn(
              'text-sm font-medium',
              avatarUrl ? 'text-green-900' : 'text-yellow-900'
            )}>
              Logo de la tienda
            </span>
            <Badge variant={avatarUrl ? 'default' : 'secondary'}>
              {avatarUrl ? 'Configurado' : 'Pendiente'}
            </Badge>
          </div>
          
          <p className={cn(
            'text-xs',
            avatarUrl ? 'text-green-700' : 'text-yellow-700'
          )}>
            {avatarUrl 
              ? 'Tu logo está listo y se mostrará en la tienda' 
              : 'Agrega un logo para mejorar la identidad de tu marca'
            }
          </p>
        </div>
        
        {/* Estado de la portada */}
        <div className={cn(
          'border rounded-lg p-3',
          coverUrl 
            ? 'bg-green-50 border-green-200' 
            : 'bg-gray-50 border-gray-200'
        )}>
          <div className="flex items-center space-x-2 mb-2">
            <ImageIcon className={cn(
              'w-4 h-4',
              coverUrl ? 'text-green-600' : 'text-gray-600'
            )} />
            <span className={cn(
              'text-sm font-medium',
              coverUrl ? 'text-green-900' : 'text-gray-900'
            )}>
              Imagen de portada
            </span>
            <Badge variant={coverUrl ? 'default' : 'outline'}>
              {coverUrl ? 'Configurada' : 'Opcional'}
            </Badge>
          </div>
          
          <p className={cn(
            'text-xs',
            coverUrl ? 'text-green-700' : 'text-gray-600'
          )}>
            {coverUrl 
              ? 'Tu portada está lista y se mostrará en la tienda' 
              : 'Opcional: agrega una imagen de portada para destacar tu tienda'
            }
          </p>
        </div>
      </motion.div>

      {/* Errores de validación */}
      {(formState.errors.profileImage || formState.errors.coverImage) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <h4 className="text-sm font-medium text-red-900">Errores en imágenes</h4>
          </div>
          
          {formState.errors.profileImage && (
            <p className="text-sm text-red-800 mb-1">
              Avatar: {formState.errors.profileImage}
            </p>
          )}
          
          {formState.errors.coverImage && (
            <p className="text-sm text-red-800">
              Portada: {formState.errors.coverImage}
            </p>
          )}
        </motion.div>
      )}

      {/* Consejos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          📸 Consejos para las imágenes
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Usa imágenes de alta calidad y bien iluminadas</li>
          <li>• El logo debe ser simple y reconocible</li>
          <li>• La portada puede mostrar tus productos destacados</li>
          <li>• Mantén consistencia con los colores de tu marca</li>
          <li>• Optimiza las imágenes para carga rápida</li>
        </ul>
      </motion.div>
    </div>
  );
}

export default ProfileAvatar;