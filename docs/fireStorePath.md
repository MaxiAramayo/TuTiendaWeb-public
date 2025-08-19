
## 📂 Colecciones Raíz

```
/users/{userId}
/stores/{storeId}
```

---

### 🔑 /users/{userId}

* **Campos (document fields)**
  – `email`
  – `displayName`
  – `role`
  – `storeIds: string[]`
  – `preferences`
  – `createdAt`, `updatedAt`

---

### 🏪 /stores/{storeId}

Cada documento `{storeId}` agrupa todas las secciones del perfil de la tienda como campos anidados:

```
/stores/{storeId}
   • basicInfo: { name, description, slug, type }
   • contactInfo: { whatsapp, website }
   • address: { street, city, province, country, zipCode, mapsLink? }
   • schedule: { monday:…, tuesday:…, …, sunday:… }
   • socialLinks: { instagram?, facebook? }
   • theme: { logoUrl?, bannerUrl?, primaryColor?, secondaryColor?, accentColor?, fontFamily?, style? }
   • settings:
       – paymentMethods: [ { id, name, enabled, instructions? }, … ]
       – deliveryMethods: [ { id, name, enabled, price?, instructions? }, … ]
       – notifications: { receiveOrdersOnWhatsApp, receiveOrdersInApp, pushNotifications }
       – currency, language, timezone
   • subscription:
       – active, plan, startDate, graceUntil, trialUsed
       – billing: { provider?, customerId?, subscriptionId?, autoRenew? }
   • metadata: { createdAt, updatedAt, version, status, completeness }
```

---

## 📁 Subcolecciones de la Tienda

Bajo cada tienda, mantenemos subcolecciones para **productos**, **ventas** u **órdenes**, aislando la alta cardinalidad:

```
/stores/{storeId}/products/{productId}
/stores/{storeId}/sales/{saleId}
/stores/{storeId}/orders/{orderId}
```

#### /stores/{storeId}/products/{productId}

* `name`, `description?`, `price`, `imageUrl?`
* `category`, `tags?`, `availableDays?`, `availableHours?`
* `extras: ExtraGroup[]`, `status`
* `createdAt`, `updatedAt`

#### /stores/{storeId}/sales/{saleId}

* `items: SaleItem[]`
* `subtotal`, `discount?`, `tax?`, `total`
* `deliveryMethod`, `paymentMethod`, `orderSource`
* `customer: { name, phone?, address?, notes? }`
* `status`, `paymentStatus`
* `createdBy`, `createdAt`, `updatedAt`

#### /stores/{storeId}/orders/{orderId}

* igual que `Sale` pero con `status: received|confirmed|cancelled`
* se transforma en `Sale` al confirmarse

---

### 🔗 Resumen de Paths

```
/users/{userId}

/stores/{storeId}
    basicInfo
    contactInfo
    address
    schedule
    socialLinks
    theme
    settings
    subscription
    metadata

/stores/{storeId}/products/{productId}
/stores/{storeId}/sales/{saleId}
/stores/{storeId}/orders/{orderId}
```

Con esta organización:

* **Lecturas rápidas**: todos los datos del perfil en un único documento `/stores/{storeId}`.
* **Escalabilidad**: subcolecciones separadas para productos/ventas/órdenes.
* **Seguridad**: reglas sobre `/stores/{storeId}` (lectura pública) y subcolecciones (solo dueño autenticado).

¡Listo para definir tus Firestore Rules y arrancar el desarrollo!
