/**
 * Feature Dashboard - API Pública
 * 
 * Panel de administración completo para gestión de tienda:
 * - Layouts y componentes estructurales
 * - Módulos especializados (products, profile, sells, overview)
 * - Navegación y autenticación
 * - Responsive design y UX optimizada
 * 
 * Arquitectura FSD:
 * - components/: Componentes compartidos del dashboard
 * - layouts/: Layouts principales (DashboardLayout)
 * - modules/: Módulos especializados autocontenidos
 * - shared/: Utilidades y componentes reutilizables
 * 
 * @module features/dashboard
 */

// === LAYOUTS ===
// Layouts principales del dashboard
export { default as DashboardLayout } from './layouts/DashboardLayout';

// === SHARED COMPONENTS ===
// Componentes estructurales compartidos
export { default as SignOutButton } from './components/SignOutButton';

// === MODULES ===
// Módulos especializados del dashboard
// Nota: sells, products y profile eliminados, se importan directamente cuando sea necesario 