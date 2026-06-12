/**
 * Utilidades compartidas para formateo de mensajes y números de WhatsApp.
 * Usadas tanto en Server Actions como en componentes cliente.
 *
 * @module features/store/utils/whatsapp.utils
 */

/**
 * Item confiable para el mensaje de WhatsApp (forma del SaleItem ya recalculado
 * en el servidor). Se tipa de forma mínima para no acoplar este util al schema
 * de ventas.
 */
interface TrustedMessageItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  variants?: Array<{ name: string; price: number }>;
}

/**
 * Formatea el mensaje de WhatsApp a partir de la venta YA recalculada en el
 * servidor. Esta es la versión confiable: subtotal, envío y total provienen del
 * cálculo del servidor, no del carrito del cliente.
 *
 * Mantiene el mismo formato visual que veía el comercio antes del fix de H-1.
 */
export function formatWhatsAppMessageFromSale({
  customerName,
  storeName,
  items,
  subtotal,
  deliveryFee,
  total,
  deliveryMethod,
  address,
  paymentMethod,
  notes,
}: {
  customerName: string;
  storeName: string;
  items: TrustedMessageItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: string;
  address?: string;
  paymentMethod: string;
  notes?: string;
}): string {
  let message = `*NUEVO PEDIDO - ${storeName}*\n\n`;
  message += `*Cliente:* ${customerName}\n`;
  message += `*Entrega:* ${deliveryMethod === "delivery" ? "Delivery" : "Retiro en local"}\n`;

  if (deliveryMethod === "delivery" && address) {
    message += `*Dirección:* ${address}\n`;
  }

  message += `*Pago:* ${paymentMethod}\n\n`;
  message += `*PRODUCTOS:*\n`;
  message += `------------------------\n`;

  items.forEach((item) => {
    const itemTotal = item.unitPrice * item.quantity;
    message += `> ${item.quantity}x ${item.productName} - $${itemTotal}\n`;

    if (item.variants && item.variants.length > 0) {
      item.variants.forEach((variant) => {
        message += `   + ${variant.name} (+$${variant.price})\n`;
      });
    }
  });

  message += `------------------------\n`;
  message += `*Subtotal:* $${subtotal}\n`;

  if (deliveryFee > 0) {
    message += `*Envío:* $${deliveryFee}\n`;
  }

  message += `*TOTAL:* $${total}\n`;

  if (notes) {
    message += `\n*Notas:* ${notes}`;
  }

  return message;
}

export function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "");

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith("54")) {
    cleaned = `54${cleaned}`;
  }

  return cleaned;
}
