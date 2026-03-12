'use client';

import React, { useCallback } from 'react';
import { useProfile } from '../hooks/useProfile';
import { PaymentDeliverySection } from './sections/PaymentDeliverySection';

export default function CheckoutSettingsClient() {
  const {
    profile,
    formData,
    formState,
    form,
    isSaving,
    updateField,
    saveProfile,
    loadProfile,
  } = useProfile();

  const handleSectionSave = useCallback(async () => {
    const currentFormData = form.getValues();
    await saveProfile(currentFormData);
  }, [form, saveProfile]);

  const sectionProps = {
    formData,
    formState,
    form,
    updateField,
    profile,
    onSave: handleSectionSave,
    onRefresh: loadProfile,
    isSaving,
  };

  return (
    <div className="space-y-8 w-full">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Pagos y Entregas</h2>
        <p className="text-sm text-gray-500">Configura cómo tus clientes pueden pagar y recibir sus pedidos.</p>
      </div>

      <PaymentDeliverySection {...sectionProps} />
    </div>
  );
}
