/**
 * Layout principal de la aplicación
 * 
 * Define la estructura HTML base para todas las páginas
 * 
 * @module app
 */

import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { mulish } from "@/components/ui/fonts";
import { AuthStoreProvider } from "@/features/auth/providers/auth-store-provider";
import { AuthSyncProvider } from "@/features/auth/providers/auth-provider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Toaster } from "sonner";

/**
 * Metadata raíz — define el title template para todas las páginas.
 * Las páginas individuales solo necesitan definir su propio `title`
 * y este template agrega automáticamente " | TuTiendaWeb".
 */
export const metadata: Metadata = {
  title: {
    template: "%s | TuTiendaWeb",
    default:
      "TuTiendaWeb | Gestión Digital para Restaurantes y Comercios · Argentina",
  },
  description:
    "Digitalizá tu restaurante o comercio con TuTiendaWeb. Catálogo QR, pedidos por WhatsApp y gestión de ventas desde cualquier dispositivo.",
  metadataBase: new URL("https://tutiendaweb.com.ar"),
};

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
        <meta name="theme-color" content="#7c3aed" />
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
