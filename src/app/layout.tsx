/**
 * Layout principal de la aplicación
 * 
 * Define la estructura HTML base para todas las páginas
 * 
 * @module app
 */

import type { ReactNode } from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { mulish } from "@/components/ui/fonts";
import { AuthStoreProvider } from "@/features/auth/providers/auth-store-provider";
import { AuthSyncProvider } from "@/features/auth/providers/auth-provider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Toaster } from "sonner";

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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
        {/* JSON-LD — Organization + WebSite para rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://tutiendaweb.com.ar/#organization",
                  name: "TuTiendaWeb",
                  url: "https://tutiendaweb.com.ar",
                  logo: "https://tutiendaweb.com.ar/images/og-image.jpg",
                  description:
                    "Plataforma SaaS de catálogo digital y pedidos por WhatsApp para comercios argentinos.",
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Buenos Aires",
                    addressCountry: "AR",
                  },
                  contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "customer support",
                    availableLanguage: "Spanish",
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://tutiendaweb.com.ar/#website",
                  url: "https://tutiendaweb.com.ar",
                  name: "TuTiendaWeb",
                  publisher: { "@id": "https://tutiendaweb.com.ar/#organization" },
                  inLanguage: "es-AR",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://tutiendaweb.com.ar/?s={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
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

        {/* Meta Pixel — solo si está configurado */}
        {META_PIXEL_ID && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${META_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}
