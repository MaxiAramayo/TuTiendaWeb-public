/**
 * Componente para mostrar el preview del código QR
 * 
 * Refactorizado para seguir arquitectura Server-First:
 * - Eliminada dependencia de User (usa storeProfile.basicInfo.name)
 * - Datos vienen del Server Component via props
 * 
 * @module features/dashboard/modules/qr/components
 */

"use client";

import React from "react";
import QRCode from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Store, MapPin } from "lucide-react";
import { QRPreviewProps } from "../types/qr-types";
import { DEFAULT_QR_CONFIG } from "../utils/qr-utils";

/**
 * Componente para mostrar el preview del código QR con información de la tienda
 */
export function QRPreview({
  storeProfile,
  storeURL,
  qrDataURL,
  onQRUpdate
}: QRPreviewProps) {
  const storeName = storeProfile.basicInfo?.name || 'Mi Tienda';

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <Store className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Código QR de tu Menú
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          Comparte este código QR con tus clientes para que accedan fácilmente a tu menú digital actualizado
        </p>
      </div>

      {/* QR Container */}
      <Card
        id="qr-container"
        className="bg-gradient-to-br from-slate-800 to-slate-900 border-0 shadow-2xl max-w-md mx-auto qr-container-pdf"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          minHeight: '500px',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact'
        }}
      >
        <CardContent className="p-10 flex flex-col items-center justify-center space-y-8">
          {/* Store Name */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white leading-tight">
              {storeName}
            </h2>
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full border border-white/30">
              <span className="text-white font-medium text-sm">Menú Digital</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white p-2 rounded-3xl shadow-2xl">
            <QRCode
              id="qr-code"
              value={storeURL}
              size={DEFAULT_QR_CONFIG.size}
              level={DEFAULT_QR_CONFIG.level}
              includeMargin={DEFAULT_QR_CONFIG.includeMargin}
              fgColor={DEFAULT_QR_CONFIG.fgColor}
              bgColor={DEFAULT_QR_CONFIG.bgColor}
              renderAs="canvas"
            />
          </div>

          {/* Store Info */}
          <div className="space-y-4 text-center max-w-sm">
            {storeProfile.contactInfo?.whatsapp && (
              <div className="flex items-center justify-center space-x-3 bg-white/10 rounded-lg p-3">
                <Store className="w-5 h-5 text-white/80 flex-shrink-0" />
                <p className="text-white/90 text-sm leading-relaxed font-medium">
                  WhatsApp: {storeProfile.contactInfo.whatsapp}
                </p>
              </div>
            )}
            {storeProfile.basicInfo?.description && (
              <div className="flex items-center justify-center space-x-3 bg-white/10 rounded-lg p-3">
                <MapPin className="w-5 h-5 text-white/80 flex-shrink-0" />
                <p className="text-white/90 text-sm leading-relaxed font-medium">
                  {storeProfile.basicInfo.description}
                </p>
              </div>
            )}
          </div>

          {/* URL Display */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
            <p className="text-white/90 text-xs font-mono tracking-wide">
              {storeURL}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              ¿Cómo usar el código QR?
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>1. Descarga el PDF para imprimir</p>
              <p>2. Muestra el código en pantalla</p>
              <p>3. Los clientes escanean para ver tu menú</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QRPreview;
