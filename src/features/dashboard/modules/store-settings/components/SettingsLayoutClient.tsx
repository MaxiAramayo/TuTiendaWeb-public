'use client';

import React from 'react';
import { useAuthClient } from "@/features/auth/hooks/use-auth-client";
import { useProfile } from '../hooks/useProfile';
import { StoreProfile } from '../types/store.type';

interface SettingsLayoutClientProps {
  initialProfile?: StoreProfile | null;
  children: React.ReactNode;
}

export default function SettingsLayoutClient({ 
  initialProfile,
  children
}: SettingsLayoutClientProps) {
  const { isLoading: authLoading } = useAuthClient();
  
  const {
    isLoading,
    error,
  } = useProfile({ initialProfile });

  const isReady = !authLoading;

  if (!isReady && !initialProfile) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar la configuración</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 w-full max-w-[1400px] mx-auto">
      {children}
    </div>
  );
}
