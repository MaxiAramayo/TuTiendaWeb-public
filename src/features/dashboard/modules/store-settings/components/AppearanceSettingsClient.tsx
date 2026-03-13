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
      <ThemeSection {...sectionProps} />
    </div>
  );
}
