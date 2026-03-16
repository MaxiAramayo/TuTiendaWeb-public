/**
 * Panel de acciones del QR — descarga, compartir, copiar.
 *
 * @module features/dashboard/modules/qr/components
 */

"use client";

import React, { useState } from "react";
import {
  Download,
  Copy,
  Share2,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { QRActionsProps } from "../types/qr-types";
import toast from "react-hot-toast";

export function QRActions({
  isGenerating,
  qrDataURL,
  storeProfile,
  onUpdateQR,
  onDownloadPDF,
}: QRActionsProps) {
  const [copied, setCopied] = useState(false);

  const slug       = storeProfile.basicInfo?.slug;
  const storeName  = storeProfile.basicInfo?.name || "Mi Tienda";
  const accent     = storeProfile.theme?.primaryColor || "#c9973a";
  const cartaURL   = `https://tutiendaweb.com.ar/carta/${slug}`;
  const catalogURL = `https://tutiendaweb.com.ar/${slug}`;

  const handleCopyURL = async () => {
    try {
      await navigator.clipboard.writeText(cartaURL);
      setCopied(true);
      toast.success("Link copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Menú — ${storeName}`,
      text: `Mirá el menú de ${storeName}`,
      url: cartaURL,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(cartaURL);
        toast.success("URL copiada para compartir");
      }
    } catch {
      toast.error("Error al compartir");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Primary: Descargar PDF ── */}
      <button
        onClick={onDownloadPDF}
        disabled={isGenerating || !qrDataURL || !slug}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          height: 52,
          borderRadius: 14,
          border: "none",
          background: accent,
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: "0.01em",
          cursor: isGenerating || !qrDataURL || !slug ? "not-allowed" : "pointer",
          opacity: isGenerating || !qrDataURL || !slug ? 0.45 : 1,
          transition: "opacity 0.15s, transform 0.1s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => { if (!isGenerating) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = isGenerating || !qrDataURL || !slug ? "0.45" : "1"; }}
      >
        {isGenerating ? (
          <>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <span>Generando PDF…</span>
          </>
        ) : (
          <>
            <Download style={{ width: 16, height: 16 }} />
            <span>Descargar PDF para imprimir</span>
          </>
        )}
      </button>

      {/* ── Secondary: Copiar / Compartir ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          onClick={handleCopyURL}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            height: 42,
            borderRadius: 12,
            border: "1.5px solid rgba(0,0,0,0.09)",
            background: "white",
            color: copied ? "#16a34a" : "#374151",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
            fontFamily: "inherit",
          }}
        >
          {copied ? (
            <CheckCircle2 style={{ width: 15, height: 15 }} />
          ) : (
            <Copy style={{ width: 15, height: 15 }} />
          )}
          <span>{copied ? "Copiado" : "Copiar link"}</span>
        </button>

        <button
          onClick={handleShare}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            height: 42,
            borderRadius: 12,
            border: "1.5px solid rgba(0,0,0,0.09)",
            background: "white",
            color: "#374151",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "border-color 0.15s",
            fontFamily: "inherit",
          }}
        >
          <Share2 style={{ width: 15, height: 15 }} />
          <span>Compartir</span>
        </button>
      </div>

      {/* ── Ver catálogo completo ── */}
      <a
        href={catalogURL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 12,
          color: "#9ca3af",
          textDecoration: "none",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#6b7280")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#9ca3af")}
      >
        <ExternalLink style={{ width: 13, height: 13 }} />
        Ver catálogo completo (con carrito y pedidos)
      </a>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: "rgba(0,0,0,0.06)" }} />

      {/* ── Info box ── */}
      <div
        style={{
          borderRadius: 14,
          padding: "14px 16px",
          background: `rgba(${hexToRGBString(accent)}, 0.06)`,
          border: `1px solid rgba(${hexToRGBString(accent)}, 0.18)`,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
            color: blendAccent(accent, 0.5),
          }}
        >
          ¿Cómo usar el QR?
        </p>
        <ol
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {[
            "Descargá el PDF y llevalo a imprimir",
            "Colocá el cartel en cada mesa de tu local",
            "Tus clientes escanean y ven el menú — el mozo toma el pedido",
          ].map((step, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: accent,
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* ── Actualizar QR ── */}
      <button
        onClick={onUpdateQR}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          fontSize: 11,
          color: "#9ca3af",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontFamily: "inherit",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#6b7280")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9ca3af")}
      >
        <RefreshCw style={{ width: 11, height: 11 }} />
        Actualizar código QR
      </button>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── small local helpers (no exports needed) ───────────────────────────────
function hexToRGBString(hex: string): string {
  const c = hex.replace("#", "");
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16),
  ].join(", ");
}

function blendAccent(hex: string, darken = 0): string {
  const c = hex.replace("#", "");
  const factor = 1 - darken;
  const r = Math.round(parseInt(c.substring(0, 2), 16) * factor);
  const g = Math.round(parseInt(c.substring(2, 4), 16) * factor);
  const b = Math.round(parseInt(c.substring(4, 6), 16) * factor);
  return `rgb(${r},${g},${b})`;
}

export default QRActions;
