/**
 * Configuración del dominio base para las tiendas
 */
export const DOMAIN_CONFIG = {
  // Dominio base que aparecerá en la URL de las tiendas
  BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tutiendaweb.site',
  
  // Texto que aparece en los formularios
  DISPLAY_TEXT: process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tutiendaweb.site',
  
  // Protocolo (https en producción, http en desarrollo)
  PROTOCOL: process.env.NODE_ENV === 'production' ? 'https' : 'http',
};

/**
 * Genera la URL completa de una tienda
 * @param siteName - Nombre del sitio de la tienda
 * @returns URL completa de la tienda
 */
export const generateStoreUrl = (siteName: string): string => {
  return `${DOMAIN_CONFIG.PROTOCOL}://${siteName}.${DOMAIN_CONFIG.BASE_DOMAIN}`;
};

/**
 * Extrae el nombre del sitio de una URL
 * @param url - URL completa
 * @returns Nombre del sitio o null si no es válida
 */
export const extractSiteNameFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const subdomain = urlObj.hostname.split('.')[0];
    return subdomain !== 'www' ? subdomain : null;
  } catch {
    return null;
  }
};
