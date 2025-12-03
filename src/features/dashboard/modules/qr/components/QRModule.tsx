/**
 * Componente principal del módulo QR
 * 
 * @module features/dashboard/modules/qr/components
 */

"use client";

import React from "react";
import { useAuthClient } from "@/features/auth/hooks/use-auth-client";
import { useQRGenerator } from "../hooks/useQRGenerator";
import { QRPDFService } from "../services/QRPDFService";
import QRPreview from "./QRPreview";
import QRActions from "./QRActions";
import QRModuleSkeleton from "./QRModuleSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import "../qr-styles.css";

/**
 * Componente principal que gestiona toda la funcionalidad del módulo QR
 */
const QRModule: React.FC = () => {
  const { user, isLoading } = useAuthClient();
  const {
    qrDataURL,
    storeURL,
    storeProfile,
    isLoadingProfile,
    isGenerating,
    error,
    generateQR,
    setGenerating,
    clearError,
    isReady: qrReady
  } = useQRGenerator();

  /**
   * Maneja la descarga del PDF usando el método optimizado
   */
  const handleDownloadPDF = async () => {
    if (!storeProfile) {
      toast.error('No se encontró información de la tienda');
      return;
    }

    setGenerating(true);

    try {
      await QRPDFService.generatePDFFromStore(storeProfile);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  // Loading state
  if (isLoading || isLoadingProfile) {
    return <QRModuleSkeleton />;
  }

  // Error state - Usuario no encontrado
  if (!isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No se pudo cargar la información del usuario. Por favor, inicia sesión nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state - Perfil de tienda no encontrado
  if (!storeProfile && !isLoadingProfile) {
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
            user={user}
            storeProfile={storeProfile || undefined}
            storeURL={storeURL}
            qrDataURL={qrDataURL}
            onQRUpdate={generateQR}
          />

          {/* QR Actions */}
          <div className="flex justify-center">
            <QRActions
              isGenerating={isGenerating}
              qrDataURL={qrDataURL}
              user={user}
              storeProfile={storeProfile || undefined}
              onUpdateQR={generateQR}
              onDownloadPDF={handleDownloadPDF}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRModule;
