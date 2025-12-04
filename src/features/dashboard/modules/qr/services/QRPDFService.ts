/**
 * Servicio para generar PDFs con códigos QR
 * Dibuja todo el diseño de la card QR, adaptando altura al contenido
 * y eliminando cualquier tipo `any`.
 *
 * @module features/dashboard/modules/qr/services
 */
import jsPDF from 'jspdf'
import { StoreProfile } from '@/features/dashboard/modules/store-settings/types/store.type'

// --- Tipos auxiliares ---
type RGB = [number, number, number]
interface InfoItem { text: string; isURL: boolean }

// --- Colores tipados como tupla para evitar TS2556 ---
const COLORS: Record<'cardBg'|'badgeBg'|'boxBg'|'text', RGB> = {
  cardBg:  [30, 41, 59],   // slate‑800
  badgeBg: [71, 85, 105],  // slate‑600
  boxBg:   [51, 65, 85],   // slate‑700
  text:    [255, 255, 255] // blanco
}

// --- Espaciados y tamaños fijos de layout (no la altura total) ---
const S = {
  cardWidth:       120,
  marginTop:       30,
  sidePadding:     12.5,
  cardRadius:      12,
  titleFont:       20,
  titleLineH:      7,
  gapBeforeTitle:  20,
  badgeFont:       10,
  badgeHeight:     12,
  badgeRadius:     6,
  gapTitleBadge:   10,
  qrSize:          45,
  qrPadding:       4,
  qrRadius:        8,
  gapBadgeQR:      10,
  gapAfterQR:      15,
  boxFont:         9,
  urlFont:         8,
  boxLineH:        4,
  boxVPadding:     8,
  boxRadius:       4,
  gapBetweenBoxes: 5,
  bottomMargin:    15
}

export class QRPDFService {
  /**
   * Genera PDF usando datos del perfil de la tienda
   */
  static async generatePDFFromStore(storeProfile: StoreProfile): Promise<void> {
    if (!storeProfile.basicInfo?.name || !storeProfile.basicInfo?.slug) {
      throw new Error('Datos del perfil de tienda incompletos')
    }

    // 1) Obtener el QR desde el canvas
    const canvasEl = document.getElementById('qr-code')
    if (!(canvasEl instanceof HTMLCanvasElement)) {
      throw new Error('Canvas QR no encontrado o inválido')
    }
    const qrDataURL = canvasEl.toDataURL('image/png', 1.0)

    // 2) Inicializar jsPDF
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pageW = pdf.internal.pageSize.getWidth()
    const cardX = (pageW - S.cardWidth) / 2
    const cardY = S.marginTop

    // 3) Preparar los textos dinámicos
    const items: InfoItem[] = []
    if (storeProfile.contactInfo?.whatsapp) {
      items.push({ text: `WhatsApp: ${storeProfile.contactInfo.whatsapp}`, isURL: false })
    }
    if (storeProfile.basicInfo.description) {
      items.push({ text: storeProfile.basicInfo.description, isURL: false })
    }
    // URL siempre va al final
    items.push({ text: `https://tutiendaweb.com.ar/${storeProfile.basicInfo.slug}`, isURL: true })

    // 4) Medir título (cast a string[] para tipar correctamente)
    pdf.setFont('helvetica', 'bold').setFontSize(S.titleFont)
    const titleLines: string[] =
      (pdf.splitTextToSize(storeProfile.basicInfo.name, S.cardWidth - 2 * S.sidePadding) as string[])
    const titleH = titleLines.length * S.titleLineH

    // 5) Medir cada caja de info
    const boxHeights: number[] = items.map((item: InfoItem) => {
      pdf.setFont(item.isURL ? 'courier' : 'helvetica', 'normal')
      pdf.setFontSize(item.isURL ? S.urlFont : S.boxFont)
      const maxW = S.cardWidth - 2 * S.sidePadding
      const lines: string[] = (pdf.splitTextToSize(item.text, maxW) as string[])
      return Math.max(12, lines.length * S.boxLineH + S.boxVPadding)
    })

    // 6) Calcular altura total de la card (¡sin mínimo fijo!)
    const hTitleBlock = S.gapBeforeTitle + titleH + S.gapTitleBadge + S.badgeHeight + S.gapBadgeQR
    const hQRBlock    = S.qrSize + 2 * S.qrPadding + S.gapAfterQR
    const hBoxes      = boxHeights.reduce((a, b) => a + b, 0) + boxHeights.length * S.gapBetweenBoxes
    const cardH       = hTitleBlock + hQRBlock + hBoxes + S.bottomMargin

    // 7) Dibujar fondo de la card
    pdf.setFillColor(...COLORS.cardBg)
    pdf.roundedRect(cardX, cardY, S.cardWidth, cardH, S.cardRadius, S.cardRadius, 'F')

    // 8) Pintar título
    pdf.setTextColor(...COLORS.text)
    pdf.setFont('helvetica','bold').setFontSize(S.titleFont)
    let cursorY = cardY + S.gapBeforeTitle
    for (const line of titleLines) {
      const w = pdf.getTextWidth(line)
      pdf.text(line, cardX + (S.cardWidth - w) / 2, cursorY)
      cursorY += S.titleLineH
    }

    // 9) Badge "Menú Digital"
    pdf.setFont('helvetica','normal').setFontSize(S.badgeFont)
    const badgeText = 'Menú Digital'
    const btW = pdf.getTextWidth(badgeText)
    const badgeW = btW + 20
    const badgeX = cardX + (S.cardWidth - badgeW) / 2
    const badgeY = cursorY + S.gapTitleBadge
    pdf.setFillColor(...COLORS.badgeBg)
    pdf.roundedRect(badgeX, badgeY, badgeW, S.badgeHeight, S.badgeRadius, S.badgeRadius, 'F')
    pdf.setTextColor(...COLORS.text)
    pdf.text(badgeText, badgeX + (badgeW - btW) / 2, badgeY + 8)

    // 10) Contenedor y código QR
    const qrX = cardX + (S.cardWidth - (S.qrSize + 2*S.qrPadding)) / 2
    const qrY = badgeY + S.badgeHeight + S.gapBadgeQR
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(qrX, qrY, S.qrSize + 2*S.qrPadding, S.qrSize + 2*S.qrPadding, S.qrRadius, S.qrRadius, 'F')
    pdf.addImage(qrDataURL, 'PNG', qrX + S.qrPadding, qrY + S.qrPadding, S.qrSize, S.qrSize)

    // 11) Dibujar cajas de información (sin iconos), con tipado en cada ciclo
    let infoY = qrY + S.qrSize + 2*S.qrPadding + S.gapAfterQR
    items.forEach((item: InfoItem, idx: number) => {
      const hBox = boxHeights[idx]
      pdf.setFillColor(...COLORS.boxBg)
      pdf.roundedRect(cardX + S.sidePadding, infoY, S.cardWidth - 2*S.sidePadding, hBox, S.boxRadius, S.boxRadius, 'F')

      pdf.setTextColor(...COLORS.text)
      pdf.setFont(item.isURL ? 'courier' : 'helvetica','normal')
      pdf.setFontSize(item.isURL ? S.urlFont : S.boxFont)

      const lines: string[] = (pdf.splitTextToSize(item.text, S.cardWidth - 2*S.sidePadding) as string[])
      let ty = infoY + 6
      lines.forEach((line: string) => {
        const lw = pdf.getTextWidth(line)
        const tx = cardX + S.sidePadding + (S.cardWidth - 2*S.sidePadding - lw)/2
        pdf.text(line, tx, ty)
        ty += S.boxLineH
      })

      infoY += hBox + S.gapBetweenBoxes
    })

    // 12) Guardar el PDF
    const fileName = `qr-${storeProfile.basicInfo.slug}.pdf`
    pdf.save(fileName)
  }
}
