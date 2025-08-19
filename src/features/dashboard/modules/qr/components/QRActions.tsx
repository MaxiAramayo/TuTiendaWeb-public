/**
 * Componente para las acciones del código QR
 * 
 * @module features/dashboard/modules/qr/components
 */

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Download, 
  RefreshCw, 
  Share2, 
  Printer,
  Smartphone,
  Monitor,
  Copy,
  ExternalLink,
  CheckCircle
} from "lucide-react";
import { QRActionsProps } from "../types/qr-types";
import toast from "react-hot-toast";

/**
 * Componente para las acciones disponibles del código QR
 */
const QRActions: React.FC<QRActionsProps> = ({
  isGenerating,
  qrDataURL,
  user,
  storeProfile,
  onUpdateQR,
  onDownloadPDF
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  /**
   * Copia la URL al portapapeles
   */
  const handleCopyURL = async () => {
    const slug = storeProfile?.basicInfo?.slug;
    if (slug) {
      const url = `https://tutiendaweb.com.ar/${slug}`;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('URL copiada al portapapeles');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error al copiar URL:', error);
        toast.error('Error al copiar la URL');
      }
    }
  };

  /**
   * Comparte el QR usando Web Share API
   */
  const handleShare = async () => {
    const slug = storeProfile?.basicInfo?.slug;
    const storeName = storeProfile?.basicInfo?.name || user?.displayName || 'Mi Tienda';
    if (slug) {
      const url = `https://tutiendaweb.com.ar/${slug}`;
      const shareData = {
        title: `Menú Digital - ${storeName}`,
        text: `¡Mira el menú digital de ${storeName}!`,
        url: url
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
          setShared(true);
          toast.success('Compartido exitosamente');
          setTimeout(() => setShared(false), 2000);
        } else {
          // Fallback para navegadores sin Web Share API
          await navigator.clipboard.writeText(url);
          toast.success('URL copiada para compartir');
        }
      } catch (error) {
        console.error('Error al compartir:', error);
        toast.error('Error al compartir');
      }
    }
  };

  /**
   * Imprime el código QR
   */
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }

    const qrContainer = document.getElementById('qr-container');
    if (!qrContainer) {
      toast.error('No se encontró el código QR para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${storeProfile?.basicInfo?.name || user.displayName || 'Mi Tienda'}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Arial', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            .qr-print-container {
              background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
              padding: 40px;
              border-radius: 20px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
              max-width: 400px;
              width: 100%;
            }
            .store-name {
              color: white;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .badge {
              color: white;
              background: rgba(255,255,255,0.2);
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              display: inline-block;
              margin-bottom: 30px;
            }
            .qr-wrapper {
              background: white;
              padding: 30px;
              border-radius: 20px;
              display: inline-block;
              margin-bottom: 30px;
            }
            .info-section {
              color: white;
              font-size: 14px;
              margin-bottom: 10px;
              background: rgba(255,255,255,0.1);
              padding: 10px;
              border-radius: 10px;
            }
            .url-section {
              color: white;
              background: rgba(255,255,255,0.15);
              padding: 15px;
              border-radius: 15px;
              font-family: monospace;
              font-size: 12px;
              word-break: break-all;
            }
            @media print {
              body { margin: 0; }
              .qr-print-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-print-container">
            <div class="store-name">${storeProfile?.basicInfo?.name || user.displayName || 'Mi Tienda'}</div>
            <div class="badge">Menú Digital</div>
            <div class="qr-wrapper">
              ${qrContainer.querySelector('.bg-white')?.innerHTML || ''}
            </div>
            ${storeProfile?.contactInfo?.whatsapp ? `<div class="info-section">WhatsApp: ${storeProfile.contactInfo.whatsapp}</div>` : ''}
            <div class="url-section">tutiendaweb.com.ar/${storeProfile?.basicInfo?.slug || 'mi-tienda'}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Esperar a que cargue antes de imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      toast.success('Enviado a impresión');
    }, 500);
  };

  /**
   * Abre vista móvil en nueva ventana
   */
  const handleMobileView = () => {
    const slug = storeProfile?.basicInfo?.slug;
    if (slug) {
      const url = `https://tutiendaweb.com.ar/${slug}`;
      const mobileWindow = window.open(url, '_blank', 'width=375,height=667,scrollbars=yes,resizable=yes');
      if (mobileWindow) {
        toast.success('Vista móvil abierta');
      } else {
        toast.error('No se pudo abrir la vista móvil');
      }
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Primary Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Acciones del Código QR
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Update QR */}
            <Button
              onClick={onUpdateQR}
              variant="outline"
              className="flex items-center space-x-2 h-12"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar QR</span>
            </Button>

            {/* Download PDF */}
            <Button
              onClick={onDownloadPDF}
              disabled={isGenerating || !qrDataURL || !storeProfile?.basicInfo?.slug}
              className="flex items-center space-x-2 h-12"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </>
              )}
            </Button>
          </div>

          {/* Open Menu Button */}
          <div className="mt-4">
            <Button
              onClick={() => {
                const slug = storeProfile?.basicInfo?.slug;
                if (slug) {
                  window.open(`https://tutiendaweb.com.ar/${slug}`, '_blank');
                }
              }}
              disabled={!storeProfile?.basicInfo?.slug}
              variant="secondary"
              className="w-full flex items-center space-x-2 h-12"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Ver Menú Digital</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Opciones de Compartir
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 qr-actions-grid">
            {/* Copy URL */}
            <Button
              onClick={handleCopyURL}
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-2 h-10 action-button ${copied ? 'success-state' : ''}`}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Copiado</span>
                  <span className="sm:hidden">✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copiar</span>
                  <span className="sm:hidden">📋</span>
                </>
              )}
            </Button>

            {/* Share */}
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-2 h-10 action-button ${shared ? 'success-state' : ''}`}
            >
              {shared ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Compartido</span>
                  <span className="sm:hidden">✓</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Compartir</span>
                  <span className="sm:hidden">📤</span>
                </>
              )}
            </Button>

            {/* Print */}
            <Button
              onClick={handlePrint}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 h-10 action-button"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
              <span className="sm:hidden">🖨️</span>
            </Button>

            {/* Mobile View */}
            <Button
              onClick={handleMobileView}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 h-10 action-button"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Móvil</span>
              <span className="sm:hidden">📱</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center space-x-2">
            <Monitor className="w-5 h-5" />
            <span>Consejos de Uso</span>
          </h3>
          
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>Para imprimir:</strong> Descarga el PDF para obtener la mejor calidad de impresión
              </p>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>Para mostrar en pantalla:</strong> Usa el código QR directamente desde esta página
              </p>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <p>
                <strong>Tamaño recomendado:</strong> Mínimo 3x3 cm para que sea fácil de escanear
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRActions;
