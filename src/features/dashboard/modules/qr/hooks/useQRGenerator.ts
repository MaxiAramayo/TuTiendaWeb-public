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
import { User } from "@/features/user/user.types";
import { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";
import { profileService } from "@/features/dashboard/modules/store-settings/services/profile.service";

/**
 * Hook personalizado para manejar la generación de códigos QR
 */
export const useQRGenerator = (user: User | undefined) => {
  const [state, setState] = useState<QRGeneratorState>({
    qrDataURL: "",
    storeURL: "",
    isGenerating: false,
    error: undefined
  });
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Cargar perfil de la tienda cuando cambie el usuario
  useEffect(() => {
    const loadStoreProfile = async () => {
      if (!user?.id) {
        setStoreProfile(null);
        setState(prev => ({ ...prev, storeURL: "", error: undefined }));
        return;
      }

      setIsLoadingProfile(true);
      try {
        const profile = await profileService.getProfile(user.id);
        setStoreProfile(profile);
        
        if (profile?.basicInfo?.slug) {
          const newStoreURL = generateStoreURL(profile.basicInfo.slug);
          setState(prev => ({ ...prev, storeURL: newStoreURL, error: undefined }));
        } else {
          setState(prev => ({ ...prev, error: "No se encontró el slug de la tienda" }));
        }
      } catch (error) {
        console.error('Error cargando perfil de tienda:', error);
        setState(prev => ({ ...prev, error: "Error al cargar información de la tienda" }));
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadStoreProfile();
  }, [user?.id]);

  /**
   * Genera el código QR
   */
  const generateQR = useCallback(async () => {
    if (!user || !storeProfile) {
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
  }, [user, storeProfile]);

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
    isReady: !!user && !!storeProfile && !!state.storeURL && !isLoadingProfile
  };
};
