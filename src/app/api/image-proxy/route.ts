/**
 * Proxy de imágenes para evitar restricciones CORS al generar PDFs con html2canvas.
 *
 * html2canvas necesita que las imágenes externas (ej: Firebase Storage) sean
 * accesibles con CORS. Como Firebase Storage no tiene CORS configurado por
 * defecto, este endpoint las fetchea server-side (sin restricciones de CORS)
 * y las devuelve con los headers Access-Control-Allow-Origin necesarios.
 *
 * Uso: /api/image-proxy?url=<encoded-url>
 *
 * @module app/api/image-proxy
 */

import { NextRequest, NextResponse } from "next/server";

/** Dominios permitidos para el proxy (evita que sea un proxy abierto) */
const ALLOWED_HOSTNAMES = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "lh3.googleusercontent.com", // Google profile photos
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  // Validar que la URL proviene de un dominio permitido
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (!ALLOWED_HOSTNAMES.includes(parsed.hostname)) {
    return new NextResponse("URL hostname not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(rawUrl, {
      // No cache para siempre tener la versión actual del logo
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, {
        status: 502,
      });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("Content-Type") || "image/png";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Permite que html2canvas use la imagen sin tainting del canvas
        "Access-Control-Allow-Origin": "*",
        // Cache razonable para evitar re-fetching constante
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[image-proxy] Error fetching image:", err);
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}
