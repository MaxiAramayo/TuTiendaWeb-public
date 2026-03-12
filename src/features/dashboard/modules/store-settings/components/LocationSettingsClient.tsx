'use client';

import React, { useCallback } from 'react';
import { useProfile } from '../hooks/useProfile';
import { AddressSection } from './sections/AddressSection';
import { ScheduleSection } from './sections/ScheduleSection';

export default function LocationSettingsClient() {
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
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Ubicación y Horarios</h2>
        <p className="text-sm text-gray-500">Configura la dirección física de tu tienda y cuándo estás abierto.</p>
      </div>

      <AddressSection {...sectionProps} />
      <div className="h-px bg-gray-200" />
      <ScheduleSection {...sectionProps} />
    </div>
  );
}
