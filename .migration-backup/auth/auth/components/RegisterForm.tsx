/**
 * Formulario de registro de usuarios
 * 
 * @module features/auth/components/RegisterForm
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoogleButton } from '@/features/auth/components/GoogleButton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useSlugValidation } from '@/features/user/hooks/useSlugValidation';
import { registerSchema, type RegisterFormData as RegisterFormValues } from '@/features/auth/schemas/auth.schema';
import type { StoreType } from '@/features/store/schemas/store.schema';



/**
 * Componente de formulario de registro
 */
export const RegisterForm = () => {
  const { signUp, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

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
    watch,
    setValue,
    trigger
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      whatsappNumber: '',
      name: '',
      storeType: 'other',
      slug: '',
      terms: true
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

  const onSubmit = async (data: RegisterFormValues) => {
    if (!slugAvailable) {
      toast.error('El nombre del sitio no está disponible');
      return;
    }

    try {
      // Usar el slug del hook en lugar del formulario
      const formDataWithSlug = {
        ...data,
        slug: slug
      };

      await signUp(formDataWithSlug);
      toast.success('Cuenta y tienda creadas correctamente');
    } catch (error) {
      // El error ya se maneja en useAuth con toast
      console.error('Error en registro:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
        <CardDescription>
          Regístrate para crear tu tienda online
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Datos personales */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{String(errors.email?.message || '')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{String(errors.password?.message || '')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{String(errors.confirmPassword?.message || '')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre completo</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Tu nombre"
              {...register('displayName')}
              disabled={isLoading}
            />
            {errors.displayName && (
              <p className="text-sm text-red-500">{String(errors.displayName?.message || '')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">Número de WhatsApp</Label>
            <Input
              id="whatsappNumber"
              type="tel"
              placeholder="+54 9 11 1234-5678"
              {...register('whatsappNumber')}
              disabled={isLoading}
            />
            {errors.whatsappNumber && (
              <p className="text-sm text-red-500">{String(errors.whatsappNumber?.message || '')}</p>
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
                disabled={isLoading}
                onChange={(e) => {
                  const { value } = e.target;
                  register('name').onChange(e);
                  if (value.length >= 3) {
                    handleStoreNameChange(value);
                  }
                }}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{String(errors.name?.message || '')}</p>
              )}
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="storeType">Tipo de negocio</Label>
              <Select
                defaultValue="other"
                onValueChange={(value) => setValue('storeType', value as StoreType)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de negocio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurante</SelectItem>
                  <SelectItem value="retail">Comercio</SelectItem>
                  <SelectItem value="service">Servicio</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
              {errors.storeType && (
                <p className="text-sm text-red-500">{String(errors.storeType?.message || '')}</p>
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
                  disabled={isLoading}
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
                <p className="text-sm text-red-500">{String(errors.slug?.message || '')}</p>
              )}
              {!errors.slug && slugAvailable === false && (
                <p className="text-sm text-red-500">Este nombre de sitio ya está en uso</p>
              )}
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="flex items-start space-x-2 mt-4">
            <Checkbox
              id="terms"
              {...register('terms')}
              disabled={isLoading}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                Acepto los{' '}
                <Link href="/terminos-condiciones" className="text-primary hover:underline" target="_blank">
                  términos y condiciones
                </Link>
              </Label>
              {errors.terms && (
                <p className="text-sm text-red-500">{String(errors.terms?.message || '')}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isLoading || isCheckingSlug || slugAvailable === false}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              O continúa con
            </span>
          </div>
        </div>

        <GoogleButton className="w-full" />
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/sign-in" className="text-primary hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};
