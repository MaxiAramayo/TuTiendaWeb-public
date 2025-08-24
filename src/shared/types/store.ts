/**
 * Tipos centralizados para todo el módulo de tienda
 * 
 * @module shared/types/store
 */

/**
 * Interfaz base para un producto
 */
export interface Product {
  id?: string;
  idProduct: string;
  idStore?: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  imageUrl?: string; // Compatibilidad con ambas convenciones de nombres
  category?: string;
  available?: boolean;
  tags?: string[];
  stock?: number;
  topics?: Topics[];
  /** Tags de productos con configuración visual */
  productTags?: import('@/shared/types/firebase.types').ProductTag[];
}

/**
 * Interfaz para tópicos/extras de un producto
 */
export interface Topics {
  id: string;
  name: string;
  price: number;
}

/**
 * Producto en el carrito
 */
export interface ProductInCart extends Product {
  cantidad: number;
  aclaracion?: string;
  id: string; // ID único en el carrito
}

/**
 * Producto en el formulario de carrito
 */
export interface ProductCart {
  cantidadProducto: number;
  aclaracion?: string;
  producto: Product;
}

/**
 * Tipo para los filtros de productos
 */
export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
}

/**
 * Opciones para ordenar productos
 */
export type SortOption = 
  | 'price-asc' 
  | 'price-desc' 
  | 'name-asc' 
  | 'name-desc' 
  | 'newest';

/**
 * Opciones para filtrado de productos
 */
export interface FilterOptions {
  /** Término de búsqueda */
  searchTerm: string;
  /** Categoría seleccionada */
  selectedCategory: string;
  /** Ordenamiento por precio */
  sortByPrice: string;
}

/**
 * Resultado de productos agrupados por categoría
 */
export type GroupedProducts = Record<string, Product[]>

/**
 * Props para el componente ProductCard
 */
export interface ProductCardProps {
  /** Producto a mostrar en la tarjeta */
  product: Product;
  /** Función para manejar la apertura del modal de producto */
  onOpenModal: (product: Product) => void;
}

/**
 * Props para el componente ProductsList
 */
export interface ProductsListProps {
  /** Lista de productos a mostrar */
  products: Product[];
}

/**
 * Props para el componente ProductList
 */
export interface ProductListProps {
  /** Lista de productos a mostrar */
  products: Product[];
  /** Nombre de la tienda */
  name: string;
  /** Número de WhatsApp para contacto */
  whatsapp: string;
  /** Indica si es un menú o una tienda completa */
  menu: boolean;
  /** ID único de la tienda */
  uid: string;
}

// Tipos relacionados con ventas
export interface Sells {
  id: string;
  products: ProductInCart[];
  date: Date;
  customerName: string;
  deliveryMethod: string;
  address: string;
  paymentMethod: string;
  notes?: string;
}

// Tipos relacionados con la tienda
export type StoreData = {
  whatsapp: string;
  localaddress: string;
  siteName: string;
  descripcion: string;
  uid: string;
  email: string;
  name: string;
  instagramlink: string;
  openinghours: string;
  urlProfile?: string;
  suscripcion: boolean;
  urlPortada?: string;
  
  // Propiedades adicionales para compatibilidad con la nueva estructura
  id?: string;
  contactInfo?: {
    whatsapp?: string;
    email?: string;
    phone?: string;
  };
  basicInfo?: {
    name?: string;
    description?: string;
    address?: string;
  };
  settings?: {
    paymentMethods?: import('@/shared/types/firebase.types').PaymentMethod[];
    deliveryMethods?: import('@/shared/types/firebase.types').DeliveryMethod[];
    currency?: string;
    language?: string;
    orderSettings?: {
      preparationTime?: number;
    };
  };
};

// Tipos relacionados con el usuario
export interface User extends StoreData {
  periodoPrueba?: boolean;
  signupDate?: Date;
}

// Tipos relacionados con el formulario de checkout
export type FormCheckoutValues = {
  nombre: string;
  formaDeConsumir: string;
  formaDePago: string;
  direccion?: string;
  aclaracion?: string;
};

/**
 * Props para el componente CartDrawer
 */
export interface CartDrawerProps {
  isOpen: boolean;
  items: ProductInCart[];
  onClose: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

/**
 * Props para el componente Cart
 */
export interface CartProps {
  items: ProductInCart[];
  total: number;
  onQuantityChange: (id: string, action: "increase" | "decrease") => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClose: () => void;
}

// ============================================================================
// CONFIGURACIÓN DE TEMA AVANZADA
// ============================================================================

/**
 * Configuración básica de tema (existente)
 */
export interface ThemeConfig {
  accentColor?: string;
}

/**
 * Configuración avanzada de tema
 */
export interface AdvancedThemeConfig extends ThemeConfig {
  /** Configuración de colores */
  colors: {
    /** Color primario */
    primary: string;
    /** Color secundario */
    secondary: string;
    /** Color de acento */
    accent: string;
    /** Color de texto principal */
    textPrimary: string;
    /** Color de texto secundario */
    textSecondary: string;
    /** Color de fondo */
    background: string;
    /** Color de superficie */
    surface: string;
  };
  
  /** Configuración de tipografía */
  typography: {
    /** Fuente principal */
    fontFamily: string;
    /** Tamaño base */
    fontSize: 'sm' | 'base' | 'lg';
    /** Peso de fuente para títulos */
    headingWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    /** Peso de fuente para texto */
    bodyWeight: 'normal' | 'medium';
  };
  
  /** Configuración de botones */
  buttons: {
    /** Estilo de botones */
    style: 'rounded' | 'square' | 'pill';
    /** Tamaño por defecto */
    defaultSize: 'sm' | 'md' | 'lg';
    /** Efecto hover */
    hoverEffect: 'scale' | 'shadow' | 'brightness';
  };
  
  /** Configuración de iconos */
  icons: {
    /** Estilo de iconos */
    style: 'outline' | 'filled' | 'duotone';
    /** Tamaño por defecto */
    defaultSize: number;
    /** Color por defecto */
    defaultColor: string;
  };
}

/**
 * Filtros avanzados de productos
 */
export interface AdvancedProductFilters {
  category?: string;
  tags?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: boolean;
  search?: string;
}
