/**
 * Componente Error Boundary para capturar errores de React
 * 
 * @module components/error/ErrorBoundary
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';
import { errorService, ErrorType, ErrorSeverity } from '@/shared/services/error.service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary que captura errores de JavaScript y los maneja de forma elegante
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Actualizar el estado para mostrar la UI de error
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Registrar el error
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    
    // Crear error estructurado
    const structuredError = errorService.createError(
      ErrorType.UNKNOWN,
      'REACT_ERROR_BOUNDARY',
      error.message,
      'Ha ocurrido un error inesperado. La página se recargará automáticamente.',
      {
        severity: ErrorSeverity.HIGH,
        context: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        },
        originalError: error,
        recoverable: true,
        retryable: true
      }
    );
    
    // Manejar el error
    errorService.handleError(structuredError);
    
    // Mostrar notificación al usuario
    toast.error('Ha ocurrido un error inesperado. Recargando la página...');
    
    // Llamar callback personalizado si existe
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Recargar la página después de un breve delay
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }

  render() {
    if (this.state.hasError) {
      // Mostrar UI de fallback personalizada o por defecto
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Algo salió mal
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Ha ocurrido un error inesperado. La página se recargará automáticamente en unos segundos.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook para usar Error Boundary de forma funcional
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};