/**
 * Placeholders contextuales según el tipo de tienda
 *
 * Los textos de "notas/aclaraciones" del catálogo público estaban pensados
 * solo para restaurantes (ej. "Sin cebolla"). Estos helpers devuelven un
 * placeholder acorde al tipo de tienda: caso especial para restaurantes y
 * un texto neutro para el resto de los rubros.
 *
 * @module features/store/utils/store-placeholders
 */

/** Placeholder para las notas de un producto (modal de producto). */
export function getProductNotesPlaceholder(storeType?: string): string {
  if (storeType === 'restaurant') {
    return 'Ej: Sin cebolla, bien cocido, sin sal…';
  }
  return 'Ej: detalles o preferencias para este producto';
}

/** Placeholder para las notas adicionales del checkout. */
export function getCheckoutNotesPlaceholder(storeType?: string): string {
  if (storeType === 'restaurant') {
    return 'Preferencias, alergias, instrucciones especiales…';
  }
  return 'Comentarios o instrucciones para tu pedido…';
}
