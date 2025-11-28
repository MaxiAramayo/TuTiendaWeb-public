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
       – plan: "free" | "premium"
       – active: boolean
       – trialUsed: boolean
       – startDate, endDate
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
```

#### 🏷️ /stores/{storeId}/categories/{categoryId}

Organización jerárquica del menú.

  * `name`: string ("Hamburguesas")
  * `slug`: string ("hamburguesas")
  * `isActive`: boolean
  * `parentId`: string | null (para subcategorías)
  * `createdAt`, `updatedAt`

#### 🔖 /stores/{storeId}/tags/{tagId}

Etiquetas para filtros rápidos (ej: "Sin TACC", "Picante").

  * `name`: string ("Sandwich")
  * `slug`: string ("sandwich")

#### 🍔 /stores/{storeId}/products/{productId}

El inventario de venta.

  * `name`, `description`, `shortDescription?`
  * `slug`, `imageUrls: string[]`
  * `price` (precio venta), `costPrice` (costo interno)
  * `categoryId` (Link a la colección categories)
  * `tags: string[]` (Array de IDs de tags)
  * `status`: "active" | "paused" | "archived"
  * `promotionsEnabled?`, `hasPromotion?`
  * `variants: Variant[]`
      * `{ id, name, price?, additionalPrice?, available?, isAvailable? }`
  * `createdAt`, `updatedAt`

#### 🧾 /stores/{storeId}/sells/{sellId}

Historial de órdenes y ventas. Funciona como "Snapshot" (guarda la foto del producto al momento de la compra).

  * `orderNumber`: string ("ORD-1754...")
  * `date`: ISO string
  * `status`: "pending" | "confirmed" | "completed" | "cancelled"
  * `source`: "web" | "local"
  * **Totales:**
      * `total`, `subtotal`, `paidAmount`
      * `discount?`, `tax?`
  * **Cliente:**
      * `customerName`, `customerPhone`
      * `address?`, `customerId?`
  * **Métodos:**
      * `paymentMethod`: "efectivo" | "mercadopago" | "transferencia"
      * `paymentStatus`: "pending" | "paid"
      * `deliveryMethod`: "pickup" | "delivery" | "retiro"
      * `deliveryDate?`, `deliveryNotes?`, `notes?`
  * **Items (Snapshot):**
      * `products: OrderItem[]`
          * `{ id, idProduct, name, price, cantidad, category, aclaracion?, appliedTopics[] }`
  * `createdBy` (ID del empleado si es venta local)

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

    /categories/{categoryId}
    /tags/{tagId}
    /products/{productId}
        variants[...]
    /sells/{sellId}
        products[...] (items de la orden)
```

### 💡 Puntos Clave de este Diseño

1.  **Lectura Ultra-Rápida:** Al cargar la tienda (`/stores/KFk1...`), obtienes de un solo golpe el nombre, colores, horarios y métodos de pago. No necesitas hacer 5 consultas diferentes.
2.  **Inventario Escalable:** Si tienes 10,000 productos, no ralentizan la carga inicial de la tienda porque están en una subcolección `/products`.
3.  **Historial Seguro:** La colección `/sells` (Ventas) guarda una copia de los precios. Si cambias el precio de la hamburguesa mañana, las ventas de ayer no se modifican.