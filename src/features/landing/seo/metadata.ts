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
}

/**
 * Configuración SEO por defecto
 */
const defaultSEO: SEOProps = {
  title: "TuTienda | Menú Digital QR para Restaurantes y Cafeterías",
  description: "Crea menús digitales con códigos QR para tu restaurante o cafetería. Digitaliza tu negocio, reduce costos y mejora la experiencia de tus clientes.",
  keywords: ["menú digital", "código QR", "restaurante", "cafetería", "digitalización", "pedidos online"],
  image: "/images/og-image.jpg",
  robots: "index, follow"
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
    metadataBase: new URL('https://tutiendaweb.com.ar'),
    
    // Metadatos Open Graph
    openGraph: {
      title: seoConfig.title,
      description: seoConfig.description,
      images: [
        {
          url: seoConfig.image!,
          width: 1200,
          height: 630,
          alt: seoConfig.title
        }
      ],
      type: "website",
      locale: "es_ES"
    },
    
    // Metadatos Twitter
    twitter: {
      card: "summary_large_image",
      title: seoConfig.title,
      description: seoConfig.description,
      images: [seoConfig.image!],
    },
    
    // Configuración de robots
    robots: seoConfig.robots
  };
} 