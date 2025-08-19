/**
 * Utilidades para el manejo del carrito de compras
 * 
 * @module features/store/components/cart
 */
import { ProductInCart } from '@/shared/types/store';

/**
 * Modifica la cantidad de un producto en el carrito.
 * 
 * @param {string} id - ID del producto a modificar
 * @param {"increase" | "decrease"} action - Acción a realizar
 * @param {ProductInCart[]} carrito - Array de productos en el carrito
 * @returns {ProductInCart[]} Nuevo array de productos actualizado
 */
export function editarCantidadCart(
  id: string,
  action: "increase" | "decrease",
  carrito: ProductInCart[]
): ProductInCart[] {
  return carrito.map(producto => {
    if (producto.id !== id) return producto;
    
    const nuevaCantidad = action === "increase" 
      ? producto.cantidad + 1 
      : producto.cantidad - 1;

    // Si la cantidad llega a 0, retornamos null para que el filtro lo elimine
    if (nuevaCantidad <= 0) return null;

    return { ...producto, cantidad: nuevaCantidad };
  }).filter((producto): producto is ProductInCart => producto !== null);
}

/**
 * Elimina un producto del carrito por id.
 * 
 * @param {string} id - ID del producto a eliminar
 * @param {ProductInCart[]} carrito - Array de productos en el carrito
 * @returns {ProductInCart[]} Nuevo array de productos sin el producto eliminado
 */
export function eliminarDelCarrito(
  id: string,
  carrito: ProductInCart[]
): ProductInCart[] {
  return carrito.filter(producto => producto.id !== id);
}

/**
 * Calcula el total del carrito incluyendo productos y sus tópicos.
 * 
 * @param {ProductInCart[]} carrito - Array de productos en el carrito
 * @returns {number} Total calculado
 */
export function calcularTotal(carrito: ProductInCart[]): number {
  return carrito.reduce((total, producto) => {
    // El precio del producto ya incluye los tópicos si existen
    const precioProducto = producto.price * producto.cantidad;
    return total + precioProducto;
  }, 0);
}

/**
 * Formatea los items del carrito para su visualización.
 * 
 * @param {ProductInCart[]} items - Items del carrito
 * @returns {Array} Items formateados para visualización
 */
export function formatearItemsCarrito(items: ProductInCart[]) {
  return items.map(item => ({
    id: item.id,
    idProduct: item.idProduct,
    name: item.name,
    description: item.description,
    price: item.price,
    cantidad: item.cantidad,
    image: item.image,
    topics: item.topics
  }));
} 