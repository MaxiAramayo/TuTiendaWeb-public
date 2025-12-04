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
import { AuthStoreProvider } from "@/features/auth/providers/auth-store-provider";
import { AuthSyncProvider } from "@/features/auth/providers/auth-provider";
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
          <AuthStoreProvider>
            <AuthSyncProvider>
              {children}
            </AuthSyncProvider>
          </AuthStoreProvider>
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
        </ErrorBoundary>
      </body>
    </html>
  );
}
