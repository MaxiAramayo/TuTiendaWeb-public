/**
 * Tipos para el módulo de suscripciones
 */

/**
 * Estados posibles de una suscripción
 */
export type SubscriptionStatus = 
  | 'active'
  | 'pending'
  | 'cancelled'
  | 'expired'
  | 'paused';

/**
 * Tipos de planes de suscripción
 */
export type PlanType = 'basic' | 'pro' | 'premium' | 'enterprise';

/**
 * Frecuencia de facturación
 */
export type BillingFrequency = 'monthly' | 'yearly';

/**
 * Información de un plan de suscripción
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  type: PlanType;
  price: number;
  currency: string;
  billingFrequency: BillingFrequency;
  features: string[];
  maxProducts: number;
  maxOrders: number;
  hasAnalytics: boolean;
  hasCustomDomain: boolean;
  hasWhatsAppIntegration: boolean;
  isPopular?: boolean;
  discountPercentage?: number;
}

/**
 * Información de una suscripción activa
 */
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date;
  nextBillingDate: Date;
  autoRenew: boolean;
  mercadoPagoSubscriptionId?: string;
  paymentMethodId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Datos para crear una nueva suscripción
 */
export interface CreateSubscriptionData {
  planId: string;
  paymentMethodId?: string;
  autoRenew: boolean;
}

/**
 * Respuesta de MercadoPago para crear suscripción
 */
export interface MercadoPagoSubscriptionResponse {
  id: string;
  status: string;
  init_point: string;
  sandbox_init_point?: string;
  auto_recurring: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
    currency_id: string;
  };
  payer_id?: string;
  payment_method_id?: string;
}

/**
 * Datos para el webhook de MercadoPago
 */
export interface MercadoPagoWebhookData {
  id: string;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: string;
  user_id: string;
  version: string;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

/**
 * Estadísticas de suscripciones
 */
export interface SubscriptionStats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  churnRate: number;
  conversionRate: number;
}

/**
 * Props para componentes de suscripción
 */
export interface SubscriptionComponentProps {
  subscription?: Subscription;
  plans?: SubscriptionPlan[];
  onSubscribe?: (planId: string) => void;
  onCancel?: (subscriptionId: string) => void;
  onUpgrade?: (planId: string) => void;
  isLoading?: boolean;
}

/**
 * Estado del store de suscripciones
 */
export interface SubscriptionState {
  currentSubscription: Subscription | null;
  availablePlans: SubscriptionPlan[];
  stats: SubscriptionStats | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Acciones del store de suscripciones
 */
export interface SubscriptionActions {
  fetchCurrentSubscription: () => Promise<void>;
  fetchAvailablePlans: () => Promise<void>;
  createSubscription: (data: CreateSubscriptionData) => Promise<string>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
  upgradeSubscription: (planId: string) => Promise<void>;
  pauseSubscription: (subscriptionId: string) => Promise<void>;
  resumeSubscription: (subscriptionId: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  clearError: () => void;
}

/**
 * Store completo de suscripciones
 */
export interface SubscriptionStore extends SubscriptionState, SubscriptionActions {}