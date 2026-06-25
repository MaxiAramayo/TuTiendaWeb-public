'use client';

import React, { useCallback } from 'react';
import { useProfile } from '../hooks/useProfile';
import { ScheduleSection } from './sections/ScheduleSection';

export default function ScheduleSettingsClient() {
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
      <ScheduleSection {...sectionProps} />
    </div>
  );
}
