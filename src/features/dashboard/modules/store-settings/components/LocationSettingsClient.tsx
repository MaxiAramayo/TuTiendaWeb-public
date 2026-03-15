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
      <AddressSection {...sectionProps} />
      <div className="h-px bg-gray-200" />
      <ScheduleSection {...sectionProps} />
    </div>
  );
}
