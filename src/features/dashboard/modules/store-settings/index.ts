/**
 * Exportaciones del módulo de perfil
 * 
 * Centraliza todas las exportaciones del módulo de gestión de perfiles
 * para facilitar las importaciones desde otros módulos
 * 
 * @module features/dashboard/modules/profile
 */

// Componentes principales
export { ProfileForm } from './components/ProfileForm';
export { ProfileAvatar } from './components/avatar/ProfileAvatar';
// TabSelector removed - component doesn't exist
export { default as ProfileFormWrapper } from './forms/profile/ProfileForm';

// Componentes de secciones
export { ProfileHeader } from './components/sections/ProfileHeader';
export { ProfileNavigation } from './components/sections/ProfileNavigation';
export { BasicInfoSection } from './components/sections/BasicInfoSection';
export { ContactInfoSection } from './components/sections/ContactInfoSection';
export { AddressSection } from './components/sections/AddressSection';
export { ScheduleSection } from './components/sections/ScheduleSection';
export { SocialLinksSection } from './components/sections/SocialLinksSection';
export { ThemeSection } from './components/sections/ThemeSection';
export { PaymentDeliverySection } from './components/sections/PaymentDeliverySection';

export { SubscriptionSection } from './components/sections/SubscriptionSection';

// Componentes UI
export { default as ProfileTips } from './ui/ProfileTips';
export { default as ShareStore } from './ui/ShareStore';
export { default as ProfileStatsComponent } from './ui/ProfileStats';

// Hooks
export { useProfile, useBasicProfile, useRealtimeProfile } from './hooks/useProfile';

// Tipos
export type {
  StoreProfile,
  ProfileFormData,
  ProfileSection,
  DailySchedule,
  WeeklySchedule,

  ThemeConfig,
  SocialLinks,
  Address,
  ContactInfo,
  BasicStoreInfo,
  FormState,
  ValidationConfig,
  CreateStoreProfileData,
  UpdateStoreProfileData,
  SubscriptionInfo,
} from './types/store.type';

// StoreType se importa desde validaciones centralizadas
export type { StoreType } from '@shared/validations';

// PaymentMethod y DeliveryMethod se importan desde firebase.types
export type { PaymentMethod, DeliveryMethod } from '@shared/types/firebase.types';

// Tipo ProfileStats (para evitar conflicto con el componente)
export type { ProfileStats } from './types/store.type';

// Validaciones
export {
  profileFormSchema,
  basicInfoSchema,
  contactInfoSchema,
  addressSchema,
  socialLinksSchema,
  themeConfigSchema,
  slugValidationSchema,
  imageUploadSchema,
  customValidations,
  fieldErrorMessages,
} from './validations/profile.validations';

// Tipos de validación
export type {
  BasicInfoFormData,
  ContactInfoFormData,
  AddressFormData,
  SocialLinksFormData,
  ThemeConfigFormData,
  SlugValidationData,
  ImageUploadData,
} from './validations/profile.validations';

// Servicios
export { profileService } from './services/profile.service';

// Utilidades
export {
  calculateProfileCompleteness,
  getMissingFields,
  getProfileRecommendations,
  formatWhatsAppNumber,
  generateSlug,
  profileToFormData,
  formatPrice,
  formatDate,
  formatTime,
  getDayName,
  generateRandomColor,
  debounce,
  throttle,
  compressImage,
  isSiteNameUnique,
} from './utils/profile.utils';

// Validaciones centralizadas
export {
  validateHexColor as validateHexColorUtil,
} from '@shared/validations';