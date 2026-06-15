# Matriz — schemas de `store`

Fuente: `src/features/store/schemas/store.schema.ts`
Test: `src/features/store/schemas/store.schema.test.ts`

## `whatsappSchema`

| Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|------|-------|-----------|------------------|
| transform `+54` | sin prefijo | `"1112345678"` | ✅ → `"+541112345678"` | — |
| transform | con `+` | `"+5491112345678"` | ✅ → igual | — |
| `min(1)` | vacío | `""` | ❌ | `Este campo es obligatorio` |
| regex | inválido | `"0123456789"`,`"abc"`,`"+54 9 11 1234"` | ❌ | `Número de WhatsApp inválido. Debe incluir código de país` |

## `instagramUrlSchema` / `facebookUrlSchema`

| Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|------|-------|-----------|------------------|
| opcional | ausente | `undefined` | ✅ | — |
| refine IG | válido | `https://instagram.com/usuario` | ✅ | — |
| refine IG | inválido | `https://twitter.com/x` | ❌ | `URL de Instagram inválida` |
| refine FB | válido | `https://facebook.com/mitienda` | ✅ | — |
| refine FB | inválido | `https://instagram.com/x` | ❌ | `URL de Facebook inválida` |

## `slugSchema`

| Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|------|-------|-----------|------------------|
| `min(3)` | inválido | `"ab"` | ❌ | `Debe contener al menos 3 caracteres` |
| `max(30)` | inválido | 31 chars | ❌ | `No puede exceder 30 caracteres` |
| regex | inválido | `"Tienda"` | ❌ | `Solo letras minúsculas, números y guiones` |
| refine `--` | inválido | `"ti--enda"` | ❌ | `No puede contener guiones dobles` |
| refine borde `-` | inválido | `"-tienda"`,`"tienda-"` | ❌ | `No puede empezar o terminar con guión` |
| válido | happy | `"tienda-demo"` | ✅ | — |

## `storeNameSchema`

| Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|------|-------|-----------|------------------|
| `trim()` | transform | `"  Mi Tienda  "` | ✅ → `"Mi Tienda"` | — |
| regex | acentos/ñ | `"Almacén Doña Ñata"` | ✅ | — |
| `min(2)` | inválido | `"a"` | ❌ | `Debe contener al menos 2 caracteres` |
| regex | con números | `"Tienda123"` | ❌ | `El nombre solo puede contener letras y espacios` |

## `hexColorSchema` / `timeSchema`

| Schema | Caso | Input | Resultado | Mensaje esperado |
|--------|------|-------|-----------|------------------|
| hex | válido | `"#FF0000"`,`"#abc"` | ✅ | — |
| hex | inválido | `"FF0000"`,`"#GG0000"`,`"#FF00"` | ❌ | `Color hexadecimal inválido (ej: #FF0000)` |
| time | válido | `"00:00"`,`"9:30"`,`"23:59"` | ✅ | — |
| time | inválido | `"24:00"`,`"12:60"`,`"12-30"`,`"1230"` | ❌ | `Formato de hora inválido (HH:MM)` |

## `scheduleSchema` (doble refine)

| Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|------|-------|-----------|------------------|
| cerrado | válido | `{day:'monday', isOpen:false}` | ✅ | — |
| abierto ok | válido | open `09:00` < close `18:00` | ✅ | — |
| refine 1 | abierto sin horarios | `{isOpen:true}` | ❌ | `Horarios de apertura y cierre son requeridos cuando está abierto` |
| refine 2 | open ≥ close | `18:00` / `09:00` | ❌ | `La hora de apertura debe ser anterior a la de cierre` |
| `day` enum | inválido | `"lunes"` | ❌ | `Día de la semana inválido` |
