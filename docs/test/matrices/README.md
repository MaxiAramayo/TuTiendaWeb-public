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

- `login.md` — `loginSchema`
- `register.md` — `registerSchema` (OWASP + confirmPassword)
- `store-setup.md` — `storeSetupSchema`
- `onboarding.md` — `onboardingSchema` (por paso)
- `product.md` — `productSchema` / `productFormSchema`
- `category.md` — `categorySchema`
- `product-import.md` — `productImportRowSchema` (extras, tags, activo)
- `checkout.md` — `checkoutFormSchema` / `publicCheckoutItemSchema`
- `store.md` — `storeSchema` (whatsapp, URLs, schedule)
- `sell.md` — `createSaleSchema`
- `profile.md` — `profileFormSchema` (imageUpload, whatsapp, slug)

Cada archivo se crea junto con su test correspondiente en la Fase 1.
