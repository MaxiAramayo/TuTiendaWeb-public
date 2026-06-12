/**
 * Server Actions para Checkout
 *
 * Mutaciones del proceso de checkout ejecutadas en el servidor
 *
 * @module features/store/actions/checkout.actions
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { checkoutFormSchema, publicCheckoutItemSchema, type CheckoutFormData, type PublicCheckoutItem } from '../schemas/checkout.schema';
import { getPublicStoreById } from '../services/public-store.service';
import { buildTrustedSale, CheckoutValidationError } from '../services/checkout.service';
import { createPublicSaleAction } from '@/features/dashboard/modules/sells/actions/sale.actions';
import { formatWhatsAppMessageFromSale, formatWhatsAppNumber } from '../utils/whatsapp.utils';

// ============================================================================
// TYPES
// ============================================================================

type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  whatsappMessage: string;
  whatsappNumber: string;
  storeName: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface ProcessCheckoutInput {
  storeId: string;
  formData: CheckoutFormData;
  /**
   * Items del carrito en forma MÍNIMA: solo producto, cantidad y variantes
   * elegidas. Sin precios — el servidor los recalcula (ver checkout.service).
   */
  items: PublicCheckoutItem[];
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Procesa el checkout, recalcula precios/envío en el servidor, guarda la venta
 * y devuelve el mensaje de WhatsApp ya formateado a partir de ese cálculo.
 *
 * SEGURIDAD (H-1): nunca confía en precios ni totales del cliente. Solo acepta
 * qué productos y cantidades pidió, y reconstruye la venta con datos reales de
 * Firestore.
 *
 * @param input - Datos del checkout (formulario + items mínimos)
 * @returns Resultado con datos de la orden y mensaje de WhatsApp, o errores
 */
export async function processCheckoutAction(
  input: ProcessCheckoutInput
): Promise<ActionResponse<CheckoutResult>> {
  try {
    const { storeId } = input;

    // 1. VALIDATE FORM DATA
    const formValidation = checkoutFormSchema.safeParse(input.formData);
    if (!formValidation.success) {
      return {
        success: false,
        errors: formValidation.error.flatten().fieldErrors as Record<string, string[]>
      };
    }

    // 2. VALIDATE ITEMS (estructura mínima, sin precios)
    const itemsValidation = z
      .array(publicCheckoutItemSchema)
      .min(1, 'El carrito está vacío')
      .safeParse(input.items);
    if (!itemsValidation.success) {
      return { success: false, errors: { _form: ['El carrito es inválido o está vacío'] } };
    }

    // 3. GET STORE DATA (también verifica que esté activa)
    const store = await getPublicStoreById(storeId);
    if (!store) {
      return { success: false, errors: { _form: ['La tienda no está disponible'] } };
    }

    // 4. BUILD TRUSTED SALE (recalcula precios + envío en el servidor)
    let built;
    try {
      built = await buildTrustedSale({
        storeId,
        customerName: formValidation.data.nombre,
        deliveryMethodId: formValidation.data.formaDeConsumir,
        paymentMethodId: formValidation.data.formaDePago,
        address: formValidation.data.direccion,
        notes: formValidation.data.aclaracion,
        items: itemsValidation.data
      });
    } catch (error) {
      if (error instanceof CheckoutValidationError) {
        return { success: false, errors: { _form: [error.message] } };
      }
      throw error;
    }

    // 5. CREATE SALE (con datos ya confiables)
    const saleResult = await createPublicSaleAction(storeId, built.saleData);
    if (!saleResult.success) {
      return {
        success: false,
        errors: saleResult.errors || { _form: ['Error al crear la orden'] }
      };
    }

    // 6. FORMAT WHATSAPP MESSAGE desde el cálculo del servidor (lo más importante)
    // Soportar ambas estructuras: nueva (contactInfo.whatsapp) y legacy (whatsapp)
    const storeName = store.basicInfo?.name || store.name || 'Mi Tienda';
    const whatsapp = store.contactInfo?.whatsapp || store.whatsapp || '';

    const whatsappMessage = formatWhatsAppMessageFromSale({
      customerName: built.saleData.customer.name,
      storeName,
      items: built.saleData.items,
      subtotal: built.subtotal,
      deliveryFee: built.deliveryFee,
      total: built.total,
      deliveryMethod: built.saleData.delivery.method,
      address: built.saleData.delivery.address,
      paymentMethod: formValidation.data.formaDePago,
      notes: built.saleData.notes
    });

    const whatsappNumber = formatWhatsAppNumber(whatsapp);

    // 7. REVALIDATE - soportar ambas estructuras
    const storeSlug = store.basicInfo?.slug || store.siteName;
    revalidatePath(`/${storeSlug}`);

    return {
      success: true,
      data: {
        orderId: saleResult.data.id,
        orderNumber: built.saleData.orderNumber,
        whatsappMessage,
        whatsappNumber,
        storeName,
        subtotal: built.subtotal,
        deliveryFee: built.deliveryFee,
        total: built.total
      }
    };

  } catch (error) {
    console.error('[CheckoutAction] Error processing checkout:', error);
    return {
      success: false,
      errors: { _form: ['Error al procesar el pedido'] }
    };
  }
}

/**
 * Valida los datos del formulario de checkout
 *
 * @param formData - Datos del formulario
 * @returns Resultado de validación
 */
export async function validateCheckoutFormAction(
  formData: unknown
): Promise<ActionResponse<CheckoutFormData>> {
  const validation = checkoutFormSchema.safeParse(formData);

  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  return {
    success: true,
    data: validation.data
  };
}
