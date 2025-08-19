/**
 * Utilidades para el módulo de suscripciones
 */

import { SubscriptionPlan, SubscriptionStatus, Subscription } from '../types/subscription.types';

/**
 * Planes de suscripción predefinidos
 */
export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Básico',
    description: 'Perfecto para empezar tu tienda online',
    type: 'basic',
    price: 2999,
    currency: 'ARS',
    billingFrequency: 'monthly',
    features: [
      'Hasta 50 productos',
      'Hasta 100 pedidos por mes',
      'Soporte por email',
      'Plantillas básicas',
      'SSL incluido'
    ],
    maxProducts: 50,
    maxOrders: 100,
    hasAnalytics: false,
    hasCustomDomain: false,
    hasWhatsAppIntegration: false
  },
  {
    id: 'premium-monthly',
    name: 'Premium',
    description: 'Para tiendas en crecimiento con más funciones',
    type: 'premium',
    price: 5999,
    currency: 'ARS',
    billingFrequency: 'monthly',
    features: [
      'Hasta 500 productos',
      'Hasta 1000 pedidos por mes',
      'Soporte prioritario',
      'Todas las plantillas',
      'SSL incluido',
      'Analíticas avanzadas',
      'Integración WhatsApp'
    ],
    maxProducts: 500,
    maxOrders: 1000,
    hasAnalytics: true,
    hasCustomDomain: false,
    hasWhatsAppIntegration: true,
    isPopular: true
  },
  {
    id: 'enterprise-monthly',
    name: 'Empresarial',
    description: 'Para grandes tiendas con necesidades avanzadas',
    type: 'enterprise',
    price: 12999,
    currency: 'ARS',
    billingFrequency: 'monthly',
    features: [
      'Productos ilimitados',
      'Pedidos ilimitados',
      'Soporte 24/7',
      'Todas las plantillas',
      'SSL incluido',
      'Analíticas avanzadas',
      'Dominio personalizado',
      'Integración WhatsApp',
      'API completa',
      'Backup automático'
    ],
    maxProducts: -1,
    maxOrders: -1,
    hasAnalytics: true,
    hasCustomDomain: true,
    hasWhatsAppIntegration: true
  },
  {
    id: 'basic-yearly',
    name: 'Básico Anual',
    description: 'Plan básico con descuento anual',
    type: 'basic',
    price: 29990,
    currency: 'ARS',
    billingFrequency: 'yearly',
    features: [
      'Hasta 50 productos',
      'Hasta 100 pedidos por mes',
      'Soporte por email',
      'Plantillas básicas',
      'SSL incluido'
    ],
    maxProducts: 50,
    maxOrders: 100,
    hasAnalytics: false,
    hasCustomDomain: false,
    hasWhatsAppIntegration: false,
    discountPercentage: 17
  },
  {
    id: 'premium-yearly',
    name: 'Premium Anual',
    description: 'Plan premium con descuento anual',
    type: 'premium',
    price: 59990,
    currency: 'ARS',
    billingFrequency: 'yearly',
    features: [
      'Hasta 500 productos',
      'Hasta 1000 pedidos por mes',
      'Soporte prioritario',
      'Todas las plantillas',
      'SSL incluido',
      'Analíticas avanzadas',
      'Integración WhatsApp'
    ],
    maxProducts: 500,
    maxOrders: 1000,
    hasAnalytics: true,
    hasCustomDomain: false,
    hasWhatsAppIntegration: true,
    discountPercentage: 17
  },
  {
    id: 'enterprise-yearly',
    name: 'Empresarial Anual',
    description: 'Plan empresarial con descuento anual',
    type: 'enterprise',
    price: 129990,
    currency: 'ARS',
    billingFrequency: 'yearly',
    features: [
      'Productos ilimitados',
      'Pedidos ilimitados',
      'Soporte 24/7',
      'Todas las plantillas',
      'SSL incluido',
      'Analíticas avanzadas',
      'Dominio personalizado',
      'Integración WhatsApp',
      'API completa',
      'Backup automático'
    ],
    maxProducts: -1,
    maxOrders: -1,
    hasAnalytics: true,
    hasCustomDomain: true,
    hasWhatsAppIntegration: true,
    discountPercentage: 17
  }
];

/**
 * Formatea el precio de una suscripción
 * @param price - Precio en centavos
 * @param currency - Moneda
 * @param frequency - Frecuencia de facturación
 * @returns Precio formateado
 */
export const formatSubscriptionPrice = (
  price: number, 
  currency: string, 
  frequency: 'monthly' | 'yearly'
): string => {
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(price);
  
  const frequencyText = frequency === 'monthly' ? '/mes' : '/año';
  return `${formattedPrice}${frequencyText}`;
};

/**
 * Obtiene el color del estado de suscripción
 * @param status - Estado de la suscripción
 * @returns Clases CSS para el color
 */
export const getSubscriptionStatusColor = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'expired':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'paused':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Obtiene el texto del estado de suscripción
 * @param status - Estado de la suscripción
 * @returns Texto del estado
 */
export const getSubscriptionStatusText = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return 'Activa';
    case 'pending':
      return 'Pendiente';
    case 'cancelled':
      return 'Cancelada';
    case 'expired':
      return 'Expirada';
    case 'paused':
      return 'Pausada';
    default:
      return 'Desconocido';
  }
};

/**
 * Calcula los días restantes hasta la expiración
 * @param endDate - Fecha de expiración
 * @returns Número de días restantes
 */
export const getDaysUntilExpiry = (endDate: Date): number => {
  const now = new Date();
  const expiry = new Date(endDate);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verifica si una suscripción está próxima a expirar
 * @param subscription - Suscripción a verificar
 * @param daysThreshold - Umbral de días (por defecto 7)
 * @returns true si está próxima a expirar
 */
export const isSubscriptionExpiringSoon = (
  subscription: Subscription, 
  daysThreshold: number = 7
): boolean => {
  if (subscription.status !== 'active') return false;
  
  const daysUntilExpiry = getDaysUntilExpiry(subscription.endDate);
  return daysUntilExpiry <= daysThreshold && daysUntilExpiry > 0;
};

/**
 * Verifica si un usuario puede actualizar a un plan específico
 * @param currentPlan - Plan actual
 * @param targetPlan - Plan objetivo
 * @returns true si puede actualizar
 */
export const canUpgradeToPlan = (
  currentPlan: SubscriptionPlan | null, 
  targetPlan: SubscriptionPlan
): boolean => {
  if (!currentPlan) return true;
  
  // Solo puede actualizar si el precio es mayor
  return targetPlan.price > currentPlan.price;
};

/**
 * Calcula el ahorro anual de un plan
 * @param monthlyPrice - Precio mensual
 * @param yearlyPrice - Precio anual
 * @returns Porcentaje de ahorro
 */
export const calculateYearlyDiscount = (
  monthlyPrice: number, 
  yearlyPrice: number
): number => {
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - yearlyPrice;
  return Math.round((savings / monthlyTotal) * 100);
};

/**
 * Obtiene el plan por ID
 * @param planId - ID del plan
 * @param plans - Lista de planes disponibles
 * @returns Plan encontrado o null
 */
export const getPlanById = (
  planId: string, 
  plans: SubscriptionPlan[] = DEFAULT_SUBSCRIPTION_PLANS
): SubscriptionPlan | null => {
  return plans.find(plan => plan.id === planId) || null;
};

/**
 * Filtra planes por tipo
 * @param type - Tipo de plan
 * @param plans - Lista de planes disponibles
 * @returns Planes filtrados
 */
export const getPlansByType = (
  type: 'basic' | 'premium' | 'enterprise',
  plans: SubscriptionPlan[] = DEFAULT_SUBSCRIPTION_PLANS
): SubscriptionPlan[] => {
  return plans.filter(plan => plan.type === type);
};

/**
 * Filtra planes por frecuencia de facturación
 * @param frequency - Frecuencia de facturación
 * @param plans - Lista de planes disponibles
 * @returns Planes filtrados
 */
export const getPlansByFrequency = (
  frequency: 'monthly' | 'yearly',
  plans: SubscriptionPlan[] = DEFAULT_SUBSCRIPTION_PLANS
): SubscriptionPlan[] => {
  return plans.filter(plan => plan.billingFrequency === frequency);
};

/**
 * Verifica si un usuario tiene acceso a una característica
 * @param subscription - Suscripción actual
 * @param feature - Característica a verificar
 * @returns true si tiene acceso
 */
export const hasFeatureAccess = (
  subscription: Subscription | null,
  feature: keyof Pick<SubscriptionPlan, 'hasAnalytics' | 'hasCustomDomain' | 'hasWhatsAppIntegration'>
): boolean => {
  if (!subscription || subscription.status !== 'active') {
    return false;
  }
  
  return subscription.plan[feature] === true;
};

/**
 * Verifica si un usuario ha alcanzado el límite de productos
 * @param subscription - Suscripción actual
 * @param currentProductCount - Número actual de productos
 * @returns true si ha alcanzado el límite
 */
export const hasReachedProductLimit = (
  subscription: Subscription | null,
  currentProductCount: number
): boolean => {
  if (!subscription || subscription.status !== 'active') {
    return true;
  }
  
  const maxProducts = subscription.plan.maxProducts;
  return maxProducts !== -1 && currentProductCount >= maxProducts;
};

/**
 * Verifica si un usuario ha alcanzado el límite de pedidos
 * @param subscription - Suscripción actual
 * @param currentOrderCount - Número actual de pedidos del mes
 * @returns true si ha alcanzado el límite
 */
export const hasReachedOrderLimit = (
  subscription: Subscription | null,
  currentOrderCount: number
): boolean => {
  if (!subscription || subscription.status !== 'active') {
    return true;
  }
  
  const maxOrders = subscription.plan.maxOrders;
  return maxOrders !== -1 && currentOrderCount >= maxOrders;
};