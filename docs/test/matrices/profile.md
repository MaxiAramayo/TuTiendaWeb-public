# Matriz — schemas de `profile`

Fuente: `src/features/dashboard/modules/store-settings/schemas/profile.schema.ts`
Test: `src/features/dashboard/modules/store-settings/schemas/profile.schema.test.ts`

## `imageUploadSchema`

| Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|------|-------|-----------|------------------|
| `instanceof(File)` | válido | PNG < 5MB | ✅ | — |
| `instanceof(File)` | inválido | `"no-soy-archivo"` | ❌ | `Debe seleccionar un archivo` |
| refine MIME | inválido | `application/pdf` | ❌ | `Solo se permiten archivos JPG, PNG o WebP` |
| refine tamaño | inválido | `6MB` | ❌ | `El archivo no puede superar los 5MB` |
| refine tamaño | borde | `5MB` exacto | ✅ | — |
| `type` enum | inválido | `"avatar"` | ❌ | (default Zod) |

## `whatsappSchema` (flexible)

| Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|------|-------|-----------|------------------|
| refine | válido | `+54 9 11 1234-5678`, `+5491112345678`, `1112345678`, `011-1234-5678` | ✅ | — |
| `min(8)` | inválido | `"12345"` | ❌ | `Debe tener al menos 8 caracteres` |
| `max(25)` | inválido | 26 chars | ❌ | `No puede superar los 25 caracteres` |
| refine | con letras | `"abcd12345"` | ❌ | `Ingrese un número de WhatsApp válido (ej: +54 9 11 1234-5678)` |

## `slugSchema`

| Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|------|-------|-----------|------------------|
| transform | normaliza | `"mi-tienda"` | ✅ → `"mi-tienda"` | — |
| `min(3)` | inválido | `"ab"` | ❌ | `Debe tener al menos 3 caracteres` |
| regex | inválido | `"Tienda"`,`"mi tienda"`,`"mi--tienda"`,`"-tienda"` | ❌ | `Solo letras minúsculas, números y guiones` |

## `profileFormSchema`

| Campo | Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|-------|------|-------|-----------|------------------|
| — | defaults | mínimo válido | — | ✅ → `country:'Argentina'`, `currency:'ARS'`, `language:'es'` | — |
| `name` | `min(2)` | inválido | `"a"` | ❌ | `Debe tener al menos 2 caracteres` |
| `description` | `min(10)` | inválido | `"corta"` | ❌ | `Debe tener al menos 10 caracteres` |
| `storeType` | enum | inválido | `"teletransporte"` | ❌ | (default Zod) |
