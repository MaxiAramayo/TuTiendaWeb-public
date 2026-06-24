# Hallazgos — Fase 1 de testing (unit) (2026-06-15)

Detectados al escribir la suite unit de la Fase 1 (schemas Zod, funciones puras y
componentes). Se documentan acá porque su corrección excede el alcance del entregable de
tests (que es **agregar cobertura**, no modificar el código de producción).

> Estado: **hallazgos abiertos**. Ninguno corregido en este commit (solo tests + docs).

---

## H-1 (Alta) — Loop infinito de renders en `ProductForm` sin `categories`/`tags`

**Archivo:** `src/features/products/forms/product-form.tsx`

**Problema:**
- Las props opcionales tienen default a literales nuevos en cada render
  (`categories: initialCategories = []`, `tags: initialTags = []`).
- Dos efectos sincronizan esas props a estado dependiendo de su referencia:
  ```ts
  useEffect(() => { setAvailableCategories(initialCategories); }, [initialCategories]);
  useEffect(() => { setAvailableTags(initialTags); }, [initialTags]);
  ```
- Como `[]` es una referencia nueva por render, la dependencia cambia siempre →
  `setState` → re-render → loop infinito. En el test esto provocó **OOM del worker**
  (heap JS agotado). En producción se dispara si se monta `<ProductForm>` sin pasar
  `categories`/`tags`.

**Mitigaciones propuestas:**
1. Subir los defaults a constantes estables a nivel de módulo, o
2. Guardar los efectos (sincronizar solo cuando la prop está definida / cambió de verdad), o
3. Memoizar con `useMemo`.

**Workaround en tests:** `product-form.test.tsx` pasa referencias estables
(`EMPTY_CATEGORIES`/`EMPTY_TAGS`) para evitar el loop. Una vez corregido, el componente
debería poder renderizarse sin esas props.

---

## H-2 (Media) — ✅ RESUELTO — El `<form>` sin `noValidate` oculta los mensajes de validación de Zod

> **Estado (2026-06-24):** corregido. Se agregó `noValidate` a los `<form>` de
> `LoginForm`, `RegisterForm` y `UserRegistrationStep`, de modo que los mensajes de
> Zod (en español) se muestran de forma consistente. Regresión:
> `LoginForm.test.tsx` → "muestra el mensaje de Zod cuando el formato de email es inválido".

**Archivos:** `src/features/auth/components/LoginForm.tsx` (y todo form con
`<input type="email">` cuyo `<form>` no use `noValidate`).

**Problema:**
- En `LoginForm`, el `<form>` no declara `noValidate`. Con `type="email"`, la **validación
  nativa del navegador** intercepta el submit cuando el formato es inválido y muestra su
  propio globo, **antes** de que React Hook Form ejecute el resolver de Zod.
- Resultado: el mensaje custom `"Formato de email inválido"` del schema **nunca se muestra**;
  la UX depende del mensaje nativo del navegador (no localizado / inconsistente). El caso
  "email requerido" (vacío) sí pasa la validación nativa y lo captura Zod.

**Mitigación propuesta:**
- Agregar `noValidate` al `<form>` para que la validación/mensajes los maneje Zod + RHF de
  forma consistente y en español. Revisar otros forms con inputs de tipos con constraints
  nativas (`email`, `url`, `number` con `min`/`max`, `required`).

**Impacto en tests:** el test de `LoginForm` verifica el caso requerido (observable) y deja
documentado que el formato de email no es testeable por submit mientras no haya `noValidate`.

---

## H-3 (Baja) — `cleanForFirestore` es superficial (no recursivo)

**Archivo:** `src/lib/utils/firestore.ts`

**Problema:**
- `cleanForFirestore` elimina `undefined` solo en el **primer nivel** del objeto. Un
  `undefined` anidado (p. ej. `{ theme: { color: undefined } }`) **no** se limpia y puede
  hacer fallar un `.set()`/`.update()` de Firestore ("Unsupported field value: undefined").

**Mitigación propuesta:**
- Si se usa con objetos anidados antes de escribir en Firestore, hacer la limpieza recursiva
  (cuidando preservar `null`/`''`/`0`/`false` y no romper arrays/`Timestamp`/`Date`), o
  documentar explícitamente que solo aplica a objetos planos.

---

## H-4 (Baja) — Rama muerta en el transform de `extras` / `subcategoria` (product-import)

**Archivo:** `src/features/products/schemas/product-import.schema.ts`

**Problema:**
- En `subcategoria`, el transform contempla `v === null`, pero `z.string().optional()`
  rechaza `null` **antes** del transform (solo admite `string`/`undefined`), así que esa rama
  es inalcanzable por parseo directo.

**Mitigación propuesta:**
- Eliminar el chequeo `v === null` (código muerto) o, si se espera recibir `null` desde el
  parser de Excel, cambiar a `z.string().nullish()` y cubrirlo con un test.
