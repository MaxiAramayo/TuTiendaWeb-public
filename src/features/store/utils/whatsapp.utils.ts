/**
 * Utilidades compartidas para formateo de mensajes y números de WhatsApp.
 * Usadas tanto en Server Actions como en componentes cliente.
 *
 * @module features/store/utils/whatsapp.utils
 */

import type { ProductInCart } from "@/shared/types/store";

export function formatWhatsAppMessage({
  customerName,
  storeName,
  items,
  total,
  deliveryFee,
  deliveryMethod,
  address,
  paymentMethod,
  notes,
}: {
  customerName: string;
  storeName: string;
  items: ProductInCart[];
  total: number;
  deliveryFee: number;
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
    const itemTotal = item.price * item.cantidad;
    message += `> ${item.cantidad}x ${item.name} - $${itemTotal}\n`;

    if (item.topics && item.topics.length > 0) {
      item.topics.forEach((topic) => {
        message += `   + ${topic.name} (+$${topic.price})\n`;
      });
    }
  });

  message += `------------------------\n`;
  message += `*Subtotal:* $${total - deliveryFee}\n`;

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

export function buildWhatsAppUrl(phone: string, message: string): string {
  const number = formatWhatsAppNumber(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
