/**
 * Utilidades para el módulo de perfil
 * 
 * Funciones auxiliares para validación, formateo, cálculos
 * y transformaciones de datos del perfil
 * 
 * @module features/dashboard/modules/profile/utils
 */

import { StoreProfile, ProfileFormData, ProfileSection } from '../types/store.type';

/**
 * Configuración de utilidades
 */
const CONFIG = {
  whatsapp: {
    countryCode: '+54',
    minLength: 10,
    maxLength: 15,
  },
  slug: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-z0-9-]+$/,
  },
  completeness: {
    weights: {
      basicInfo: 30,
      contactInfo: 20,
      address: 15,
      schedule: 10,
      socialLinks: 10,
      theme: 10,
      settings: 5,
    },
  },
};

/**
 * Calcula el porcentaje de completitud del perfil
 */
export function calculateProfileCompleteness(profile: StoreProfile | any): number {
  // Si es un User simple, retornar un cálculo básico
  if (!profile.basicInfo && profile.displayName) {
    let score = 0;
    if (profile.displayName) score += 40;
    if (profile.email) score += 30;
    if (profile.id) score += 30;
    return Math.min(score, 100);
  }
  
  // Si no tiene la estructura de StoreProfile, retornar 0
  if (!profile.basicInfo || !profile.contactInfo || !profile.settings) {
    return 0;
  }
  let totalScore = 0;
  let maxScore = 0;

  // Información básica (30%)
  const basicScore = calculateBasicInfoScore(profile);
  totalScore += basicScore * CONFIG.completeness.weights.basicInfo;
  maxScore += CONFIG.completeness.weights.basicInfo;

  // Información de contacto (20%)
  const contactScore = calculateContactInfoScore(profile);
  totalScore += contactScore * CONFIG.completeness.weights.contactInfo;
  maxScore += CONFIG.completeness.weights.contactInfo;

  // Dirección (15%)
  const addressScore = calculateAddressScore(profile);
  totalScore += addressScore * CONFIG.completeness.weights.address;
  maxScore += CONFIG.completeness.weights.address;

  // Horarios (10%)
  const scheduleScore = calculateScheduleScore(profile);
  totalScore += scheduleScore * CONFIG.completeness.weights.schedule;
  maxScore += CONFIG.completeness.weights.schedule;

  // Redes sociales (10%)
  const socialScore = calculateSocialLinksScore(profile);
  totalScore += socialScore * CONFIG.completeness.weights.socialLinks;
  maxScore += CONFIG.completeness.weights.socialLinks;

  // Tema (10%)
  const themeScore = calculateThemeScore(profile);
  totalScore += themeScore * CONFIG.completeness.weights.theme;
  maxScore += CONFIG.completeness.weights.theme;

  // Configuración (5%)
  const settingsScore = calculateSettingsScore(profile);
  totalScore += settingsScore * CONFIG.completeness.weights.settings;
  maxScore += CONFIG.completeness.weights.settings;

  return Math.round((totalScore / maxScore) * 100);
}

/**
 * Calcula el score de información básica
 */
function calculateBasicInfoScore(profile: StoreProfile): number {
  const fields = [
    profile.basicInfo.name,
    profile.basicInfo.description,
    profile.basicInfo.slug,
    profile.basicInfo.type,
    profile.basicInfo.category,
  ];

  const filledFields = fields.filter(field => field && field.trim().length > 0).length;
  return filledFields / fields.length;
}

/**
 * Calcula el score de información de contacto
 */
function calculateContactInfoScore(profile: StoreProfile): number {
  const fields = [
    profile.contactInfo.whatsapp,
    profile.contactInfo.website,
  ];

  const filledFields = fields.filter(field => field && field.trim().length > 0).length;
  return filledFields / fields.length;
}

/**
 * Calcula el score de dirección
 */
function calculateAddressScore(profile: StoreProfile): number {
  if (!profile.address) return 0;

  const fields = [
    profile.address.street,
    profile.address.city,
    profile.address.province,
    profile.address.zipCode,
  ];

  const filledFields = fields.filter(field => field && field.trim().length > 0).length;
  return filledFields / fields.length;
}

/**
 * Calcula el score de horarios
 */
function calculateScheduleScore(profile: StoreProfile): number {
  if (!profile.schedule) return 0;

  const days = Object.values(profile.schedule);
  const configuredDays = days.filter(day => day.isOpen && day.openTime && day.closeTime).length;
  
  return configuredDays > 0 ? 1 : 0;
}

/**
 * Calcula el score de redes sociales
 */
function calculateSocialLinksScore(profile: StoreProfile): number {
  const links = [
    profile.socialLinks?.instagram,
    profile.socialLinks?.facebook,
  ];

  const filledLinks = links.filter(link => link && link.trim().length > 0).length;
  return filledLinks > 0 ? Math.min(filledLinks / 2, 1) : 0; // Al menos 2 redes para score completo
}

/**
 * Calcula el score de tema
 */
function calculateThemeScore(profile: StoreProfile): number {
  let score = 0;
  
  if (profile.theme?.logoUrl) score += 0.4;
  if (profile.theme?.bannerUrl) score += 0.3;
  if (profile.theme?.primaryColor && profile.theme.primaryColor !== '#6366f1') score += 0.2;
  if (profile.theme?.style && profile.theme.style !== 'modern') score += 0.1;
  
  return Math.min(score, 1);
}

/**
 * Calcula el score de configuración
 */
function calculateSettingsScore(profile: StoreProfile): number {
  let score = 0;
  
  // Métodos de pago configurados
  const enabledPayments = profile.settings.paymentMethods.filter(method => method.enabled).length;
  if (enabledPayments >= 2) score += 0.5;
  
  // Métodos de entrega configurados
  const enabledDelivery = profile.settings.deliveryMethods.filter(method => method.enabled).length;
  if (enabledDelivery >= 1) score += 0.5;
  
  return Math.min(score, 1);
}

/**
 * Identifica campos faltantes en el perfil (solo campos esenciales)
 */
export function getMissingFields(profile: StoreProfile): ProfileSection[] {
  const missing: ProfileSection[] = [];

  // Información básica (solo campos esenciales)
  if (!profile.basicInfo.name || profile.basicInfo.name.trim().length === 0 ||
      !profile.basicInfo.description || profile.basicInfo.description.trim().length === 0) {
    missing.push('basic');
  }

  // Información de contacto (solo WhatsApp es esencial)
  if (!profile.contactInfo.whatsapp || profile.contactInfo.whatsapp.trim().length === 0) {
    missing.push('contact');
  }

  return missing;
}

/**
 * Obtiene recomendaciones para mejorar el perfil
 */
export function getProfileRecommendations(profile: StoreProfile): string[] {
  const recommendations: string[] = [];
  const completeness = calculateProfileCompleteness(profile);

  if (completeness < 50) {
    recommendations.push('Completa la información básica de tu tienda para mejorar tu presencia online');
  }

  if (!profile.basicInfo.description || profile.basicInfo.description.length < 50) {
    recommendations.push('Agrega una descripción detallada de tu tienda (mínimo 50 caracteres)');
  }

  if (!profile.contactInfo.whatsapp || profile.contactInfo.whatsapp.trim().length === 0) {
    recommendations.push('Agrega tu número de WhatsApp para que los clientes puedan contactarte');
  }

  if (!profile.address) {
    recommendations.push('Completa la dirección de tu tienda para delivery y retiro en local');
  }

  if (!profile.schedule) {
    recommendations.push('Configura los horarios de atención para que los clientes sepan cuándo estás disponible');
  }

  if (!profile.theme?.logoUrl) {
    recommendations.push('Sube un logo para darle identidad visual a tu tienda');
  }

  if (!profile.theme?.bannerUrl) {
    recommendations.push('Agrega una imagen de portada para hacer tu tienda más atractiva');
  }

  const socialLinks = profile.socialLinks ? Object.values(profile.socialLinks).filter(link => link && link.trim().length > 0) : [];
  if (socialLinks.length === 0) {
    recommendations.push('Conecta tus redes sociales para aumentar tu alcance');
  }

  const enabledPayments = profile.settings.paymentMethods.filter(method => method.enabled).length;
  if (enabledPayments < 2) {
    recommendations.push('Configura múltiples métodos de pago para facilitar las compras');
  }

  return recommendations.slice(0, 3); // Máximo 3 recomendaciones
}

/**
 * Valida y formatea un número de WhatsApp
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











/**
 * Genera un slug a partir de un texto
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
 * Convierte horarios del formato simple al formato de períodos
 */
export function convertSimpleScheduleToPeriods(schedule: any): any {
  if (!schedule) return undefined;
  
  const convertedSchedule: any = {};
  
  Object.keys(schedule).forEach(day => {
    const daySchedule = schedule[day];
    
    // Si ya tiene el formato de períodos, mantenerlo
    if (daySchedule && Array.isArray(daySchedule.periods)) {
      convertedSchedule[day] = daySchedule;
      return;
    }
    
    // Convertir del formato simple al formato de períodos
    if (daySchedule && typeof daySchedule === 'object') {
      convertedSchedule[day] = {
        closed: daySchedule.closed || false,
        periods: []
      };
      
      // Si no está cerrado y tiene horarios de apertura/cierre
      if (!daySchedule.closed && daySchedule.open && daySchedule.close) {
        convertedSchedule[day].periods.push({
          open: daySchedule.open,
          close: daySchedule.close,
          nextDay: false
        });
      }
      
      // Si tiene un break, crear dos períodos
      if (!daySchedule.closed && daySchedule.break && daySchedule.break.start && daySchedule.break.end) {
        // Primer período: apertura hasta inicio del break
        if (daySchedule.open && daySchedule.break.start) {
          convertedSchedule[day].periods = [{
            open: daySchedule.open,
            close: daySchedule.break.start,
            nextDay: false
          }];
        }
        
        // Segundo período: fin del break hasta cierre
        if (daySchedule.break.end && daySchedule.close) {
          convertedSchedule[day].periods.push({
            open: daySchedule.break.end,
            close: daySchedule.close,
            nextDay: false
          });
        }
      }
    } else {
      // Formato por defecto si no hay datos
      convertedSchedule[day] = {
        closed: true,
        periods: []
      };
    }
  });
  
  return convertedSchedule;
}

/**
 * Convierte horarios del formato de períodos al formato simple
 */
export function convertPeriodsScheduleToSimple(schedule: any): any {
  if (!schedule) return undefined;
  
  const convertedSchedule: any = {};
  
  Object.keys(schedule).forEach(day => {
    const daySchedule = schedule[day];
    
    // Si ya tiene el formato simple, mantenerlo
    if (daySchedule && !Array.isArray(daySchedule.periods)) {
      convertedSchedule[day] = daySchedule;
      return;
    }
    
    // Convertir del formato de períodos - mantener el formato de períodos para preservar todos los datos
    if (daySchedule && Array.isArray(daySchedule.periods)) {
      convertedSchedule[day] = {
        closed: daySchedule.closed || false,
        periods: daySchedule.periods.map((period: any) => ({
          open: period.open || '',
          close: period.close || '',
          nextDay: period.nextDay || false
        }))
      };
    } else {
      // Formato por defecto si no hay datos
      convertedSchedule[day] = {
        closed: true,
        periods: []
      };
    }
  });
  
  return convertedSchedule;
}

/**
 * Convierte datos del perfil a datos del formulario
 */
export function profileToFormData(profile: StoreProfile): ProfileFormData {
  return {
    // Información básica
    name: profile.basicInfo.name,
    description: profile.basicInfo.description || '',
    siteName: profile.basicInfo.slug,
    storeType: profile.basicInfo.type,
    category: profile.basicInfo.category || '',
    
    // Contacto
    whatsapp: profile.contactInfo.whatsapp,
    website: profile.contactInfo.website || '',
    
    // Dirección
    street: profile.address?.street || '',
    city: profile.address?.city || '',
    province: profile.address?.province || '',
    country: profile.address?.country || 'Argentina',
    zipCode: profile.address?.zipCode || '',
    
    // Horarios - convertir al formato de períodos para el componente ScheduleSection
    schedule: convertSimpleScheduleToPeriods(profile.schedule),
    
    // Redes sociales
    instagram: profile.socialLinks?.instagram || '',
    facebook: profile.socialLinks?.facebook || '',
    
    // Configuración - currency, language y timezone no están en CommerceConfig
    
    // Métodos de pago y entrega
    paymentMethods: profile.settings.paymentMethods || [],
    deliveryMethods: profile.settings.deliveryMethods || [],
    

    
    // Tema - mapear como objeto completo
    theme: {
      primaryColor: profile.theme?.primaryColor || '#6366f1',
      secondaryColor: profile.theme?.secondaryColor || '#8b5cf6',
      accentColor: profile.theme?.accentColor || '#8B5CF6',
      fontFamily: profile.theme?.fontFamily || 'Inter, sans-serif',
      style: profile.theme?.style || 'modern',
      buttonStyle: profile.theme?.buttonStyle || 'rounded',
      logoUrl: profile.theme?.logoUrl,
      bannerUrl: profile.theme?.bannerUrl,
    },
  };
}

/**
 * Formatea un precio con la moneda correspondiente
 */
export function formatPrice(amount: number, currency: string = 'ARS'): string {
  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
}

/**
 * Formatea una fecha
 */
export function formatDate(date: Date | { seconds: number } | null): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date.seconds * 1000);
  
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Formatea un horario
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
 * Obtiene el nombre del día en español
 */
export function getDayName(day: string): string {
  const dayNames: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };
  
  return dayNames[day] || day;
}



/**
 * Genera un color aleatorio
 */
export function generateRandomColor(): string {
  const colors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#84cc16', // Lime
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Debounce function para optimizar búsquedas
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function para limitar llamadas
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Comprime una imagen antes de subirla
 */
export function compressImage(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      const maxWidth = 1200;
      const maxHeight = 800;
      
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Verifica si un nombre de sitio es único
 * Esta función debería conectarse con la base de datos para verificar unicidad
 */
export async function isSiteNameUnique(siteName: string, currentUserId?: string): Promise<boolean> {
  // Verificación real con Firebase no implementada
  // Por ahora retorna true para evitar errores de compilación
  return true;
}