'use client';

import React, { useCallback } from 'react';
import { useProfile } from '../hooks/useProfile';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { ContactInfoSection } from './sections/ContactInfoSection';
import { SocialLinksSection } from './sections/SocialLinksSection';

export default function GeneralSettingsClient() {
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
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">General</h2>
        <p className="text-sm text-gray-500">Administra la información básica y el contacto de tu negocio.</p>
      </div>

      <BasicInfoSection {...sectionProps} />
      <div className="h-px bg-gray-200" />
      <ContactInfoSection {...sectionProps} />
      <div className="h-px bg-gray-200" />
      <SocialLinksSection {...sectionProps} />
    </div>
  );
}
