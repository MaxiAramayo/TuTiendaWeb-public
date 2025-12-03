/**
 * Hook para manejar la lógica del QR Generator
 * 
 * @module features/dashboard/modules/qr/hooks
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { QRGeneratorState } from "../types/qr-types";
import { generateStoreURL, getQRDataURL, isQRReady } from "../utils/qr-utils";
import { validateQrStoreData } from '@shared/validations';
import { useCurrentStore } from "@/features/dashboard/hooks/useCurrentStore";

/**
 * Hook personalizado para manejar la generación de códigos QR
 */
export const useQRGenerator = () => {
  const [state, setState] = useState<QRGeneratorState>({
    qrDataURL: "",
    storeURL: "",
    isGenerating: false,
    error: undefined
  });

  const { storeProfile, isLoading: isLoadingProfile } = useCurrentStore();

  // Actualizar URL cuando cambia el perfil
  useEffect(() => {
    if (isLoadingProfile) return;

    if (!storeProfile) {
      setState(prev => ({ ...prev, storeURL: "", error: undefined }));
      return;
    }

    if (storeProfile.basicInfo?.slug) {
      const newStoreURL = generateStoreURL(storeProfile.basicInfo.slug);
      setState(prev => ({ ...prev, storeURL: newStoreURL, error: undefined }));
    } else {
      setState(prev => ({ ...prev, error: "No se encontró el slug de la tienda" }));
    }
  }, [storeProfile, isLoadingProfile]);

  /**
   * Genera el código QR
   */
  const generateQR = useCallback(async () => {
    if (!storeProfile) {
      setState(prev => ({ ...prev, error: "Información de la tienda no disponible" }));
      return;
    }

    const validation = validateQrStoreData(storeProfile);
    if (!validation.success) {
      setState(prev => ({ ...prev, error: validation.error?.issues[0]?.message || 'Datos de tienda inválidos' }));
      return;
    }

    try {
      // Verificar si el QR está listo antes de intentar obtener el dataURL
      let qrIsReady = isQRReady();
      let attempts = 0;
      const maxAttempts = 10;

      while (!qrIsReady && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 200));
        qrIsReady = isQRReady();
        attempts++;
      }

      if (!qrIsReady) {
        throw new Error('El QR no se pudo renderizar después de múltiples intentos');
      }

      const dataURL = await getQRDataURL();
      setState(prev => ({
        ...prev,
        qrDataURL: dataURL,
        error: undefined
      }));
    } catch (error) {
      console.error('Error generando QR:', error);
      setState(prev => ({
        ...prev,
        error: "Error al generar el código QR"
      }));
    }
  }, [storeProfile]);

  /**
   * Actualiza el estado de generación de PDF
   */
  const setGenerating = useCallback((isGenerating: boolean) => {
    setState(prev => ({ ...prev, isGenerating }));
  }, []);

  /**
   * Limpia errores
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  // Auto-generar QR cuando los datos estén listos
  useEffect(() => {
    if (storeProfile?.basicInfo?.slug && state.storeURL && !isLoadingProfile) {
      // Pequeño delay para asegurar que el QR component esté renderizado
      const timer = setTimeout(() => {
        generateQR();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [storeProfile?.basicInfo?.slug, state.storeURL, isLoadingProfile, generateQR]);

  return {
    ...state,
    storeProfile,
    isLoadingProfile,
    generateQR,
    setGenerating,
    clearError,
    isReady: !!storeProfile && !!state.storeURL && !isLoadingProfile
  };
};
