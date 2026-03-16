/**
 * Componente cliente del módulo QR — layout rediseñado.
 *
 * Arquitectura Server-First: recibe storeProfile desde Server Component.
 *
 * @module features/dashboard/modules/qr/components
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { QRPDFService } from "../services/QRPDFService";
import { QRPreview } from "./QRPreview";
import { QRActions } from "./QRActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, QrCode } from "lucide-react";
import toast from "react-hot-toast";
import { generateCartaURL, getQRDataURL, isQRReady } from "../utils/qr-utils";
import type { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";
import "../qr-styles.css";

interface QRModuleClientProps {
  storeProfile: StoreProfile | null;
}

export function QRModuleClient({ storeProfile }: QRModuleClientProps) {
  const [qrDataURL, setQrDataURL]       = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError]               = useState<string | undefined>(undefined);

  const storeURL = storeProfile?.basicInfo?.slug
    ? generateCartaURL(storeProfile.basicInfo.slug)
    : "";

  const accent = storeProfile?.theme?.primaryColor || "#c9973a";

  // ── Generate QR data URL from canvas ──────────────────────────────────
  const generateQR = useCallback(async () => {
    if (!storeProfile) { setError("Información de la tienda no disponible"); return; }
    try {
      let ready = isQRReady();
      let attempts = 0;
      while (!ready && attempts < 10) {
        await new Promise((r) => setTimeout(r, 200));
        ready = isQRReady();
        attempts++;
      }
      if (!ready) throw new Error("El QR no pudo renderizarse");
      const dataURL = await getQRDataURL();
      setQrDataURL(dataURL);
      setError(undefined);
    } catch (err) {
      console.error("Error generando QR:", err);
      setError("Error al generar el código QR");
    }
  }, [storeProfile]);

  // ── Download PDF ───────────────────────────────────────────────────────
  const handleDownloadPDF = useCallback(async () => {
    if (!storeProfile) { toast.error("No se encontró información de la tienda"); return; }
    setIsGenerating(true);
    try {
      await QRPDFService.generatePDFFromStore(storeProfile);
      toast.success("PDF generado exitosamente");
    } catch (err) {
      console.error("Error al generar PDF:", err);
      toast.error("Error al generar el PDF. Intentá de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  }, [storeProfile]);

  // ── Auto-generate on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (storeProfile?.basicInfo?.slug && storeURL) {
      const t = setTimeout(() => generateQR(), 150);
      return () => clearTimeout(t);
    }
  }, [storeProfile?.basicInfo?.slug, storeURL, generateQR]);

  // ── Error states ───────────────────────────────────────────────────────
  if (!storeProfile || !storeProfile.basicInfo?.slug) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {!storeProfile
              ? "No se encontró el perfil de la tienda. Configurá tu tienda primero."
              : "Configurá el slug de tu tienda en el perfil para generar el QR."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const storeName = storeProfile.basicInfo?.name || "Mi Tienda";
  const slug      = storeProfile.basicInfo?.slug;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ── Page header ── */}
      <div style={{ maxWidth: 960, marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#0d0d0d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <QrCode style={{ width: 18, height: 18, color: accent }} />
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#0d0d0d",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Código QR del menú
          </h1>
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#6b7280",
            margin: "0 0 0 50px",
          }}
        >
          Imprimí el cartel y ponelo en cada mesa para que tus clientes vean el
          menú sin necesidad de hacer el pedido ellos mismos.
        </p>
      </div>

      {/* ── Main grid ── */}
      <div
        style={{
          maxWidth: 960,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 32,
        }}
        className="lg:!grid-cols-[auto_1fr]"
      >
        {/* ── Left: QR card + label ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Ambient glow + mobile scale wrapper */}
          <div
            style={{ position: "relative", display: "flex", justifyContent: "center" }}
            className="w-full sm:w-auto"
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-20px",
                borderRadius: "50%",
                background: accent,
                opacity: 0.1,
                filter: "blur(48px)",
                pointerEvents: "none",
              }}
            />
            {/* Scale down on narrow screens without touching the QR card design */}
            <div className="[zoom:0.9] sm:[zoom:1] origin-top">
              <QRPreview
                storeProfile={storeProfile}
                storeURL={storeURL}
                qrDataURL={qrDataURL}
                onQRUpdate={generateQR}
              />
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
            Vista previa del cartel QR
          </p>
        </div>

        {/* ── Right: Info + Actions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Store info card */}
          <div
            style={{
              background: "white",
              borderRadius: 18,
              padding: "20px 24px",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#9ca3af",
                marginBottom: 10,
              }}
            >
              Tu tienda
            </p>
            <p
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#0d0d0d",
                margin: "0 0 4px",
                letterSpacing: "-0.02em",
              }}
            >
              {storeName}
            </p>
            <p
              style={{
                fontSize: 12,
                fontFamily: "monospace",
                color: "#9ca3af",
                margin: 0,
              }}
            >
              tutiendaweb.com.ar/carta/{slug}
            </p>
          </div>

          {/* Actions card */}
          <div
            style={{
              background: "white",
              borderRadius: 18,
              padding: "20px 24px",
              border: "1px solid rgba(0,0,0,0.06)",
              flex: 1,
            }}
          >
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
