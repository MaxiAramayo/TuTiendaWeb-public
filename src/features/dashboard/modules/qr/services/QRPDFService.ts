/**
 * Servicio para generar PDFs con códigos QR.
 *
 * Captura el DOM de la vista previa con html2canvas para que el PDF sea
 * idéntico a lo que se ve en pantalla.
 *
 * Solución CORS: las imágenes de Firebase Storage se fetchean a través de
 * /api/image-proxy en el onclone para que html2canvas pueda usarlas sin
 * que el canvas quede "tainted" (sin poder llamar a toDataURL).
 *
 * @module features/dashboard/modules/qr/services
 */
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { StoreProfile } from "@/features/dashboard/modules/store-settings/types/store.type";

/** Convierte una URL externa a data:URL pasando por el proxy server-side */
async function toDataURLViaProxy(externalUrl: string): Promise<string> {
  const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(externalUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`Proxy error ${response.status}`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Retorna true si la URL es externa (no es relativa ni data:) */
function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

export class QRPDFService {
  static async generatePDFFromStore(storeProfile: StoreProfile): Promise<void> {
    if (!storeProfile.basicInfo?.name || !storeProfile.basicInfo?.slug) {
      throw new Error("Datos del perfil de tienda incompletos");
    }

    const containerEl = document.getElementById("qr-container");
    if (!containerEl) {
      throw new Error("Contenedor QR no encontrado en el DOM");
    }

    try {
      // ── Captura con html2canvas ──────────────────────────────────────────
      // scale 3 → ~1080px de ancho → ~270 DPI al imprimir en A4 con márgenes
      // useCORS: true → intenta CORS para imágenes que sí lo soporten
      // onclone → para imágenes externas (Firebase) las fetchea via proxy
      const canvas = await html2canvas(containerEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#0d0d0d",
        logging: false,
        onclone: async (clonedDoc) => {
          // Buscamos el contenedor clonado por id para máxima compatibilidad
          const clonedContainer = clonedDoc.getElementById("qr-container");
          if (!clonedContainer) return;

          const imgs = Array.from(
            clonedContainer.querySelectorAll<HTMLImageElement>("img")
          );

          await Promise.all(
            imgs.map(async (img) => {
              const src = img.getAttribute("src") || "";

              if (isExternalUrl(src)) {
                // Reemplazar con data:URL del proxy para evitar canvas taint
                try {
                  const dataUrl = await toDataURLViaProxy(src);
                  img.src = dataUrl;
                  // Esperar a que cargue el nuevo src
                  await new Promise<void>((resolve) => {
                    if (img.complete && img.naturalWidth > 0) {
                      resolve();
                    } else {
                      img.onload = () => resolve();
                      img.onerror = () => resolve(); // continúa aunque falle
                    }
                  });
                } catch {
                  // Si el proxy falla, ocultar la imagen para no bloquear el PDF
                  img.style.visibility = "hidden";
                }
              } else {
                // Imagen local o data: → solo esperar que esté cargada
                await new Promise<void>((resolve) => {
                  if (img.complete && img.naturalWidth > 0) {
                    resolve();
                  } else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                  }
                });
              }
            })
          );
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      // ── Generar PDF A4 ───────────────────────────────────────────────────
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      const pdfWidth  = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Usar las dimensiones del canvas para calcular el aspect ratio
      // (evita getImageProperties que cambió en jsPDF 3.x)
      const aspectRatio = canvas.height / canvas.width;

      const margin       = 28; // mm de margen a cada lado
      const maxImgWidth  = pdfWidth - margin * 2;
      const maxImgHeight = pdfHeight - margin * 2;

      let renderWidth  = maxImgWidth;
      let renderHeight = renderWidth * aspectRatio;

      if (renderHeight > maxImgHeight) {
        renderHeight = maxImgHeight;
        renderWidth  = renderHeight / aspectRatio;
      }

      // Centrar en la página
      const x = (pdfWidth - renderWidth) / 2;
      const y = (pdfHeight - renderHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, renderWidth, renderHeight);
      pdf.save(`menu-qr-${storeProfile.basicInfo.slug}.pdf`);
    } catch (error) {
      console.error("[QRPDFService] Error generando PDF:", error);
      throw new Error("No se pudo generar el PDF. Intentá de nuevo.");
    }
  }
}
