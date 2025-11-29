"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Upload, Plus, Trash2, DollarSign, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { Product, Category, Tag, ProductVariant } from '@/shared/types/firebase.types';
import { toast } from 'sonner';
import { createCategoryAction } from '../actions/category.actions';
import { createTagAction } from '../actions/tag.actions';
import { productSchema, ProductFormData } from '../validations/product.schema';

interface ProductFormProps {
    product?: Product;
    onSave: (data: any) => Promise<boolean>;
    onCancel: () => void;
    onRemoveImage?: (productId: string, imageUrl: string) => Promise<boolean>;
    loading?: boolean;
    storeId: string;
    storeType?: string;
    categories?: Category[];
    tags?: Tag[];
}

const ProductForm: React.FC<ProductFormProps> = ({
    product,
    onSave,
    onCancel,
    onRemoveImage,
    loading = false,
    storeId,
    storeType = 'general',
    categories: initialCategories = [],
    tags: initialTags = []
}) => {

    const isRestaurant = storeType === 'restaurant';
    const productTerm = isRestaurant ? 'plato' : 'producto';
    const ProductTerm = isRestaurant ? 'Plato' : 'Producto';

    const [availableCategories, setAvailableCategories] = useState<Category[]>(initialCategories);
    const [availableTags, setAvailableTags] = useState<Tag[]>(initialTags);
    const [existingImages, setExistingImages] = useState<string[]>(product?.imageUrls || []);

    // UI states
    const [newCategory, setNewCategory] = useState('');
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newVariant, setNewVariant] = useState({ name: '', price: 0 });
    const [newTag, setNewTag] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema) as Resolver<ProductFormData>,
        defaultValues: {
            name: product?.name || '',
            shortDescription: product?.shortDescription || '',
            description: product?.description || '',
            price: product?.price || 0,
            costPrice: product?.costPrice || 0,
            categoryId: product?.categoryId || '',
            images: [],
            variants: product?.variants || [],
            tags: product?.tags || [],
            hasPromotion: product?.hasPromotion || false
        }
    });


    const currentTags = watch('tags');
    const currentVariants = watch('variants');
    const currentImages = watch('images');

    useEffect(() => {
        if (product) {
            reset({
                name: product.name || '',
                shortDescription: product.shortDescription || '',
                description: product.description || '',
                price: product.price || 0,
                costPrice: product.costPrice || 0,
                categoryId: product.categoryId || '',
                images: [],
                variants: product.variants || [],
                tags: product.tags || [],
                hasPromotion: product.hasPromotion || false
            });
            setExistingImages(product.imageUrls || []);
        }
    }, [product, reset]);

    const addCategory = async () => {
        if (newCategory.trim()) {
            try {
                const result = await createCategoryAction({ name: newCategory.trim() });
                const newCat: Category = {
                    id: result.id,
                    name: result.name,
                    storeId,
                    slug: result.name.toLowerCase().replace(/\s+/g, '-'),
                    isActive: true,
                    createdAt: {} as any,
                    updatedAt: {} as any
                };
                setAvailableCategories(prev => [...prev, newCat]);
                setValue('categoryId', newCat.id);
                setNewCategory('');
                setShowAddCategory(false);
                toast.success('Categoría creada exitosamente');
            } catch (error) {
                toast.error('Error al crear la categoría');
            }
        }
    };

    const addTag = async () => {
        if (newTag.trim()) {
            try {
                const existingTag = availableTags.find(tag =>
                    tag.name.toLowerCase() === newTag.trim().toLowerCase()
                );

                if (existingTag) {
                    if (!currentTags.includes(existingTag.id)) {
                        setValue('tags', [...currentTags, existingTag.id]);
                        toast.success('Tag agregado');
                    } else {
                        toast.info('Este tag ya está seleccionado');
                    }
                } else {
                    const result = await createTagAction({ name: newTag.trim() });
                    const newTagDoc: Tag = {
                        id: result.id,
                        name: result.name,
                        storeId,
                        slug: result.name.toLowerCase().replace(/\s+/g, '-'),
                        createdAt: {} as any,
                        updatedAt: {} as any
                    };
                    setAvailableTags(prev => [...prev, newTagDoc]);
                    setValue('tags', [...currentTags, newTagDoc.id]);
                    toast.success('Tag creado y agregado exitosamente');
                }
                setNewTag('');
            } catch (error) {
                toast.error('Error al agregar el tag');
            }
        }
    };

    const addVariant = () => {
        if (newVariant.name.trim()) {
            const variant: ProductVariant = {
                id: Date.now().toString(),
                name: newVariant.name.trim(),
                price: newVariant.price,
                isAvailable: true
            };
            setValue('variants', [...currentVariants, variant]);
            setNewVariant({ name: '', price: 0 });
            toast.success('Variante agregada');
        }
    };

    const removeVariant = (variantId: string) => {
        const updatedVariants = currentVariants.filter(v => v.id !== variantId);
        setValue('variants', updatedVariants);
        toast.success('Variante eliminada');
    };

    const removeTag = (tagIdToRemove: string) => {
        const updatedTags = currentTags.filter(tagId => tagId !== tagIdToRemove);
        setValue('tags', updatedTags);
        toast.success('Tag eliminado');
    };

    const handleImageUpload = async (files: FileList) => {
        const newImages = Array.from(files);
        const compressedImages: File[] = [];

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };

        for (const image of newImages) {
            try {
                const compressedBlob = await imageCompression(image, options);
                // Create a new File from the blob, preserving the original name and type
                const compressedFile = new File([compressedBlob], image.name, {
                    type: compressedBlob.type,
                    lastModified: Date.now(),
                });
                compressedImages.push(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
                // Fallback to original if compression fails
                compressedImages.push(image);
            }
        }

        setValue('images', [...currentImages, ...compressedImages]);
    };

    const removeImage = (index: number) => {
        const updatedImages = currentImages.filter((_, i) => i !== index);
        setValue('images', updatedImages);
    };

    const removeExistingImage = async (index: number) => {
        const updatedExistingImages = existingImages.filter((_, i) => i !== index);
        setExistingImages(updatedExistingImages);
        // If we had an API to remove immediately, we would call onRemoveImage here
        // For now we just update local state, actual removal might happen on save or separate action
    };

    const onSubmit = async (data: ProductFormData) => {
        setIsSubmitting(true);
        try {
            // Combine existing images (urls) and new images (files) is handled by parent or action
            // But here we just pass the form data. 
            // Note: existingImages state is separate from data.images which are new Files.
            // The parent component expects 'images' to be Files and maybe handles existing ones differently?
            // Looking at product-create-view, it appends 'images' from data.
            // If we are editing, we might need to handle existing images preservation.
            // For now, we pass data as is.

            const success = await onSave({ ...data, existingImageUrls: existingImages });
            if (success) {
                onCancel();
            }
        } catch (error) {
            console.error(error);
            toast.error(`Error al ${product ? 'actualizar' : 'crear'} el ${productTerm}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between bg-gray-50">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {product ? `Editar ${ProductTerm}` : `Nuevo ${ProductTerm}`}
                </h2>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Información Básica</h3>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del {productTerm} *</label>
                            <input
                                type="text"
                                {...register('name')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Ej: Hamburguesa Clásica`}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Descripción detallada..."
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="number"
                                step="0.01"
                                {...register('price', { valueAsNumber: true })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                        <div className="flex space-x-2">
                            <Controller
                                name="categoryId"
                                control={control}
                                render={({ field }) => (
                                    <select
                                        {...field}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar categoría</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowAddCategory(!showAddCategory)}
                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}

                        {showAddCategory && (
                            <div className="mt-2 flex space-x-2">
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    placeholder="Nueva categoría"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addCategory}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                >
                                    Agregar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Imágenes</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {existingImages.map((url, index) => (
                            <div key={`existing-${index}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                                <img src={url} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeExistingImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {currentImages.map((file: File, index: number) => (
                            <div key={`new-${index}`} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                                <img src={URL.createObjectURL(file)} alt={`Nueva ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <label className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">Subir imagen</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} />
                        </label>
                    </div>
                </div>

                {/* Variants & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Variants */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Variantes</h3>
                        <div className="space-y-2">
                            {currentVariants.map((variant) => (
                                <div key={variant.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                    <span className="text-sm font-medium">{variant.name}</span>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">${variant.price}</span>
                                        <button type="button" onClick={() => removeVariant(variant.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newVariant.name}
                                    onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                                    placeholder="Nombre variante"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <input
                                    type="number"
                                    value={newVariant.price}
                                    onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) })}
                                    placeholder="Precio"
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {currentTags.map(tagId => {
                                const tag = availableTags.find(t => t.id === tagId);
                                return (
                                    <span key={tagId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {tag?.name || 'Tag'}
                                        <button type="button" onClick={() => removeTag(tagId)} className="ml-1 text-blue-600 hover:text-blue-800">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Nuevo tag"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {availableTags.filter(t => !currentTags.includes(t.id)).map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => setValue('tags', [...currentTags, tag.id])}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-gray-600 transition-colors"
                                >
                                    + {tag.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Guardar {ProductTerm}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
