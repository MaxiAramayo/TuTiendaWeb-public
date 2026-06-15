# Matriz — `storeSetupSchema`

Fuente: `src/features/auth/schemas/store-setup.schema.ts`
Test: `src/features/auth/schemas/store-setup.schema.test.ts`

| Campo | Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|-------|------|-------|-----------|------------------|
| `storeName` | requerido | inválido | ausente | ❌ | `Nombre de la tienda es requerido` |
| `storeName` | `min(3)` | inválido | `"ab"` | ❌ | `El nombre debe tener al menos 3 caracteres` |
| `storeName` | `min(3)` | borde | `"abc"` | ✅ | — |
| `storeName` | `max(100)` | inválido | 101 chars | ❌ | `El nombre no puede exceder 100 caracteres` |
| `storeName` | `trim()` | transform | `"  Tienda Demo  "` | ✅ → `"Tienda Demo"` | — |
| `storeType` | enum (12) | válido | `"retail"` … `"other"` | ✅ | — |
| `storeType` | enum errorMap | inválido | `"teletransporte"` | ❌ | `Selecciona un tipo de tienda válido` |
| `slug` | `min(3)` | inválido | `"ab"` | ❌ | `El nombre del sitio debe tener al menos 3 caracteres` |
| `slug` | `max(50)` | inválido | 51 chars | ❌ | `El nombre del sitio no puede exceder 50 caracteres` |
| `slug` | regex `^[a-z0-9-]+$` | inválido | `"Tienda"`, `"a b"`, `"a_b"`, `"tiénda"`, `"a!"` | ❌ | `Solo letras minúsculas, números y guiones` |
| `slug` | regex | válido | `"tienda-123"` | ✅ | — |
| `address` | opcional / `literal('')` | válido | `""`, ausente | ✅ | — |
| `address` | `min(10)` | inválido | `"Calle 1"` | ❌ | (unión) |
| `address` | `max(200)` | inválido | 201 chars | ❌ | (unión) |
| `phone` | opcional / `literal('')` | válido | `""`, `"+5491112345678"`, `"5491112345678"` | ✅ | — |
| `phone` | regex E.164 | inválido | `"0123456789"`, `"abc"`, `"+"`, 16 dígitos | ❌ | (unión) |

> Los campos `address`/`phone` usan `.optional().or(z.literal(''))`: el mensaje del
> error de regla queda envuelto en un error de unión, por eso se afirma `success: false`.
