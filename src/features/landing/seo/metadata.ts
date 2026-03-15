/**
 * Utilidades para el SEO
 *
 * Funciones para generar metadatos y configurar SEO de la landing page
 *
 * @module features/landing/seo
 */

import { Metadata } from "next";

/**
 * Propiedades de configuración SEO
 */
export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  robots?: string;
  canonical?: string;
}

/**
 * Configuración SEO por defecto — orientada al mercado argentino
 */
const defaultSEO: Required<SEOProps> = {
  title:
    "TuTiendaWeb | Gestión Digital para Restaurantes y Comercios · Argentina",
  description:
    "Digitalizá tu restaurante o comercio con TuTiendaWeb. Creá un catálogo digital con código QR, recibí pedidos por WhatsApp y gestioná tus ventas desde cualquier dispositivo. Desarrollado en Argentina.",
  keywords: [
    "catálogo digital",
    "menú digital QR",
    "pedidos por WhatsApp",
    "gestión de ventas",
    "restaurantes argentina",
    "comercios digitales",
    "pymes argentina",
    "sistema de pedidos online",
    "digitalización de negocios",
    "catálogo online argentina",
    "panel de administración",
    "TuTiendaWeb",
  ],
  image: "/images/og-image.jpg",
  robots: "index, follow",
  canonical: "https://tutiendaweb.com.ar",
};

/**
 * Genera los metadatos para Next.js a partir de la configuración SEO
 *
 * @param config - Configuración SEO personalizada (opcional)
 * @returns Metadatos para Next.js
 */
export function generateSEOMetadata(config?: Partial<SEOProps>): Metadata {
  const seoConfig = { ...defaultSEO, ...config };

  return {
    title: seoConfig.title,
    description: seoConfig.description,
    keywords: seoConfig.keywords,
    metadataBase: new URL("https://tutiendaweb.com.ar"),

    // URL canónica — evita contenido duplicado en Google
    alternates: {
      canonical: seoConfig.canonical,
    },

    // Open Graph — para compartir en redes sociales
    openGraph: {
      title: seoConfig.title,
      description: seoConfig.description,
      url: seoConfig.canonical,
      siteName: "TuTiendaWeb",
      images: [
        {
          url: seoConfig.image,
          width: 1200,
          height: 630,
          alt: "TuTiendaWeb — Gestión Digital para tu Negocio",
        },
      ],
      type: "website",
      locale: "es_AR",
      countryName: "Argentina",
    },

    // Twitter / X Card
    twitter: {
      card: "summary_large_image",
      title: seoConfig.title,
      description: seoConfig.description,
      images: [seoConfig.image],
    },

    // Robots
    robots: seoConfig.robots,

    // Verificación de Google Search Console (agregar cuando esté disponible)
    // verification: { google: "XXXXXXXXX" },
  };
}
