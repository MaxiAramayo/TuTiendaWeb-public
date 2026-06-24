# Hallazgos — Doble-submit en import Excel + auditoría de validaciones (2026-06-13)

Detectado a partir del reporte: *"se puede apretar 2 veces el botón de importar productos
en el Excel y trata de meter todos los productos"*. Se documenta acá porque la corrección
correcta amerita una pasada por las validaciones de **todos los forms/actions** y la
generación de tests, más allá del fix puntual del import.

> Estado: **hallazgos abiertos**. Ninguno corregido en este commit.

---

## H-1 (Alta) — ✅ RESUELTO — Doble-submit en importación de productos por Excel

> **Estado (2026-06-24):** corregido. El botón "Importar" del paso `preview` ahora
> incluye `isPending` en su `disabled` y `proceedToImport()` tiene guard sincrónico
> `if (isPending) return`. El tope total del servidor queda como backstop ante un
> doble-tap que esquive la UI. Regresión: `test/integration/products.int.test.ts`
> → "el tope total backstopea un doble-submit (no excede MAX_IMPORT_PRODUCTS)".

**Archivos:**
- `src/features/products/components/product-import-dialog.tsx`
- `src/features/products/actions/product-import.actions.ts`

**Problema:**
- En el paso `preview`, el botón "Importar" (≈línea 410) solo se deshabilita con
  `validRows.length === 0 || validRows.length > availableSlots`, **no** con `isPending`.
  El único "guard" efectivo es el cambio de `step` a `'importing'`, que ocurre dentro de
  `startTransition` → hay una ventana donde dos clicks rápidos (o doble-tap en móvil)
  disparan `proceedToImport()` dos veces.
- `importProductsAction` **no es idempotente**: cada invocación inserta el lote completo
  vía `bulkCreateProducts`, por lo que un doble-submit duplica productos (hasta el tope
  `MAX_IMPORT_PRODUCTS`).
- El control de tope total se hace con un `count()` previo + suma; ante dos requests
  concurrentes hay condición de carrera (ambos leen el mismo `existingCount`).

**Mitigaciones propuestas (implementación futura):**
1. Deshabilitar el botón inmediatamente al primer click (estado de "enviando" sincrónico,
   no dependiente del `step`) y/o `disabled={isPending}` en el botón de `preview`.
2. Guard de "en curso" (`if (isPending) return;` al inicio de `proceedToImport`).
3. Idempotencia/dedupe en servidor: clave de import por lote o dedupe por
   `(nombre, categoria)` dentro de la tienda antes de crear.
4. Evaluar transacción/recuento atómico para el tope total.

---

## H-2 (Media) — Auditoría de doble-submit y validación en forms/actions

Revisar de forma consistente, en todos los módulos con mutaciones, que:
- el botón de submit se deshabilite mientras hay una acción en curso (`useTransition` /
  `isPending`), siguiendo el patrón de la guía del proyecto;
- toda Server Action valide su input con Zod (patrón AUTH → VALIDATE → MUTATE → REVALIDATE)
  y devuelva `ActionResponse`.

**Áreas a barrer:** productos (alta/edición/import), ventas (`sale.actions.ts`),
checkout público (`checkout.actions.ts` / `createPublicSaleAction` — ver también
[auditoria-actions-2026-06-12.md](auditoria-actions-2026-06-12.md) H-1), store-settings y auth/onboarding.

---

## H-3 (Media) — Tests a generar

- **Unit de schemas Zod:** casos válidos e inválidos de
  `product-import.schema`, `sell.schema`, `checkout.schema` y schemas de store-settings.
- **Tests de acciones clave:** doble ejecución de `importProductsAction` (no debe duplicar /
  debe respetar tope), límites de `MAX_IMPORT_PRODUCTS`, y validación de payloads inválidos.
- Definir/confirmar el runner de tests del repo (no hay suite de tests visible aún) como
  parte de este trabajo.
