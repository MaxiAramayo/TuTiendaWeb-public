'use server';

import { revalidatePath } from 'next/cache';
import { productFormSchema, productUpdateSchema } from '../schemas/product.schema';
import { z } from 'zod';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../services/product.service';
import { getServerSession } from '@/lib/auth/server-session';
import { adminStorage } from '@/lib/firebase/admin';

// Tipo de respuesta estándar
type ActionResponse<T = unknown> =
    | { success: true; data: T }
    | { success: false; errors: Record<string, string[]> };

// ============================================================================
// HELPERS
// ============================================================================
async function uploadImage(file: File, storeId: string, productId: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const imageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const filename = `stores/${storeId}/products/${productId}/${imageId}.${ext}`;

    const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const fileRef = bucket.file(filename);

    await fileRef.save(buffer, {
        metadata: {
            contentType: file.type,
        },
    });

    await fileRef.makePublic();

    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

async function deleteImage(imageUrl: string): Promise<void> {
    try {
        // Extract path from URL: https://storage.googleapis.com/BUCKET/PATH
        const urlParts = imageUrl.split('/');
        const bucketName = urlParts[3];
        const filePath = urlParts.slice(4).join('/');

        const bucket = adminStorage.bucket(bucketName);
        const fileRef = bucket.file(filePath);

        await fileRef.delete();
    } catch (error) {
        console.error('Error deleting image from Storage:', imageUrl, error);
        // Don't throw - we don't want to fail the whole operation if image deletion fails
    }
}

// ============================================================================
// CREATE PRODUCT
// ============================================================================
export async function createProductAction(
    formData: FormData
): Promise<ActionResponse<{ id: string }>> {
    // 1. AUTH
    const session = await getServerSession();
    if (!session) {
        return { success: false, errors: { _form: ['No autenticado'] } };
    }

    // 2. PARSE FORM DATA
    const rawData = {
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        price: formData.get('price'),
        costPrice: formData.get('costPrice'),
        categoryId: formData.get('categoryId'),
        tags: formData.getAll('tags').map(t => {
            try { return JSON.parse(t as string); } catch { return t; }
        }).flat(),
        variants: formData.getAll('variants').map(v => {
            try { return JSON.parse(v as string); } catch { return v; }
        }).flat(),
        active: formData.get('active') === 'true',
        imageUrl: formData.get('imageUrl') || undefined,
        image: formData.getAll('images'), // Get ALL images
    };

    // 3. VALIDATE
    const validation = productFormSchema.safeParse(rawData);

    if (!validation.success) {
        console.error('CreateProductAction - Validation Errors:', validation.error.flatten().fieldErrors);
        return {
            success: false,
            errors: validation.error.flatten().fieldErrors,
        };
    }

    // 4. CREATE PRODUCT DOCUMENT FIRST (to get ID)
    try {
        const { image, active, ...productData } = validation.data;
        const status = active !== false ? 'active' : 'inactive';

        // Clean undefined values
        const cleanProductData = Object.fromEntries(
            Object.entries(productData).filter(([_, v]) => v !== undefined)
        );

        const product = await createProduct(
            {
                ...cleanProductData as any,
                status,
                imageUrls: [], // Empty initially
                slug: productData.name.toLowerCase().replace(/\s+/g, '-'),
                currency: 'ARS',
                hasPromotion: false,
            },
            session.storeId
        );

        // 5. UPLOAD IMAGES (now we have product.id)
        const imageFiles = validation.data.image as any[];
        const uploadedUrls: string[] = [];

        if (imageFiles && Array.isArray(imageFiles)) {
            for (const file of imageFiles) {
                if (file instanceof File) {
                    try {
                        const url = await uploadImage(file, session.storeId, product.id);
                        uploadedUrls.push(url);
                    } catch (error) {
                        console.error('Error uploading image:', error);
                        // Continue with other images even if one fails
                    }
                }
            }
        }

        // 6. UPDATE PRODUCT WITH IMAGE URLS
        if (uploadedUrls.length > 0) {
            await updateProduct(product.id, { imageUrls: uploadedUrls }, session.storeId);
        }

        // 7. REVALIDATE CACHE
        revalidatePath('/dashboard/products');
        revalidatePath(`/dashboard/products/${product.id}`);

        return { success: true, data: { id: product.id } };
    } catch (error) {
        console.error('Error creating product:', error);
        return {
            success: false,
            errors: { _form: ['Error al crear producto'] },
        };
    }
}

// ============================================================================
// UPDATE PRODUCT
// ============================================================================
export async function updateProductAction(
    formData: FormData
): Promise<ActionResponse<{ id: string }>> {
    const session = await getServerSession();
    if (!session) {
        return { success: false, errors: { _form: ['No autenticado'] } };
    }

    const id = formData.get('id') as string;

    const rawData = {
        id,
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        price: formData.get('price'),
        costPrice: formData.get('costPrice'),
        categoryId: formData.get('categoryId'),
        tags: formData.getAll('tags').map(t => {
            try { return JSON.parse(t as string); } catch { return t; }
        }).flat(),
        variants: formData.getAll('variants').map(v => {
            try { return JSON.parse(v as string); } catch { return v; }
        }).flat(),
        active: formData.get('active') === 'true',
        imageUrl: formData.get('imageUrl') || undefined,
        image: formData.getAll('images'), // Get ALL new images
    };

    // Validate
    const validation = productUpdateSchema.extend({
        image: z.any().optional()
    }).safeParse(rawData);

    if (!validation.success) {
        console.error('UpdateProductAction - Validation Errors:', JSON.stringify(validation.error.flatten().fieldErrors, null, 2));
        return {
            success: false,
            errors: validation.error.flatten().fieldErrors,
        };
    }

    try {
        const { active, imageUrl, image, ...updateData } = validation.data as any;

        // Clean undefined values
        const cleanUpdateData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
        );

        const finalUpdateData: any = { ...cleanUpdateData };

        if (active !== undefined) {
            finalUpdateData.status = active ? 'active' : 'inactive';
        }

        // Handle images
        const existingImageUrlsStr = formData.get('existingImageUrls') as string;
        let finalImageUrls: string[] = [];

        // Parse existing images from form (the ones user kept)
        if (existingImageUrlsStr) {
            try {
                const existingImageUrls = JSON.parse(existingImageUrlsStr);
                if (Array.isArray(existingImageUrls)) {
                    finalImageUrls = existingImageUrls;
                }
            } catch (e) {
                console.error('Error parsing existingImageUrls:', e);
            }
        }

        // Get current images from DB to identify deleted ones
        const existingProduct = await getProductById(id, session.storeId);
        const oldImageUrls = existingProduct?.imageUrls || [];

        // Delete images that were removed (in oldImageUrls but not in finalImageUrls)
        const removedImages = oldImageUrls.filter(url => !finalImageUrls.includes(url));
        for (const removedUrl of removedImages) {
            await deleteImage(removedUrl);
        }

        // Upload new images
        const newImageFiles = image as any[];
        if (newImageFiles && Array.isArray(newImageFiles)) {
            for (const file of newImageFiles) {
                if (file instanceof File) {
                    try {
                        const url = await uploadImage(file, session.storeId, id);
                        finalImageUrls.push(url);
                    } catch (error) {
                        console.error('Error uploading new image:', error);
                        // Continue with other images
                    }
                }
            }
        }

        // Set final image URLs (kept + newly uploaded)
        if (finalImageUrls.length > 0 || removedImages.length > 0) {
            finalUpdateData.imageUrls = finalImageUrls;
        } else if (imageUrl) {
            // Fallback if only imageUrl was passed
            finalUpdateData.imageUrls = [imageUrl];
        }

        await updateProduct(id, finalUpdateData, session.storeId);

        revalidatePath('/dashboard/products');
        revalidatePath(`/dashboard/products/${id}`);

        return { success: true, data: { id } };
    } catch (error) {
        console.error('UpdateProductAction - Error:', error);
        return {
            success: false,
            errors: { _form: ['Error al actualizar producto'] },
        };
    }
}

// ============================================================================
// DELETE PRODUCT
// ============================================================================
export async function deleteProductAction(
    productId: string
): Promise<ActionResponse<null>> {
    const session = await getServerSession();
    if (!session) {
        return { success: false, errors: { _form: ['No autenticado'] } };
    }

    try {
        // 1. Get product to access image URLs
        const product = await getProductById(productId, session.storeId);

        if (!product) {
            return {
                success: false,
                errors: { _form: ['Producto no encontrado'] },
            };
        }

        // 2. Delete all images from Storage
        if (product.imageUrls && product.imageUrls.length > 0) {
            for (const imageUrl of product.imageUrls) {
                await deleteImage(imageUrl);
            }
        }

        // 3. Delete product document (hard delete)
        await deleteProduct(productId, session.storeId);

        revalidatePath('/dashboard/products');

        return { success: true, data: null };
    } catch (error) {
        console.error('Error deleting product:', error);
        return {
            success: false,
            errors: { _form: ['Error al eliminar producto'] },
        };
    }
}

// ============================================================================
// TOGGLE PRODUCT STATUS
// ============================================================================
export async function toggleProductStatusAction(
    productId: string,
    newStatus: 'active' | 'inactive'
): Promise<ActionResponse<null>> {
    const session = await getServerSession();
    if (!session) {
        return { success: false, errors: { _form: ['No autenticado'] } };
    }

    try {
        await updateProduct(
            productId,
            { status: newStatus },
            session.storeId
        );

        revalidatePath('/dashboard/products');
        revalidatePath(`/dashboard/products/${productId}`);

        return { success: true, data: null };
    } catch (error) {
        console.error('Error toggling product status:', error);
        return {
            success: false,
            errors: { _form: ['Error al cambiar estado del producto'] },
        };
    }
}
