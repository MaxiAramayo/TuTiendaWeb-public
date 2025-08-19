/**
 * Componente para mostrar estadísticas de ventas con gráficos interactivos
 * 
 * Similar a ProfileStats, proporciona una vista visual de las estadísticas
 * de ventas con opciones de filtrado por período.
 * 
 * @module features/dashboard/modules/sells/components/SellsStats
 */

"use client";

import React, { useMemo, useState } from "react";
import { useSellStore } from "../api/sellStore";
import { OptimizedSell, ProductInSell } from "../types/optimized-sell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Utilidades locales
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

const calculateProductTotal = (product: ProductInSell): number => {
  let basePrice = product.price;
  
  if (product.appliedTopics && product.appliedTopics.length > 0) {
    const extrasTotal = product.appliedTopics.reduce(
      (sum: number, topic: any) => sum + topic.price, 
      0
    );
    basePrice += extrasTotal;
  }
  
  return basePrice * product.cantidad;
};

const calculateOrderTotal = (sell: OptimizedSell): number => {
  return sell.products.reduce(
    (acc: number, product: ProductInSell) => acc + calculateProductTotal(product), 
    0
  );
};

const calculateSellsStatistics = (sells: OptimizedSell[]) => {
  const totalRevenue = sells.reduce((acc, sell) => acc + calculateOrderTotal(sell), 0);
  const totalOrders = sells.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Ventas por método de pago
  const paymentStats = sells.reduce((acc, sell) => {
    const method = sell.paymentMethod || 'Sin especificar';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Ventas por método de entrega
  const deliveryStats = sells.reduce((acc, sell) => {
    const method = sell.deliveryMethod || 'Sin especificar';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Productos más vendidos
  const productStats: Record<string, {
    name: string;
    idProduct: string;
    quantity: number;
    revenue: number;
  }> = {};
  
  sells.forEach(sell => {
    sell.products.forEach((product: ProductInSell) => {
      const key = product.idProduct;
      const productTotal = calculateProductTotal(product);
      
      if (productStats[key]) {
        productStats[key].quantity += product.cantidad;
        productStats[key].revenue += productTotal;
      } else {
        productStats[key] = {
          name: product.name,
          idProduct: product.idProduct,
          quantity: product.cantidad,
          revenue: productTotal
        };
      }
    });
  });

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Clientes más frecuentes
  const customerStats: Record<string, {
    name: string;
    orders: number;
    totalSpent: number;
  }> = {};
  
  sells.forEach(sell => {
    const customerName = sell.customerName;
    const orderTotal = calculateOrderTotal(sell);
    
    if (customerStats[customerName]) {
      customerStats[customerName].orders += 1;
      customerStats[customerName].totalSpent += orderTotal;
    } else {
      customerStats[customerName] = {
        name: customerName,
        orders: 1,
        totalSpent: orderTotal
      };
    }
  });

  const topCustomers = Object.values(customerStats)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);
  
  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    paymentStats,
    deliveryStats,
    topProducts,
    topCustomers
  };
};

const groupSellsByPeriod = (
  sells: OptimizedSell[], 
  period: 'day' | 'week' | 'month' | 'year'
): Record<string, OptimizedSell[]> => {
  const groups: Record<string, OptimizedSell[]> = {};
  
  sells.forEach(sell => {
    const date = new Date(sell.date);
    let key: string;
    
    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = String(date.getFullYear());
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(sell);
  });
  
  return groups;
};

interface SellsStatsProps {
  /** Período seleccionado para mostrar estadísticas */
  period?: 'today' | 'week' | 'month' | 'year' | 'all';
  /** Función callback al hacer clic en una estadística */
  onStatClick?: (stat: string, value: any) => void;
}

export const SellsStats = ({ 
  period = 'month',
  onStatClick
}: SellsStatsProps) => {
  const { sells, isLoading } = useSellStore();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'products' | 'customers'>('overview');

  // Filtrar ventas por período
  const filteredSells = useMemo(() => {
    if (period === 'all') return sells;

    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return sells.filter((sell) => new Date(sell.date) >= startDate);
  }, [sells, period]);

  // Calcular estadísticas
  const stats = useMemo(() => 
    calculateSellsStatistics(filteredSells), 
    [filteredSells]
  );

  // Agrupar ventas por día para gráfico de tendencia
  const dailyStats = useMemo(() => {
    const grouped = groupSellsByPeriod(filteredSells, 'day');
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7) // Últimos 7 días
      .map(([date, sellsForDay]) => ({
        date,
        revenue: sellsForDay.reduce((acc: number, sell: OptimizedSell) => acc + calculateOrderTotal(sell), 0),
        orders: sellsForDay.length
      }));
  }, [filteredSells]);

  const periodLabels = {
    today: 'Hoy',
    week: 'Última semana',
    month: 'Último mes',
    year: 'Último año',
    all: 'Todo el tiempo'
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con período */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Estadísticas de Ventas - {periodLabels[period]}
        </h3>
        <Badge variant="outline">
          {filteredSells.length} {filteredSells.length === 1 ? 'venta' : 'ventas'}
        </Badge>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onStatClick?.('revenue', stats.totalRevenue)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio: {formatCurrency(stats.averageOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onStatClick?.('orders', stats.totalOrders)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyStats.length > 0 && `Últimos 7 días: ${dailyStats.reduce((acc, day) => acc + day.orders, 0)}`}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onStatClick?.('products', stats.topProducts)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
            <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.topProducts.reduce((acc, product) => acc + product.quantity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topProducts.length} productos únicos
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onStatClick?.('customers', stats.topCustomers)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.topCustomers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Cliente top: {stats.topCustomers[0]?.orders || 0} órdenes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas con detalles */}
      <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Métodos de pago */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Métodos de Pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.paymentStats).map(([method, count]) => {
                  const percentage = ((count as number) / stats.totalOrders) * 100;
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{method}</span>
                        <span>{count as number} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Métodos de entrega */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Métodos de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(stats.deliveryStats).map(([method, count]) => {
                  const percentage = ((count as number) / stats.totalOrders) * 100;
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{method}</span>
                        <span>{count as number} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Tendencia de los últimos 7 días */}
          {dailyStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tendencia de Ventas (Últimos 7 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dailyStats.map(({ date, revenue, orders }) => (
                    <div key={date} className="flex items-center justify-between text-sm">
                      <span>{new Date(date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-green-600">{formatCurrency(revenue)}</span>
                        <Badge variant="outline" className="text-xs">
                          {orders} {orders === 1 ? 'orden' : 'órdenes'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topProducts.map((product: any, index: number) => (
                  <div key={product.idProduct} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity} unidades vendidas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-green-600">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(product.revenue / product.quantity)} c/u
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mejores Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topCustomers.map((customer: any, index: number) => (
                  <div key={customer.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.orders} {customer.orders === 1 ? 'orden' : 'órdenes'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm text-green-600">
                        {formatCurrency(customer.totalSpent)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(customer.totalSpent / customer.orders)} promedio
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
