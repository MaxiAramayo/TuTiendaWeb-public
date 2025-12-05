/**
 * Selector avanzado de productos para ventas
 * 
 * Funcionalidades:
 * - Búsqueda de productos
 * - Filtros por categoría
 * - Manejo de cantidades
 * - Gestión de extras/topics
 * - Notas personalizadas
 * 
 * @module features/dashboard/modules/sells/components
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Minus, X, Package, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { Product, ProductInCart, Topics } from "@/shared/types/store";
import { Product as ProductDocument, Category } from "@/shared/types/firebase.types";
import Image from "next/image";

/**
 * Convierte ProductDocument a Product para compatibilidad
 * Mapea variants de Firebase a topics del store
 */
const mapProductDocumentToProduct = (productDoc: ProductDocument): Product => {
  // Mapear variantes de Firebase a Topics del store
  const topics: Topics[] = productDoc.variants
    ?.filter(v => v.isAvailable)
    ?.map(variant => ({
      id: variant.id,
      name: variant.name,
      price: variant.price
    })) || [];

  return {
    id: productDoc.id,
    idProduct: productDoc.id, // Usar id como idProduct
    idStore: productDoc.storeId || '', 
    name: productDoc.name,
    description: productDoc.description || '',
    price: productDoc.price,
    image: productDoc.imageUrls?.[0],
    imageUrl: productDoc.imageUrls?.[0],
    category: productDoc.categoryId, // Mapear categoryId a category
    available: productDoc.status === 'active',
    stock: productDoc.stockQuantity || 0,
    topics: topics // Variantes convertidas a topics
  };
};

interface ProductSelectorProps {
  /** Productos disponibles para seleccionar (Firebase Type) */
  products: ProductDocument[];
  /** Categorías para mostrar nombres en lugar de IDs */
  categories?: Category[];
  /** Productos actualmente seleccionados */
  selectedProducts: ProductInCart[];
  /** Callback para agregar producto */
  onAddProduct: (product: ProductInCart) => void;
  /** Callback para actualizar cantidad */
  onUpdateQuantity: (productId: string, cantidad: number) => void;
  /** Callback para remover producto */
  onRemoveProduct: (productId: string) => void;
}

/**
 * Componente selector de productos con funcionalidades avanzadas
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products: productsFromProps,
  categories = [],
  selectedProducts,
  onAddProduct,
  onUpdateQuantity,
  onRemoveProduct
}) => {

  // Crear mapa de categoryId -> categoryName
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(cat => {
      map.set(cat.id, cat.name);
    });
    return map;
  }, [categories]);

  // Función helper para obtener nombre de categoría
  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return 'Sin categoría';
    return categoryNameMap.get(categoryId) || categoryId;
  };

  // Mapear ProductDocument[] a Product[]
  const products = useMemo(() => {
    return productsFromProps.map(mapProductDocumentToProduct);
  }, [productsFromProps]);

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [productToAdd, setProductToAdd] = useState<Product | null>(null);
  const [addingProduct, setAddingProduct] = useState({
    cantidad: 1,
    aclaracion: "",
    selectedTopics: [] as Topics[]
  });

  // Filtrar productos disponibles
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      // Filtro de búsqueda
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de categoría
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;

      // Filtro de disponibilidad
      const matchesAvailability = !showAvailableOnly || product.available !== false;

      // No mostrar productos ya seleccionados
      const notAlreadySelected = !selectedProducts.some(sp => sp.idProduct === product.idProduct);

      return matchesSearch && matchesCategory && matchesAvailability && notAlreadySelected;
    });
  }, [products, searchTerm, selectedCategory, showAvailableOnly, selectedProducts]);

  // Obtener IDs de categorías únicas de los productos
  const uniqueCategoryIds = useMemo(() => {
    if (!products) return [];
    const categoriesSet = new Set(products.map(p => p.category).filter((cat): cat is string => Boolean(cat)));
    return Array.from(categoriesSet);
  }, [products]);

  /**
   * Inicia el proceso de agregar un producto
   */
  const handleSelectProduct = (product: Product) => {
    setProductToAdd(product);
    setAddingProduct({
      cantidad: 1,
      aclaracion: "",
      selectedTopics: []
    });
  };

  /**
   * Cancela la adición de producto
   */
  const handleCancelAdd = () => {
    setProductToAdd(null);
    setAddingProduct({
      cantidad: 1,
      aclaracion: "",
      selectedTopics: []
    });
  };

  /**
   * Confirma la adición del producto
   */
  const handleConfirmAdd = () => {
    if (!productToAdd) return;

    const productInCart: ProductInCart = {
      ...productToAdd,
      id: `${productToAdd.idProduct}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID único para el carrito
      cantidad: addingProduct.cantidad,
      aclaracion: addingProduct.aclaracion || undefined,
      topics: addingProduct.selectedTopics.length > 0 ? addingProduct.selectedTopics : undefined
    };

    onAddProduct(productInCart);
    handleCancelAdd();
  };

  /**
   * Maneja la selección/deselección de topics
   */
  const handleTopicToggle = (topic: Topics) => {
    setAddingProduct(prev => ({
      ...prev,
      selectedTopics: prev.selectedTopics.some(t => t.id === topic.id)
        ? prev.selectedTopics.filter(t => t.id !== topic.id)
        : [...prev.selectedTopics, topic]
    }));
  };

  /**
   * Calcula el precio total de un producto con sus extras
   */
  const calculateProductPrice = (basePrice: number, topics: Topics[] = []) => {
    const topicsPrice = topics.reduce((sum, topic) => sum + topic.price, 0);
    return basePrice + topicsPrice;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Seleccionar Productos
          {selectedProducts.length > 0 && (
            <Badge variant="secondary">
              {selectedProducts.length} seleccionado{selectedProducts.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro por categoría */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {uniqueCategoryIds.map((categoryId: string) => (
                <SelectItem key={categoryId} value={categoryId}>
                  {getCategoryName(categoryId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de disponibilidad */}
          <div className="flex items-center space-x-2">
            <input
              id="available-only"
              type="checkbox"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="available-only" className="text-sm">
              Solo disponibles
            </Label>
          </div>
        </div>

        {/* Productos seleccionados */}
        {selectedProducts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Productos en el pedido:</h4>
            <div className="space-y-2">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div>
                        <h5 className="font-medium">{product.name}</h5>
                        <div className="text-sm text-gray-600">
                          ${product.price.toFixed(2)}
                          {product.topics && product.topics.length > 0 && (
                            <span> + extras</span>
                          )}
                        </div>
                        {product.aclaracion && (
                          <p className="text-xs text-gray-500 mt-1">
                            Nota: {product.aclaracion}
                          </p>
                        )}
                        {product.topics && product.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.topics.map((topic) => (
                              <Badge key={topic.id} variant="outline" className="text-xs">
                                {topic.name} (+${topic.price.toFixed(2)})
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Controles de cantidad */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(product.id, Math.max(1, product.cantidad - 1))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {product.cantidad}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(product.id, product.cantidad + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Precio total */}
                    <div className="text-right min-w-[70px]">
                      <div className="font-bold">
                        ${(calculateProductPrice(product.price, product.topics) * product.cantidad).toFixed(2)}
                      </div>
                    </div>

                    {/* Botón eliminar */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveProduct(product.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Modal de configuración de producto */}
        {productToAdd && (
          <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-blue-900">
                Configurar: {productToAdd.name}
              </h4>
              <Button variant="ghost" size="sm" onClick={handleCancelAdd}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cantidad */}
              <div>
                <Label>Cantidad</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingProduct(prev => ({
                      ...prev,
                      cantidad: Math.max(1, prev.cantidad - 1)
                    }))}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={addingProduct.cantidad}
                    onChange={(e) => setAddingProduct(prev => ({
                      ...prev,
                      cantidad: Math.max(1, parseInt(e.target.value) || 1)
                    }))}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingProduct(prev => ({
                      ...prev,
                      cantidad: prev.cantidad + 1
                    }))}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Precio base */}
              <div>
                <Label>Precio base</Label>
                <div className="mt-1 font-medium text-lg">
                  ${productToAdd.price.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Extras/Variantes del producto */}
            {productToAdd.topics && productToAdd.topics.length > 0 && (
              <div>
                <Label>Extras / Variantes disponibles</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {productToAdd.topics.map((topic) => (
                    <label
                      key={topic.id}
                      className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                        addingProduct.selectedTopics.some(t => t.id === topic.id)
                          ? 'bg-blue-100 border-blue-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={addingProduct.selectedTopics.some(t => t.id === topic.id)}
                          onChange={() => handleTopicToggle(topic)}
                          className="rounded"
                        />
                        <span className="text-sm">{topic.name}</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        +${topic.price.toFixed(2)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Notas */}
            <div>
              <Label htmlFor="product-notes">Notas (opcional)</Label>
              <Textarea
                id="product-notes"
                placeholder="Comentarios especiales para este producto..."
                value={addingProduct.aclaracion}
                onChange={(e) => setAddingProduct(prev => ({
                  ...prev,
                  aclaracion: e.target.value
                }))}
                rows={2}
              />
            </div>

            {/* Resumen de precio */}
            <div className="bg-white p-3 rounded border">
              <div className="flex justify-between items-center">
                <span>Precio total:</span>
                <span className="font-bold text-lg">
                  ${(calculateProductPrice(productToAdd.price, addingProduct.selectedTopics) * addingProduct.cantidad).toFixed(2)}
                </span>
              </div>
              {addingProduct.selectedTopics.length > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  Base: ${productToAdd.price.toFixed(2)} + Extras: ${addingProduct.selectedTopics.reduce((sum, t) => sum + t.price, 0).toFixed(2)}
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancelAdd}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar al pedido
              </Button>
            </div>
          </div>
        )}

        {/* Lista de productos disponibles */}
        <div>
          <h4 className="font-medium mb-3">
            Productos disponibles ({filteredProducts.length})
          </h4>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay productos disponibles</p>
              <p className="text-sm">
                {searchTerm ? 'Prueba con otros términos de búsqueda' : 'Agrega productos a tu inventario'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredProducts.map((product: Product) => (
                <div
                  key={`product-${product.idProduct}`}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="flex items-start gap-3">
                    {product.image && (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-sm truncate">
                        {product.name}
                      </h5>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-green-600">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.topics && product.topics.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.topics.length} extras
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card >
  );
};

export default ProductSelector;
