# Data Models Documentation

Based on the Firestore data structure.

## Store (`/stores/{storeId}`)

The root document for a store.

```json
{
  "id": "KFk1qdddTBdgFIc2ZAGu",
  "ownerId": "wGwRRIO9lfPrIzGK23uvI0JdyHr1",
  "basicInfo": {
    "name": "GramBristo Restaurant",
    "slug": "grambristo-restaurant",
    "description": "Restaurante especializado...",
    "type": "restaurant"
  },
  "contactInfo": {
    "whatsapp": "+54 3854402944",
    "website": ""
  },
  "address": {
    "street": "Roca 600",
    "city": "Capital",
    "province": "Santiago del Estero",
    "country": "Argentina",
    "zipCode": "4200"
  },
  "theme": {
    "primaryColor": "#7C3AED",
    "secondaryColor": "#E0E7FF",
    "accentColor": "#1F2937",
    "fontFamily": "Open Sans, sans-serif",
    "buttonStyle": "square",
    "style": "pill",
    "logoUrl": "...",
    "bannerUrl": "..."
  },
  "schedule": {
    "monday": { "closed": false, "periods": [...] },
    ...
  },
  "settings": {
    "currency": "ARS",
    "language": "es",
    "timezone": "America/Argentina/Buenos_Aires",
    "orderSettings": { "preparationTime": 30 },
    "paymentMethods": [...],
    "deliveryMethods": [...]
  },
  "subscription": {
    "plan": "free",
    "active": true,
    ...
  },
  "socialLinks": {
    "instagram": "...",
    "facebook": ""
  },
  "metadata": {
    "createdAt": "...",
    "updatedAt": "...",
    "status": "active",
    "version": 1
  }
}
```

## Categories (`/stores/{storeId}/categories/{categoryId}`)

```json
{
  "id": "V89p9D8e24JREfJTmttW",
  "storeId": "KFk1qdddTBdgFIc2ZAGu",
  "name": "Pizzas",
  "slug": "pizzas",
  "parentId": null,
  "isActive": true,
  "createdAt": "2025-08-25T20:43:49.810Z",
  "updatedAt": "2025-08-25T20:43:49.810Z"
}
```

## Products (`/stores/{storeId}/products/{productId}`)

```json
{
  "id": "FLNQPBSiOHE9e4WYhb1C",
  "storeId": "KFk1qdddTBdgFIc2ZAGu",
  "name": "Lomito Completo",
  "slug": "lomito-completo",
  "description": "...",
  "shortDescription": "...",
  "price": 9000,
  "costPrice": 4500,
  "categoryId": "l9gH8wNjG69BOgtYxjfm",
  "tags": ["lx8nEW0DGhn2RpHnB0rJ"],
  "imageUrls": [],
  "variants": [
    {
      "id": "1754078474055",
      "name": "Pan de la casa",
      "additionalPrice": 1000,
      "available": true
    }
  ],
  "hasPromotion": false,
  "promotionsEnabled": true,
  "status": "active",
  "currency": "ARS",
  "createdAt": "...",
  "updatedAt": "..."
}
```
