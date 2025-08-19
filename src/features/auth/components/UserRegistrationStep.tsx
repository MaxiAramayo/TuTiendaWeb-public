/**
 * Primer paso del registro: datos del usuario
 * 
 * @module features/auth/components/UserRegistrationStep
 */

'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleButton } from '@/features/auth/components/GoogleButton';
import { UserData } from './MultiStepRegister';

// Schema de validación para el primer paso
const userRegistrationSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  terms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar los términos y condiciones'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type UserRegistrationFormValues = z.infer<typeof userRegistrationSchema>;

interface UserRegistrationStepProps {
  onComplete: (data: UserData) => void;
  initialData?: UserData | null;
}

/**
 * Componente del primer paso de registro
 */
export const UserRegistrationStep: React.FC<UserRegistrationStepProps> = ({ 
  onComplete, 
  initialData 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch
  } = useForm<UserRegistrationFormValues>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      email: initialData?.email || '',
      password: initialData?.password || '',
      confirmPassword: initialData?.password || '',
      displayName: initialData?.displayName || '',
      terms: initialData?.terms || false
    }
  });

  const onSubmit = async (data: UserRegistrationFormValues) => {
    setIsLoading(true);
    
    // Simular validación (aquí podrías verificar si el email ya existe)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userData: UserData = {
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      terms: data.terms
    };
    
    onComplete(userData);
    setIsLoading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          Crear cuenta
        </CardTitle>
        <CardDescription>
          Ingresa tus datos personales para comenzar
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Botón de Google */}
        <GoogleButton 
          className="w-full h-11" 
          onNewUser={(googleUserData) => {
            // Construir userData desde googleUserData para usuarios nuevos o con perfil incompleto
            const userData: UserData = {
              email: googleUserData.email,
              password: '', // No password for Google users
              displayName: googleUserData.displayName,
              terms: true // Assume Google users accept terms
            };
            onComplete(userData);
          }}
        />
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              O continúa con email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              disabled={isLoading}
              className="h-11"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Nombre completo */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nombre completo
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Tu nombre completo"
              {...register('displayName')}
              disabled={isLoading}
              className="h-11"
            />
            {errors.displayName && (
              <p className="text-sm text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
                className="h-11 pr-10"
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

          {/* Confirmar contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword')}
              disabled={isLoading}
              className="h-11"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Términos y condiciones */}
          <div className="flex items-center space-x-2">
            <Controller
              name="terms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="terms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              )}
            />
            <Label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Acepto los{' '}
              <Link
                href="/terminos-condiciones"
                className="text-blue-600 hover:underline"
                target="_blank"
              >
                términos y condiciones
              </Link>
            </Label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-500">{errors.terms.message}</p>
          )}

          {/* Botón de continuar */}
          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Validando...' : 'Continuar'}
          </Button>
        </form>

        {/* Link a login */}
        <div className="text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/sign-in" className="text-blue-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};