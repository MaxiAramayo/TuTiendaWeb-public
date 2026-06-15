# Matriz — schemas de `sell`

Fuente: `src/features/dashboard/modules/sells/schemas/sell.schema.ts`
Test: `src/features/dashboard/modules/sells/schemas/sell.schema.test.ts`

## `saleItemSchema`

| Campo | Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|-------|------|-------|-----------|------------------|
| item | válido | happy | item completo | ✅ | — |
| `quantity` | `int().positive()` | inválido | `0`, `-1`, `1.5` | ❌ | (default Zod) |
| `unitPrice` | `nonnegative()` | inválido | `-1` | ❌ | (default Zod) |
| `unitPrice` | `nonnegative()` | borde | `0` | ✅ | — |

## `customerInfoSchema`

| Campo | Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|-------|------|-------|-----------|------------------|
| `name` | `min(1)` | inválido | `""` | ❌ | `El nombre del cliente es requerido` |
| `email` | `email()` | inválido | `"no-email"` | ❌ | (default Zod) |

## `saleTotalsSchema`

| Campo | Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|-------|------|-------|-----------|------------------|
| `discount` | default | ausente | — | ✅ → `0` | — |
| `total` | `nonnegative()` | inválido | `-1` | ❌ | (default Zod) |

## `createSaleSchema` (refine delivery)

| Campo | Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|-------|------|-------|-----------|------------------|
| venta | válido | factory `makeSale()` | — | ✅ | — |
| `items` | `min(1)` | inválido | `[]` | ❌ | `Debe agregar al menos un item` |
| `delivery.address` | refine | delivery sin dirección | `{method:'delivery'}` | ❌ | `La dirección es obligatoria para delivery` |
| `delivery.address` | refine | dirección en blanco | `"   "` | ❌ | `La dirección es obligatoria para delivery` |
| `delivery.address` | refine | delivery con dirección | `"Av. Siempreviva 742"` | ✅ | — |
| `delivery` | retiro | sin dirección | `{method:'retiro'}` | ✅ | — |
