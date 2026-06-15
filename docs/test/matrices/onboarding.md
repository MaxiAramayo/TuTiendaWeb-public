# Matriz — `onboardingCompleteSchema`

Fuente: `src/features/auth/schemas/onboarding.schema.ts`
Test: `src/features/auth/schemas/onboarding.schema.test.ts`

| Campo | Regla | Caso | Input | Resultado | Mensaje esperado |
|-------|-------|------|-------|-----------|------------------|
| `name` | requerido | inválido | ausente | ❌ | `El nombre es requerido` |
| `name` | `min(2)` | inválido | `"a"` | ❌ | `El nombre debe tener al menos 2 caracteres` |
| `name` | `max(100)` | inválido | 101 chars | ❌ | `Maximo 100 caracteres` |
| `name` | `trim()` | transform | `"  Tienda  "` | ✅ → `"Tienda"` | — |
| `storeType` | enum (5) | válido | `restaurant`/`clothing`/`retail`/`beauty`/`other` | ✅ | — |
| `storeType` | enum errorMap | inválido | `"services"` | ❌ | `Selecciona un tipo de tienda` |
| `whatsapp` | requerido | inválido | ausente | ❌ | `El WhatsApp es requerido` |
| `whatsapp` | `min(10)` | inválido | `"+12345"` | ❌ | `Numero de WhatsApp invalido` |
| `whatsapp` | `max(25)` | inválido | 26 chars | ❌ | `Numero de WhatsApp invalido` |
| `description` | `min(10)` | inválido | `"corta"` | ❌ | `La descripcion debe tener al menos 10 caracteres` |
| `description` | `max(300)` | inválido | 301 chars | ❌ | `Maximo 300 caracteres` |
| `slug` | `min(3)` | inválido | `"ab"` | ❌ | `La URL debe tener al menos 3 caracteres` |
| `slug` | `max(50)` | inválido | 51 chars | ❌ | `Maximo 50 caracteres` |
| `slug` | regex | inválido | `"Tienda Demo"` | ❌ | `Solo minusculas, numeros y guiones` |
| `primaryColor` | hex regex | válido | `"#FF0000"`, `"#abc"` | ✅ | — |
| `primaryColor` | hex regex | inválido | `"FF0000"`, `"#GG0000"`, `"#FF00"`, `"rojo"` | ❌ | `Color invalido` |

## `ONBOARDING_STEP_FIELDS` / `ONBOARDING_TOTAL_STEPS`

| Constante | Caso | Esperado |
|-----------|------|----------|
| `ONBOARDING_TOTAL_STEPS` | total | `10` |
| paso 1 | campos | `['name', 'storeType']` |
| paso 3 | campos | `['whatsapp']` |
| paso 4 | campos | `['description', 'slug']` |
| pasos 0,2,5,6,7,8,9 | informativos | `[]` |
