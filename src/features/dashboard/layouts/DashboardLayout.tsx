/**
 * Layout principal del Dashboard (Server Component)
 * 
 * Este componente proporciona la estructura base para todas las páginas del dashboard.
 * Incluye manejo de errores con ErrorBoundary y optimizaciones del servidor.
 * 
 * @module features/dashboard/layouts
 */

import ModernDashboardWrapper from "./ModernDashboardWrapper";
// import ErrorBoundary from "@/components/shared/errors/ErrorBoundary";

/**
 * Props para el componente DashboardLayout
 */
interface DashboardLayoutProps {
  /** Contenido a renderizar dentro del layout */
  children: React.ReactNode;
}

/**
 * Layout principal del Dashboard (Server Component)
 * 
 * Este layout proporciona:
 * - Estructura estática del dashboard
 * - Manejo de errores con ErrorBoundary
 * - Optimizaciones del servidor (SEO, performance)
 * - Envuelve el contenido en el wrapper del cliente para funcionalidades interactivas
 * 
 * @param props - Propiedades del componente
 * @returns Componente React (Server Component)
 */
const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    // <ErrorBoundary showHomeButton={true}>
      <ModernDashboardWrapper>
        {children}
      </ModernDashboardWrapper>
    // </ErrorBoundary>
  );
};

export default DashboardLayout; 