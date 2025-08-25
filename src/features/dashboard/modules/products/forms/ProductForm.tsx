/**
 * Formulario para crear y editar productos
 * 
 * Componente completo que maneja la creación y edición de productos,
 * incluyendo información básica, imágenes, gestión de categorías, variantes,
 * tags y validación en tiempo real.
 * 
 * @module features/dashboard/modules/products/forms
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Save, X, Upload, Plus, Trash2, Eye, EyeOff, Check, AlertCircle, Loader2, Hash, Calculator, Package, Tag as TagIcon, DollarSign, Image as ImageIcon, Edit, AlertTriangle } from 'lucide-react';
import { CreateProductData, UpdateProductData, ProductVariant } from '../types/product.types';
import { Product } from '@/shared/types/firebase.types';
import { Category, Tag } from '@/shared/types/firebase.types';
import { categoriesService } from '../api/categories.service';
import { tagsService } from '../api/tags.service';
import { productsService } from '../api/products.service';
import { generateSlug } from '../utils/product.utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Props del formulario de productos
 */
interface ProductFormProps {
  /** Producto a editar (undefined para crear nuevo) */
  product?: Product;
  /** Función llamada al guardar */
  onSave: (data: CreateProductData | UpdateProductData) => Promise<boolean>;
  /** Función llamada al cancelar */
  onCancel: () => void;
  /** Función llamada al eliminar imagen */
  onRemoveImage?: (productId: string, imageUrl: string) => Promise<boolean>;
  /** Estado de carga */
  loading?: boolean;
  /** ID de la tienda */
  storeId: string;
  /** Tipo de tienda para determinar terminología */
  storeType?: string;
}

/**
 * Categorías predefinidas
 */
const DEFAULT_CATEGORIES = {
  restaurant: [
    'Entradas',
    'Platos Principales',
    'Postres',
    'Bebidas',
    'Ensaladas',
    'Sopas',
    'Pizzas',
    'Hamburguesas',
    'Pastas',
    'Mariscos',
    'Carnes',
    'Vegetariano',
    'Vegano',
    'Sin Gluten'
  ],
  general: [
    'Electrónicos',
    'Ropa',
    'Hogar',
    'Deportes',
    'Libros',
    'Belleza',
    'Juguetes',
    'Automotriz',
    'Salud',
    'Mascotas'
  ]
};

/**
 * Estado de validación de un campo
 */
interface FieldValidation {
  isValid: boolean | null;
  message: string;
  isValidating?: boolean;
}

/**
 * Datos del formulario mejorado
 */
interface FormData {
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  costPrice: number;
  categoryId: string;
  images: File[];
  variants: ProductVariant[];
  tags: string[];
  hasPromotion: boolean;
}

/**
 * Estado de validación de campos
 */
interface ValidationState {
  name: FieldValidation;
  shortDescription: FieldValidation;
  description: FieldValidation;
  price: FieldValidation;
  costPrice: FieldValidation;
  categoryId: FieldValidation;
  images: FieldValidation;
}

/**
 * Formulario de productos mejorado
 */
const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSave,
  onCancel,
  onRemoveImage,
  loading = false,
  storeId,
  storeType = 'general'
}) => {
  // Determinar terminología según tipo de tienda
  const isRestaurant = storeType === 'restaurant';
  const productTerm = isRestaurant ? 'plato' : 'producto';
  const ProductTerm = isRestaurant ? 'Plato' : 'Producto';

  // Estados para categorías y tags
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    name: '',
    shortDescription: '',
    description: '',
    price: 0,
    costPrice: 0,
    categoryId: '',
    images: [],
    variants: [],
    tags: [],
    hasPromotion: false
  });

  // Estado separado para el precio con impuestos para evitar bucles infinitos
  const [priceWithTax, setPriceWithTax] = useState<number>(0);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationState, setValidationState] = useState<ValidationState>({
    name: { isValid: null, message: '' },
    shortDescription: { isValid: null, message: '' },
    description: { isValid: null, message: '' },
    price: { isValid: null, message: '' },
    costPrice: { isValid: null, message: '' },
    categoryId: { isValid: null, message: '' },
    images: { isValid: null, message: '' }
  });

  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<(Category & { hasProducts?: boolean }) | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newVariant, setNewVariant] = useState({ name: '', price: 0 });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Cargar categorías y tags
  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          categoriesService.getCategories(storeId),
          tagsService.getTags(storeId)
        ]);
        setAvailableCategories(categoriesData || []);
        setAvailableTags(tagsData || []);
      } catch (error) {
        // No mostrar error si las colecciones están vacías
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'failed-precondition') {
          toast.error('Error al cargar categorías y tags');
        }
        // Establecer arrays vacíos en caso de error
        setAvailableCategories([]);
        setAvailableTags([]);
      } finally {
        setLoadingCategories(false);
        setLoadingTags(false);
      }
    };

    loadCategoriesAndTags();
  }, [storeId]);

  // Inicializar formulario con datos del producto
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        price: product.price,
        costPrice: product.costPrice || 0,
        categoryId: product.categoryId || '',
        images: [], // Las imágenes nuevas se manejan por separado
        variants: product.variants || [],
        tags: product.tags || [],
        hasPromotion: product.hasPromotion || false
      });
      // Cargar imágenes existentes - usar imageUrls que es el campo correcto
      setExistingImages(product.imageUrls || []);
    } else {
      // Limpiar imágenes existentes si no hay producto
      setExistingImages([]);
    }
  }, [product, availableCategories, availableTags]);

  /**
   * Valida un campo específico en tiempo real
   */
  const validateField = useCallback((field: keyof FormData, value: any): FieldValidation => {
    switch (field) {
      case 'name':
        if (!value || !value.trim()) {
          return { isValid: false, message: `El nombre del ${productTerm} es obligatorio` };
        }
        if (value.trim().length < 2) {
          return { isValid: false, message: 'El nombre debe tener al menos 2 caracteres' };
        }
        if (value.trim().length > 100) {
          return { isValid: false, message: 'El nombre no puede exceder 100 caracteres' };
        }
        return { isValid: true, message: 'Nombre válido' };

      case 'shortDescription':
        // La descripción corta es opcional
        if (!value || !value.trim()) {
          return { isValid: true, message: 'Descripción corta opcional' };
        }
        if (value.trim().length < 5) {
          return { isValid: false, message: 'La descripción corta debe tener al menos 5 caracteres' };
        }
        if (value.trim().length > 150) {
          return { isValid: false, message: 'La descripción corta no puede exceder 150 caracteres' };
        }
        return { isValid: true, message: 'Descripción corta válida' };

      case 'description':
        if (!value || !value.trim()) {
          return { isValid: false, message: `La descripción del ${productTerm} es obligatoria` };
        }
        if (value.trim().length < 10) {
          return { isValid: false, message: 'La descripción debe tener al menos 10 caracteres' };
        }
        if (value.trim().length > 500) {
          return { isValid: false, message: 'La descripción no puede exceder 500 caracteres' };
        }
        return { isValid: true, message: 'Descripción válida' };

      case 'price':
        if (!value || value <= 0) {
          return { isValid: false, message: 'El precio de venta debe ser mayor a 0' };
        }
        if (formData.costPrice > 0 && value <= formData.costPrice) {
          return { isValid: false, message: 'El precio de venta debe ser mayor al precio de costo' };
        }
        return { isValid: true, message: 'Precio válido' };

      case 'costPrice':
        if (value < 0) {
          return { isValid: false, message: 'El precio de costo no puede ser negativo' };
        }
        if (value > 0 && formData.price > 0 && value >= formData.price) {
          return { isValid: false, message: 'El precio de costo debe ser menor al precio de venta' };
        }
        return { isValid: true, message: 'Precio de costo válido' };

      case 'categoryId':
        if (!value || !value.trim()) {
          return { isValid: false, message: 'Debe seleccionar una categoría' };
        }
        return { isValid: true, message: 'Categoría válida' };

      case 'images':
        if (!value || value.length === 0) {
          return { isValid: true, message: 'Imágenes opcionales' };
        }
        if (value.length > 5) {
          return { isValid: false, message: 'Máximo 5 imágenes permitidas' };
        }
        return { isValid: true, message: `${value.length} imagen(es) válida(s)` };

      default:
        return { isValid: null, message: '' };
    }
  }, [formData.price, formData.costPrice, productTerm]);

  /**
   * Actualiza un campo del formulario con validación en tiempo real
   */
  const updateField = useCallback(<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Para el nombre, no validar inmediatamente (usamos debounce)
    if (field === 'name') {
      // Limpiar errores cuando el usuario empiece a escribir
      if (errors[field] || submitError) {
        setErrors(prev => ({ ...prev, [field]: '' }));
        setSubmitError('');
      }
      return;
    }
    
    // Validar otros campos en tiempo real
    const validation = validateField(field, value);
    setValidationState(prev => ({
      ...prev,
      [field]: validation
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors, validateField]);

  /**
   * Valida el nombre del producto con verificación de duplicados
   */
  const validateProductName = useCallback(async (name: string) => {
    if (!name.trim()) {
      return { isValid: false, message: 'El nombre es requerido' };
    }

    if (name.trim().length < 2) {
      return { isValid: false, message: 'El nombre debe tener al menos 2 caracteres' };
    }

    if (name.trim().length > 100) {
      return { isValid: false, message: 'El nombre no puede tener más de 100 caracteres' };
    }

    // Verificar duplicados solo si el nombre es válido
    try {
      setIsValidatingName(true);
      const excludeProductId = product?.id;
      const hasDuplicate = await productsService.hasProductWithName(
        storeId, 
        name.trim(), 
        excludeProductId
      );

      if (hasDuplicate) {
        return { isValid: false, message: 'Este nombre ya está en uso' };
      }

      return { isValid: true, message: 'Nombre disponible' };
    } catch (error) {
      return { isValid: null, message: '' };
    } finally {
      setIsValidatingName(false);
    }
  }, [storeId, product?.id]);

  /**
   * Debounce para la validación del nombre
   */
  useEffect(() => {
    if (!formData.name.trim() || isSubmitting) return;

    const timeoutId = setTimeout(() => {
      validateProductName(formData.name).then(validation => {
        setValidationState(prev => ({
          ...prev,
          name: validation
        }));
        
        if (!validation.isValid) {
          setErrors(prev => ({
            ...prev,
            name: validation.message
          }));
        } else {
          setErrors(prev => ({ ...prev, name: '' }));
        }
      });
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [formData.name, validateProductName, isSubmitting]);

  /**
   * Agrega una nueva categoría
   */
  const addCategory = useCallback(async () => {
    if (newCategory.trim()) {
      try {
        const categoryData = {
          name: newCategory.trim(),
          storeId,
          description: ''
        };
        const newCategoryDoc = await categoriesService.createCategory(storeId, categoryData);
        setAvailableCategories(prev => [...prev, newCategoryDoc]);
        updateField('categoryId', newCategoryDoc.id);
        setNewCategory('');
        setShowAddCategory(false);
        toast.success('Categoría creada exitosamente');
      } catch (error) {
        toast.error('Error al crear la categoría');
      }
    }
  }, [newCategory, storeId, updateField]);

  /**
   * Inicia la edición de una categoría
   */
  const startEditingCategory = useCallback((category: Category) => {
    setEditingCategory({ id: category.id, name: category.name });
  }, []);

  /**
   * Cancela la edición de categoría
   */
  const cancelEditingCategory = useCallback(() => {
    setEditingCategory(null);
  }, []);

  /**
   * Guarda los cambios de una categoría editada
   */
  const saveEditedCategory = useCallback(async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      // Verificar si ya existe una categoría con el mismo nombre (excluyendo la actual)
      const exists = await categoriesService.categoryExistsByName(
        storeId, 
        editingCategory.name.trim(), 
        editingCategory.id
      );
      
      if (exists) {
        toast.error('Ya existe una categoría con ese nombre');
        return;
      }

      await categoriesService.updateCategory(storeId, {
        id: editingCategory.id,
        name: editingCategory.name.trim()
      });

      // Actualizar la lista local
      setAvailableCategories(prev => 
        prev.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, name: editingCategory.name.trim() }
            : cat
        )
      );

      setEditingCategory(null);
      toast.success('Categoría actualizada exitosamente');
    } catch (error) {
      toast.error('Error al actualizar la categoría');
    }
  }, [editingCategory, storeId]);

  /**
   * Inicia el proceso de eliminación de categoría
   */
  const startDeleteCategory = useCallback(async (category: Category) => {
    try {
      // Verificar si hay productos en esta categoría
      const { hasProducts, count } = await categoriesService.hasProductsInCategory(storeId, category.id);
      
      if (hasProducts) {
        toast.error(
          `No se puede eliminar la categoría "${category.name}" porque tiene ${count} producto(s) asociado(s). ` +
          'Primero mueve los productos a otra categoría o elimínalos.'
        );
        return;
      }

      setCategoryToDelete(category);
      setShowDeleteConfirm(true);
    } catch (error) {
      toast.error('Error al verificar la categoría');
    }
  }, [storeId]);

  /**
   * Confirma la eliminación de una categoría
   */
  const confirmDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return;

    try {
      await categoriesService.hardDeleteCategory(storeId, categoryToDelete.id);
      
      // Actualizar la lista local
      setAvailableCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      
      // Si el producto actual tenía esa categoría, limpiar la selección
      if (formData.categoryId === categoryToDelete.id) {
        updateField('categoryId', '');
      }

      toast.success(`Categoría "${categoryToDelete.name}" eliminada exitosamente`);
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la categoría');
    } finally {
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, storeId, formData.categoryId, updateField]);

  /**
   * Cancela la eliminación de categoría
   */
  const cancelDeleteCategory = useCallback(() => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  }, []);

  /**
   * Agrega una nueva variante
   */
  const addVariant = useCallback(() => {
    if (newVariant.name.trim()) {
      const variant: ProductVariant = {
        id: Date.now().toString(),
        name: newVariant.name.trim(),
        price: newVariant.price,
      isAvailable: true
      };
      updateField('variants', [...formData.variants, variant]);
      setNewVariant({ name: '', price: 0 });
      toast.success('Variante agregada');
    }
  }, [newVariant, formData.variants, updateField]);

  /**
   * Elimina una variante
   */
  const removeVariant = useCallback((variantId: string) => {
    const updatedVariants = formData.variants.filter(v => v.id !== variantId);
    updateField('variants', updatedVariants);
    toast.success('Variante eliminada');
  }, [formData.variants, updateField]);

  /**
   * Agrega un nuevo tag
   */
  const addTag = useCallback(async () => {
    if (newTag.trim()) {
      try {
        // Verificar si el tag ya existe en la lista local
        const existingTag = availableTags.find(tag => 
          tag.name.toLowerCase() === newTag.trim().toLowerCase()
        );
        
        if (existingTag) {
          // Si existe, agregarlo a los tags seleccionados si no está ya
          if (!formData.tags.includes(existingTag.id)) {
            updateField('tags', [...formData.tags, existingTag.id]);
            toast.success('Tag agregado');
          } else {
            toast.info('Este tag ya está seleccionado');
          }
        } else {
          // Si no existe, crear uno nuevo
          const tagData = { name: newTag.trim() };
          const newTagDoc = await tagsService.createTag(storeId, tagData);
          setAvailableTags(prev => [...prev, newTagDoc]);
          updateField('tags', [...formData.tags, newTagDoc.id]);
          toast.success('Tag creado y agregado exitosamente');
        }
        setNewTag('');
      } catch (error) {
        console.error('Error al crear/agregar tag:', error);
        // No mostrar error si las colecciones están vacías
        if (error && typeof error === 'object' && 'code' in error && error.code !== 'failed-precondition') {
          toast.error('Error al agregar el tag');
        }
      }
    }
  }, [newTag, formData.tags, availableTags, storeId, updateField]);

  /**
   * Elimina un tag
   */
  const removeTag = useCallback((tagIdToRemove: string) => {
    const updatedTags = formData.tags.filter(tagId => tagId !== tagIdToRemove);
    updateField('tags', updatedTags);
    toast.success('Tag eliminado');
  }, [formData.tags, updateField]);

  /**
   * Agrega un tag existente desde la lista de disponibles
   */
  const addExistingTag = useCallback((tagId: string) => {
    if (!formData.tags.includes(tagId)) {
      updateField('tags', [...formData.tags, tagId]);
    }
  }, [formData.tags, updateField]);

  /**
   * Maneja la subida de múltiples imágenes
   */
  const handleImageUpload = useCallback((files: FileList) => {
    const newImages = Array.from(files);
    
    // Validar número total de imágenes (existentes + nuevas)
    const totalImages = existingImages.length + formData.images.length + newImages.length;
    if (totalImages > 5) {
      toast.error('Máximo 5 imágenes permitidas en total');
      return;
    }
    
    // Validar cada archivo
    for (const file of newImages) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`La imagen ${file.name} excede 10MB`);
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        return;
      }
    }
    
    updateField('images', [...formData.images, ...newImages]);
  }, [formData.images, existingImages.length, updateField]);

  /**
   * Elimina una imagen nueva
   */
  const removeImage = useCallback((index: number) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    updateField('images', updatedImages);
  }, [formData.images, updateField]);

  /**
   * Elimina una imagen existente
   */
  const removeExistingImage = useCallback(async (index: number) => {
    const imageUrl = existingImages[index];
    
    // Si tenemos la función onRemoveImage y estamos editando un producto
    if (onRemoveImage && product?.id) {
      try {
        const success = await onRemoveImage(product.id, imageUrl);
        if (success) {
          const updatedExistingImages = existingImages.filter((_, i) => i !== index);
          setExistingImages(updatedExistingImages);
          toast.success('Imagen eliminada exitosamente');
        }
      } catch (error) {
        toast.error('Error al eliminar la imagen');
      }
    } else {
      // Fallback: solo actualizar estado local
      const updatedExistingImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(updatedExistingImages);
    }
  }, [existingImages, onRemoveImage, product?.id]);



  /**
   * Valida el formulario completo
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const newValidationState: ValidationState = {
      name: validateField('name', formData.name),
      shortDescription: validateField('shortDescription', formData.shortDescription),
      description: validateField('description', formData.description),
      price: validateField('price', formData.price),
      costPrice: validateField('costPrice', formData.costPrice),
      categoryId: validateField('categoryId', formData.categoryId),
      images: validateField('images', formData.images)
    };
    
    // Recopilar errores
    Object.entries(newValidationState).forEach(([field, validation]) => {
      if (validation.isValid === false) {
        newErrors[field] = validation.message;
      }
    });
    
    setValidationState(newValidationState);
    setErrors(newErrors);
    
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setSubmitError('');
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Verificar si existe un producto con el mismo nombre
      const productName = formData.name.trim();
      const excludeProductId = product?.id; // Excluir producto actual al editar
      
      const hasDuplicateName = await productsService.hasProductWithName(
        storeId, 
        productName, 
        excludeProductId
      );
      
      if (hasDuplicateName) {
        const errorMessage = 'Este nombre ya está en uso';
        setSubmitError(errorMessage);
        toast.error(
          product 
            ? 'Ya existe otro producto con este nombre. Por favor elige un nombre diferente.'
            : 'Ya existe un producto con este nombre. Por favor elige un nombre diferente.'
        );
        setValidationState(prev => ({
          ...prev,
          name: { isValid: false, message: errorMessage }
        }));
        setErrors(prev => ({
          ...prev,
          name: errorMessage
        }));
        setIsSubmitting(false);
        return;
      }
      
      // Combinar imágenes existentes con nuevas imágenes
      const allImages = [...existingImages, ...formData.images];
      
      const productData: CreateProductData | UpdateProductData = {
        name: formData.name.trim(),
        shortDescription: formData.shortDescription.trim() || undefined,
        description: formData.description.trim(),
        price: formData.price,
        costPrice: formData.costPrice,
        categoryId: formData.categoryId,
        images: allImages,
        status: 'active',
        variants: formData.variants.length > 0 ? formData.variants : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        hasPromotion: formData.hasPromotion
      };
      
      if (product) {
        (productData as UpdateProductData).id = product.id;
      }
      
      const success = await onSave(productData);
      
      if (success) {
        toast.success(`${ProductTerm} ${product ? 'actualizado' : 'creado'} exitosamente`);
        onCancel(); // Cerrar formulario
      }
    } catch (error) {
      toast.error(`Error al ${product ? 'actualizar' : 'crear'} el ${productTerm}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSave, product, ProductTerm, productTerm, onCancel]);

  if (loadingCategories || loadingTags) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }
 
  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6">
        {/* Header integrado */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {product ? `Editar ${ProductTerm}` : `Crear Nuevo ${ProductTerm}`}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Completa los datos para {product ? 'actualizar' : 'crear'} un nuevo {productTerm}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="space-y-4 sm:space-y-6">
          {/* Información básica */}
          <div className="space-y-3 sm:space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-sm sm:text-base font-medium text-gray-900">
                Información del {ProductTerm}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Completa los datos básicos del {productTerm}
              </p>
            </div>

            {/* Nombre */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Nombre del {productTerm} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={cn(
                  'w-full px-2 sm:px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base',
                  validationState.name.isValid === false && 'border-red-500',
                  validationState.name.isValid === true && 'border-green-500',
                  validationState.name.isValid === null && 'border-gray-300',
                  isValidatingName && 'border-blue-300'
                )}
                placeholder={`Ingresa el nombre del ${productTerm}`}
                disabled={isSubmitting}
              />
              {isValidatingName && (
                <div className="flex items-center space-x-1 text-blue-600 mt-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verificando disponibilidad...</span>
                </div>
              )}
              {!isValidatingName && validationState.name.isValid === true && (
                <div className="flex items-center space-x-1 text-green-600 mt-1">
                  <Check className="w-4 h-4" />
                  <span className="text-sm">{validationState.name.message}</span>
                </div>
              )}
              {!isValidatingName && validationState.name.isValid === false && (
                <div className="flex items-center space-x-1 text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{validationState.name.message}</span>
                </div>
              )}
            </div>

            {/* Descripción corta */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Descripción corta <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => updateField('shortDescription', e.target.value)}
                className={cn(
                  'w-full px-2 sm:px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base',
                  validationState.shortDescription.isValid === false && 'border-red-500',
                  validationState.shortDescription.isValid === true && 'border-green-500',
                  validationState.shortDescription.isValid === null && 'border-gray-300'
                )}
                placeholder="Descripción breve del producto (máx. 150 caracteres)"
                maxLength={150}
              />
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-1">
                  {validationState.shortDescription.isValid === true && (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">{validationState.shortDescription.message}</span>
                    </>
                  )}
                  {validationState.shortDescription.isValid === false && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">{validationState.shortDescription.message}</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formData.shortDescription.length}/150 caracteres
                </span>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className={cn(
                  'w-full px-2 sm:px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-sm sm:text-base',
                  validationState.description.isValid === false && 'border-red-500',
                  validationState.description.isValid === true && 'border-green-500',
                  validationState.description.isValid === null && 'border-gray-300'
                )}
                placeholder={`Descripción detallada del ${productTerm}`}
              />
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center space-x-1">
                  {validationState.description.isValid === true && (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">{validationState.description.message}</span>
                    </>
                  )}
                  {validationState.description.isValid === false && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">{validationState.description.message}</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formData.description.length}/500 caracteres
                </span>
              </div>
            </div>
          </div>

          {/* Categoría */}
          <div className="space-y-3">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-sm sm:text-base font-medium text-gray-900">
                Categoría
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Selecciona la categoría que mejor describa tu {productTerm}
              </p>
            </div>
            <div className="flex space-x-2">
              <select
                value={formData.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className={cn(
                  'flex-1 px-2 sm:px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base',
                  validationState.categoryId.isValid === false && 'border-red-500',
                  validationState.categoryId.isValid === true && 'border-green-500',
                  validationState.categoryId.isValid === null && 'border-gray-300'
                )}
              >
                <option value="">Selecciona una categoría</option>
                {loadingCategories ? (
                  <option disabled>Cargando categorías...</option>
                ) : availableCategories.length === 0 ? (
                  <option disabled>No hay categorías disponibles - Crea una nueva</option>
                ) : (
                  availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="px-3 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
                title="Agregar nueva categoría"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {validationState.categoryId.isValid === true && (
              <div className="flex items-center space-x-1 text-green-600 mt-2">
                <Check className="w-4 h-4" />
                <span className="text-sm">{validationState.categoryId.message}</span>
              </div>
            )}
            {validationState.categoryId.isValid === false && (
              <div className="flex items-center space-x-1 text-red-600 mt-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{validationState.categoryId.message}</span>
              </div>
            )}

            {/* Gestión de categorías existentes */}
            {availableCategories.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Gestionar categorías existentes:
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {availableCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      {editingCategory?.id === category.id ? (
                        // Modo edición
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            placeholder="Nombre de la categoría"
                            onKeyPress={(e) => e.key === 'Enter' && saveEditedCategory()}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={saveEditedCategory}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            title="Guardar"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditingCategory}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        // Modo visualización
                        <>
                          <span className="text-sm font-medium text-gray-900 flex-1">
                            {category.name}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => startEditingCategory(category)}
                              className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs transition-colors"
                              title="Editar categoría"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startDeleteCategory(category)}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs transition-colors"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {showAddCategory && (
              <div className="flex space-x-2 mt-3 p-3 bg-gray-50 rounded-lg border">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nombre de la nueva categoría"
                  className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Crear
                </button>
              </div>
            )}
          </div>

          {/* Precios */}
          <div className="space-y-3 sm:space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-sm sm:text-base font-medium text-gray-900 flex items-center">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Información de Precios
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Configura los precios de costo y venta de tu {productTerm}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              {/* Precio de costo */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Precio de costo <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => updateField('costPrice', parseFloat(e.target.value) || 0)}
                    className={cn(
                      'w-full pl-6 sm:pl-8 pr-2 sm:pr-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base',
                      validationState.costPrice.isValid === false && 'border-red-500',
                      validationState.costPrice.isValid === true && 'border-green-500',
                      validationState.costPrice.isValid === null && 'border-gray-300'
                    )}
                    placeholder="0.00"
                  />
                </div>
                {validationState.costPrice.isValid === true && (
                  <div className="flex items-center space-x-1 text-green-600 mt-1">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{validationState.costPrice.message}</span>
                  </div>
                )}
                {validationState.costPrice.isValid === false && (
                  <div className="flex items-center space-x-1 text-red-600 mt-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{validationState.costPrice.message}</span>
                  </div>
                )}
              </div>

              {/* Precio de venta */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Precio de venta *
                </label>
                <div className="relative">
                  <span className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                    className={cn(
                      'w-full pl-6 sm:pl-8 pr-2 sm:pr-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base',
                      validationState.price.isValid === false && 'border-red-500',
                      validationState.price.isValid === true && 'border-green-500',
                      validationState.price.isValid === null && 'border-gray-300'
                    )}
                    placeholder="0.00"
                  />
                </div>
                {validationState.price.isValid === true && (
                  <div className="flex items-center space-x-1 text-green-600 mt-1">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{validationState.price.message}</span>
                  </div>
                )}
                {validationState.price.isValid === false && (
                  <div className="flex items-center space-x-1 text-red-600 mt-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">{validationState.price.message}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Margen de ganancia */}
            {formData.price > 0 && formData.costPrice > 0 && (
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                  <span className="text-xs sm:text-sm font-medium text-blue-900">Margen de ganancia:</span>
                  <span className="text-xs sm:text-sm font-bold text-blue-900">
                    ${((formData.price || 0) - (formData.costPrice || 0)).toFixed(2)} 
                    ({(((formData.price || 0) - (formData.costPrice || 0)) / (formData.price || 1) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Promoción */}
          <div className="space-y-2">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-sm sm:text-base font-medium text-gray-900">
                Promoción
              </h3>
            </div>
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="hasPromotion"
                checked={formData.hasPromotion}
                onChange={(e) => updateField('hasPromotion', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
              />
              <div>
                <label htmlFor="hasPromotion" className="text-xs sm:text-sm text-gray-700 font-medium">
                  Este {productTerm} tiene una promoción activa
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Marca esta opción si el {productTerm} tiene descuentos o promociones especiales
                </p>
              </div>
            </div>
          </div>

          {/* Imágenes */}
          <div className="space-y-3 sm:space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-sm sm:text-base font-medium text-gray-900 flex items-center">
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Imágenes del {productTerm}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Agrega hasta 5 imágenes para mostrar tu {productTerm}
              </p>
            </div>
            
            {/* Imágenes existentes */}
            {existingImages.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <h4 className="text-xs font-medium text-gray-700 mb-1 sm:mb-2">Imágenes actuales:</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                  {existingImages.map((imageUrl, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Imagen existente ${index + 1}`}
                        className="w-full h-16 sm:h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Eliminar imagen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                        Actual
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Subir nuevas imágenes */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400 mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm text-gray-600">
                  Haz clic para subir nuevas imágenes
                </p>
                <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                  Máximo {5 - existingImages.length - formData.images.length} imágenes más, 10MB cada una
                </p>
              </label>
            </div>
            
            {/* Vista previa de nuevas imágenes */}
            {formData.images.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <h4 className="text-xs font-medium text-gray-700 mb-1 sm:mb-2">Nuevas imágenes:</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                  {formData.images.map((image, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Nueva imagen ${index + 1}`}
                        className="w-full h-16 sm:h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Eliminar imagen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                        Nueva
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Variantes */}
          <div className="space-y-3 sm:space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-sm sm:text-base font-medium text-gray-900">
                Variantes del {productTerm} <span className="text-gray-400 text-xs">(opcional)</span>
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Agrega variantes como tamaños, colores o características adicionales
              </p>
            </div>
            
            {/* Variantes existentes */}
            {formData.variants.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Variantes configuradas:</h4>
                <div className="space-y-2">
                  {formData.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center space-x-3 p-3 bg-white border rounded-lg">
                      <span className="flex-1 font-medium text-gray-900">{variant.name}</span>
                      <span className="text-sm font-medium text-green-600">
                        +${(variant.price || 0).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVariant(variant.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Eliminar variante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Agregar nueva variante */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Agregar nueva variante:</h4>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre de la variante"
                  className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newVariant.price}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="Precio adicional"
                  className="w-full sm:w-32 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={addVariant}
                  disabled={!newVariant.name.trim()}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3 sm:space-y-4">
            <div className="border-b border-gray-200 pb-2">
              <h3 className="text-sm sm:text-base font-medium text-gray-900 flex items-center">
                <TagIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Tags/Etiquetas <span className="text-gray-400 text-xs">(opcional)</span>
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Agrega etiquetas para ayudar a categorizar y encontrar tu {productTerm}
              </p>
            </div>
            
            {/* Tags seleccionados */}
            <div className="mb-4">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Tags seleccionados:</h4>
              <div className="flex flex-wrap gap-2 min-h-[2rem] p-2 bg-white rounded-lg border">
                {formData.tags.length === 0 ? (
                  <p className="text-sm text-gray-500 italic flex items-center">
                    No hay tags seleccionados
                  </p>
                ) : (
                  formData.tags.map((tagId) => {
                    const tag = availableTags.find(t => t.id === tagId);
                    return (
                      <span
                        key={tagId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {tag?.name || `Tag ${tagId}`}
                        <button
                          type="button"
                          onClick={() => removeTag(tagId)}
                          className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Eliminar tag"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Tags disponibles para seleccionar */}
            {availableTags.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Tags disponibles (haz clic para agregar):
                </h4>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 bg-white rounded-lg border">
                  {availableTags
                    .filter(tag => !formData.tags.includes(tag.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => addExistingTag(tag.id)}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-50 text-gray-700 border border-gray-300 hover:bg-gray-100 hover:border-blue-300 transition-colors"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {tag.name}
                      </button>
                    ))
                  }
                  {availableTags.filter(tag => !formData.tags.includes(tag.id)).length === 0 && (
                    <p className="text-sm text-gray-500 italic flex items-center justify-center w-full py-2">
                      Todos los tags disponibles están seleccionados
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Crear nuevo tag */}
            <div>
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Crear nuevo tag:</h4>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nombre del nuevo tag"
                  className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Crear
                </button>
              </div>
            </div>
          </div>



          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
            >
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  {product ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {product ? `Actualizar ${productTerm}` : `Crear ${productTerm}`}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Modal de confirmación para eliminar categoría */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Eliminar Categoría
                </h3>
                <p className="text-sm text-gray-500">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                ¿Estás seguro de que quieres eliminar la categoría{' '}
                <span className="font-semibold">&ldquo;{categoryToDelete.name}&rdquo;</span>?
              </p>
              
              {categoryToDelete.hasProducts && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-red-800 font-medium">
                        No se puede eliminar esta categoría
                      </p>
                      <p className="text-red-700 mt-1">
                        Esta categoría tiene productos asociados. Para eliminarla, 
                        primero debes reasignar o eliminar todos los productos de esta categoría.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={cancelDeleteCategory}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              {!categoryToDelete.hasProducts && (
                <button
                  type="button"
                  onClick={confirmDeleteCategory}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductForm;