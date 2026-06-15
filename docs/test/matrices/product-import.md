# Matriz — `productImportRowSchema`

Fuente: `src/features/products/schemas/product-import.schema.ts`
Test: `src/features/products/schemas/product-import.schema.test.ts`

| Campo | Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|-------|------|-------|-----------|------------------|
| `nombre` | `min(3)` | inválido | `"ab"` | ❌ | `Nombre debe tener al menos 3 caracteres` |
| `precio` | coerce | válido | `"2500"` | ✅ → `2500` | — |
| `precio` | tipo | inválido | `"abc"` | ❌ | `Precio debe ser un número` |
| `precio` | `positive()` | inválido | `"0"`, `"-10"` | ❌ | `Precio debe ser mayor a 0` |
| `costo` | `min(0)` | inválido | `"-1"` | ❌ | `Costo no puede ser negativo` |
| `costo` | default | ausente | — | ✅ → `0` | — |
| `costo` | borde | válido | `"0"` | ✅ | — |
| `categoria` | `min(1)` | inválido | `""` | ❌ | `Categoría requerida` |
| `subcategoria` | transform | normaliza | `""` / ausente | ✅ → `undefined` | — |
| `subcategoria` | transform | preserva | `"USB-C"` | ✅ → `"USB-C"` | — |
| `tags` | split/trim/filter | transform | `" nuevo , oferta ,, "` | ✅ → `['nuevo','oferta']` | — |
| `tags` | default | ausente / `""` | — | ✅ → `[]` | — |
| `activo` | transform→bool | inactivo | `"no"`,`"false"`,`"0"`,`"inactivo"` (case/space-insensitive) | ✅ → `false` | — |
| `activo` | transform→bool | activo | `"si"`,`"true"`,`"1"`,`"activo"`, ausente | ✅ → `true` | — |
| `extras` | transform | único | `"Salsa:100"` | ✅ → `[{name:'Salsa',price:100}]` | — |
| `extras` | transform | múltiple | `"Salsa:100; Queso:50"` | ✅ → 2 items | — |
| `extras` | último `:` | nombre con `:` | `"Combo:Doble:200"` | ✅ → `{name:'Combo:Doble',price:200}` | — |
| `extras` | precio 0 | borde | `"Gratis:0"` | ✅ → `price:0` | — |
| `extras` | vacío | borde | `"   "` | ✅ → `[]` | — |
| `extras` | formato | inválido | `"Salsa"`,`"Salsa:"`,`"Salsa:abc"`,`"Salsa:-1"` | ❌ | `Extra "<token>" debe tener formato Nombre:Precio con precio numérico >= 0` |
| `MAX_IMPORT_PRODUCTS` | constante | — | — | `300` | — |
