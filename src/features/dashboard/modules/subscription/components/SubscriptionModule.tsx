/**
 * Componente principal del módulo de suscripciones
 */

import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { PlanCard } from './PlanCard';
import { SubscriptionStatusCard } from './SubscriptionStatusCard';
import { CreateSubscriptionData } from '../types/subscription.types';

/**
 * Props para el componente SubscriptionModule
 */
interface SubscriptionModuleProps {
  userId: string;
}

/**
 * Componente principal del módulo de suscripciones
 */
export const SubscriptionModule: React.FC<SubscriptionModuleProps> = ({ userId }) => {
  const {
    currentSubscription,
    availablePlans,
    isLoading,
    error,
    createSubscription,
    cancelSubscription,
    upgradeSubscription,
    pauseSubscription,
    resumeSubscription,
    clearError,
    canUpgradeToPlan
  } = useSubscription(userId);

  const [activeTab, setActiveTab] = useState<'status' | 'plans'>('status');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /**
   * Maneja la selección de un plan
   */
  const handlePlanSelect = async (planId: string) => {
    try {
      setActionLoading(planId);
      clearError();

      const subscriptionData: CreateSubscriptionData = {
        planId,
        autoRenew: true
      };

      const paymentUrl = await createSubscription(subscriptionData);
      
      // Redirigir a MercadoPago
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Error seleccionando plan:', error);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Maneja la actualización de plan
   */
  const handleUpgrade = async (planId: string) => {
    try {
      setActionLoading(`upgrade-${planId}`);
      clearError();

      const paymentUrl = await upgradeSubscription(planId);
      
      // Redirigir a MercadoPago
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Error actualizando plan:', error);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Maneja la cancelación de suscripción
   */
  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar tu suscripción?')) {
      return;
    }

    try {
      setActionLoading('cancel');
      clearError();
      await cancelSubscription(subscriptionId);
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Maneja la pausa de suscripción
   */
  const handlePause = async (subscriptionId: string) => {
    if (!confirm('¿Quieres pausar tu suscripción? Podrás reanudarla cuando quieras.')) {
      return;
    }

    try {
      setActionLoading('pause');
      clearError();
      await pauseSubscription(subscriptionId);
    } catch (error) {
      console.error('Error pausando suscripción:', error);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Maneja la reanudación de suscripción
   */
  const handleResume = async (subscriptionId: string) => {
    try {
      setActionLoading('resume');
      clearError();
      await resumeSubscription(subscriptionId);
    } catch (error) {
      console.error('Error reanudando suscripción:', error);
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * Maneja el cambio de pestaña
   */
  const handleTabChange = (tab: 'status' | 'plans') => {
    setActiveTab(tab);
    clearError();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Suscripciones</h1>
        <p className="text-gray-600">
          Gestiona tu suscripción y accede a todas las funciones premium de tu tienda.
        </p>
      </div>

      {/* Navegación por pestañas */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('status')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Mi Suscripción
          </button>
          <button
            onClick={() => handleTabChange('plans')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Planes Disponibles
          </button>
        </nav>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Contenido de las pestañas */}
      {activeTab === 'status' && (
        <div>
          <SubscriptionStatusCard
            subscription={currentSubscription}
            onCancel={handleCancel}
            onPause={handlePause}
            onResume={handleResume}
            onUpgrade={() => setActiveTab('plans')}
            isLoading={actionLoading !== null}
          />
        </div>
      )}

      {activeTab === 'plans' && (
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando planes...</span>
            </div>
          ) : (
            <>
              {/* Información sobre actualización */}
              {currentSubscription && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Plan actual: {currentSubscription.plan.name}
                      </p>
                      <p className="text-sm text-blue-700">
                        Puedes actualizar a un plan superior en cualquier momento.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid de planes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availablePlans.map((plan) => {
                  const isCurrentPlan = currentSubscription?.plan.id === plan.id;
                  const canUpgrade = currentSubscription ? canUpgradeToPlan(plan.id) : true;
                  const isLoadingThisPlan = actionLoading === plan.id || actionLoading === `upgrade-${plan.id}`;

                  return (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isCurrentPlan={isCurrentPlan}
                      isPopular={plan.isPopular}
                      onSelect={currentSubscription ? 
                        () => handleUpgrade(plan.id) : 
                        () => handlePlanSelect(plan.id)
                      }
                      isLoading={isLoadingThisPlan}
                      disabled={!canUpgrade && !isCurrentPlan}
                    />
                  );
                })}
              </div>

              {availablePlans.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay planes disponibles</h3>
                  <p className="text-gray-600">
                    Los planes de suscripción no están disponibles en este momento.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};