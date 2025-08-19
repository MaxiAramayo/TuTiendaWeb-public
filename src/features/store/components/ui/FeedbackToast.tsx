/**
 * Componente de feedback visual con toast notifications
 * 
 * Proporciona notificaciones visuales para diferentes acciones del usuario
 * 
 * @module features/store/components/ui
 */

"use client";

import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, ShoppingCart, Package, Truck } from 'lucide-react';

/**
 * Tipos de notificaciones disponibles
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'cart' | 'order' | 'delivery';

/**
 * Configuración de iconos para cada tipo de toast
 */
const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  cart: ShoppingCart,
  order: Package,
  delivery: Truck
};

/**
 * Configuración de colores para cada tipo de toast
 */
const toastColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
  cart: 'text-purple-600',
  order: 'text-indigo-600',
  delivery: 'text-orange-600'
};

/**
 * Interfaz para las opciones del toast
 */
interface ToastOptions {
  /** Duración en milisegundos */
  duration?: number;
  /** Posición del toast */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  /** Acción personalizada */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Función para mostrar toast de éxito
 */
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  const Icon = toastIcons.success;
  
  toast.success(message, {
    duration: options?.duration || 3000,
    position: options?.position || 'bottom-right',
    icon: <Icon className={`h-5 w-5 ${toastColors.success}`} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
};

/**
 * Función para mostrar toast de error
 */
export const showErrorToast = (message: string, options?: ToastOptions) => {
  const Icon = toastIcons.error;
  
  toast.error(message, {
    duration: options?.duration || 5000,
    position: options?.position || 'bottom-right',
    icon: <Icon className={`h-5 w-5 ${toastColors.error}`} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
};

/**
 * Función para mostrar toast de advertencia
 */
export const showWarningToast = (message: string, options?: ToastOptions) => {
  const Icon = toastIcons.warning;
  
  toast.warning(message, {
    duration: options?.duration || 4000,
    position: options?.position || 'bottom-right',
    icon: <Icon className={`h-5 w-5 ${toastColors.warning}`} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
};

/**
 * Función para mostrar toast informativo
 */
export const showInfoToast = (message: string, options?: ToastOptions) => {
  const Icon = toastIcons.info;
  
  toast.info(message, {
    duration: options?.duration || 3000,
    position: options?.position || 'bottom-right',
    icon: <Icon className={`h-5 w-5 ${toastColors.info}`} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
};

/**
 * Función para mostrar toast relacionado con el carrito
 */
export const showCartToast = (message: string, options?: ToastOptions) => {
  const Icon = toastIcons.cart;
  
  toast.success(message, {
    duration: options?.duration || 2000,
    position: options?.position || 'bottom-right',
    icon: <Icon className={`h-5 w-5 ${toastColors.cart}`} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
};

/**
 * Función para mostrar toast relacionado con pedidos
 */
export const showOrderToast = (message: string, options?: ToastOptions) => {
  const Icon = toastIcons.order;
  
  toast.success(message, {
    duration: options?.duration || 4000,
    position: options?.position || 'bottom-right',
    icon: <Icon className={`h-5 w-5 ${toastColors.order}`} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
};

/**
 * Función para mostrar toast relacionado con entregas
 */
export const showDeliveryToast = (message: string, options?: ToastOptions) => {
  const Icon = toastIcons.delivery;
  
  toast.info(message, {
    duration: options?.duration || 5000,
    position: options?.position || 'bottom-right',
    icon: <Icon className={`h-5 w-5 ${toastColors.delivery}`} />,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick
    } : undefined
  });
};

/**
 * Función genérica para mostrar toast personalizado
 */
export const showCustomToast = (
  type: ToastType,
  message: string,
  options?: ToastOptions
) => {
  switch (type) {
    case 'success':
      showSuccessToast(message, options);
      break;
    case 'error':
      showErrorToast(message, options);
      break;
    case 'warning':
      showWarningToast(message, options);
      break;
    case 'info':
      showInfoToast(message, options);
      break;
    case 'cart':
      showCartToast(message, options);
      break;
    case 'order':
      showOrderToast(message, options);
      break;
    case 'delivery':
      showDeliveryToast(message, options);
      break;
    default:
      showInfoToast(message, options);
  }
};

/**
 * Mensajes predefinidos para acciones comunes
 */
export const TOAST_MESSAGES = {
  // Carrito
  PRODUCT_ADDED: 'Producto añadido al carrito',
  PRODUCT_REMOVED: 'Producto eliminado del carrito',
  CART_CLEARED: 'Carrito vaciado',
  QUANTITY_UPDATED: 'Cantidad actualizada',
  
  // Pedidos
  ORDER_CREATED: 'Pedido creado exitosamente',
  ORDER_SENT: 'Pedido enviado por WhatsApp',
  ORDER_ERROR: 'Error al procesar el pedido',
  
  // Filtros
  FILTERS_APPLIED: 'Filtros aplicados',
  FILTERS_CLEARED: 'Filtros eliminados',
  NO_RESULTS: 'No se encontraron productos',
  
  // Errores generales
  NETWORK_ERROR: 'Error de conexión. Intenta nuevamente.',
  UNEXPECTED_ERROR: 'Ocurrió un error inesperado',
  
  // Éxito general
  OPERATION_SUCCESS: 'Operación completada exitosamente',
  
  // Entrega
  DELIVERY_ESTIMATED: 'Tiempo de entrega estimado calculado',
  DELIVERY_INFO_UPDATED: 'Información de entrega actualizada'
} as const;

/**
 * Hook personalizado para usar toasts en componentes
 */
export const useStoreToast = () => {
  return {
    showSuccess: showSuccessToast,
    showError: showErrorToast,
    showWarning: showWarningToast,
    showInfo: showInfoToast,
    showCart: showCartToast,
    showOrder: showOrderToast,
    showDelivery: showDeliveryToast,
    showCustom: showCustomToast,
    messages: TOAST_MESSAGES
  };
};