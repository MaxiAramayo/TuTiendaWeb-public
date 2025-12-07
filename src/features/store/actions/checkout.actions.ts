/**
 * Server Actions para Checkout
 * 
 * Mutaciones del proceso de checkout ejecutadas en el servidor
 * 
 * @module features/store/actions/checkout.actions
 */
'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { checkoutFormSchema, createOrderSchema, type CheckoutFormData, type CreateOrderData } from '../schemas/checkout.schema';
import { getPublicStoreById, getStoreSettings } from '../services/public-store.service';
import { createPublicSaleAction } from '@/features/dashboard/modules/sells/actions/sale.actions';
import type { CreateSaleData, SaleItem } from '@/features/dashboard/modules/sells/schemas/sell.schema';
import type { ProductInCart } from '@/shared/types/store';

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
}

export interface ProcessCheckoutInput {
  storeId: string;
  formData: CheckoutFormData;
  cartItems: ProductInCart[];
  subtotal: number;
  deliveryFee: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formatea el mensaje para WhatsApp
 */
function formatWhatsAppMessage({
  customerName,
  storeName,
  items,
  total,
  deliveryFee,
  deliveryMethod,
  address,
  paymentMethod,
  notes
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
  let message = `🛒 *NUEVO PEDIDO - ${storeName}*\n\n`;
  message += `👤 *Cliente:* ${customerName}\n`;
  message += `📦 *Entrega:* ${deliveryMethod === 'delivery' ? 'Delivery' : 'Retiro en local'}\n`;
  
  if (deliveryMethod === 'delivery' && address) {
    message += `📍 *Dirección:* ${address}\n`;
  }
  
  message += `💳 *Pago:* ${paymentMethod}\n\n`;
  message += `*PRODUCTOS:*\n`;
  message += `─────────────\n`;
  
  items.forEach(item => {
    const itemTotal = item.price * item.cantidad;
    message += `• ${item.name} x${item.cantidad} - $${itemTotal}\n`;
    
    if (item.topics && item.topics.length > 0) {
      item.topics.forEach(topic => {
        message += `  ↳ ${topic.name} (+$${topic.price})\n`;
      });
    }
  });
  
  message += `─────────────\n`;
  message += `*Subtotal:* $${total - deliveryFee}\n`;
  
  if (deliveryFee > 0) {
    message += `*Envío:* $${deliveryFee}\n`;
  }
  
  message += `*TOTAL:* $${total}\n`;
  
  if (notes) {
    message += `\n📝 *Notas:* ${notes}`;
  }
  
  return message;
}

/**
 * Formatea número de WhatsApp para enlaces internacionales
 */
function formatWhatsAppNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '');
  
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith('54')) {
    cleaned = `54${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Convierte items del carrito a items de venta
 */
function cartToSaleItems(cartItems: ProductInCart[]): SaleItem[] {
  return cartItems.map(item => ({
    id: item.id,
    productId: item.idProduct,
    productName: item.name,
    categoryId: item.category || '',
    quantity: item.cantidad,
    unitPrice: item.price,
    subtotal: (item.price + (item.topics?.reduce((s, t) => s + t.price, 0) || 0)) * item.cantidad,
    variants: item.topics?.map(topic => ({
      id: topic.id,
      name: topic.name,
      price: topic.price
    })) || [],
    notes: item.aclaracion || ''
  }));
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Procesa el checkout y crea la orden
 * 
 * @param input - Datos del checkout
 * @returns Resultado con datos de la orden o errores
 */
export async function processCheckoutAction(
  input: ProcessCheckoutInput
): Promise<ActionResponse<CheckoutResult>> {
  try {
    const { storeId, formData, cartItems, subtotal, deliveryFee } = input;

    // 1. VALIDATE FORM DATA
    const formValidation = checkoutFormSchema.safeParse(formData);
    if (!formValidation.success) {
      return { 
        success: false, 
        errors: formValidation.error.flatten().fieldErrors as Record<string, string[]>
      };
    }

    // 2. VALIDATE CART
    if (!cartItems || cartItems.length === 0) {
      return { 
        success: false, 
        errors: { _form: ['El carrito está vacío'] } 
      };
    }

    // 3. GET STORE DATA
    const store = await getPublicStoreById(storeId);
    if (!store) {
      return { 
        success: false, 
        errors: { _form: ['Tienda no encontrada'] } 
      };
    }

    // 4. GENERATE ORDER ID
    const orderId = nanoid(6);
    const orderNumber = `ORD-${orderId}`;
    const total = subtotal + deliveryFee;

    // 5. PREPARE SALE DATA
    const saleData: CreateSaleData = {
      orderNumber,
      storeId,
      source: 'web',
      customer: {
        name: formValidation.data.nombre,
        phone: '',
      },
      items: cartToSaleItems(cartItems),
      delivery: {
        method: formValidation.data.formaDeConsumir === 'delivery' ? 'delivery' : 'retiro',
        address: formValidation.data.direccion || '',
        notes: '',
      },
      payment: {
        method: formValidation.data.formaDePago,
        total,
      },
      totals: {
        subtotal,
        discount: 0,
        total,
      },
      notes: formValidation.data.aclaracion || '',
    };

    // 6. CREATE SALE
    const saleResult = await createPublicSaleAction(storeId, saleData);
    
    if (!saleResult.success) {
      return { 
        success: false, 
        errors: saleResult.errors || { _form: ['Error al crear la orden'] }
      };
    }

    // 7. PREPARE WHATSAPP DATA
    // Soportar ambas estructuras: nueva (contactInfo.whatsapp) y legacy (whatsapp)
    const storeName = store.basicInfo?.name || store.name || 'Mi Tienda';
    const whatsapp = store.contactInfo?.whatsapp || store.whatsapp || '';
    
    const whatsappMessage = formatWhatsAppMessage({
      customerName: formValidation.data.nombre,
      storeName,
      items: cartItems,
      total,
      deliveryFee,
      deliveryMethod: formValidation.data.formaDeConsumir,
      address: formValidation.data.direccion,
      paymentMethod: formValidation.data.formaDePago,
      notes: formValidation.data.aclaracion
    });

    const whatsappNumber = formatWhatsAppNumber(whatsapp);

    // 8. REVALIDATE - soportar ambas estructuras
    const storeSlug = store.basicInfo?.slug || store.siteName;
    revalidatePath(`/${storeSlug}`);

    return {
      success: true,
      data: {
        orderId,
        orderNumber,
        whatsappMessage,
        whatsappNumber,
        storeName
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
