/**
 * Layout para las páginas de autenticación
 * 
 * @module features/auth/components/AuthLayout
 */

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Componente de layout para las páginas de autenticación
 * Proporciona una estructura común con un panel lateral y contenido centrado
 */
export const AuthLayout = ({ 
  children, 
  title = 'TuTienda', 
  subtitle = 'Gestiona tu negocio de forma simple' 
}: AuthLayoutProps) => {
  const pathname = usePathname();
  
  // Determinar qué enlaces mostrar según la ruta actual
  const showLoginLink = !pathname.includes('/login');
  const showRegisterLink = !pathname.includes('/register');
  const showResetLink = !pathname.includes('/reset-password');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Panel lateral con imagen y branding */}
      <div className="bg-primary md:w-1/3 lg:w-1/2 hidden md:flex flex-col justify-between p-8">
        <div>
          <h1 className="text-white text-3xl font-bold mb-2">{title}</h1>
          <p className="text-primary-foreground/80 text-lg">{subtitle}</p>
        </div>
        
        <div className="relative h-64 md:h-96">
          <Image 
            src="/images/auth-illustration.svg" 
            alt="Ilustración de autenticación"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <div className="text-primary-foreground/80">
          <p>© {new Date().getFullYear()} TuTienda. Todos los derechos reservados.</p>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        {/* Logo y título en móvil */}
        <div className="w-full max-w-md mb-8 md:hidden">
          <h1 className="text-2xl font-bold text-center">{title}</h1>
          <p className="text-gray-600 text-center">{subtitle}</p>
        </div>
        
        {/* Contenido del formulario */}
        <div className="w-full max-w-md">
          {children}
        </div>
        
        {/* Enlaces de navegación */}
        <div className="mt-8 text-sm text-center space-x-4">
          {showLoginLink && (
            <Link href="/sign-in" className="text-primary hover:underline">
              Iniciar sesión
            </Link>
          )}
          
          {showRegisterLink && (
            <Link href="/sign-up" className="text-primary hover:underline">
              Registrarse
            </Link>
          )}
          
          {showResetLink && (
            <Link href="/reset-password" className="text-primary hover:underline">
              Olvidé mi contraseña
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};