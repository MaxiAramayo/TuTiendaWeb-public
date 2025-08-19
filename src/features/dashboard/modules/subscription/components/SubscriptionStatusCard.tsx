/**
 * Componente para mostrar el estado de la suscripción actual
 */

import React from 'react';
import { Subscription, SubscriptionStatus as Status } from '../types/subscription.types';

/**
 * Props para el componente SubscriptionStatusCard
 */
interface SubscriptionStatusCardProps {
  subscription: Subscription | null;
  onCancel?: (subscriptionId: string) => void;
  onPause?: (subscriptionId: string) => void;
  onResume?: (subscriptionId: string) => void;
  onUpgrade?: () => void;
  isLoading?: boolean;
}

/**
 * Componente para mostrar el estado de la suscripción
 */
export const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({
  subscription,
  onCancel,
  onPause,
  onResume,
  onUpgrade,
  isLoading = false
}) => {
  if (!subscription) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Suscripción Activa</h3>
          <p className="text-gray-600 mb-4">
            No tienes una suscripción activa. Selecciona un plan para comenzar.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Status) => {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const formatPrice = (price: number, currency: string, frequency: string) => {
    const formattedPrice = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price);
    
    const frequencyText = frequency === 'monthly' ? '/mes' : '/año';
    return `${formattedPrice}${frequencyText}`;
  };

  const getDaysUntilExpiry = () => {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Mi Suscripción</h3>
          <p className="text-sm text-gray-600">Estado actual de tu plan</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
          {getStatusText(subscription.status)}
        </span>
      </div>

      {/* Información del plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">{subscription.plan.name}</h4>
          <p className="text-sm text-gray-600 mb-3">{subscription.plan.description}</p>
          <div className="text-2xl font-bold text-gray-900">
            {formatPrice(subscription.plan.price, subscription.plan.currency, subscription.plan.billingFrequency)}
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-500">Fecha de inicio:</span>
            <p className="text-sm text-gray-900">{formatDate(subscription.startDate)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Próxima facturación:</span>
            <p className="text-sm text-gray-900">{formatDate(subscription.nextBillingDate)}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Renovación automática:</span>
            <p className="text-sm text-gray-900">{subscription.autoRenew ? 'Activada' : 'Desactivada'}</p>
          </div>
        </div>
      </div>

      {/* Alerta de expiración */}
      {isExpiringSoon && subscription.status === 'active' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Tu suscripción expira en {daysUntilExpiry} día{daysUntilExpiry !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-700">
                Asegúrate de renovar para mantener el acceso a todas las funciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Características del plan actual */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Características incluidas:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {subscription.plan.features.map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        {subscription.status === 'active' && (
          <>
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Actualizar Plan
              </button>
            )}
            
            {onPause && (
              <button
                onClick={() => onPause(subscription.id)}
                disabled={isLoading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Pausar
              </button>
            )}
            
            {onCancel && (
              <button
                onClick={() => onCancel(subscription.id)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
            )}
          </>
        )}
        
        {subscription.status === 'paused' && onResume && (
          <button
            onClick={() => onResume(subscription.id)}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reanudar
          </button>
        )}
      </div>
    </div>
  );
};