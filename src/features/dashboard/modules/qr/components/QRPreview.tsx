/**
 * Vista previa del código QR — diseño premium imprimible.
 *
 * Usa el color primario de la tienda como acento y soporta logo.
 *
 * @module features/dashboard/modules/qr/components
 */

"use client";

import React from "react";
import QRCode from "qrcode.react";
import { QRPreviewProps } from "../types/qr-types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Convierte hex a RGB tuple */
function hexToRGB(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

/** Mezcla un color hex con alpha sobre fondo oscuro (#0d0d0d) */
function alphaOnDark(hex: string, alpha: number): string {
  const [r, g, b] = hexToRGB(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function QRPreview({ storeProfile, storeURL }: QRPreviewProps) {
  const storeName   = storeProfile.basicInfo?.name  || "Mi Tienda";
  const slug        = storeProfile.basicInfo?.slug  || "";
  const accent      = storeProfile.theme?.primaryColor || "#c9973a";
  const logoUrl     = storeProfile.theme?.logoUrl;
  const description = storeProfile.basicInfo?.description || "";

  return (
    <>
      {/* Google Fonts — Cormorant Garamond (display) + DM Sans (body) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
      `}</style>

      {/*
        ┌─────────────────────────────────────────┐
        │  id="qr-container" — elemento imprimible │
        └─────────────────────────────────────────┘
      */}
      <div
        id="qr-container"
        style={{
          position: "relative",
          background: "#0d0d0d",
          borderRadius: "26px",
          padding: "48px 36px 40px",
          width: "360px",
          boxSizing: "border-box",
          boxShadow: `0 0 0 1px ${alphaOnDark(accent, 0.18)}, 0 40px 80px rgba(0,0,0,0.5)`,
          overflow: "hidden",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* ── Noise texture overlay ── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.025,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "128px 128px",
            pointerEvents: "none",
          }}
        />

        {/* ── Corner brackets ── */}
        {(
          [
            { top: 14, left: 14 },
            { top: 14, right: 14 },
            { bottom: 14, left: 14 },
            { bottom: 14, right: 14 },
          ] as React.CSSProperties[]
        ).map((pos, i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: "absolute",
              ...pos,
              width: 22,
              height: 22,
              borderTop: i < 2 ? `1.5px solid ${alphaOnDark(accent, 0.55)}` : undefined,
              borderBottom: i >= 2 ? `1.5px solid ${alphaOnDark(accent, 0.55)}` : undefined,
              borderLeft: i % 2 === 0 ? `1.5px solid ${alphaOnDark(accent, 0.55)}` : undefined,
              borderRight: i % 2 === 1 ? `1.5px solid ${alphaOnDark(accent, 0.55)}` : undefined,
            }}
          />
        ))}

        {/* ── Logo (si existe) ── */}
        {logoUrl && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "18px",
                background: "transparent",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 0 1px ${alphaOnDark(accent, 0.3)}`,
                padding: "4px",
              }}
            >
              {/* Sin crossOrigin: Firebase Storage no tiene CORS configurado.
                  El PDF usa /api/image-proxy para resolver el taint del canvas. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt={storeName}
                loading="eager"
                style={{ objectFit: "contain", width: 64, height: 64, borderRadius: "14px" }}
              />
            </div>
          </div>
        )}

        {/* ── Nombre de la tienda ── */}
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: storeName.length > 18 ? "26px" : "32px",
            fontWeight: 700,
            color: accent,
            textAlign: "center",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
          }}
        >
          {storeName}
        </h2>

        {/* ── Descripción de la tienda ── */}
        {description && (
          <p
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.7)",
              fontSize: "13px",
              lineHeight: 1.4,
              margin: "12px auto 0",
              maxWidth: "90%",
              fontWeight: 300,
            }}
          >
            {description.length > 80 ? description.substring(0, 80) + "..." : description}
          </p>
        )}

        {/* ── Divider ornamental ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "24px auto 20px",
            width: "80%",
          }}
        >
          <div style={{ flex: 1, height: 1.5, background: alphaOnDark(accent, 0.25) }} />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: alphaOnDark(accent, 0.7),
            }}
          />
          <div style={{ flex: 1, height: 1.5, background: alphaOnDark(accent, 0.25) }} />
        </div>

        {/* ── Tagline ── */}
        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: "10px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            margin: "0 0 26px",
            fontWeight: 500,
          }}
        >
          Escaneá para ver el menú
        </p>

        {/* ── QR Code ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div
            style={{
              background: "white",
              padding: "18px",
              borderRadius: "20px",
              boxShadow: `0 0 0 2px ${alphaOnDark(accent, 0.2)}, 0 16px 40px rgba(0,0,0,0.5)`,
              lineHeight: 0,
            }}
          >
            <QRCode
              id="qr-code"
              value={storeURL}
              size={210}
              level="H"
              includeMargin={false}
              fgColor="#0d0d0d"
              bgColor="#ffffff"
              renderAs="canvas"
            />
          </div>
        </div>

        {/* ── URL ── */}
        <div
          style={{
            background: alphaOnDark(accent, 0.08),
            border: `1px solid ${alphaOnDark(accent, 0.2)}`,
            borderRadius: "14px",
            padding: "14px 18px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            boxShadow: `inset 0 1px 0 ${alphaOnDark(accent, 0.1)}`,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "9px",
              fontWeight: 600,
              textTransform: "uppercase",
              color: alphaOnDark(accent, 0.8),
              letterSpacing: "0.1em",
            }}
          >
            Menú Digital
          </span>
          <span
            style={{
              fontFamily: "'DM Mono', 'Courier New', monospace",
              fontSize: "12px",
              fontWeight: 600,
              color: accent,
              letterSpacing: "0.04em",
            }}
          >
            tutiendaweb.com.ar/carta/{slug}
          </span>
        </div>
      </div>
    </>
  );
}

export default QRPreview;
