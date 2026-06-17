/**
 * Checkout Service - Reconstrucción segura de la venta en el servidor
 *
 * ⚠️  SOLO USO EN SERVIDOR (Server Actions). Usa Firebase Admin SDK.
 *
 * El objetivo de este módulo es la regla de oro del checkout público:
 *   "El cliente solo dice QUÉ quiere y CUÁNTO. El servidor decide CUÁNTO CUESTA."
 *
 * `buildTrustedSale` ignora cualquier precio/subtotal/total que venga del
 * navegador y los recalcula leyendo los productos reales de Firestore y el costo
 * de envío real de la configuración de la tienda. Sobre ese cálculo confiable se
 * arma tanto la venta a guardar como el mensaje de WhatsApp.
 *
 * @module features/store/services/checkout.service
 */

import { nanoid } from 'nanoid';
import { getProductById } from '@/features/products/services/product.service';
import { getStoreSettings } from './public-store.service';
import type { CreateSaleData, SaleItem } from '@/features/dashboard/modules/sells/schemas/sell.schema';
import type { PublicCheckoutItem } from '../schemas/checkout.schema';

/**
 * Error de validación de negocio del checkout (producto inexistente, variante
 * inválida, método no disponible, etc.). El action lo traduce a un error de
 * formulario para el cliente.
 */
export class CheckoutValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutValidationError';
  }
}

export interface BuildTrustedSaleInput {
  storeId: string;
  customerName: string;
  /** id del método de entrega elegido (formaDeConsumir) */
  deliveryMethodId: string;
  /** id del método de pago elegido (formaDePago) */
  paymentMethodId: string;
  address?: string;
  notes?: string;
  /** items mínimos validados (sin precios) */
  items: PublicCheckoutItem[];
}

export interface BuildTrustedSaleResult {
  saleData: CreateSaleData;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethodName: string;
  paymentMethodName: string;
}

/**
 * Reconstruye una venta confiable a partir de la intención del cliente.
 *
 * - Verifica que cada producto exista y esté activo en ESTA tienda.
 * - Resuelve las variantes contra las reales del producto (precio del servidor).
 * - Recalcula unitPrice, subtotal por item, subtotal general y total.
 * - Resuelve el costo de envío desde `settings.deliveryMethods` (no del cliente).
 * - Valida que los métodos de pago y entrega estén habilitados.
 *
 * @throws {CheckoutValidationError} si algún dato no es válido.
 */
export async function buildTrustedSale(
  input: BuildTrustedSaleInput
): Promise<BuildTrustedSaleResult> {
  const settings = await getStoreSettings(input.storeId);

  // 1. Método de pago: debe existir y estar habilitado en la tienda
  const paymentMethod = settings.paymentMethods.find(
    m => m.id === input.paymentMethodId && m.enabled
  );
  if (!paymentMethod) {
    throw new CheckoutValidationError('El método de pago seleccionado no está disponible');
  }

  // 2. Método de entrega: debe existir y estar habilitado; el costo sale de acá
  const deliveryMethod = settings.deliveryMethods.find(
    m => m.id === input.deliveryMethodId && m.enabled
  );
  if (!deliveryMethod) {
    throw new CheckoutValidationError('El método de entrega seleccionado no está disponible');
  }

  const deliveryFee = deliveryMethod.price ?? 0;
  const isDelivery =
    input.deliveryMethodId === 'delivery' || (deliveryMethod as { type?: string }).type === 'delivery';

  if (isDelivery && !input.address?.trim()) {
    throw new CheckoutValidationError('La dirección es obligatoria para delivery');
  }

  // 3. Reconstruir cada item con datos reales del producto
  const items: SaleItem[] = [];

  for (const reqItem of input.items) {
    const product = await getProductById(reqItem.productId, input.storeId);

    if (!product) {
      throw new CheckoutValidationError('Uno de los productos del pedido ya no existe');
    }
    if (product.status !== 'active') {
      throw new CheckoutValidationError(`"${product.name}" no está disponible en este momento`);
    }

    // Variantes: solo IDs que correspondan a una variante real y disponible
    const realVariants = (reqItem.variantIds ?? []).map(variantId => {
      const variant = product.variants?.find(v => v.id === variantId && v.isAvailable);
      if (!variant) {
        throw new CheckoutValidationError(`Una de las opciones de "${product.name}" no está disponible`);
      }
      return { id: variant.id, name: variant.name, price: variant.price };
    });

    const variantsTotal = realVariants.reduce((sum, v) => sum + v.price, 0);
    const subtotal = (product.price + variantsTotal) * reqItem.quantity;

    items.push({
      id: nanoid(8),
      productId: product.id,
      productName: product.name,        // snapshot desde el servidor
      categoryId: product.categoryId || '',
      quantity: reqItem.quantity,
      unitPrice: product.price,         // precio real
      subtotal,                         // recalculado
      variants: realVariants,
      notes: reqItem.notes?.slice(0, 500) || ''
    });
  }

  // 4. Totales calculados desde items ya verificados
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal + deliveryFee;

  const saleData: CreateSaleData = {
    orderNumber: `ORD-${nanoid(6)}`,
    storeId: input.storeId,
    source: 'web',
    customer: {
      name: input.customerName,
      phone: ''
    },
    items,
    delivery: {
      method: isDelivery ? 'delivery' : 'retiro',
      address: input.address?.trim() || '',
      notes: ''
    },
    payment: {
      method: input.paymentMethodId as CreateSaleData['payment']['method'],
      total
    },
    totals: {
      subtotal,
      discount: 0,
      deliveryFee,
      total
    },
    notes: input.notes?.slice(0, 1000) || ''
  };

  return {
    saleData,
    subtotal,
    deliveryFee,
    total,
    deliveryMethodName: deliveryMethod.name,
    paymentMethodName: paymentMethod.name
  };
}
