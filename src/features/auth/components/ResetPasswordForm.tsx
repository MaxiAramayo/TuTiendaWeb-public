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
import { auth } from '@/lib/firebase/client';
import { sendPasswordResetEmail } from 'firebase/auth';
import { resetPasswordSchema, type ResetPasswordData as ResetPasswordFormValues } from '@/features/auth/schemas/reset-password.schema';

// ...

export const ResetPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(true);

      // actionCodeSettings redirige al usuario de vuelta al sign-in
      // después de que Firebase procese el reset de contraseña
      await sendPasswordResetEmail(auth, data.email, {
        url: `${window.location.origin}/sign-in`,
        handleCodeInApp: false,
      });

      setEmailSent(true);
      toast.success('Correo enviado. Revisá tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Error al restablecer contraseña:', error);

      if (error?.code === 'auth/user-not-found') {
        // Por seguridad no revelar si el email existe o no — mostrar éxito igualmente
        setEmailSent(true);
      } else if (error?.code === 'auth/invalid-email') {
        toast.error('El formato del email no es válido.');
      } else if (error?.code === 'auth/too-many-requests') {
        toast.error('Demasiados intentos. Esperá unos minutos e intentá de nuevo.');
      } else if (error?.code === 'auth/network-request-failed') {
        toast.error('Error de conexión. Verificá tu internet e intentá de nuevo.');
      } else {
        toast.error('No se pudo enviar el correo. Intentá de nuevo.');
      }
    } finally {
      setIsLoading(false);
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
