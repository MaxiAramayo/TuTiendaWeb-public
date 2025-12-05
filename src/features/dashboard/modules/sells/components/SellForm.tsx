/**
 * Formulario de ventas con validación Zod y ProductSelector
 *
 * Actualizado para usar la nueva estructura de datos con objetos anidados
 * (customer, delivery, payment, totals, metadata)
 *
 * @module features/dashboard/modules/sells/components
 */

"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
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
import { ProductSelector } from "./ProductSelector";
import { ProductInCart } from "@/shared/types/store";
import { Product as ProductDocument } from "@/shared/types/firebase.types";
import { z } from "zod";
import { toast } from "sonner";

// === TIPOS Y VALIDACIONES ===
import {
  Sale,
  SaleItem,
  DELIVERY_METHODS,
  DELIVERY_METHODS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHODS_LABELS,
  SALE_SOURCES,
  SALE_SOURCE_LABELS,
} from "../schemas/sell.schema";

// Server Actions
import { createSaleAction, updateSaleAction, getSaleByIdAction } from "../actions/sale.actions";

// Schema del formulario 
const formSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Nombre del cliente es requerido"),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
  }),
  delivery: z.object({
    method: z.enum(["retiro", "delivery"]),
    address: z.string().optional(),
    notes: z.string().optional(),
  }),
  payment: z.object({
    method: z.enum(["efectivo", "transferencia", "mercadopago"]),
  }),
  source: z.enum(["local", "web", "whatsapp"]),
  notes: z.string().optional(),
  discount: z.coerce.number().nonnegative(),
});

type FormData = z.infer<typeof formSchema>;

interface SellFormProps {
  /** ID de la venta a editar (undefined para nueva venta) */
  sellId?: string;
  /** Venta existente para editar */
  sell?: Sale;
  /** ID de la tienda */
  storeId: string;
  /** Callback al guardar exitosamente */
  onSuccess?: () => void;
  /** Callback al cancelar */
  onCancel?: () => void;
  /** Modo de solo lectura */
  readOnly?: boolean;
  /** Productos disponibles para seleccionar */
  products: ProductDocument[];
}

/**
 * Formulario para crear/editar ventas
 */
export const SellForm: React.FC<SellFormProps> = ({
  sellId,
  sell,
  storeId,
  onSuccess,
  onCancel,
  readOnly = false,
  products = [],
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductInCart[]>([]);
  const [calculatedTotals, setCalculatedTotals] = useState({
    subtotal: 0,
    discount: 0,
    total: 0,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      customer: {
        name: sell?.customer?.name || "",
        phone: sell?.customer?.phone || "",
        email: sell?.customer?.email || "",
      },
      delivery: {
        method: (sell?.delivery?.method as "retiro" | "delivery") || "retiro",
        address: sell?.delivery?.address || "",
        notes: sell?.delivery?.notes || "",
      },
      payment: {
        method: (sell?.payment?.method as "efectivo" | "transferencia" | "mercadopago") || "efectivo",
      },
      source: (sell?.source as "local" | "web" | "whatsapp") || "local",
      notes: sell?.notes || "",
      discount: sell?.totals?.discount || 0,
    },
  });

  // Cargar venta existente si solo se proporciona ID
  useEffect(() => {
    if (sellId && !sell) {
      getSaleByIdAction(sellId).then((result) => {
        if (result.success && result.data) {
          const fetchedSale = result.data.sale;
          form.reset({
            customer: {
              name: fetchedSale.customer.name || "",
              phone: fetchedSale.customer.phone || "",
              email: fetchedSale.customer.email || "",
            },
            delivery: {
              method: fetchedSale.delivery.method,
              address: fetchedSale.delivery.address || "",
              notes: fetchedSale.delivery.notes || "",
            },
            payment: {
              method: fetchedSale.payment.method,
            },
            source: fetchedSale.source,
            notes: fetchedSale.notes || "",
            discount: fetchedSale.totals.discount || 0,
          });

          // Convertir items a ProductInCart
          if (fetchedSale.items) {
            const convertedProducts: ProductInCart[] = fetchedSale.items.map(item => ({
              id: `${item.productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              idProduct: item.productId,
              name: item.productName,
              description: "",
              price: item.unitPrice,
              cantidad: item.quantity,
              category: item.categoryId,
              aclaracion: item.notes || "",
              topics: item.variants?.map(v => ({
                id: v.id,
                name: v.name,
                price: v.price
              }))
            }));
            setSelectedProducts(convertedProducts);
          }
        }
      });
    }
  }, [sellId, sell, form]);

  // Inicializar productos seleccionados desde la venta existente
  useEffect(() => {
    if (sell?.items) {
      const convertedProducts: ProductInCart[] = sell.items.map(item => ({
        id: `${item.productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        idProduct: item.productId,
        name: item.productName,
        description: "",
        price: item.unitPrice,
        cantidad: item.quantity,
        category: item.categoryId,
        aclaracion: item.notes || "",
        topics: item.variants?.map(v => ({
          id: v.id,
          name: v.name,
          price: v.price
        }))
      }));
      setSelectedProducts(convertedProducts);
    }
  }, [sell]);

  // Calcular totales automáticamente basados en productos seleccionados
  useEffect(() => {
    const subtotal = selectedProducts.reduce((sum, product) => {
      const basePrice = product.price || 0;
      const topicsPrice = product.topics?.reduce((topicSum, topic) => topicSum + topic.price, 0) || 0;
      return sum + (basePrice + topicsPrice) * (product.cantidad || 0);
    }, 0);

    const discount = form.watch("discount") || 0;
    const total = Math.max(0, subtotal - discount);

    setCalculatedTotals({ subtotal, discount, total });
  }, [selectedProducts, form.watch("discount")]);

  const onSubmit = async (data: FormData) => {
    // Validar que hay productos
    if (selectedProducts.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }

    // Validar dirección para delivery
    if (data.delivery.method === 'delivery' && !data.delivery.address?.trim()) {
      form.setError('delivery.address', {
        type: 'manual',
        message: 'La dirección es obligatoria para delivery'
      });
      return;
    }

    // Construir items para la venta
    const items: SaleItem[] = selectedProducts.map((product, index) => {
      const variantsTotal = product.topics?.reduce((sum, t) => sum + t.price, 0) || 0;
      return {
        id: product.id || `item-${index}-${Date.now()}`,
        productId: product.idProduct,
        productName: product.name,
        categoryId: product.category || "",
        quantity: product.cantidad,
        unitPrice: product.price,
        subtotal: (product.price + variantsTotal) * product.cantidad,
        variants: product.topics?.map(t => ({
          id: t.id,
          name: t.name,
          price: t.price
        })),
        notes: product.aclaracion,
      };
    });

    const saleData = {
      orderNumber: sell?.orderNumber || `ORD-${Date.now()}`,
      storeId,
      source: data.source,
      customer: {
        name: data.customer.name,
        phone: data.customer.phone || undefined,
        email: data.customer.email || undefined,
      },
      items,
      delivery: {
        method: data.delivery.method,
        address: data.delivery.address || undefined,
        notes: data.delivery.notes || undefined,
      },
      payment: {
        method: data.payment.method,
        total: calculatedTotals.total,
      },
      totals: {
        subtotal: calculatedTotals.subtotal,
        discount: data.discount || 0,
        total: calculatedTotals.total,
      },
      notes: data.notes || undefined,
    };

    startTransition(async () => {
      try {
        let result;
        if (sell?.id || sellId) {
          result = await updateSaleAction(sell?.id || sellId!, saleData);
        } else {
          result = await createSaleAction(saleData);
        }

        if (result.success) {
          toast.success(sell?.id || sellId ? "Venta actualizada" : "Venta creada");
          onSuccess?.();
          if (!sell?.id && !sellId) {
            form.reset();
            setSelectedProducts([]);
          }
        } else {
          const errorMessage = Object.values(result.errors).flat().join(", ");
          toast.error(errorMessage || "Error al guardar la venta");
        }
      } catch (error) {
        console.error("Error al guardar venta:", error);
        toast.error("Error al guardar la venta");
      }
    });
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
                <Label htmlFor="customer.name">Nombre del Cliente *</Label>
                <Controller
                  name="customer.name"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="Nombre completo"
                      disabled={readOnly}
                    />
                  )}
                />
                {form.formState.errors.customer?.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.customer.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="customer.phone">Teléfono</Label>
                <Controller
                  name="customer.phone"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="+54 9 11 1234-5678"
                      disabled={readOnly}
                    />
                  )}
                />
              </div>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer.email">Email</Label>
                  <Controller
                    name="customer.email"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="email"
                        placeholder="email@ejemplo.com"
                        disabled={readOnly}
                      />
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="source">Canal de Venta</Label>
                  <Controller
                    name="source"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar canal" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SALE_SOURCES).map((source) => (
                            <SelectItem key={source} value={source}>
                              {SALE_SOURCE_LABELS[source]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selector de Productos */}
        <ProductSelector
          products={products}
          selectedProducts={selectedProducts}
          onAddProduct={handleAddProduct}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveProduct={handleRemoveProduct}
        />

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
                  ${calculatedTotals.subtotal.toFixed(2)}
                </div>
              </div>

              {showAdvanced && (
                <div>
                  <Label>Descuento</Label>
                  <Controller
                    name="discount"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        disabled={readOnly}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              )}

              <div>
                <Label>Total</Label>
                <div className="text-xl font-bold text-green-600">
                  ${calculatedTotals.total.toFixed(2)}
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
                  name="delivery.method"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(DELIVERY_METHODS).map((method) => (
                          <SelectItem key={method} value={method}>
                            {DELIVERY_METHODS_LABELS[method]}
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
                  name="payment.method"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PAYMENT_METHODS).map((method) => (
                          <SelectItem key={method} value={method}>
                            {PAYMENT_METHODS_LABELS[method]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {form.watch("delivery.method") === "delivery" && (
              <div>
                <Label>Dirección de Entrega *</Label>
                <Controller
                  name="delivery.address"
                  control={form.control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Dirección completa..."
                      disabled={readOnly}
                      className={form.formState.errors.delivery?.address ? "border-red-500" : ""}
                    />
                  )}
                />
                {form.formState.errors.delivery?.address && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.delivery.address.message}
                  </p>
                )}
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
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          {!readOnly && (
            <Button
              type="submit"
              disabled={isPending || !form.formState.isValid}
            >
              {isPending ? "Guardando..." : "Guardar Venta"}
              <SaveIcon className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SellForm;
