# Shared Validations

## ⚠️ REGLA IMPORTANTE

**Solo schemas VERDADERAMENTE compartidos** (usados en 3+ features diferentes)

## ✅ Qué incluir aquí:

- Primitivos básicos: email, url, color, time, slug
- Validaciones de formato comunes
- Mensajes de error compartidos

## ❌ Qué NO incluir:

- Schemas específicos de un feature (productos, ventas, etc.)
- Schemas que solo se usan en 1-2 lugares
- Lógica de negocio

## 📁 Estructura correcta:

```
shared/validations/
  ├── common.schemas.ts   ← Solo primitivos básicos
  └── README.md           ← Este archivo

features/products/schemas/
  └── product.schema.ts   ← Schemas de productos

features/dashboard/modules/store-settings/schemas/
  └── profile.schema.ts   ← Schemas de perfil
```

## 🔄 Migración desde index.ts

El antiguo `index.ts` violaba la arquitectura (barrel exports prohibidos).

**Schemas movidos a features:**

- `productDataSchema` → `features/products/schemas/`
- `storeProfileSchema` → `features/dashboard/modules/store-settings/schemas/`
- `qrUserDataSchema` → `features/dashboard/modules/qr/schemas/`
- `sellTotalsSchema` → `features/dashboard/modules/sells/schemas/`

**Solo permanecen en shared:**

- `emailSchema`, `urlSchema`, `hexColorSchema`
- `timeSchema`, `slugSchema`, `whatsappSchema`

## 📖 Uso correcto:

```typescript
// ✅ CORRECTO - Importar directamente
import { emailSchema, slugSchema } from '@/shared/validations/common.schemas';

// ❌ INCORRECTO - No usar barrel
import { emailSchema } from '@/shared/validations';
```
