# Modelos de datos (Firestore)

Esquema de almacenamiento de TuTiendaWeb expresado como **tipos**, no como datos de
ejemplo. Describe cómo se guardan los documentos en Firestore para saber qué escribir y
leer en cada colección. **Verificado contra el código el 2026-06-12.**

> Convenciones:
> - `Timestamp` = `firebase-admin/firestore` Timestamp (en el servidor). Al serializar
>   para Client Components se convierten a ISO `string` (`serializeFirestoreData` /
>   `serializeTimestamp`).
> - Campos marcados `?` son opcionales (pueden no existir en el documento).
> - "Fuente" indica el schema/servicio que define la forma real almacenada.
> - El árbol de paths está en [firestore-paths.md](firestore-paths.md). El ciclo de vida
>   de `subscription` está en [suscripciones.md](suscripciones.md).

---

## Árbol de colecciones

```
/users/{userId}
/stores/{storeId}
  /categories/{categoryId}     ← jerarquía de 2 niveles (parentId)
  /tags/{tagId}
  /products/{productId}        ← referencia categoryId + subcategoryId?
  /sells/{sellId}              ← snapshot de la orden/venta
  /notifications/{id}          ← eventos de suscripción / sistema
```

---

## `/users/{userId}`

Documento de usuario. Se crea en `registerAction` / `getOrCreateUserFromGoogle`.
El `role`/`storeId` operativos viven en los **custom claims** de Firebase Auth, no acá.

```ts
interface UserDocument {
  id: string;                          // = UID de Firebase Auth
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: 'user' | 'owner';              // 'user' hasta crear tienda → 'owner'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

> Fuente: `features/user/services/user.service.ts`. Tras crear la tienda, los permisos
> reales se resuelven por custom claims (`storeId`, `role`), ver [auth.md](auth.md).

---

## `/stores/{storeId}`

Documento maestro de la tienda: agrupa configuración global para minimizar lecturas.
Creado por `createStore` (`features/store/services/store.service.ts`).

```ts
interface Store {
  id: string;                          // = ID del documento

  basicInfo: {
    name: string;
    slug: string;                      // único entre tiendas (basicInfo.slug)
    description: string;
    type: StoreType;
  };

  contactInfo: {
    whatsapp: string;                  // número del comercio (destino de pedidos)
    email: string;
    phone: string;
  };

  address: {
    street: string;
    city: string;
    state: string;                     // provincia
    zipCode: string;
  };

  socialLinks?: {                      // lo agrega store-settings, no createStore
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };

  theme: {
    primaryColor: string;              // hex
    secondaryColor: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: 'inter' | 'roboto' | 'poppins' | 'montserrat';
    logoUrl?: string;
    bannerUrl?: string;
  };

  schedule?: WeeklySchedule;           // ver tipo abajo (lo escribe store-settings)

  settings: {
    paymentMethods: PaymentMethod[];
    deliveryMethods: DeliveryMethod[];
    currency: string;                  // 'ARS'
    language?: string;                 // 'es'
    timezone?: string;                 // 'America/Argentina/Buenos_Aires'
    orderSettings?: { preparationTime: number };
  };

  subscription: Subscription;          // ver tipo dedicado abajo

  metadata: {
    ownerId: string;                   // UID del owner (estructura nueva)
    active: boolean;                   // soft-delete: false = desactivada
    onboardingCompleted?: boolean;
    onboardingStep?: OnboardingStep;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
}

type StoreType =
  | 'retail' | 'restaurant' | 'service' | 'digital' | 'fashion'
  | 'beauty' | 'health' | 'sports' | 'electronics' | 'home'
  | 'automotive' | 'other';
  // Aliases legacy tolerados en lectura: 'services', 'clothing', 'books'.

interface PaymentMethod {
  id: string;                          // 'efectivo' | 'transferencia' | 'mercadopago' | ...
  name: string;
  enabled: boolean;
  instructions?: string;
}

interface DeliveryMethod {
  id: string;                          // 'retiro' | 'delivery' | ...
  name: string;
  enabled: boolean;
  price?: number;
  instructions?: string;
}
```

> **ownerId:** la estructura nueva guarda `metadata.ownerId`. Documentos legacy pueden
> tener `ownerId` en la raíz; los servicios (`getStoresByOwner`, `isStoreOwner`) leen
> ambos. Para tiendas nuevas usar siempre `metadata.ownerId`.

### Horario semanal (`schedule`)

La forma canónica que consume el catálogo público es un objeto por día de la semana:

```ts
interface WeeklySchedule {
  monday: DailySchedule;
  tuesday: DailySchedule;
  wednesday: DailySchedule;
  thursday: DailySchedule;
  friday: DailySchedule;
  saturday: DailySchedule;
  sunday: DailySchedule;
}

interface DailySchedule {
  closed: boolean;
  periods: Array<{
    open: string;                      // 'HH:MM'
    close: string;                     // 'HH:MM'
    nextDay?: boolean;                 // cierra después de medianoche
  }>;
}
```

### Suscripción (`subscription`)

Inicializada por `createStore` (trial de 7 días con Timestamps reales). El resto del
ciclo de vida (pago, renovación, gracia, suspensión) lo gestionan las Cloud Functions
del repo `Funciones-google-tutiendaweb`. **No existe el plan `free`**: suspender =
`active: false` manteniendo el `plan`. Detalle completo en [suscripciones.md](suscripciones.md).

```ts
interface Subscription {
  active: boolean;                     // true = habilitada; false = suspendida
  plan: 'trial' | 'pro';              // NO existe 'free'
  paymentStatus:
    | 'trial' | 'pending' | 'authorized'
    | 'paused' | 'cancelled' | 'expired';
  trialUsed: boolean;
  startDate: Timestamp;
  endDate: Timestamp;                  // próximo cobro / vencimiento

  // Agregados/actualizados por las Cloud Functions (pueden no existir al crear):
  cancelAtPeriodEnd?: boolean;         // soft-cancel marcado
  lastPaymentDate?: Timestamp;         // buffer anti race-condition del scheduler
  graceUntil?: Timestamp;              // fin del período de gracia por pago fallido

  billing: {
    provider: 'mercadopago' | 'none';
    autoRenew: boolean;
    subscriptionId?: string;           // ID del PreApproval de MercadoPago
    pendingPlan?: 'pro';               // plan contratado, aún no confirmado por pago
    payerEmail?: string;
  };
}
```

Valores iniciales que escribe `createStore`:

```ts
subscription = {
  active: true,
  plan: 'trial',
  paymentStatus: 'trial',
  trialUsed: false,
  startDate: Timestamp.now(),
  endDate: Timestamp.now() + 7 días,
  billing: { provider: 'none', autoRenew: false },
};
```

---

## `/stores/{storeId}/categories/{categoryId}`

Jerarquía de **2 niveles** vía auto-referencia `parentId`. Topes: 50 categorías
principales, 30 subcategorías por padre. Borrado bloqueado si tiene productos o
subcategorías. Fuente: `features/products/{schemas/category.schema.ts, services/category.service.ts}`.

```ts
interface Category {
  id: string;
  storeId: string;
  name: string;
  slug: string;                        // derivado del nombre en el servidor
  description?: string;
  parentId: string | null;            // null = principal; <id> = subcategoría
  order?: number;                      // orden manual entre hermanas (mismo parentId); menor = primero
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

Reglas de integridad (validadas en el servicio):
- El padre de una subcategoría debe existir y ser **principal** (no se permiten 3 niveles).
- Nombre único dentro del mismo nivel (case-insensitive).
- Una categoría con subcategorías no puede convertirse en subcategoría.

### Orden manual (`order`)

- `order` es **relativo a las hermanas** (categorías con el mismo `parentId`): los
  principales se indexan entre sí y los hijos de cada padre se indexan entre sí
  (ambos empiezan en 0). No es un orden global.
- Al **crear**, `createCategory()` asigna `order = max(order de hermanas) + 1`
  (la nueva queda al final de su nivel).
- **Reordenamiento**: `reorderCategories(storeId, items)` recibe pares
  `{ id, order }` y los escribe en un **único batch atómico** (valida que cada id
  pertenezca a la tienda). Expuesto vía `reorderCategoriesAction`.
- **Lectura ordenada**: `getCategoryTree()` ordena principales e hijos por
  `(order, name)` con el comparador `byOrderThenName`. Categorías **sin `order`**
  (datos previos a este campo) caen al final, desempatadas alfabéticamente, hasta
  que se reordene el nivel una vez (ahí todas reciben `order`).
- **Catálogo público**: el orden definido en el dashboard es el orden por defecto
  de las secciones en la tienda. `getStoreCategoryOrder()` (en
  `features/store/services/public-store.service.ts`) devuelve
  `{ categoryOrder: string[], subcategoryOrderByParent: Record<nombrePadre, string[]> }`
  (nombres, porque los productos públicos referencian categoría/subcategoría por
  nombre). El orden de subcategorías se entrega **scopeado por categoría padre**
  porque su `order` es relativo y un mismo nombre de subcategoría puede repetirse
  bajo padres distintos. `ProductList` ordena cada sección con esos datos.

> **UX de reordenamiento (dashboard):** drag & drop con `@dnd-kit` en
> `categories-manager.tsx`. El arrastre se inicia desde un handle (ícono ⠿) y los
> cambios se acumulan en local; se persisten en **una sola escritura batch** al
> tocar "Guardar orden" (con "Descartar" para revertir al último guardado).

---

## `/stores/{storeId}/tags/{tagId}`

Etiquetas para filtros del catálogo. Fuente: `features/products/actions/tag.actions.ts`.

```ts
interface Tag {
  id: string;
  storeId: string;
  name: string;
  slug: string;                        // derivado del nombre
  color?: string;                      // hex (definido en el schema; opcional al crear)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## `/stores/{storeId}/products/{productId}`

Inventario de venta. Referencia a `categoryId` y opcionalmente `subcategoryId` (hoja).
Fuente: `shared/types/firebase.types.ts` (`Product`), `features/products/schemas/product.schema.ts`,
`features/products/services/product.service.ts`.

```ts
interface Product {
  id: string;
  storeId: string;

  name: string;
  slug: string;                        // derivado del nombre
  description?: string;

  categoryId: string;                  // categoría principal
  subcategoryId?: string;              // subcategoría (debe pertenecer a categoryId)
  tags?: string[];                     // IDs de tags

  price: number;                       // precio de venta
  costPrice?: number;                  // costo interno (default 0)
  currency: 'ARS';

  imageUrls?: string[];                // URLs públicas en Storage

  variants?: ProductVariant[];

  status: 'active' | 'inactive' | 'draft';
  hasPromotion?: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;                       // precio adicional del extra
  isAvailable: boolean;
  imageUrl?: string;
}
```

> **Estado:** se persiste `status` (`'active' | 'inactive' | 'draft'`). El formulario usa
> un booleano `active` que el action mapea a `status`.
> **Variantes legacy:** documentos viejos pueden traer `additionalPrice`/`available`; el
> servicio los normaliza a `price`/`isAvailable` al leer.
> **Integridad de subcategoría:** el action valida con `isValidSubcategory()` que
> `subcategoryId` sea hijo de `categoryId` antes de guardar. El valor crudo del form
> se normaliza con `normalizeSubcategoryId()`, que descarta `''`, `'undefined'` y
> `'null'` (tratándolos como "sin subcategoría"); así un producto con solo categoría
> principal nunca dispara el error de integridad. La validación solo corre si queda
> un id real.

---

## `/stores/{storeId}/sells/{sellId}`

Historial de órdenes/ventas. Funciona como **snapshot**: guarda la foto de los items al
momento de la compra. Se crean tanto desde el dashboard (`source: 'local'`) como desde el
catálogo público (`source: 'web'`). Fuente: `features/dashboard/modules/sells/{schemas/sell.schema.ts, services/sale.service.ts}`.

```ts
interface Sale {
  id: string;
  orderNumber: string;                 // 'ORD-...'
  storeId: string;
  source: 'local' | 'web' | 'whatsapp';

  customer: {
    name: string;
    phone?: string;
    email?: string;
  };

  items: SaleItem[];

  delivery: {
    method: 'retiro' | 'delivery';
    address?: string;                  // obligatorio si method = 'delivery'
    notes?: string;
  };

  payment: {
    method: 'efectivo' | 'transferencia' | 'mercadopago';
    total: number;
  };

  totals: {
    subtotal: number;
    discount: number;                  // default 0
    total: number;
  };

  notes?: string;

  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
}

interface SaleItem {
  id: string;
  productId: string;
  productName: string;                 // snapshot del nombre
  categoryId: string;
  quantity: number;                    // entero positivo
  unitPrice: number;                   // snapshot del precio
  subtotal: number;                    // (unitPrice + Σ variants.price) * quantity
  variants?: Array<{ id: string; name: string; price: number }>;
  notes?: string;
}
```

> El modelo refactorizado **no** tiene un campo `status` de orden
> (pendiente/confirmada/...); el ciclo de estados descrito en los casos de uso aún no
> está reflejado en este schema. `source` distingue el origen. Ver [sells.md](sells.md).

---

## `/stores/{storeId}/notifications/{id}`

Eventos del sistema/suscripción (paginables, marcables como leídos). Los escribe
`createStore` (bienvenida del trial) y las Cloud Functions de suscripciones.

```ts
interface StoreNotification {
  type:
    | 'trial_started' | 'trial_expired'
    | 'payment_success' | 'payment_failed'
    | 'subscription_cancelled' | 'subscription_expired'
    | 'subscription_reactivated';
  message: string;
  read: boolean;
  createdAt: Timestamp;
}
```

---

## Puntos de diseño

1. **Lectura rápida del store:** una sola lectura de `/stores/{id}` trae nombre, tema,
   horarios, métodos de pago y suscripción — sin consultas adicionales.
2. **Inventario escalable:** productos/categorías/ventas viven en subcolecciones, así no
   pesan en la carga inicial del documento de la tienda.
3. **Historial inmutable:** `/sells` guarda snapshot de precios/nombres; cambiar un
   producto después no altera ventas pasadas.
4. **Soft-delete de tiendas:** `metadata.active = false` en vez de borrar. Productos y
   ventas, en cambio, se borran de forma definitiva (hard delete).
