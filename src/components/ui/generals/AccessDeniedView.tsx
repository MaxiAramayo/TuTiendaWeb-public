'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, MessageCircle, Crown, ArrowRight, Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { clearSessionAction } from '@/features/auth/actions/auth.actions';

interface AccessDeniedViewProps {
  supportNumber?: string;
}

export default function AccessDeniedView({ supportNumber }: AccessDeniedViewProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      'Hola! Tengo un problema de acceso con mi tienda y necesito ayuda para regularizar mi suscripción.'
    );
    const number = supportNumber || process.env.NEXT_PUBLIC_SUPPORT_NUMBER || '';
    window.open(`https://wa.me/${number}?text=${text}`, '_blank');
  };

  /**
   * Cierre de sesión completo:
   * 1. signOut(auth) — limpia el Firebase Client SDK (evita que AuthSyncProvider re-cree la cookie)
   * 2. clearSessionAction() — elimina la cookie httpOnly del servidor directamente,
   *    sin depender del timing del AuthSyncProvider
   * 3. window.location.href — hard redirect para limpiar cualquier estado en memoria
   */
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
    } catch {
      // Ignorar: puede que el usuario ya estuviera deslogueado en el client SDK
    }
    try {
      await clearSessionAction();
    } catch {
      // Ignorar: la cookie puede que ya no existiera
    }
    window.location.href = '/sign-in';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-red-200 shadow-lg">
        <CardHeader className="text-center pb-2">
           <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
           </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Acceso Suspendido</CardTitle>
          <CardDescription className="text-base text-gray-500 mt-2">
            Tu tienda se encuentra temporalmente deshabilitada debido a una falta de pago o fin del período de gracia.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-100 text-sm">
            Para continuar usando la plataforma y habilitar tu catálogo público nuevamente, necesitas regularizar tu suscripción.
          </div>

          <div className="flex flex-col gap-3">
             <Button
               onClick={() => { window.location.href = '/dashboard/subscription'; }}
               className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base font-medium shadow-sm transition-all text-white"
             >
               <Crown className="w-5 h-5 mr-2" />
               Regularizar Suscripción
             </Button>

             <Button
               onClick={handleWhatsApp}
               variant="outline"
               className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-base"
             >
               <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
               Contactar a Soporte
             </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-gray-100 pt-6">
           <Button
             variant="ghost"
             onClick={handleLogout}
             disabled={isLoggingOut}
             className="text-gray-500 hover:text-gray-700"
           >
             {isLoggingOut ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Cerrando sesión...
               </>
             ) : (
               <>
                 Cerrar sesión <ArrowRight className="w-4 h-4 ml-2" />
               </>
             )}
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
