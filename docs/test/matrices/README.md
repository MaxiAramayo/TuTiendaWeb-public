# Matrices de casos de prueba

Una matriz por schema/feature: relaciona cada **regla de validación** con sus
casos (válido / inválido / borde) y el **mensaje esperado**. Sirve de:

- checklist al escribir los tests (que no falte ninguna regla),
- documentación de las reglas de negocio de validación,
- referencia para revisar PRs.

## Formato

| Campo | Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|-------|------|-------|-----------|------------------|
| `price` | `positive()` | inválido | `-10` | ❌ | `El precio debe ser positivo` |
| `price` | `positive()` | borde | `0` | ❌ | `El precio debe ser positivo` |
| `price` | válido | happy | `1000` | ✅ | — |

> Los mensajes deben copiarse del schema real, no inventarse.

## Índice de matrices

- ✅ `store-setup.md` — `storeSetupSchema`
- ✅ `onboarding.md` — `onboardingCompleteSchema` (por paso)
- ✅ `product-import.md` — `productImportRowSchema` (extras, tags, activo)
- ✅ `store.md` — `storeSchema` (whatsapp, URLs, schedule)
- ✅ `sell.md` — `createSaleSchema`
- ✅ `profile.md` — `profileFormSchema` (imageUpload, whatsapp, slug)
- ⏳ `login.md` — `loginSchema` *(test hecho; matriz pendiente)*
- ⏳ `register.md` — `registerSchema` (OWASP + confirmPassword) *(test hecho; matriz pendiente)*
- ⏳ `product.md` — `productSchema` / `productFormSchema` *(test hecho; matriz pendiente)*
- ⏳ `category.md` — `categorySchema` *(test hecho; matriz pendiente)*
- ⏳ `checkout.md` — `checkoutFormSchema` / `publicCheckoutItemSchema` *(test hecho; matriz pendiente)*

> Schemas auxiliares cubiertos por tests sin matriz dedicada: `reset-password`,
> `user-profile`, `complete-registration`, `tag` (validaciones triviales).
