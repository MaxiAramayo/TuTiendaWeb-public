/**
 * Server Actions para el módulo de ventas
 * 
 * @module features/dashboard/modules/sells/actions/sale.actions
 */

'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from '@/lib/auth/server-session';
import { 
  createSaleSchema,
  updateSaleSchema,
  type ActionResponse, 
  type Sale, 
  type CreateSaleData,
  type UpdateSaleData,
  type SalesFilter,
  type SalesStats 
} from '../schemas/sell.schema';
import { 
  createSale, 
  updateSale, 
  deleteSale, 
  getSales,
  getSaleById,
  calculateSalesStats 
} from '../services/sale.service';

// =============================================================================
// READ ACTIONS
// =============================================================================

/**
 * Obtiene todas las ventas con filtros opcionales
 */
export async function getSalesAction(
  filters?: SalesFilter
): Promise<ActionResponse<{ sales: Sale[]; stats: SalesStats }>> {
  const session = await getServerSession();
  if (!session?.storeId) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }

  try {
    const sales = await getSales(session.storeId, filters);
    const stats = await calculateSalesStats(session.storeId);
    
    return { success: true, data: { sales, stats } };
  } catch (error) {
    console.error('Error fetching sales:', error);
    return { success: false, errors: { _form: ['Error al obtener ventas'] } };
  }
}

/**
 * Obtiene una venta por ID
 */
export async function getSaleByIdAction(
  saleId: string
): Promise<ActionResponse<{ sale: Sale }>> {
  const session = await getServerSession();
  if (!session?.storeId) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }

  try {
    const sale = await getSaleById(session.storeId, saleId);
    if (!sale) {
      return { success: false, errors: { _form: ['Venta no encontrada'] } };
    }
    return { success: true, data: { sale } };
  } catch (error) {
    console.error('Error fetching sale:', error);
    return { success: false, errors: { _form: ['Error al obtener venta'] } };
  }
}

// =============================================================================
// CREATE ACTIONS
// =============================================================================

/**
 * Crea una nueva venta
 */
export async function createSaleAction(
  data: CreateSaleData
): Promise<ActionResponse<{ id: string; sale: Sale }>> {
  const session = await getServerSession();
  if (!session?.storeId) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }

  // Validar datos
  const validation = createSaleSchema.safeParse(data);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const formattedErrors: Record<string, string[]> = {};
    Object.entries(fieldErrors).forEach(([key, value]) => {
      formattedErrors[key] = value as string[];
    });
    return { success: false, errors: formattedErrors };
  }

  try {
    const sale = await createSale(validation.data, session.storeId);
    revalidatePath('/dashboard/sells');
    return { success: true, data: { id: sale.id, sale } };
  } catch (error) {
    console.error('Error creating sale:', error);
    return { success: false, errors: { _form: ['Error al crear venta'] } };
  }
}

// =============================================================================
// UPDATE ACTIONS
// =============================================================================

/**
 * Actualiza una venta existente
 */
export async function updateSaleAction(
  saleId: string,
  data: UpdateSaleData
): Promise<ActionResponse<{ sale: Sale }>> {
  const session = await getServerSession();
  if (!session?.storeId) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }

  // Validar datos
  const validation = updateSaleSchema.safeParse(data);
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const formattedErrors: Record<string, string[]> = {};
    Object.entries(fieldErrors).forEach(([key, value]) => {
      formattedErrors[key] = value as string[];
    });
    return { success: false, errors: formattedErrors };
  }

  try {
    const sale = await updateSale(saleId, validation.data, session.storeId);
    revalidatePath('/dashboard/sells');
    return { success: true, data: { sale } };
  } catch (error) {
    console.error('Error updating sale:', error);
    return { success: false, errors: { _form: ['Error al actualizar venta'] } };
  }
}

// =============================================================================
// DELETE ACTIONS
// =============================================================================

/**
 * Elimina una venta
 */
export async function deleteSaleAction(
  saleId: string
): Promise<ActionResponse<{ success: boolean }>> {
  const session = await getServerSession();
  if (!session?.storeId) {
    return { success: false, errors: { _form: ['No autenticado'] } };
  }

  try {
    await deleteSale(saleId, session.storeId);
    revalidatePath('/dashboard/sells');
    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Error deleting sale:', error);
    return { success: false, errors: { _form: ['Error al eliminar venta'] } };
  }
}

// =============================================================================
// PUBLIC ACTIONS (para checkout sin autenticación)
// =============================================================================

/**
 * Crea una venta pública desde el checkout (sin requerir autenticación)
 */
export async function createPublicSaleAction(
  storeId: string,
  data: CreateSaleData
): Promise<ActionResponse<{ id: string; sale: Sale }>> {
  if (!storeId) {
    return { success: false, errors: { _form: ['Store ID requerido'] } };
  }

  try {
    const sale = await createSale(data, storeId);
    return { success: true, data: { id: sale.id, sale } };
  } catch (error) {
    console.error('Error creating public sale:', error);
    return { success: false, errors: { _form: ['Error al crear venta'] } };
  }
}
