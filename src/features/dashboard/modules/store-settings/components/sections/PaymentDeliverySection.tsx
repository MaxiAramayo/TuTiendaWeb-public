/**
 * Sección de métodos de pago y entrega
 * 
 * Implementa CU-STORE-08: Configurar Métodos de Pago y Entrega
 * Permite habilitar y configurar métodos de pago y entrega
 * 
 * @module features/dashboard/modules/store-settings/components/sections
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileFormData, FormState } from '../../types/store.type';
import { PaymentMethod, DeliveryMethod } from '@/shared/types/firebase.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { 
  CreditCard, 
  Truck, 
  DollarSign, 
  MapPin, 
  Globe, 
  Plus, 
  Trash2, 
  Edit,
  AlertTriangle,
  CheckCircle2,
  Save,
  Loader2,
  Info
} from 'lucide-react';

/**
 * Props del componente
 */
interface PaymentDeliverySectionProps {
  formData: ProfileFormData;
  formState: FormState;
  updateField: (field: keyof ProfileFormData, value: any) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

/**
 * Métodos de pago predefinidos
 */
const PAYMENT_METHODS_CONFIG = {
  efectivo: {
    id: 'efectivo',
    name: 'Efectivo',
    icon: DollarSign,
    description: 'Pago en efectivo al recibir el pedido',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  transferencia: {
    id: 'transferencia',
    name: 'Transferencia bancaria',
    icon: CreditCard,
    description: 'Transferencia a cuenta bancaria',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  mercadopago: {
    id: 'mercadopago',
    name: 'MercadoPago',
    icon: CreditCard,
    description: 'Pagos online con MercadoPago',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200'
  }
};

/**
 * Métodos de entrega predefinidos
 */
const DELIVERY_METHODS_CONFIG = {
  retiro: {
    id: 'retiro',
    name: 'Retiro en local',
    icon: MapPin,
    description: 'El cliente retira en la tienda',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  delivery: {
    id: 'delivery',
    name: 'Delivery',
    icon: Truck,
    description: 'Entrega a domicilio',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
};

/**
 * Componente de sección de métodos de pago y entrega
 */
export function PaymentDeliverySection({
  formData,
  formState,
  updateField,
  onSave,
  isSaving = false,
}: PaymentDeliverySectionProps) {
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<string | null>(null);

  // Obtener métodos actuales o inicializar con arrays vacíos
  const paymentMethods = useMemo(() => {
    return Array.isArray(formData.paymentMethods) ? formData.paymentMethods : [];
  }, [formData.paymentMethods]);

  const deliveryMethods = useMemo(() => {
    return Array.isArray(formData.deliveryMethods) ? formData.deliveryMethods : [];
  }, [formData.deliveryMethods]);

  // Validar que al menos un método esté activo
  const hasActivePayment = useMemo(() => {
    return paymentMethods.length > 0 && paymentMethods.some(method => method && method.enabled === true);
  }, [paymentMethods]);

  const hasActiveDelivery = useMemo(() => {
    return deliveryMethods.length > 0 && deliveryMethods.some(method => method && method.enabled === true);
  }, [deliveryMethods]);

  const isValid = hasActivePayment && hasActiveDelivery;

  // Estado actual de métodos de pago y entrega
  useEffect(() => {
    // Verificar estado de métodos de pago y entrega
  }, [paymentMethods, deliveryMethods, hasActivePayment, hasActiveDelivery, isValid]);

  /**
   * Actualizar método de pago
   */
  const updatePaymentMethod = (methodId: string, updates: Partial<PaymentMethod>) => {
    if (!methodId) return;
    
    const updatedMethods = paymentMethods.map(method => 
      method && method.id === methodId ? { ...method, ...updates } : method
    ).filter(Boolean); // Filtrar elementos null/undefined
    
    // Actualizando método de pago
    updateField('paymentMethods', updatedMethods);
  };

  /**
   * Actualizar método de entrega
   */
  const updateDeliveryMethod = (methodId: string, updates: Partial<DeliveryMethod>) => {
    if (!methodId) return;
    
    const updatedMethods = deliveryMethods.map(method => 
      method && method.id === methodId ? { ...method, ...updates } : method
    ).filter(Boolean); // Filtrar elementos null/undefined
    
    // Actualizando método de entrega
    updateField('deliveryMethods', updatedMethods);
  };

  /**
   * Agregar método de pago
   */
  const addPaymentMethod = (configKey: string) => {
    const config = PAYMENT_METHODS_CONFIG[configKey as keyof typeof PAYMENT_METHODS_CONFIG];
    if (!config) {
      console.warn('Configuración de método de pago no encontrada:', configKey);
      return;
    }

    const newMethod: PaymentMethod = {
      id: config.id,
      name: config.name,
      enabled: true,

    };

    const exists = paymentMethods.find(method => method && method.id === config.id);
    if (exists) {
      // Método de pago ya existe, habilitando
      updatePaymentMethod(config.id, { enabled: true });
    } else {
      // Agregando nuevo método de pago
      const updatedMethods = [...paymentMethods.filter(Boolean), newMethod];
      updateField('paymentMethods', updatedMethods);
    }
  };

  /**
   * Agregar método de entrega
   */
  const addDeliveryMethod = (configKey: string) => {
    const config = DELIVERY_METHODS_CONFIG[configKey as keyof typeof DELIVERY_METHODS_CONFIG];
    if (!config) {
      console.warn('Configuración de método de entrega no encontrada:', configKey);
      return;
    }

    const newMethod: DeliveryMethod = {
      id: config.id,
      name: config.name,
      enabled: true,
      price: 0
    };

    const exists = deliveryMethods.find(method => method && method.id === config.id);
    if (exists) {
      // Método de entrega ya existe, habilitando
      updateDeliveryMethod(config.id, { enabled: true });
    } else {
      // Agregando nuevo método de entrega
      const updatedMethods = [...deliveryMethods.filter(Boolean), newMethod];
      updateField('deliveryMethods', updatedMethods);
    }
  };

  /**
   * Renderizar método de pago
   */
  const renderPaymentMethod = (method: PaymentMethod) => {
    const config = PAYMENT_METHODS_CONFIG[method.id as keyof typeof PAYMENT_METHODS_CONFIG];
    if (!config) return null;

    const Icon = config.icon;
    const isEditing = editingPayment === method.id;

    return (
      <motion.div
        key={method.id}
        layout
        className={cn(
          'border rounded-lg p-3 sm:p-4 transition-all duration-200',
          method.enabled ? config.borderColor : 'border-gray-200',
          method.enabled ? config.bgColor : 'bg-gray-50'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={cn(
              'p-1.5 sm:p-2 rounded-lg',
              method.enabled ? config.bgColor : 'bg-gray-100'
            )}>
              <Icon className={cn(
                'w-4 h-4 sm:w-5 sm:h-5',
                method.enabled ? config.color : 'text-gray-400'
              )} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className={cn(
                  'font-medium text-sm sm:text-base',
                  method.enabled ? 'text-gray-900' : 'text-gray-500'
                )}>
                  {method.name}
                </h4>
                <Switch
                  checked={method.enabled}
                  onCheckedChange={(enabled) => updatePaymentMethod(method.id, { enabled })}
                />
              </div>
              
              <p className={cn(
                'text-xs sm:text-sm mt-1',
                method.enabled ? 'text-gray-600' : 'text-gray-400'
              )}>
                {config.description}
              </p>

              {method.enabled && (
                <AnimatePresence>
                  <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 sm:mt-3 space-y-2"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Instrucciones para el cliente (opcional)"
                            value={''}
                            onChange={(e) => {}}
                            className="text-xs sm:text-sm"
                            rows={2}
                          />
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button
                              size="sm"
                              onClick={() => setEditingPayment(null)}
                              className="w-full sm:w-auto text-xs sm:text-sm"
                            >
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingPayment(null)}
                              className="w-full sm:w-auto text-xs sm:text-sm"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <p className="text-xs sm:text-sm text-gray-600 break-words">
                            Sin instrucciones específicas
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingPayment(method.id)}
                            className="w-full sm:w-auto justify-center sm:justify-start"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="ml-1 sm:hidden text-xs">Editar</span>
                          </Button>
                        </div>
                      )}
                    </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  /**
   * Renderizar método de entrega
   */
  const renderDeliveryMethod = (method: DeliveryMethod) => {
    const config = DELIVERY_METHODS_CONFIG[method.id as keyof typeof DELIVERY_METHODS_CONFIG];
    if (!config) return null;

    const Icon = config.icon;
    const isEditing = editingDelivery === method.id;

    return (
      <motion.div
        key={method.id}
        layout
        className={cn(
          'border rounded-lg p-3 sm:p-4 transition-all duration-200',
          method.enabled ? config.borderColor : 'border-gray-200',
          method.enabled ? config.bgColor : 'bg-gray-50'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={cn(
              'p-1.5 sm:p-2 rounded-lg',
              method.enabled ? config.bgColor : 'bg-gray-100'
            )}>
              <Icon className={cn(
                'w-4 h-4 sm:w-5 sm:h-5',
                method.enabled ? config.color : 'text-gray-400'
              )} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className={cn(
                  'font-medium text-sm sm:text-base',
                  method.enabled ? 'text-gray-900' : 'text-gray-500'
                )}>
                  {method.name}
                </h4>
                <Switch
                  checked={method.enabled}
                  onCheckedChange={(enabled) => updateDeliveryMethod(method.id, { enabled })}
                />
              </div>
              
              <p className={cn(
                'text-xs sm:text-sm mt-1',
                method.enabled ? 'text-gray-600' : 'text-gray-400'
              )}>
                {config.description}
              </p>

              {method.enabled && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 sm:mt-3 space-y-2"
                  >
                    {isEditing ? (
                      <div className="space-y-2 sm:space-y-3">
                        <div>
                          <Label htmlFor={`price-${method.id}`} className="text-xs sm:text-sm">
                            Precio (opcional)
                          </Label>
                          <Input
                            id={`price-${method.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={method.price || ''}
                            onChange={(e) => updateDeliveryMethod(method.id, { price: parseFloat(e.target.value) || 0 })}
                            className="text-xs sm:text-sm"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button
                            size="sm"
                            onClick={() => setEditingDelivery(null)}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingDelivery(null)}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="text-xs sm:text-sm text-gray-600">
                          {method.price && method.price > 0 && (
                            <p className="font-medium">Precio: ${method.price}</p>
                          )}
                          <p className="break-words">Sin instrucciones específicas</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingDelivery(method.id)}
                          className="w-full sm:w-auto justify-center sm:justify-start"
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="ml-1 sm:hidden text-xs">Editar</span>
                        </Button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header con título y botón de guardar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Métodos de pago y entrega</h2>
          <p className="text-xs sm:text-sm text-gray-500">Configura cómo recibirás pagos y entregarás productos</p>
        </div>
        {onSave && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto"
            size="sm"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Save className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="text-xs sm:text-sm">{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </Button>
        )}
      </div>
      {/* Validación general */}
      {(!hasActivePayment || !hasActiveDelivery) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            {!hasActivePayment && !hasActiveDelivery && (
              "Debe configurar al menos un método de pago y uno de entrega."
            )}
            {!hasActivePayment && hasActiveDelivery && (
              "Debe configurar al menos un método de pago."
            )}
            {hasActivePayment && !hasActiveDelivery && (
              "Debe configurar al menos un método de entrega."
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Información de estado */}
      <Alert>
        <Info className="h-3 w-3 sm:h-4 sm:w-4" />
        <AlertDescription className="text-xs sm:text-sm">
          <div className="space-y-1">
            <p>Estado actual:</p>
            <ul className="text-xs sm:text-sm space-y-1 ml-4">
              <li className={cn(
                "flex items-center space-x-2",
                hasActivePayment ? "text-green-600" : "text-red-600"
              )}>
                {hasActivePayment ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span className="break-words">Métodos de pago: {paymentMethods.filter(m => m?.enabled).length} activos de {paymentMethods.length} configurados</span>
              </li>
              <li className={cn(
                "flex items-center space-x-2",
                hasActiveDelivery ? "text-green-600" : "text-red-600"
              )}>
                {hasActiveDelivery ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span className="break-words">Métodos de entrega: {deliveryMethods.filter(m => m?.enabled).length} activos de {deliveryMethods.length} configurados</span>
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Métodos de pago */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Métodos de pago</span>
            {hasActivePayment && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configura los métodos de pago que aceptas en tu tienda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          {/* Métodos existentes */}
          <div className="space-y-2 sm:space-y-3">
            {paymentMethods.map(renderPaymentMethod)}
          </div>

          {/* Agregar nuevos métodos */}
          <div className="border-t pt-3 sm:pt-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Agregar método de pago</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(PAYMENT_METHODS_CONFIG).map(([key, config]) => {
                const exists = paymentMethods.find(method => method.id === config.id);
                const Icon = config.icon;
                
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => addPaymentMethod(key)}
                    disabled={exists?.enabled}
                    className="justify-start text-xs sm:text-sm"
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="truncate">{config.name}</span>
                    {exists?.enabled && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 ml-auto text-green-600" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métodos de entrega */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center space-x-2">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Métodos de entrega</span>
            {hasActiveDelivery && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configura cómo entregas los productos a tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          {/* Métodos existentes */}
          <div className="space-y-2 sm:space-y-3">
            {deliveryMethods.map(renderDeliveryMethod)}
          </div>

          {/* Agregar nuevos métodos */}
          <div className="border-t pt-3 sm:pt-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Agregar método de entrega</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(DELIVERY_METHODS_CONFIG).map(([key, config]) => {
                const exists = deliveryMethods.find(method => method.id === config.id);
                const Icon = config.icon;
                
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => addDeliveryMethod(key)}
                    disabled={exists?.enabled}
                    className="justify-start text-xs sm:text-sm"
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="truncate">{config.name}</span>
                    {exists?.enabled && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 ml-auto text-green-600" />}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentDeliverySection;