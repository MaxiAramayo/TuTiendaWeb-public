# 02 · Convenciones de testing

Reglas de estilo y organización para que la suite sea consistente y mantenible.

## Naming y ubicación de archivos

| Tipo | Sufijo | Ubicación | Config |
|------|--------|-----------|--------|
| Unit (lógica/schemas) | `*.test.ts` | **colocado** junto al código (`src/.../foo.test.ts`) | `vitest.config.ts` (project `unit`) |
| Unit (componentes) | `*.test.tsx` | colocado junto al componente | `vitest.config.ts` (project `dom`) |
| Integración | `*.int.test.ts` | `test/integration/<feature>/` | `vitest.integration.config.ts` |
| Reglas | `*.rules.test.ts` | `test/rules/` | `vitest.integration.config.ts` |
| E2E | `*.spec.ts` | `e2e/` | `playwright.config.ts` |

**Por qué colocados los unit:** quedan al lado del código que prueban, se ven
en el mismo PR y es obvio qué falta cubrir. **Por qué separados int/rules/e2e:**
necesitan emuladores y no deben correr en el run rápido (`npm run test`).

## Estructura de un test: patrón AAA

Cada `it` sigue **Arrange → Act → Assert** y prueba **un solo comportamiento**:

```ts
it('rechaza un precio negativo con el mensaje esperado', () => {
  // Arrange
  const input = makeProduct({ price: -10 });
  // Act
  const result = productSchema.safeParse(input);
  // Assert
  expect(result.success).toBe(false);
  expect(issueFor(result, 'price')).toBe('El precio debe ser positivo');
});
```

## Nombrado de `describe` / `it`

- `describe` = la unidad bajo prueba: nombre de función, schema o componente.
- `it` = comportamiento observable en **infinitivo/presente, en español**:
  "rechaza…", "recalcula…", "muestra el error…", "permite la lectura pública…".
- Agrupar variantes con `describe` anidados o `it.each` para tablas de casos.

```ts
describe('whatsappSchema', () => {
  describe('casos válidos', () => { /* ... */ });
  describe('casos inválidos', () => { /* ... */ });
  describe('bordes', () => { /* ... */ });
});
```

## Tablas de casos con `it.each`

Para validaciones con muchas variantes, preferir `it.each` sobre copiar/pegar:

```ts
it.each([
  ['11 1234-5678', '+541112345678'],
  ['+5491112345678', '+5491112345678'],
])('formatWhatsAppNumber(%s) → %s', (input, expected) => {
  expect(formatWhatsAppNumber(input)).toBe(expected);
});
```

## Datos de prueba

- Usar los **factories** de `test/helpers/factories.ts`. Devuelven datos
  **válidos por defecto**; cada test muta lo mínimo para su caso.
- No hardcodear objetos grandes inline; mutá un factory.
- Para Firestore Timestamps en unit, pasar `{ seconds }` o ISO strings.

## Determinismo

- Nada de `setTimeout`/esperas arbitrarias.
- Congelar tiempo con `vi.useFakeTimers()` + `vi.setSystemTime(...)` cuando el
  código use `new Date()`/`Date.now()`.
- Mockear aleatoriedad: `vi.mock` sobre `nanoid` para IDs/orderNumber deterministas.

## Mocks

- En unit, `next/cache`, `next/navigation` y `server-only` ya están mockeados
  globalmente en `vitest.setup.ts`.
- Mockear servicios externos (Storage, fetch) en unit; en integración se usan
  los emuladores reales.
- Restaurar mocks con `vi.restoreAllMocks()` en `afterEach` cuando se creen
  dentro de un test.

## Aserciones de mensajes

Es requisito del proyecto: los **mensajes de error** (Zod y UI) se afirman
**literalmente**, no con `expect(...).toBeTruthy()`. Helper sugerido:

```ts
function issueFor(result: SafeParseReturn<unknown>, path: string): string | undefined {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path.join('.') === path)?.message;
}
```

## Qué NO testear

- Detalles de implementación privados (testear el contrato/salida observable).
- Librerías de terceros (Zod, Firebase) — se asume que funcionan.
- Rutas/layouts de `src/app` con unit → se cubren con E2E.
