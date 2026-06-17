# Hallazgos — Fase 2 de testing (integración) (2026-06-17)

Detectados al escribir la suite de integración de la Fase 2 (PR2 · Sells). A
diferencia de la Fase 1, acá **sí** se corrigió un hallazgo (INT-01) por decisión
explícita del usuario, porque toca la ruta de dinero. El resto queda documentado.

> Estado: **INT-01 e INT-02 corregidos en PR2**.

Ver también la tabla resumen en [docs/test/60-firebase-security-audit.md](../test/60-firebase-security-audit.md).

---

## INT-01 (Media) — ✅ RESUELTO — El costo de envío no quedaba persistido en la venta

**Archivos:**
- `src/features/dashboard/modules/sells/schemas/sell.schema.ts` (`saleTotalsSchema`)
- `src/features/store/services/checkout.service.ts` (`buildTrustedSale`)
- `src/features/dashboard/modules/sells/services/sale.service.ts` (`createSale`, `updateSale`, `mapDocToSale`)

**Problema:**
- `buildTrustedSale` calculaba `total = subtotal + deliveryFee`, pero `createSale`
  **recalculaba** `total = subtotal - discount` descartando el envío.
- `saleTotalsSchema` no tenía campo `deliveryFee`, así que el monto del envío ni
  siquiera se guardaba.
- Consecuencia: en pedidos `delivery`, la venta persistida quedaba con
  `total = subtotal`. El mensaje de WhatsApp al comercio mostraba el total correcto
  (usa el valor en memoria), pero `calculateSalesStats` (KPIs del dashboard)
  **subcontaba** los ingresos por envío.
- Por qué no lo detectó PR1: el único test de persistencia del checkout usaba
  `retiro` (envío = 0).

**Decisión (usuario):** el envío **integra** el total de la venta.

**Corrección aplicada (PR2):**
1. `saleTotalsSchema`: nuevo campo `deliveryFee: z.number().nonnegative().default(0)`
   (`default(0)` → compatible con ventas previas y con retiro).
2. `buildTrustedSale`: incluye `deliveryFee` en `saleData.totals`.
3. `createSale`: `total = subtotal − discount + deliveryFee`, y persiste `deliveryFee`.
4. `updateSale`: respeta `deliveryFee` en los recálculos (lo toma del payload o del
   doc existente como fallback).
5. `mapDocToSale`: mapea `deliveryFee` con default 0 para ventas viejas.
6. Consumidores: `SellForm` (venta manual) pasa `deliveryFee: 0`; factory `makeSale`
   incluye el campo.

**Regresión:**
- `test/integration/checkout.int.test.ts` → "persiste el costo de envío en la venta
  cuando el método es delivery (INT-01)".
- `test/integration/sells.int.test.ts` → casos de `createSale`/`updateSale` con envío.

---

## INT-02 (Baja) — ✅ RESUELTO — `updateSale` reseteaba el descuento al cambiar items sin `totals`

**Archivo:** `src/features/dashboard/modules/sells/services/sale.service.ts` (`updateSale`)

**Problema:**
- En la rama que recalcula totales cuando llega `data.items`, el descuento se leía
  como `data.totals?.discount ?? 0`. Si se editaban los items de una venta **sin** volver
  a enviar `totals`, un descuento ya guardado se **perdía** (volvía a 0) en el total.
- Tras INT-01, el `deliveryFee` ya se preservaba desde el documento existente; el
  descuento no recibía el mismo tratamiento.

**Impacto:** bajo y acotado a la edición de ventas desde el dashboard. No afecta al
checkout público (que no aplica descuentos hoy).

**Corrección aplicada (PR2):**
- En la rama de recálculo por items, tanto el descuento como el envío hacen fallback
  al valor ya persistido en la venta:
  ```ts
  const existingTotals = existingDoc.data()?.totals;
  const discount = data.totals?.discount ?? existingTotals?.discount ?? 0;
  const deliveryFee = data.totals?.deliveryFee ?? existingTotals?.deliveryFee ?? 0;
  const total = subtotal - discount + deliveryFee;
  ```

**Regresión:** `test/integration/sells.int.test.ts` → "preserva el descuento existente
al reemplazar items sin enviar totals (INT-02)".

---

## Nota de tooling (no es un hallazgo de producto)

`vi.useFakeTimers()` en integración **cuelga el IO del SDK de Firestore** (que usa
timers internos). Al congelar tiempo en suites de integración, limitar a
`vi.useFakeTimers({ toFake: ['Date'] })`. Documentado en
[docs/test/20-integration-guide.md](../test/20-integration-guide.md) → criterio de
determinismo.
