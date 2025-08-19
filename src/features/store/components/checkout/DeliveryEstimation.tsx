/**
 * Componente de estimación de tiempo de entrega
 * 
 * Calcula y muestra el tiempo estimado de entrega basado en la dirección y método de entrega
 * 
 * @module features/store/components/checkout
 */

"use client";

import { useState, useEffect } from 'react';
import { Clock, MapPin, Truck, Store, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useStoreToast } from '../ui/FeedbackToast';
import { useThemeClasses, useThemeStyles } from '../../hooks/useStoreTheme';

interface DeliveryEstimationProps {
  /** Método de entrega seleccionado */
  deliveryMethod: 'delivery' | 'take';
  /** Dirección de entrega (solo para delivery) */
  address?: string;
  /** Total del pedido para calcular prioridad */
  orderTotal?: number;
}

interface EstimationResult {
  /** Tiempo mínimo en minutos */
  minTime: number;
  /** Tiempo máximo en minutos */
  maxTime: number;
  /** Costo de entrega */
  deliveryCost: number;
  /** Zona de entrega */
  zone: 'centro' | 'cercana' | 'lejana' | 'fuera_zona';
  /** Mensaje adicional */
  message?: string;
}

/**
 * Configuración de zonas de entrega
 */
const DELIVERY_ZONES = {
  centro: {
    keywords: ['centro', 'downtown', 'microcentro', 'plaza'],
    baseTime: 20,
    maxTime: 35,
    cost: 0,
    description: 'Zona centro'
  },
  cercana: {
    keywords: ['barrio', 'cerca', 'próximo', 'avenida'],
    baseTime: 30,
    maxTime: 50,
    cost: 500,
    description: 'Zona cercana'
  },
  lejana: {
    keywords: ['lejos', 'afueras', 'periferia', 'suburbio'],
    baseTime: 45,
    maxTime: 70,
    cost: 1000,
    description: 'Zona lejana'
  },
  fuera_zona: {
    keywords: [],
    baseTime: 60,
    maxTime: 90,
    cost: 1500,
    description: 'Fuera de zona'
  }
};

/**
 * Tiempo de preparación para retirar en tienda
 */
const PICKUP_TIME = {
  min: 15,
  max: 25
};

/**
 * Componente de estimación de tiempo de entrega
 */
const DeliveryEstimation = ({
  deliveryMethod,
  address,
  orderTotal = 0
}: DeliveryEstimationProps) => {
  const [estimation, setEstimation] = useState<EstimationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { showDelivery, messages } = useStoreToast();
  const themeClasses = useThemeClasses();
  const themeStyles = useThemeStyles();
  
  /**
   * Detecta la zona basada en la dirección
   */
  const detectZone = (address: string): keyof typeof DELIVERY_ZONES => {
    const normalizedAddress = address.toLowerCase();
    
    for (const [zone, config] of Object.entries(DELIVERY_ZONES)) {
      if (config.keywords.some(keyword => normalizedAddress.includes(keyword))) {
        return zone as keyof typeof DELIVERY_ZONES;
      }
    }
    
    // Si no se detecta ninguna zona específica, asumir zona cercana por defecto
    return 'cercana';
  };
  
  /**
   * Calcula el tiempo de entrega
   */
  const calculateDeliveryTime = (address: string, total: number): EstimationResult => {
    const zone = detectZone(address);
    const zoneConfig = DELIVERY_ZONES[zone];
    
    // Ajustar tiempo basado en el total del pedido (pedidos grandes pueden tomar más tiempo)
    const totalAdjustment = total > 10000 ? 10 : total > 5000 ? 5 : 0;
    
    // Agregar variabilidad por hora del día
    const currentHour = new Date().getHours();
    const rushHourAdjustment = (currentHour >= 12 && currentHour <= 14) || (currentHour >= 19 && currentHour <= 21) ? 10 : 0;
    
    const minTime = zoneConfig.baseTime + totalAdjustment + rushHourAdjustment;
    const maxTime = zoneConfig.maxTime + totalAdjustment + rushHourAdjustment;
    
    let message = '';
    if (rushHourAdjustment > 0) {
      message = 'Horario de alta demanda - tiempo extendido';
    }
    if (totalAdjustment > 0) {
      message += message ? ' | ' : '';
      message += 'Pedido grande - tiempo adicional de preparación';
    }
    
    return {
      minTime,
      maxTime,
      deliveryCost: zoneConfig.cost,
      zone,
      message
    };
  };
  
  /**
   * Calcula el tiempo de preparación para retirar
   */
  const calculatePickupTime = (total: number): EstimationResult => {
    const totalAdjustment = total > 10000 ? 10 : total > 5000 ? 5 : 0;
    
    return {
      minTime: PICKUP_TIME.min + totalAdjustment,
      maxTime: PICKUP_TIME.max + totalAdjustment,
      deliveryCost: 0,
      zone: 'centro',
      message: totalAdjustment > 0 ? 'Pedido grande - tiempo adicional de preparación' : undefined
    };
  };
  
  /**
   * Efecto para calcular la estimación cuando cambian los parámetros
   */
  useEffect(() => {
    if (deliveryMethod === 'take') {
      // Para retirar en tienda, calcular inmediatamente
      const result = calculatePickupTime(orderTotal);
      setEstimation(result);
      setError(null);
      return;
    }
    
    if (deliveryMethod === 'delivery' && address && address.trim().length > 5) {
      setIsCalculating(true);
      setError(null);
      
      // Simular cálculo asíncrono
      const timeoutId = setTimeout(() => {
        try {
          const result = calculateDeliveryTime(address, orderTotal);
          setEstimation(result);
          
          // Mostrar notificación
          showDelivery(messages.DELIVERY_ESTIMATED, {
            duration: 2000
          });
        } catch (err) {
          setError('Error al calcular el tiempo de entrega');
        } finally {
          setIsCalculating(false);
        }
      }, 800);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Limpiar estimación si no hay dirección válida
      setEstimation(null);
      setError(null);
    }
  }, [deliveryMethod, address, orderTotal, showDelivery, messages]);
  
  /**
   * Formatear tiempo en texto legible
   */
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };
  
  /**
   * Obtener color del badge según la zona
   */
  const getZoneBadgeVariant = (zone: string) => {
    switch (zone) {
      case 'centro': return 'default';
      case 'cercana': return 'secondary';
      case 'lejana': return 'outline';
      case 'fuera_zona': return 'destructive';
      default: return 'secondary';
    }
  };
  
  // No mostrar nada si no hay método de entrega
  if (!deliveryMethod) {
    return null;
  }
  
  return (
    <Card className="mt-4 border-l-4" 
          style={themeStyles.border.primary}>
      <div className="p-6">
        <div className="flex items-center gap-2 text-lg font-semibold mb-4">
          {deliveryMethod === 'delivery' ? (
            <Truck className={`h-5 w-5 ${themeClasses.accent.primary}`} 
                   style={themeStyles.price.primary} />
          ) : (
            <Store className={`h-5 w-5 ${themeClasses.accent.secondary}`} 
                   style={themeStyles.price.secondary} />
          )}
          <span className={themeClasses.price.secondary}>Tiempo estimado</span>
        </div>
        <div className="space-y-4">
        
        {isCalculating && (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner 
              size="sm" 
              variant="default" 
              text="Calculando tiempo..."
            />
          </div>
        )}
        
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          </Alert>
        )}
        
        {estimation && !isCalculating && (
          <div className="space-y-3">
            {/* Tiempo estimado */}
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${themeClasses.accent.primary}`} 
                     style={themeStyles.price.primary} />
              <span className={`text-lg font-semibold ${themeClasses.price.primary}`}>
                {formatTime(estimation.minTime)} - {formatTime(estimation.maxTime)}
              </span>
            </div>
            
            {/* Información de zona (solo para delivery) */}
            {deliveryMethod === 'delivery' && (
              <div className="flex items-center gap-2">
                <MapPin className={`h-4 w-4 ${themeClasses.accent.primary}`} 
                        style={themeStyles.price.primary} />
                <Badge variant={getZoneBadgeVariant(estimation.zone)}
                       style={themeStyles.background.primary}>
                  {DELIVERY_ZONES[estimation.zone].description}
                </Badge>
                {estimation.deliveryCost > 0 && (
                  <span className={`text-sm ${themeClasses.price.secondary}`}>
                    Costo: ${estimation.deliveryCost}
                  </span>
                )}
              </div>
            )}
            
            {/* Mensaje adicional */}
            {estimation.message && (
              <Alert className="border" 
                     style={themeStyles.background.secondary}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={`h-4 w-4 mt-0.5 ${themeClasses.accent.secondary}`} 
                               style={themeStyles.price.secondary} />
                  <div className="text-sm text-gray-900">
                    {estimation.message}
                  </div>
                </div>
              </Alert>
            )}
            
            {/* Información adicional */}
            <div className="text-xs text-gray-600 mt-2">
              {deliveryMethod === 'delivery' 
                ? 'El tiempo puede variar según las condiciones del tráfico y la demanda.'
                : 'Tu pedido estará listo para retirar en el tiempo estimado.'
              }
            </div>
          </div>
        )}
        
        {/* Mensaje cuando no hay dirección válida para delivery */}
        {deliveryMethod === 'delivery' && (!address || address.trim().length <= 5) && !isCalculating && (
          <div className="text-center py-4 text-gray-600">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Ingresa una dirección válida para calcular el tiempo de entrega</p>
          </div>
        )}
        </div>
      </div>
    </Card>
  );
};

export default DeliveryEstimation;