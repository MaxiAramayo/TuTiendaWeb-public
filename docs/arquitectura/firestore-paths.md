## 📂 Colecciones Raíz

```
/users/{userId}
/stores/{storeId}
```

-----

### 👤 /users/{userId}

*(Inferido por el campo `ownerId` en la tienda)*

  * **Campos (document fields)**
      * `uid`: string (ID de autenticación)
      * `email`: string
      * `displayName`: string
      * `storeIds`: string[] (Array de IDs de tiendas que posee)
      * `createdAt`, `updatedAt`

-----

### 🏪 /stores/{storeId}

Este es el **documento maestro**. Agrupa toda la configuración global del negocio para reducir lecturas en la base de datos.

```
/stores/{storeId}
   • id: string (mismo que el document ID)
   • ownerId: string (referencia a /users)
   • basicInfo: { name, slug, description, type }
   • contactInfo: { whatsapp, website }
   • address: { street, city, province, country, zipCode }
   • socialLinks: { instagram?, facebook? }
   • subscription:
       – plan: "trial" | "pro"        (NO existe "free"; ver data-models.md / suscripciones.md)
       – active: boolean              (false = suspendida, manteniendo el plan)
       – paymentStatus: "trial" | "pending" | "authorized" | "paused" | "cancelled" | "expired"
       – trialUsed: boolean
       – startDate, endDate
       – billing: { provider: "mercadopago" | "none", autoRenew, ... }
   • theme: 
       – primaryColor, secondaryColor, accentColor
       – logoUrl, bannerUrl
       – fontFamily, buttonStyle, style
   • schedule: 
       – monday...sunday: { 
             closed: boolean, 
             periods: [ { open: "HH:MM", close: "HH:MM", nextDay: boolean } ] 
         }
   • settings:
       – currency: "ARS"
       – language: "es"
       – timezone: "America/Argentina/Buenos_Aires"
       – orderSettings: { preparationTime: number }
       – paymentMethods: [ { id, name, enabled, instructions? }, … ]
       – deliveryMethods: [ { id, name, enabled, price?, instructions? }, … ]
   • metadata: { createdAt, updatedAt, status, version }
```

-----

## 📁 Subcolecciones de la Tienda

Para manejar la escalabilidad (alta cardinalidad), los elementos transaccionales se guardan en subcolecciones dentro de cada tienda.

```
/stores/{storeId}/categories/{categoryId}
/stores/{storeId}/tags/{tagId}
/stores/{storeId}/products/{productId}
/stores/{storeId}/sells/{sellId}
/stores/{storeId}/notifications/{notificationId}
```

#### 🏷️ /stores/{storeId}/categories/{categoryId}

Organización jerárquica del menú, **2 niveles** vía `parentId`
(máx. 50 principales, 30 subcategorías por padre).

  * `name`: string ("Hamburguesas")
  * `slug`: string ("hamburguesas")
  * `description?`: string
  * `parentId`: string | null  → `null` = categoría principal; `<id>` = subcategoría
  * `isActive`: boolean
  * `storeId`, `createdAt`, `updatedAt`

#### 🔖 /stores/{storeId}/tags/{tagId}

Etiquetas para filtros rápidos (ej: "Sin TACC", "Picante").

  * `name`: string ("Sandwich")
  * `slug`: string ("sandwich")

#### 🍔 /stores/{storeId}/products/{productId}

El inventario de venta.

  * `name`, `description?`
  * `slug`, `imageUrls: string[]`
  * `price` (precio venta), `costPrice` (costo interno), `currency: "ARS"`
  * `categoryId` (categoría principal)
  * `subcategoryId?` (subcategoría hoja; debe pertenecer a `categoryId`)
  * `tags: string[]` (Array de IDs de tags)
  * `status`: "active" | "inactive" | "draft"
  * `hasPromotion?`
  * `variants: Variant[]` → `{ id, name, price, isAvailable }`
      (legacy: `additionalPrice`/`available`, normalizados al leer)
  * `storeId`, `createdAt`, `updatedAt`

#### 🧾 /stores/{storeId}/sells/{sellId}

Historial de órdenes y ventas. Funciona como "Snapshot" (guarda la foto del producto al
momento de la compra). Estructura **anidada** (refactor de ventas). Forma de campo a campo
en [data-models.md](data-models.md#storesstoreidsellssellid).

  * `orderNumber`: string ("ORD-...")
  * `source`: "local" | "web" | "whatsapp"   (no hay campo `status` de orden en el modelo actual)
  * `customer`: `{ name, phone?, email? }`
  * `items`: `{ id, productId, productName, categoryId, quantity, unitPrice, subtotal, variants[], notes? }[]`
  * `delivery`: `{ method: "retiro" | "delivery", address?, notes? }`
  * `payment`: `{ method: "efectivo" | "transferencia" | "mercadopago", total }`
  * `totals`: `{ subtotal, discount, total }`
  * `notes?`
  * `metadata`: `{ createdAt, updatedAt }`

-----

### 🔗 Resumen de Paths (Árbol de Directorios)

```
/users/{userId}

/stores/{storeId}
    basicInfo
    address
    schedule
    settings
    subscription
    theme
    ...

    /categories/{categoryId}      (parentId: principal ⇄ subcategoría)
    /tags/{tagId}
    /products/{productId}
        variants[...]
    /sells/{sellId}
        items[...] (snapshot de la orden)
    /notifications/{id}           (eventos de suscripción / sistema)
```

### 💡 Puntos Clave de este Diseño

1.  **Lectura Ultra-Rápida:** Al cargar la tienda (`/stores/KFk1...`), obtienes de un solo golpe el nombre, colores, horarios y métodos de pago. No necesitas hacer 5 consultas diferentes.
2.  **Inventario Escalable:** Si tienes 10,000 productos, no ralentizan la carga inicial de la tienda porque están en una subcolección `/products`.
3.  **Historial Seguro:** La colección `/sells` (Ventas) guarda una copia de los precios. Si cambias el precio de la hamburguesa mañana, las ventas de ayer no se modifican.