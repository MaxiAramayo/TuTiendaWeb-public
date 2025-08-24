/**
 * Utilidades de formateo centralizadas
 * 
 * Este archivo centraliza todas las funciones de formateo para evitar duplicaciones
 * y garantizar consistencia en toda la aplicación.
 * 
 * @module shared/utils/format
 */

/**
 * Formatea un precio con la moneda especificada
 * 
 * @param price - Precio a formatear
 * @param currency - Código de moneda (por defecto ARS)
 * @returns Precio formateado con símbolo de moneda
 */
export function formatPrice(price: number, currency: string = 'ARS'): string {
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return formatter.format(price);
}

/**
 * Formatea números grandes agregando sufijos como 'k' para miles
 * 
 * @param num - Número a formatear
 * @returns Número formateado con sufijo
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * Formatea una fecha utilizando el formato español (Argentina)
 * 
 * @param date - Fecha a formatear
 * @param options - Opciones de formateo
 * @returns Fecha formateada como string
 */
export function formatDate(
  date: Date | string | number | { seconds: number } | null,
  options: {
    includeTime?: boolean;
    short?: boolean;
    relative?: boolean;
    format?: 'short' | 'long' | 'iso';
  } = {}
): string {
  if (!date) return '';
  
  const { includeTime = false, short = false, relative = false, format = 'short' } = options;
  
  // Convertir a Date si no lo es
  let dateObj: Date;
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    dateObj = new Date(date.seconds * 1000);
  } else {
    dateObj = new Date(date);
  }
  
  // Formato relativo
  if (relative) {
    const now = new Date();
    const diffTime = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
    return `Hace ${Math.floor(diffDays / 365)} años`;
  }
  
  // Formato corto
  if (short) {
    return dateObj.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    });
  }
  
  // Formatos específicos
  switch (format) {
    case 'long':
      return dateObj.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...(includeTime && {
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    case 'iso':
      return dateObj.toISOString();
    case 'short':
    default:
      const formatOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      };
      
      if (includeTime) {
        formatOptions.hour = '2-digit';
        formatOptions.minute = '2-digit';
      }
      
      return dateObj.toLocaleString('es-AR', formatOptions);
  }
}

/**
 * Formatea un horario
 * 
 * @param time - Hora en formato HH:mm
 * @returns Hora formateada
 */
export function formatTime(time: string): string {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/**
 * Genera un slug único a partir de un texto
 * 
 * @param text - Texto a convertir en slug
 * @returns Slug generado
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .replace(/^-|-$/g, ''); // Remover guiones al inicio y final
}

/**
 * Formatea un número de WhatsApp
 * 
 * @param phone - Número de teléfono
 * @returns Número formateado con código de país
 */
export function formatWhatsAppNumber(phone: string): string {
  // Remover todos los caracteres no numéricos excepto el +
  const cleaned = phone.replace(/[^+\d]/g, '');
  
  // Si no tiene código de país, agregar +54 (Argentina)
  if (!cleaned.startsWith('+')) {
    return `+54${cleaned}`;
  }
  
  return cleaned;
}
