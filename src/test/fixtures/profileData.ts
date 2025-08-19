import { Timestamp } from 'firebase/firestore';
import {
  StoreProfile,
  BasicStoreInfo,
  ContactInfo,
  Address,
  WeeklySchedule,
  SocialLinks,
  ThemeConfig,
  SubscriptionInfo,
} from '@/features/dashboard/modules/store-settings/types/store.type';
import { PaymentMethod, DeliveryMethod, StoreSettings, CommerceConfig } from '@shared/types/firebase.types';
// Datos básicos realistas
export const mockBasicInfo: BasicStoreInfo = {
  name: 'Grambristo',
  description: 'Restaurante de comida casera con ambiente familiar',
  slug: 'grambristo',
  type: 'restaurant',
  category: 'Gastronomía'
}

// Información de contacto
export const mockContactInfo: ContactInfo = {
  whatsapp: '+5491123456789',
  website: 'https://grambristo.com'
}

// Dirección
export const mockAddress: Address = {
  street: 'Av. Corrientes 1234',
  city: 'Buenos Aires',
  province: 'Ciudad Autónoma de Buenos Aires',
  country: 'Argentina',
  zipCode: '1043',
  coordinates: {
    lat: -34.6037,
    lng: -58.3816
  }
}

// Horarios de restaurante
export const mockSchedule: WeeklySchedule = {
  monday: {
    closed: false,
    periods: [
      { open: '12:00', close: '15:00', nextDay: false },
      { open: '19:00', close: '23:00', nextDay: false }
    ]
  },
  tuesday: {
    closed: false,
    periods: [
      { open: '12:00', close: '15:00', nextDay: false },
      { open: '19:00', close: '23:00', nextDay: false }
    ]
  },
  wednesday: {
    closed: false,
    periods: [
      { open: '12:00', close: '15:00', nextDay: false },
      { open: '19:00', close: '23:00', nextDay: false }
    ]
  },
  thursday: {
    closed: false,
    periods: [
      { open: '12:00', close: '15:00', nextDay: false },
      { open: '19:00', close: '23:00', nextDay: false }
    ]
  },
  friday: {
    closed: false,
    periods: [
      { open: '12:00', close: '15:00', nextDay: false },
      { open: '19:00', close: '23:00', nextDay: false }
    ]
  },
  saturday: {
    closed: false,
    periods: [
      { open: '12:00', close: '15:00', nextDay: false },
      { open: '19:00', close: '23:00', nextDay: false }
    ]
  },
  sunday: {
    closed: false,
    periods: [
      { open: '12:00', close: '15:00', nextDay: false },
      { open: '19:00', close: '23:00', nextDay: false }
    ]
  }
}

// Redes sociales
export const mockSocialLinks: SocialLinks = {
  instagram: 'https://instagram.com/grambristo',
  facebook: 'https://facebook.com/grambristo'
}

// Configuración de tema
export const mockThemeConfig: ThemeConfig = {
  logoUrl: 'https://example.com/logo.png',
  bannerUrl: 'https://example.com/banner.jpg',
  primaryColor: '#3B82F6',
  secondaryColor: '#64748B',
  accentColor: '#F59E0B',
  fontFamily: 'inter',
  style: 'modern'
}

// Métodos de pago
export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'efectivo',
    name: 'Efectivo',
    enabled: true,
  },
  {
    id: 'transferencia',
    name: 'Transferencia bancaria',
    enabled: true,
  },
  {
    id: 'mercadopago',
    name: 'MercadoPago',
    enabled: false,
  }
]

// Métodos de entrega
export const mockDeliveryMethods: DeliveryMethod[] = [
  {
    id: 'retiro',
    name: 'Retiro en local',
    enabled: true,
  },
  {
    id: 'delivery',
    name: 'Delivery',
    enabled: true,
  }
]



// Configuración de comercio
export const mockCommerceConfig: CommerceConfig = {
  paymentMethods: mockPaymentMethods,
  deliveryMethods: mockDeliveryMethods
}

// Configuración de la tienda
export const mockStoreSettings: StoreSettings = {
  products: {
    taxEnabled: true,
    taxRate: 21,
    requireImages: true,
    maxImagesPerProduct: 5
  },
  commerce: mockCommerceConfig,
  notifications: {
    whatsapp: true,
    inApp: true,
    push: false
  },
  subscription: {
    plan: 'basic',
    gracePeriodDays: 7
  },
  updatedAt: Timestamp.fromDate(new Date())
}

// Información de suscripción
export const mockSubscriptionInfo: SubscriptionInfo = {
  active: true,
  plan: 'basic',
  startDate: Timestamp.fromDate(new Date('2024-01-01')),
  endDate: Timestamp.fromDate(new Date('2024-12-31')),
  trialUsed: false,
  billing: {
    provider: 'mercadopago',
    customerId: 'cust_123456',
    subscriptionId: 'sub_789012',
    autoRenew: true
  }
}

// Perfil completo de la tienda
export const mockStoreProfile: StoreProfile = {
  id: 'store_123456',
  ownerId: 'user_789012',
  basicInfo: mockBasicInfo,
  contactInfo: mockContactInfo,
  address: mockAddress,
  schedule: mockSchedule,
  socialLinks: mockSocialLinks,
  theme: mockThemeConfig,
  settings: mockCommerceConfig,
  subscription: mockSubscriptionInfo,
  metadata: {
    createdAt: Timestamp.fromDate(new Date('2024-01-01')),
    updatedAt: Timestamp.fromDate(new Date('2024-01-15')),
    version: 1,
    status: 'active'
  }
}

// Datos para diferentes tipos de tienda
export const mockCafeProfile: StoreProfile = {
  ...mockStoreProfile,
  id: 'store_cafe_001',
  basicInfo: {
    name: 'Café Central',
    description: 'Café de especialidad con ambiente acogedor',
    slug: 'cafe-central',
    type: 'service',
    category: 'Cafetería'
  },
  schedule: {
    monday: { closed: false, periods: [{ open: '07:00', close: '19:00', nextDay: false }] },
    tuesday: { closed: false, periods: [{ open: '07:00', close: '19:00', nextDay: false }] },
    wednesday: { closed: false, periods: [{ open: '07:00', close: '19:00', nextDay: false }] },
    thursday: { closed: false, periods: [{ open: '07:00', close: '19:00', nextDay: false }] },
    friday: { closed: false, periods: [{ open: '07:00', close: '19:00', nextDay: false }] },
    saturday: { closed: false, periods: [{ open: '08:00', close: '20:00', nextDay: false }] },
    sunday: { closed: false, periods: [{ open: '09:00', close: '18:00', nextDay: false }] }
  }
}

export const mockKioscoProfile: StoreProfile = {
  ...mockStoreProfile,
  id: 'store_kiosco_001',
  basicInfo: {
    name: 'Kiosco Don Juan',
    description: 'Kiosco de barrio con productos de primera necesidad',
    slug: 'kiosco-don-juan',
    type: 'retail',
    category: 'Comercio'
  },
  schedule: {
    monday: { closed: false, periods: [{ open: '06:00', close: '23:00', nextDay: false }] },
    tuesday: { closed: false, periods: [{ open: '06:00', close: '23:00', nextDay: false }] },
    wednesday: { closed: false, periods: [{ open: '06:00', close: '23:00', nextDay: false }] },
    thursday: { closed: false, periods: [{ open: '06:00', close: '23:00', nextDay: false }] },
    friday: { closed: false, periods: [{ open: '06:00', close: '23:00', nextDay: false }] },
    saturday: { closed: false, periods: [{ open: '06:00', close: '23:00', nextDay: false }] },
    sunday: { closed: false, periods: [{ open: '08:00', close: '22:00', nextDay: false }] }
  }
}

// Datos inválidos para testing de validaciones
export const invalidBasicInfo = {
  name: '', // Nombre vacío
  description: 'a'.repeat(1001), // Descripción muy larga
  slug: 'invalid slug!', // Slug con caracteres inválidos
  type: 'invalid_type' as any, // Tipo inválido
  category: ''
}

export const invalidContactInfo = {
  whatsapp: '123', // WhatsApp inválido
  website: 'not-a-url' // URL inválida
}

export const invalidAddress = {
  street: '',
  city: '',
  province: '',
  country: '',
  zipCode: 'invalid',
  coordinates: {
    lat: 200, // Latitud inválida
    lng: 200 // Longitud inválida
  }
}