/**
 * Formulario para completar el perfil después de registrarse con Google
 * 
 * Refactored to use Server Actions instead of useAuth hook
 * 
 * @module features/auth/components/GoogleProfileSetup
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { completeRegistrationAction } from '@/features/auth/actions/auth.actions';
import { useSlugValidation } from '@/features/user/hooks/useSlugValidation';
import type { StoreType } from '@/features/auth/schemas/store-setup.schema';
import { googleProfileSchema, type GoogleProfileSetupValues } from '@/features/auth/schemas/google-profile.schema';



/**
 * Componente para completar el perfil después de registrarse con Google
 * Usa Server Actions para crear tienda y actualizar perfil
 */
export const GoogleProfileSetup = () => {
  const [user, loading, error] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    slug,
    isAvailable: slugAvailable,
    isChecking: isCheckingSlug,
    error: slugError,
    setSlug,
    generateFromText
  } = useSlugValidation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm<GoogleProfileSetupValues>({
    resolver: zodResolver(googleProfileSchema),
    defaultValues: {
      name: '',
      slug: '',
      whatsappNumber: '',
      storeType: 'other',
      description: '',
      address: undefined
    }
  });

  // Sincronizar slug del hook con el formulario
  useEffect(() => {
    setValue('slug', slug);
  }, [slug, setValue]);

  // Manejar cambio de slug manual
  const handleSlugChange = (value: string) => {
    setSlug(value);
    setValue('slug', value);
    trigger('slug');
  };

  // Generar slug a partir del nombre de la tienda
  const handleStoreNameChange = (name: string) => {
    generateFromText(name);
    setValue('name', name);
  };

  // Redirigir si no hay usuario autenticado
  useEffect(() => {
    if (!loading && !user) {
      toast.error('Debes estar autenticado para completar tu perfil');
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: GoogleProfileSetupValues) => {
    if (!slugAvailable) {
      toast.error('El nombre del sitio no está disponible');
      return;
    }

    try {
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      setIsSubmitting(true);

      // Map Google profile data to completeRegistrationAction format
      const formData = new FormData();

      // User profile data
      formData.append('displayName', user.displayName || '');
      formData.append('phone', data.whatsappNumber);

      // Store data
      formData.append('storeName', data.name);
      formData.append('storeType', data.storeType);
      formData.append('address', data.address || '');
      formData.append('phone', data.whatsappNumber);

      // Call Server Action
      const result = await completeRegistrationAction(null, formData);

      if (result.success) {
        toast.success('Perfil completado correctamente');
        router.push('/dashboard');
      } else {
        // Handle errors
        if (result.errors._form) {
          toast.error(result.errors._form[0]);
        } else {
          toast.error('Error al completar el perfil');
        }
      }
    } catch (error) {
      console.error('Error al completar perfil:', error);
      toast.error('Error inesperado al completar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Verificando autenticación...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No mostrar el formulario si no hay usuario
  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Completa tu perfil</CardTitle>
        <CardDescription>
          Para finalizar tu registro, necesitamos algunos datos adicionales
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">


          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">Número de WhatsApp</Label>
            <Input
              id="whatsappNumber"
              type="tel"
              placeholder="+54 9 11 1234-5678"
              {...register('whatsappNumber')}
              disabled={isSubmitting}
            />
            {errors.whatsappNumber && (
              <p className="text-sm text-red-500">{errors.whatsappNumber.message}</p>
            )}
          </div>

          {/* Datos de la tienda */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium mb-3">Información de tu tienda</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la tienda</Label>
              <Input
                id="name"
                type="text"
                placeholder="Mi Tienda"
                {...register('name')}
                disabled={isSubmitting}
                onChange={(e) => {
                  const { value } = e.target;
                  register('name').onChange(e);
                  if (value.length >= 3) {
                    handleStoreNameChange(value);
                  }
                }}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="storeType">Tipo de negocio</Label>
              <Select
                defaultValue="other"
                onValueChange={(value) => setValue('storeType', value as StoreType)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de negocio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurante</SelectItem>
                  <SelectItem value="retail">Comercio</SelectItem>
                  <SelectItem value="services">Servicio</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.storeType && (
                <p className="text-sm text-red-500">{errors.storeType.message}</p>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="slug">
                URL de tu tienda
                <span className="ml-1 text-xs text-gray-500">(tutienda.com/tu-url)</span>
              </Label>
              <div className="relative">
                <Input
                  id="slug"
                  type="text"
                  placeholder="mi-tienda"
                  value={slug}
                  disabled={isSubmitting}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={`pr-10 ${slugAvailable === true ? 'border-green-500' : slugAvailable === false ? 'border-red-500' : ''}`}
                />
                {isCheckingSlug && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="h-4 w-4 border-2 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                )}
                {!isCheckingSlug && slugAvailable === true && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                    ✓
                  </div>
                )}
                {!isCheckingSlug && slugAvailable === false && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                    ✗
                  </div>
                )}
              </div>
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug.message}</p>
              )}
              {!errors.slug && slugAvailable === false && (
                <p className="text-sm text-red-500">Este nombre de sitio ya está en uso</p>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente tu negocio"
                {...register('description')}
                disabled={isSubmitting}
                className="resize-none"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>


          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isSubmitting || isCheckingSlug || slugAvailable === false}
          >
            {isSubmitting ? 'Guardando...' : 'Completar perfil'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
