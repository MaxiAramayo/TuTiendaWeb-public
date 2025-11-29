/**
 * Layout principal de la aplicación
 * 
 * Define la estructura HTML base para todas las páginas
 * 
 * @module app
 */

import type { ReactNode } from "react";
import "./globals.css";
import { mulish } from "@/components/ui/fonts";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Toaster } from "sonner";

/**
 * Props para el componente RootLayout
 */
interface RootLayoutProps {
  /** Contenido de la página */
  children: ReactNode;
}

/**
 * Layout principal que envuelve todas las páginas
 * 
 * @param props - Propiedades del componente
 * @returns Componente React
 */
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
      </head>
      <body className={`${mulish.className} antialiased`}>


        {/* Contenido principal */}
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              expand={true}
              closeButton
              toastOptions={{
                style: {
                  marginRight: '20px'
                }
              }}
            />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
