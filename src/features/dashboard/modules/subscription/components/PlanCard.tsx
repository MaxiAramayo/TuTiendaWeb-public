/**
 * Componente de tarjeta de plan de suscripción
 */

import React from 'react';
import { SubscriptionPlan } from '../types/subscription.types';

/**
 * Props para el componente PlanCard
 */
interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect: (planId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * Componente de tarjeta de plan de suscripción
 */
export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
  isLoading = false,
  disabled = false
}) => {
  const handleSelect = () => {
    if (!disabled && !isLoading && !isCurrentPlan) {
      onSelect(plan.id);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'Plan Actual';
    if (isLoading) return 'Procesando...';
    return 'Seleccionar Plan';
  };

  const getButtonClass = () => {
    const baseClass = 'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200';
    
    if (isCurrentPlan) {
      return `${baseClass} bg-green-100 text-green-700 cursor-default`;
    }
    
    if (disabled || isLoading) {
      return `${baseClass} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }
    
    if (isPopular) {
      return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800`;
    }
    
    return `${baseClass} bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-900`;
  };

  const formatPrice = (price: number, currency: string, frequency: string) => {
    const formattedPrice = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price);
    
    const frequencyText = frequency === 'monthly' ? '/mes' : '/año';
    return `${formattedPrice}${frequencyText}`;
  };

  return (
    <div className={`
      relative bg-white rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg
      ${isPopular ? 'border-blue-500 shadow-md' : 'border-gray-200'}
      ${isCurrentPlan ? 'border-green-500 bg-green-50' : ''}
    `}>
      {/* Badge de popular */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Más Popular
          </span>
        </div>
      )}

      {/* Badge de plan actual */}
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Actual
          </span>
        </div>
      )}

      {/* Encabezado del plan */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
        
        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(plan.price, plan.currency, plan.billingFrequency)}
          </span>
          {plan.discountPercentage && (
            <div className="mt-1">
              <span className="text-sm text-green-600 font-medium">
                {plan.discountPercentage}% de descuento
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Características del plan */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">Características incluidas:</h4>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <svg 
                className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Límites del plan */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Límites:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="font-medium">Productos:</span> {plan.maxProducts === -1 ? 'Ilimitados' : plan.maxProducts}
          </div>
          <div>
            <span className="font-medium">Pedidos:</span> {plan.maxOrders === -1 ? 'Ilimitados' : plan.maxOrders}
          </div>
        </div>
      </div>

      {/* Características premium */}
      <div className="mb-6">
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className={`flex items-center ${
            plan.hasAnalytics ? 'text-green-600' : 'text-gray-400'
          }`}>
            <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
              {plan.hasAnalytics ? (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              )}
            </svg>
            Analíticas avanzadas
          </div>
          
          <div className={`flex items-center ${
            plan.hasCustomDomain ? 'text-green-600' : 'text-gray-400'
          }`}>
            <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
              {plan.hasCustomDomain ? (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              )}
            </svg>
            Dominio personalizado
          </div>
          
          <div className={`flex items-center ${
            plan.hasWhatsAppIntegration ? 'text-green-600' : 'text-gray-400'
          }`}>
            <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
              {plan.hasWhatsAppIntegration ? (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              )}
            </svg>
            Integración WhatsApp
          </div>
        </div>
      </div>

      {/* Botón de acción */}
      <button
        onClick={handleSelect}
        disabled={disabled || isLoading || isCurrentPlan}
        className={getButtonClass()}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {getButtonText()}
      </button>
    </div>
  );
};