# Refactorización del Módulo de Ventas (Sells)

## Resumen Ejecutivo

Se refactorizó el módulo de ventas para usar una nueva estructura de datos anidada y Server Actions en lugar de llamadas directas a Firebase Client SDK.

**Estado: ✅ COMPLETADO - Build exitoso**

---

## 📊 Nueva Estructura de Datos

### Antes (OptimizedSell - OBSOLETO)

```typescript
interface OptimizedSell {
  id: string;
  orderNumber?: string;
  date: Date;
  customerName: string; // Plano
  customerPhone?: string; // Plano
  products: ProductInSell[]; // Nombre diferente
  subtotal: number; // Plano
  discount?: { type; value }; // Objeto separado
  total: number; // Plano
  deliveryMethod: 'pickup' | 'delivery' | 'shipping';
  paymentMethod: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  status:
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled';
  source?: 'web' | 'whatsapp' | 'instagram' | 'local';
  createdBy?: string;
  updatedAt?: Date;
}
```

### Después (Sale - NUEVA ESTRUCTURA)

```typescript
interface Sale {
  id: string;
  orderNumber: string;
  storeId: string;
  source: 'local' | 'web' | 'whatsapp';

  customer: {
    // ✅ Anidado
    name: string;
    phone?: string;
    email?: string;
  };

  items: SaleItem[]; // ✅ Renombrado desde products

  delivery: {
    // ✅ Anidado
    method: 'retiro' | 'delivery';
    address?: string;
    notes?: string;
  };

  payment: {
    // ✅ Anidado
    method: 'efectivo' | 'transferencia' | 'mercadopago';
    total: number;
  };

  totals: {
    // ✅ Anidado
    subtotal: number;
    discount: number;
    total: number;
  };

  notes?: string;

  metadata: {
    // ✅ Anidado
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
  };
}
```

---

## 📁 Estructura Final del Módulo

```
sells/
├── schemas/
│   └── sell.schema.ts          # ✅ Única fuente de verdad (tipos + validación)
├── actions/
│   └── sale.actions.ts         # ✅ Server Actions
├── services/
│   └── sale.service.ts         # ✅ Firebase Admin SDK
├── stores/
│   └── sells-ui.store.ts       # ✅ Solo estado UI (Zustand)
├── components/
│   ├── SellForm.tsx            # ✅ Actualizado
│   ├── SellDetail.tsx          # ✅ Actualizado
│   ├── OrdersView.tsx          # ✅ Actualizado
│   ├── ProductsView.tsx        # ✅ Actualizado
│   ├── SellsStats.tsx          # ✅ Actualizado
│   ├── SellsFilters.tsx        # ✅ Actualizado
│   ├── SellsModule.tsx         # ✅ Actualizado
│   ├── SellsPageClient.tsx     # ✅ Actualizado
│   ├── DateFilter.tsx          # ✅ Sin cambios
│   └── ProductSelector.tsx     # ✅ Sin cambios
├── ui/
│   ├── CustomerSearch.tsx      # ✅ Sin cambios
│   ├── ExportButtons.tsx       # ✅ Actualizado
│   ├── OrderFilter.tsx         # ✅ Sin cambios
│   ├── StatsCards.tsx          # ✅ Actualizado
│   └── ViewToggle.tsx          # ✅ Sin cambios
├── utils/
│   └── sell.utils.ts           # ✅ Actualizado
└── types/
    └── components.ts           # ✅ Solo tipos de props de componentes
```

---

## 🗑️ Archivos Eliminados

| Archivo                    | Razón                                                 |
| -------------------------- | ----------------------------------------------------- |
| `services/sell.service.ts` | Duplicado de `sale.service.ts`                        |
| `components/SaleForm.tsx`  | Versión vieja, `SellForm.tsx` es la correcta          |
| `api/sellStore.ts`         | Zustand store viejo con Firebase Client               |
| `hooks/useSells.ts`        | Hook viejo con Firebase Client directo                |
| `utils/sell-utils.ts`      | Usa estructura vieja, reemplazado por `sell.utils.ts` |
| `types/optimized-sell.ts`  | Tipos obsoletos, ahora en schema                      |
| `types/base.ts`            | Tipos obsoletos, ahora en schema                      |
| `types/constants.ts`       | Constantes duplicadas, ahora en schema                |
| `types/utils.ts`           | Tipos utilitarios obsoletos                           |
| Carpeta `hooks/`           | Eliminada (vacía)                                     |
| Carpeta `api/`             | Eliminada (vacía)                                     |

---

## 📋 Cambios por Archivo

### Páginas Actualizadas

- `app/dashboard/page.tsx`: Cambiado `calculateSellsStats` → `calculateSalesStats`
- `app/dashboard/sells/page.tsx`: Cambiado imports a `sale.service.ts`

### Schema (`schemas/sell.schema.ts`)

- [x] Definición de `Sale` con estructura anidada
- [x] Definición de `SaleItem` con `productName` (no `name`)
- [x] Definición de `CreateSaleData` para formularios
- [x] Validaciones Zod completas
- [x] Constantes `DELIVERY_METHODS`, `PAYMENT_METHODS`, `SALE_SOURCES`
- [x] Labels para UI

### Service (`services/sale.service.ts`)

- [x] `getSales` con filtros y paginación
- [x] `getSaleById`
- [x] `createSale` con generación de orderNumber
- [x] `updateSale`
- [x] `deleteSale`
- [x] `calculateSalesStats`

### Actions (`actions/sale.actions.ts`)

- [x] `getSalesAction`
- [x] `getSaleByIdAction`
- [x] `createSaleAction`
- [x] `updateSaleAction`
- [x] `deleteSaleAction`
- [x] `createPublicSaleAction`

### Utils (`utils/sell.utils.ts`)

- [x] `formatDate`
- [x] `calculateItemSubtotal`
- [x] `calculateOrderTotal`
- [x] `calculateTotalRevenue`
- [x] `groupProductsByName` (usa `item.productName`)
- [x] `filterBySearchTerm`
- [x] `filterByDateRange`
- [x] `applyFilters`
- [x] `sortSales`

---

## 🚨 Breaking Changes

1. **Estructura de datos**:

   - `sell.customerName` → `sale.customer.name`
   - `sell.products` → `sale.items`
   - `sell.date` → `sale.metadata.createdAt`
   - `sell.total` → `sale.totals.total`
   - `sell.paymentMethod` → `sale.payment.method`
   - `sell.deliveryMethod` → `sale.delivery.method`

2. **Items**:

   - `item.name` → `item.productName`
   - `item.cantidad` → `item.quantity`
   - `item.price` → `item.unitPrice`

3. **API**:
   - `useSells()` → `getSalesAction()`
   - `useSellStore.addSell()` → `createSaleAction()`

---

## ⏭️ Próximos Pasos (Opcional)

1. Considerar migración de datos existentes en Firestore a la nueva estructura
