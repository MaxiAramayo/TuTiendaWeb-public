/**
 * Formulario de registro de usuarios
 * 
 * Refactored to use Server Actions and hybrid authentication pattern
 * 
 * @module features/auth/components/RegisterForm
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoogleButton } from '@/features/auth/components/GoogleButton';
import { hybridRegister } from '@/features/auth/lib/hybrid-login';
import { registerAction } from '@/features/auth/actions/auth.actions';
import { useSlugValidation } from '@/features/user/hooks/useSlugValidation';
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas/register.schema';
import type { StoreType } from '@/features/auth/schemas/store-setup.schema';



/**
 * Componente de formulario de registro
 * Usa patrón híbrido: registerAction + hybridRegister para auto-login
 */
export const RegisterForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    trigger,
    setError
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      // 1. Crear usuario con Server Action
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('displayName', data.displayName);

      const registerResult = await registerAction(null, formData);

      if (!registerResult.success) {
        // Manejar errores del register
        const errors = registerResult.errors || {};
        if (errors._form) {
          toast.error(errors._form[0]);
        }
        if (errors.email) {
          setError('email', { message: errors.email[0] });
        }
        if (errors.password) {
          setError('password', { message: errors.password[0] });
        }
        setIsLoading(false);
        return;
      }

      // 2. Auto-login con patrón híbrido
      const loginResult = await hybridRegister(data.email, data.password);

      if (!loginResult.success) {
        toast.error('Cuenta creada. Por favor inicia sesión.');
        router.push('/sign-in');
        return;
      }

      // 3. Redirigir a completar perfil
      toast.success('Cuenta creada correctamente');
      router.push('/auth/complete-profile');
    } catch (error) {
      console.error('Error en registro:', error);
      toast.error('Error inesperado al crear la cuenta');
    } finally {
      setIsLoading(false);
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
              <p className="text-sm text-red-500">{errors.email.message}</p>
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
              <p className="text-sm text-red-500">{errors.password.message}</p>
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
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
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
              <p className="text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full mt-6"
            disabled={isLoading}
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
