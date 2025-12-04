/**
 * Componente cliente del módulo QR
 * 
 * Recibe storeProfile desde el Server Component y maneja la UI interactiva.
 * Sigue la arquitectura Server-First de Next.js 15.
 * 
 * @module features/dashboard/modules/qr/components
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { QRPDFService } from "../services/QRPDFService";
import { QRPreview } from "./QRPreview";
import { QRActions } from "./QRActions";
import QRModuleSkeleton from "./QRModuleSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { generateStoreURL, getQRDataURL, isQRReady } from "../utils/qr-utils";
import type { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";
import "../qr-styles.css";

interface QRModuleClientProps {
  storeProfile: StoreProfile | null;
}

/**
 * Componente cliente que gestiona la funcionalidad del módulo QR
 */
export function QRModuleClient({ storeProfile }: QRModuleClientProps) {
  const [qrDataURL, setQrDataURL] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Calcular storeURL desde el storeProfile
  const storeURL = storeProfile?.basicInfo?.slug 
    ? generateStoreURL(storeProfile.basicInfo.slug) 
    : "";

  /**
   * Genera el código QR desde el canvas
   */
  const generateQR = useCallback(async () => {
    if (!storeProfile) {
      setError("Información de la tienda no disponible");
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
      setQrDataURL(dataURL);
      setError(undefined);
    } catch (err) {
      console.error('Error generando QR:', err);
      setError("Error al generar el código QR");
    }
  }, [storeProfile]);

  /**
   * Maneja la descarga del PDF
   */
  const handleDownloadPDF = useCallback(async () => {
    if (!storeProfile) {
      toast.error('No se encontró información de la tienda');
      return;
    }

    setIsGenerating(true);

    try {
      await QRPDFService.generatePDFFromStore(storeProfile);
      toast.success('PDF generado exitosamente');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      toast.error('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  }, [storeProfile]);

  // Auto-generar QR cuando los datos estén listos
  useEffect(() => {
    if (storeProfile?.basicInfo?.slug && storeURL) {
      // Pequeño delay para asegurar que el QR component esté renderizado
      const timer = setTimeout(() => {
        generateQR();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [storeProfile?.basicInfo?.slug, storeURL, generateQR]);

  // Error state - Perfil de tienda no encontrado
  if (!storeProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontró el perfil de la tienda. Por favor, configura tu tienda primero.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state - Sin slug
  if (!storeProfile.basicInfo?.slug) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se encontró el slug de la tienda. Por favor, configura tu tienda primero.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state - Datos del QR
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-8">
          {/* QR Preview */}
          <QRPreview
            storeProfile={storeProfile}
            storeURL={storeURL}
            qrDataURL={qrDataURL}
            onQRUpdate={generateQR}
          />

          {/* QR Actions */}
          <div className="flex justify-center">
            <QRActions
              isGenerating={isGenerating}
              qrDataURL={qrDataURL}
              storeProfile={storeProfile}
              onUpdateQR={generateQR}
              onDownloadPDF={handleDownloadPDF}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRModuleClient;
