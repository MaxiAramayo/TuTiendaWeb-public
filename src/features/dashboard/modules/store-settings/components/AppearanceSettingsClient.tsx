'use client';

import React, { useCallback } from 'react';
import { useProfile } from '../hooks/useProfile';
import { ThemeSection } from './sections/ThemeSection';

export default function AppearanceSettingsClient() {
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
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Apariencia</h2>
        <p className="text-sm text-gray-500">Personaliza el look & feel de tu tienda para tus clientes.</p>
      </div>

      <ThemeSection {...sectionProps} />
    </div>
  );
}
