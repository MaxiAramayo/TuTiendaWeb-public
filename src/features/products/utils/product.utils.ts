import { Product, ProductStatus } from '@/shared/types/firebase.types';
import { formatPrice } from '@/shared/utils/format.utils';

// Re-export para mantener compatibilidad
export { formatPrice };

export const getProductStatusLabel = (status: ProductStatus | string): string => {
    switch (status) {
        case 'active':
            return 'Activo';
        case 'inactive':
            return 'Inactivo';
        case 'draft':
            return 'Borrador';
        default:
            return status;
    }
};

export const getProductStatusColor = (status: ProductStatus | string): string => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'inactive':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'draft':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export const getProductMainImage = (product: Product): string | null => {
    if (product.imageUrls && product.imageUrls.length > 0) {
        return product.imageUrls[0];
    }
    return null;
};

export function getProductDescription(product: Product): string {
    return product.description || '';
}
