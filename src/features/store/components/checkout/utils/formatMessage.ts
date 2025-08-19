/**
 * Utilidad para formatear el mensaje de WhatsApp con los detalles del pedido
 * 
 * @module features/store/components/checkout/utils
 */

import { ProductInCart } from "@/shared/types/store";

type MessageData = {
  nombre: string;
  Name: string;
  carrito: ProductInCart[];
  total: number;
  formaDeConsumir: string;
  direccion?: string;
  formaDePago: string;
  aclaracion?: string;
  deliveryPrice?: number;
};

/**
 * Formatea los datos del pedido en un mensaje estructurado para WhatsApp
 * 
 * @param data - Datos del pedido y cliente
 * @returns Mensaje formateado para WhatsApp
 */
export const formatMessage = ({
  nombre,
  Name,
  carrito,
  total,
  formaDeConsumir,
  direccion,
  formaDePago,
  aclaracion,
  deliveryPrice = 0,
}: MessageData): string => {
  let mensaje = `
*¡Hola Tienda: ${Name}!*
*Nombre:* ${nombre}`;
  
  mensaje += `
*Pedido:*`;
  
  mensaje += carrito
    .map((item) => {
      let topicsMessage = "";
      if (item.topics && item.topics.length > 0) {
        topicsMessage = "\nExtras";
        item.topics.forEach((topic) => {
          topicsMessage += `\n${topic.name} ($${topic.price}) `;
        });
      }
      return `
*-${item.name}* (${item.cantidad}) - 💲${item.price}${topicsMessage}${item.aclaracion ? `
Aclaración: (${item.aclaracion})` : ''}`;
    })
    .join("");

  if (formaDeConsumir === "delivery") {
    mensaje += `
*Envío:* Por Delivery
`;
  } else if (formaDeConsumir === "take") {
    mensaje += `
*Envío:* Retira en Restaurante`;
  }
  
  if (formaDeConsumir === "delivery") {
    mensaje += `
*Dirección:* ${direccion}`;
  }

  if (aclaracion) {
    mensaje += `
*Aclaración del pedido:* ${aclaracion}`;
  }

  const subtotal = total - deliveryPrice;
  if (deliveryPrice > 0) {
    mensaje += `
*Subtotal:* 💲${subtotal}
*Envío:* 💲${deliveryPrice}`;
  }

  mensaje += `
*Pago:* ${formaDePago}
*Precio Total:* 💲${total}`;

  return mensaje;
};