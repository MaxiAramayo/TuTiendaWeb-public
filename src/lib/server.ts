/**
 * Utilidades generales para Server Components
 * 
 * Funciones helper que no pertenecen a ninguna feature específica
 * y que pueden ser utilizadas por múltiples Server Components.
 * 
 * @module lib/server
 */

import { cache } from "react";

/**
 * Utilidad para formatear fechas de Firebase en Server Components
 * 
 * @param firebaseDate - Fecha de Firebase (Timestamp o string)
 * @returns Fecha formateada como string ISO o null
 */
export const serializeFirebaseDate = (firebaseDate: any): string | null => {
  try {
    if (!firebaseDate) return null;
    
    if (firebaseDate?.toDate) {
      return firebaseDate.toDate().toISOString();
    }
    
    if (typeof firebaseDate === "string") {
      return firebaseDate;
    }
    
    if (firebaseDate?.seconds) {
      return new Date(firebaseDate.seconds * 1000).toISOString();
    }
    
    return null;
  } catch (error) {
    console.error("Error al serializar fecha de Firebase:", error);
    return null;
  }
};

/**
 * Utilidad para validar y sanitizar parámetros de URL
 * 
 * @param param - Parámetro de URL a validar
 * @returns Parámetro sanitizado o null si es inválido
 */
export const sanitizeUrlParam = cache((param: string | undefined): string | null => {
  if (!param || typeof param !== "string") return null;
  
  // Eliminar caracteres peligrosos y espacios
  const sanitized = param.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, "");
  
  return sanitized.length > 0 ? sanitized : null;
});

/**
 * Utilidad para generar metadatos SEO optimizados
 * 
 * @param data - Datos base para generar metadatos
 * @returns Objeto con metadatos para SEO
 */
export const generateSEOMetadata = cache((data: {
  title?: string;
  description?: string;
  siteName?: string;
  imageUrl?: string;
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tutiendaweb.com.ar";
  
  return {
    title: data.title || "TuTienda - Crea tu tienda online",
    description: data.description || "Crea tu tienda online de forma simple y profesional",
    openGraph: {
      title: data.title || "TuTienda",
      description: data.description || "Tienda online profesional",
      images: data.imageUrl ? [data.imageUrl] : [],
      url: data.siteName ? `${baseUrl}/${data.siteName}` : baseUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: data.title || "TuTienda",
      description: data.description || "Tienda online profesional",
      images: data.imageUrl ? [data.imageUrl] : [],
    },
  };
});
