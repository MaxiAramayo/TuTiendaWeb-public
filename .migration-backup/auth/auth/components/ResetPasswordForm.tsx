/**
 * Formulario de restablecimiento de contraseña
 * 
 * @module features/auth/components/ResetPasswordForm
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/validation';



/**
 * Componente de formulario para restablecer contraseña
 */
export const ResetPasswordForm = () => {
  const { resetPassword, isLoading } = useAuth();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      toast.success('Se ha enviado un correo para restablecer tu contraseña');
    } catch (error) {
      // El error ya se maneja en useAuth con toast
      console.error('Error al restablecer contraseña:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Restablecer contraseña</CardTitle>
        <CardDescription>
          Ingresa tu correo electrónico para recibir un enlace de restablecimiento
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {emailSent ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 text-green-700 p-4 rounded-md">
              <p>Hemos enviado un correo electrónico con instrucciones para restablecer tu contraseña.</p>
              <p className="mt-2">Revisa tu bandeja de entrada y sigue las instrucciones.</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => setEmailSent(false)}
            >
              Enviar a otro correo
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          <Link href="/sign-in" className="text-primary hover:underline font-medium">
            Volver al inicio de sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};
