"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Upload, Plus, Trash2, DollarSign, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { Product, Category, Tag, ProductVariant } from '@/shared/types/firebase.types';
import { toast } from 'sonner';
import { createCategoryAction } from '../actions/category.actions';
import { createTagAction } from '../actions/tag.actions';
import { productFormSchema, ProductFormData } from '../schemas/product.schema';

interface ProductFormProps {
    product?: Product;
    onSave: (data: ProductFormData & { existingImageUrls?: string[] }) => Promise<boolean>;
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
    const router = useRouter();

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
        resolver: zodResolver(productFormSchema) as any,
        defaultValues: {
            name: product?.name || '',
            description: product?.description || '',
            price: product?.price || 0,
            costPrice: product?.costPrice || 0,
            categoryId: product?.categoryId || '',
            images: [],
            variants: product?.variants || [],
            tags: product?.tags || [],
            hasPromotion: false,
            active: product ? product.status === 'active' : true  // true by default for new products
        }
    });



    const currentTags = watch('tags');
    const currentVariants = watch('variants');
    const currentImages = watch('images');

    // Sync availableCategories and availableTags with props when they change
    useEffect(() => {
        setAvailableCategories(initialCategories);
    }, [initialCategories]);

    useEffect(() => {
        setAvailableTags(initialTags);
    }, [initialTags]);

    useEffect(() => {
        if (product) {
            reset({
                name: product.name || '',
                description: product.description || '',
                price: product.price || 0,
                costPrice: product.costPrice || 0,
                categoryId: product.categoryId || '',
                images: [],
                variants: product.variants || [],
                tags: product.tags || [],
                hasPromotion: false,
                active: product.status === 'active'  // Use actual product status when editing
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
                router.refresh(); // Reload server data
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
                    router.refresh(); // Reload server data
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
                                {...register('name')}
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder={`Ej: ${isRestaurant ? 'Hamburguesa Clásica' : 'Camiseta de Algodón'}`}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Describe los detalles, ingredientes o características..."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Precio de Venta *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        {...register('price', { valueAsNumber: true })}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Costo (Opcional)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        {...register('costPrice', { valueAsNumber: true })}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories & Tags */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Categorización</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">Categoría *</label>
                                <button
                                    type="button"
                                    onClick={() => setShowAddCategory(!showAddCategory)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Nueva
                                </button>
                            </div>

                            {showAddCategory && (
                                <div className="mb-3 flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nombre de categoría"
                                    />
                                    <button
                                        type="button"
                                        onClick={addCategory}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                    >
                                        Crear
                                    </button>
                                </div>
                            )}

                            <select
                                {...register('categoryId')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                            >
                                <option value="">Seleccionar categoría</option>
                                {availableCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas (Tags)</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Agregar etiqueta..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={addTag}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Available Tags to Select */}
                            {availableTags.length > 0 && (
                                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Tags disponibles (click para agregar):</p>
                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.filter(tag => !currentTags.includes(tag.id)).map(tag => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => {
                                                    setValue('tags', [...currentTags, tag.id]);
                                                    toast.success('Tag agregado');
                                                }}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                            >
                                                {tag.name}
                                                <Plus className="w-3 h-3 ml-1" />
                                            </button>
                                        ))}
                                        {availableTags.filter(tag => !currentTags.includes(tag.id)).length === 0 && (
                                            <p className="text-xs text-gray-500 italic">Todos los tags disponibles ya están agregados</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-2">
                                {currentTags.map(tagId => {
                                    const tag = availableTags.find(t => t.id === tagId);
                                    return tag ? (
                                        <span key={tag.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {tag.name}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag.id)}
                                                className="ml-1.5 text-blue-600 hover:text-blue-800 focus:outline-none"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Imágenes</h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {/* Existing Images */}
                        {existingImages.map((url, index) => (
                            <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                <img src={url} alt={`Producto ${index + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(index)}
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">Guardada</span>
                            </div>
                        ))}

                        {/* New Images */}
                        {currentImages.map((file: File, index: number) => (
                            <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                <img src={URL.createObjectURL(file)} alt={`Nueva ${index + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">Nueva</span>
                            </div>
                        ))}

                        {/* Upload Button */}
                        <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-blue-500">
                            <Upload className="w-8 h-8 mb-2" />
                            <span className="text-xs font-medium">Subir imagen</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleImageUpload(e.target.files);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                {/* Variants */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Variantes</h3>
                        <span className="text-xs text-gray-500">Opcional (ej: Tallas, Colores)</span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <input
                                type="text"
                                value={newVariant.name}
                                onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Nombre (ej: XL, Rojo)"
                            />
                            <div className="relative w-full sm:w-32">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="number"
                                    value={newVariant.price || ''}
                                    onChange={(e) => setNewVariant({ ...newVariant, price: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Precio"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {currentVariants.length > 0 ? (
                            <div className="space-y-2">
                                {currentVariants.map((variant) => (
                                    <div key={variant.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-gray-900">{variant.name}</span>
                                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                ${variant.price.toFixed(2)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(variant.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-2">No hay variantes agregadas</p>
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Estado</h3>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('active')}
                                className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className="ms-3 text-sm font-medium text-gray-900">Producto Activo</span>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
