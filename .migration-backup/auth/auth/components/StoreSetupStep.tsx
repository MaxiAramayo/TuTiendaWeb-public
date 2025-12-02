/**
 * Segundo paso del registro: configuración de la tienda
 * 
 * @module features/auth/components/StoreSetupStep
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Store, Phone, ArrowLeft, Check, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSlugValidation } from '@/features/user/hooks/useSlugValidation';
import { UserData, StoreData } from './MultiStepRegister';
import type { StoreType } from '@shared/validations';

// Schema de validación para el segundo paso
const storeSetupSchema = z.object({
  whatsappNumber: z.string().min(10, 'Número de WhatsApp inválido'),
  name: z.string().min(2, 'El nombre de la tienda debe tener al menos 2 caracteres'),
  storeType: z.string().min(1, 'Selecciona un tipo de tienda'),
  slug: z.string().min(3, 'El nombre del sitio debe tener al menos 3 caracteres')
});

type StoreSetupFormValues = z.infer<typeof storeSetupSchema>;

interface StoreSetupStepProps {
  userData: UserData;
  onComplete: () => void;
  onBack: () => void;
}

/**
 * Componente del segundo paso de registro
 */
export const StoreSetupStep: React.FC<StoreSetupStepProps> = ({ 
  userData, 
  onComplete, 
  onBack 
}) => {
  const { signUp, completeGoogleProfile, isLoading } = useAuth();
  
  const {
    slug,
    isAvailable: slugAvailable,
    isChecking: isCheckingSlug,
    error: slugError,
    setSlug,
    generateFromText
  } = useSlugValidation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<StoreSetupFormValues>({
    resolver: zodResolver(storeSetupSchema),
    defaultValues: {
      whatsappNumber: '',
      name: '',
      storeType: 'other',
      slug: ''
    }
  });

  // Sincronizar slug del hook con el formulario
  useEffect(() => {
    setValue('slug', slug);
  }, [slug, setValue]);

  // Manejar cambio de slug manual
  const handleSlugChange = (value: string) => {
    setSlug(value);
  };

  // Generar slug a partir del nombre de la tienda
  const handleStoreNameChange = (name: string) => {
    generateFromText(name);
    setValue('name', name);
  };

  const onSubmit = async (data: StoreSetupFormValues) => {
    if (!slugAvailable) {
      toast.error('El nombre del sitio no está disponible');
      return;
    }

    try {
      // Detectar si es usuario de Google (sin contraseña)
      const isGoogleUser = !userData.password;
      
      if (isGoogleUser) {
        // Para usuarios de Google, usar completeGoogleProfile
        const profileData = {
          whatsappNumber: data.whatsappNumber,
          name: data.name,
          storeType: data.storeType as StoreType,
          slug: slug
        };
        
        // Obtener el UID del usuario actual de Firebase
        const { getAuth } = await import('firebase/auth');
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error('No hay usuario autenticado');
        }
        
        await completeGoogleProfile(currentUser.uid, profileData);
      } else {
        // Para usuarios con email/password, usar signUp
        const completeFormData = {
          email: userData.email,
          password: userData.password,
          confirmPassword: userData.password,
          displayName: userData.displayName,
          whatsappNumber: data.whatsappNumber,
          name: data.name,
          storeType: data.storeType as StoreType,
          slug: slug,
          terms: userData.terms as true
        };
        
        await signUp(completeFormData);
      }
      
      onComplete();
    } catch (error: any) {
      // Manejo específico de errores
      console.error('Error en registro:', error);
      
      // Mostrar mensaje específico según el tipo de error
      if (error?.code === 'auth/email-already-in-use') {
        toast.error('Este email ya está registrado. Intenta iniciar sesión o usa otro email.');
      } else {
        toast.error(error.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
      }
    }
  };

  const storeTypes = [
    { value: 'restaurant', label: 'Restaurante' },
    { value: 'clothing', label: 'Ropa y Accesorios' },
    { value: 'electronics', label: 'Electrónicos' },
    { value: 'beauty', label: 'Belleza y Cuidado' },
    { value: 'home', label: 'Hogar y Decoración' },
    { value: 'sports', label: 'Deportes y Fitness' },
    { value: 'books', label: 'Libros y Educación' },
    { value: 'health', label: 'Salud y Bienestar' },
    { value: 'automotive', label: 'Automotriz' },
    { value: 'services', label: 'Servicios' },
    { value: 'other', label: 'Otro' }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Store className="h-6 w-6 text-blue-600" />
          Configura tu tienda
        </CardTitle>
        <CardDescription>
          Completa los datos de tu tienda para comenzar a vender
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre de la tienda */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Nombre de la tienda
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Mi Tienda Online"
              {...register('name')}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length >= 3) {
                  handleStoreNameChange(value);
                } else {
                  setValue('name', value);
                }
              }}
              disabled={isLoading}
              className="h-11"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Tipo de tienda */}
          <div className="space-y-2">
            <Label htmlFor="storeType">Tipo de tienda</Label>
            <Select 
              {...register('storeType')}
              onValueChange={(value) => setValue('storeType', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecciona el tipo de tu tienda" />
              </SelectTrigger>
              <SelectContent>
                {storeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.storeType && (
              <p className="text-sm text-red-500">{errors.storeType.message}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Número de WhatsApp
            </Label>
            <Input
              id="whatsappNumber"
              type="tel"
              placeholder="+54 9 11 1234-5678"
              {...register('whatsappNumber')}
              disabled={isLoading}
              className="h-11"
            />
            {errors.whatsappNumber && (
              <p className="text-sm text-red-500">{errors.whatsappNumber.message}</p>
            )}
          </div>

          {/* Slug del sitio */}
          <div className="space-y-2">
            <Label htmlFor="slug">Nombre del sitio</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                tutienda.com/
              </span>
              <Input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="mi-tienda"
                disabled={isLoading || isCheckingSlug}
                className="rounded-l-none h-11"
              />
            </div>
            
            {/* Estado de validación del slug */}
            {slug && (
              <div className="flex items-center gap-2 text-sm">
                {isCheckingSlug ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Verificando disponibilidad...</span>
                  </>
                ) : slugAvailable ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Disponible</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">No disponible</span>
                  </>
                )}
              </div>
            )}
            
            {slugError && (
              <p className="text-sm text-red-500">{slugError}</p>
            )}
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              disabled={isLoading}
              className="flex-1 h-11"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Atrás
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !slugAvailable || isCheckingSlug}
              className="flex-1 h-11 text-base font-medium"
            >
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};