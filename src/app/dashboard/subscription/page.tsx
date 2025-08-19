/**
 * Página de suscripciones del dashboard
 * 
 * Proporciona acceso completo a la gestión de suscripciones con integración de MercadoPago
 */

'use client';

import React from 'react';
import { SubscriptionModule } from '@features/dashboard/modules/subscription/components/SubscriptionModule';

/**
 * Página principal de suscripciones
 */
export default function SubscriptionPage() {
  // En una implementación real, obtendrías el userId del contexto de autenticación
  // Por ahora usamos un placeholder
  const userId = 'user-123';

  return (
    <div className="min-h-screen bg-gray-50">
      <SubscriptionModule userId={userId} />
    </div>
  );
}