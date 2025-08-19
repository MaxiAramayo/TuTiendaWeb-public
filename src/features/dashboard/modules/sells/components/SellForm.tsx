/**
 * Formulario avanzado de ventas con validación Zod y ProductSelector
 *
 * Funcionalidades mejoradas:
 * - Validación completa con Zod + React Hook Form
 * - Selector de productos con búsqueda y topics
 * - Cálculo automático de totales
 * - Estados simplificados de venta y pago
 *
 * @module features/dashboard/modules/sells/components
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  SaveIcon,
  Phone,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSellStore } from "@/features/dashboard/modules/sells/api/sellStore";
import { useAuthStore } from "@/features/auth/api/authStore";
import { ProductSelector } from "./ProductSelector";
import { ProductInCart } from "@/shared/types/store";
import { z } from "zod";

// === TIPOS Y VALIDACIONES ===
import {
  OptimizedSell as Sell,
} from "../types/optimized-sell";
import {
  SELL_SOURCES,
} from "../types/constants";

// Schema de validación con validación condicional para dirección
const sellSchema = z.object({
  customerName: z.string().min(1, "Nombre del cliente es requerido"),
  customerPhone: z.string().optional(),
  orderNumber: z.string().optional(),
  date: z.date(),
  deliveryDate: z.date().optional(),
  products: z.array(z.any()),
  subtotal: z.number(),
  total: z.number(),
  status: z.string(),
  paymentStatus: z.string(),
  paymentMethod: z.string(),
  deliveryMethod: z.string(),
  source: z.string(),
  notes: z.string().optional(),
  discount: z.any().optional(),
  tax: z.any().optional(),
  address: z.string().optional(),
  deliveryNotes: z.string().optional(),
}).refine((data) => {
  // Validar que la dirección sea obligatoria para delivery y shipping
  if ((data.deliveryMethod === 'delivery' || data.deliveryMethod === 'shipping') && !data.address?.trim()) {
    return false;
  }
  return true;
}, {
  message: "La dirección es obligatoria para envío a domicilio y envío por correo",
  path: ["address"]
});

type SellInput = z.infer<typeof sellSchema>;

import { validateSellTotals } from '@shared/validations';

interface SellFormProps {
  /** ID de la venta a editar (undefined para nueva venta) */
  sellId?: string;
  /** Venta existente para editar */
  sell?: Sell;
  /** ID de la tienda */
  storeId: string;
  /** Callback al guardar exitosamente */
  onSuccess?: () => void;
  /** Callback al cancelar */
  onCancel?: () => void;
  /** Modo de solo lectura */
  readOnly?: boolean;
}

/**
 * Formulario mejorado para crear/editar ventas con ProductSelector
 */
export const SellForm: React.FC<SellFormProps> = ({
  sellId,
  sell,
  storeId,
  onSuccess,
  onCancel,
  readOnly = false,
}) => {
  const router = useRouter();
  const { addSell, updateSell, isLoading, getSellById } = useSellStore();
  const { user } = useAuthStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductInCart[]>([]);

  const form = useForm<SellInput>({
    resolver: zodResolver(sellSchema),
    mode: 'onChange', // Validar en tiempo real
    defaultValues: {
      customerName: sell?.customerName || "",
      customerPhone: sell?.customerPhone || "",
      orderNumber: sell?.orderNumber || "",
      date: sell?.date || new Date(),
      deliveryDate: sell?.deliveryDate || undefined,
      products: [],
      subtotal: 0,
      total: 0,
      status: sell?.status || "pending",
      paymentStatus: sell?.paymentStatus || "pending",
      paymentMethod: sell?.paymentMethod || "efectivo",
      deliveryMethod: sell?.deliveryMethod || "pickup",
      source: sell?.source || "local",
      notes: sell?.notes || "",
      discount: undefined, // Cambiado a undefined para evitar problemas
      tax: undefined,      // Cambiado a undefined para evitar problemas
      address: sell?.address || "",
      deliveryNotes: sell?.deliveryNotes || "",
    },
  });

  // Cargar venta existente si solo se proporciona ID
  useEffect(() => {
    if (sellId && !sell && storeId) {
      getSellById(storeId, sellId).then((fetchedSell) => {
        if (fetchedSell) {
          form.reset({
            customerName: fetchedSell.customerName || "",
            customerPhone: fetchedSell.customerPhone || "",
            orderNumber: fetchedSell.orderNumber || "",
            date: fetchedSell.date || new Date(),
            deliveryDate: fetchedSell.deliveryDate || undefined,
            products: [],
            subtotal: fetchedSell.subtotal || 0,
            total: fetchedSell.total || 0,
            status: fetchedSell.status || "pending",
            paymentStatus: fetchedSell.paymentStatus || "pending",
            paymentMethod: fetchedSell.paymentMethod || "efectivo",
            deliveryMethod: fetchedSell.deliveryMethod || "pickup",
            source: fetchedSell.source || "local",
            notes: fetchedSell.notes || "",
            address: fetchedSell.address || "",
            deliveryNotes: fetchedSell.deliveryNotes || "",
            discount: fetchedSell.discount || { type: "fixed", value: 0 },
            tax: fetchedSell.tax || { amount: 0 },
          });
          
          // Convertir productos a ProductInCart
          if (fetchedSell.products) {
            const convertedProducts: ProductInCart[] = fetchedSell.products.map(product => ({
              id: `${product.idProduct}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              idProduct: product.idProduct,
              name: product.name,
              description: "", // ProductInSell no tiene description
              price: product.price,
              cantidad: product.cantidad,
              category: product.category,
              aclaracion: product.aclaracion,
              topics: product.appliedTopics?.map(topic => ({
                id: topic.id,
                name: topic.name,
                price: topic.price
              }))
            }));
            setSelectedProducts(convertedProducts);
          }
        }
      });
    }
  }, [sellId, sell, storeId, getSellById, form]);

  // Inicializar productos seleccionados desde la venta existente
  useEffect(() => {
    if (sell?.products) {
      const convertedProducts: ProductInCart[] = sell.products.map(product => ({
        id: `${product.idProduct}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        idProduct: product.idProduct,
        name: product.name,
        description: "", // ProductInSell no tiene description
        price: product.price,
        cantidad: product.cantidad,
        category: product.category,
        aclaracion: product.aclaracion,
        topics: product.appliedTopics?.map(topic => ({
          id: topic.id,
          name: topic.name,
          price: topic.price
        }))
      }));
      setSelectedProducts(convertedProducts);
    }
  }, [sell]);

  // Calcular totales automáticamente basados en productos seleccionados
  useEffect(() => {
    if (selectedProducts.length > 0) {
      const productTotal = selectedProducts.reduce((sum, product) => {
        const basePrice = product.price || 0;
        const topicsPrice = product.topics?.reduce((topicSum, topic) => topicSum + topic.price, 0) || 0;
        const totalPrice = basePrice + topicsPrice;
        return sum + totalPrice * (product.cantidad || 0);
      }, 0);

      let calculatedTotal = productTotal;

      // Aplicar descuento
      const discount = form.watch("discount");
      if (discount?.value) {
        const discountAmount =
          discount.type === "percentage"
            ? (productTotal * discount.value) / 100
            : discount.value;
        calculatedTotal -= discountAmount;
      }

      // Aplicar impuestos
      const tax = form.watch("tax");
      if (tax?.amount) {
        calculatedTotal += tax.amount;
      }

      form.setValue("subtotal", productTotal);
      form.setValue("total", Math.max(0, calculatedTotal));
      
      // Actualizar los productos en el formulario
      const formProducts = selectedProducts.map(product => ({
        id: product.id,
        idProduct: product.idProduct,
        name: product.name,
        price: product.price,
        cantidad: product.cantidad,
        category: product.category || "",
        aclaracion: product.aclaracion || "",
      }));
      form.setValue("products", formProducts);
    } else {
      form.setValue("subtotal", 0);
      form.setValue("total", 0);
      form.setValue("products", []);
    }
  }, [selectedProducts, form]);

  const onSubmit = async (data: SellInput) => {
    try {
      // Validar que hay productos
      if (selectedProducts.length === 0) {
        form.setError("products", {
          message: "Debe agregar al menos un producto",
        });
        return;
      }

      // Validar totales antes de enviar
       const totalsValidation = validateSellTotals(data);
       
       if (!totalsValidation.success) {
        form.setError("total", {
          message: "Los totales calculados no coinciden",
        });
        return;
      }

      // Convertir ProductInCart a ProductInSell para la venta
      const sellProducts = selectedProducts.map(product => ({
        id: product.id,
        idProduct: product.idProduct,
        name: product.name,
        price: product.price,
        category: product.category || "",
        cantidad: product.cantidad,
        aclaracion: product.aclaracion || "",
        appliedTopics: product.topics?.map(topic => ({
          id: topic.id,
          name: topic.name,
          price: topic.price
        })) || []
      }));

      const sellData: Sell = {
        id: sell?.id || sellId || "",
        orderNumber: data.orderNumber || "ORD-" + Date.now(),
        customerName: data.customerName || "",
        customerPhone: data.customerPhone || "",
        products: sellProducts,
        subtotal: data.subtotal || 0,
        total: data.total || 0,
        date: data.date || new Date(),
        deliveryDate: data.deliveryDate,
        deliveryMethod: data.deliveryMethod || "pickup",
        address: data.address || "",
        deliveryNotes: data.deliveryNotes || "",
        paymentMethod: data.paymentMethod || "efectivo",
        paymentStatus: data.paymentStatus || "pending",
        status: data.status || "pending",
        notes: data.notes || "",
        source: data.source || "local",
        createdBy: user?.id || "",
        discount: data.discount,
        tax: data.tax,
        updatedAt: new Date()
      } as Sell;

      let success = false;
      if (sell?.id || sellId) {
        success = await updateSell(sellData, storeId);
      } else {
        success = await addSell(sellData, storeId);
      }

      if (success) {
        onSuccess?.();
        if (!sell?.id && !sellId) {
          form.reset();
          setSelectedProducts([]);
        }
      }
    } catch (error) {
      console.error("Error al guardar venta:", error);
    }
  };

  // Funciones para manejar productos
  const handleAddProduct = (product: ProductInCart) => {
    setSelectedProducts(prev => [...prev, product]);
  };

  const handleUpdateQuantity = (productId: string, cantidad: number) => {
    setSelectedProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, cantidad }
          : product
      )
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(product => product.id !== productId));
  };

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }, [onCancel, router]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {sell?.id || sellId ? "Editar Venta" : "Nueva Venta"}
            </h1>
            {sell?.orderNumber && (
              <p className="text-muted-foreground">Orden: {sell.orderNumber}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showAdvanced}
            onChange={(e) => setShowAdvanced(e.target.checked)}
          />
          <Label>Opciones avanzadas</Label>
        </div>
      </div>

      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-6"
      >
        {/* Información del Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nombre del Cliente *</Label>
                <Controller
                  name="customerName"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="Nombre completo"
                      disabled={readOnly}
                    />
                  )}
                />
                {form.formState.errors.customerName && (
                  <p className="text-sm text-red-500">
                    {String(form.formState.errors.customerName?.message || "")}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="customerPhone">Teléfono</Label>
                <Controller
                  name="customerPhone"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="+54 9 11 1234-5678"
                      disabled={readOnly}
                    />
                  )}
                />
              </div>
            </div>

            {showAdvanced && (
              <div>
                <Label htmlFor="source">Canal de Venta</Label>
                <Controller
                  name="source"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "local"}
                      onValueChange={field.onChange}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar canal" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(SELL_SOURCES).map((source) => (
                          <SelectItem key={source} value={source}>
                            {source === "local" && "Local"}
                            {source === "whatsapp" && "WhatsApp"}
                            {source === "instagram" && "Instagram"}
                            {source === "web" && "Sitio Web"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selector de Productos */}
        <ProductSelector
          selectedProducts={selectedProducts}
          onAddProduct={handleAddProduct}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveProduct={handleRemoveProduct}
        />
        {form.formState.errors.products && (
          <p className="text-sm text-red-500 mt-2">
            {String(form.formState.errors.products?.message || "")}
          </p>
        )}

        {/* Totales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Totales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Subtotal</Label>
                <div className="text-lg font-semibold">
                  ${form.watch("subtotal")?.toFixed(2) || "0.00"}
                </div>
              </div>

              {showAdvanced && (
                <div>
                  <Label>Descuento</Label>
                  <div className="space-y-2">
                    <Controller
                      name="discount.type"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value || "fixed"}
                          onValueChange={field.onChange}
                          disabled={readOnly}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Porcentaje
                            </SelectItem>
                            <SelectItem value="fixed">Monto fijo</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <Controller
                      name="discount.value"
                      control={form.control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value || 0}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          disabled={readOnly}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      )}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Total</Label>
                <div className="text-xl font-bold text-green-600">
                  ${form.watch("total")?.toFixed(2) || "0.00"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de Entrega y Pago */}
        <Card>
          <CardHeader>
            <CardTitle>Entrega y Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Método de Entrega</Label>
                <Controller
                  name="deliveryMethod"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "pickup"}
                      onValueChange={field.onChange}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["pickup", "delivery", "shipping"].map((method) => (
                          <SelectItem key={method} value={method}>
                            {method === "pickup" && "Retiro en local"}
                            {method === "delivery" && "Envío a domicilio"}
                            {method === "shipping" && "Envío por correo"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label>Método de Pago</Label>
                <Controller
                  name="paymentMethod"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "efectivo"}
                      onValueChange={field.onChange}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "efectivo",
                          "tarjeta",
                          "transferencia",
                          "mercadopago",
                          "otro",
                        ].map((method) => (
                          <SelectItem key={method} value={method}>
                            {method === "efectivo" && "Efectivo"}
                            {method === "tarjeta" && "Tarjeta"}
                            {method === "transferencia" && "Transferencia"}
                            {method === "mercadopago" && "MercadoPago"}
                            {method === "otro" && "Otro"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {(form.watch("deliveryMethod") === "delivery" || form.watch("deliveryMethod") === "shipping") && (
              <div>
                <Label>Dirección de Entrega *</Label>
                <Controller
                  name="address"
                  control={form.control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Dirección completa..."
                      disabled={readOnly}
                      className={form.formState.errors.address ? "border-red-500" : ""}
                    />
                  )}
                />
                {form.formState.errors.address && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.address.message}
                  </p>
                )}
              </div>
            )}

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Estado de Venta</Label>
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value || "pending"}
                        onValueChange={field.onChange}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "pending",
                            "confirmed",
                          ].map((status) => (
                            <SelectItem key={status} value={status}>
                              {status === "pending" && "Pendiente"}
                              {status === "confirmed" && "Confirmada"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label>Estado de Pago</Label>
                  <Controller
                    name="paymentStatus"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value || "pending"}
                        onValueChange={field.onChange}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["pending", "paid", "partial", "refunded"].map(
                            (status) => (
                              <SelectItem key={status} value={status}>
                                {status === "pending" && "Pendiente"}
                                {status === "paid" && "Pagado"}
                                {status === "partial" && "Pago parcial"}
                                {status === "refunded" && "Reembolsado"}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Notas</Label>
              <Controller
                name="notes"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    value={field.value || ""}
                    placeholder="Notas adicionales..."
                    disabled={readOnly}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex justify-end gap-4">
          {/* Mostrar errores de validación */}
          {!form.formState.isValid && Object.keys(form.formState.errors).length > 0 && (
            <div className="flex-1">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800 mb-2">Errores de validación:</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <li key={field}>
                      • {field}: {String((error as any)?.message || 'Error de validación')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          {!readOnly && (
            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? "Guardando..." : "Guardar Venta"}
              <SaveIcon className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SellForm;
