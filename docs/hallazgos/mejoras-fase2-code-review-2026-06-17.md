# Mejoras — Code review de la Fase 2 (integración) (2026-06-17)

Resultado del code review completo del stack de Fase 2 (PR2→PR6, diff `main...HEAD`:
fix INT-01/INT-02 + las 6 suites de integración).

> **Veredicto del review: sin bugs de correctitud.** La lógica de dinero
> (`createSale`/`updateSale`/`buildTrustedSale`) es consistente para todos los
> callers reales y está cubierta por 105 tests de integración verdes (+ unit 386,
> `tsc`, `lint`). Los puntos de abajo son **mejoras**, ninguna bloquea el merge.

Hallazgos de dinero ya resueltos en este stack: ver
[testing-fase2-2026-06-17.md](./testing-fase2-2026-06-17.md) (INT-01, INT-02).

---

## MEJ-01 (Baja · altitud) — `updateSale` recalcula `total` con lógica ramificada

**Archivo:** `src/features/dashboard/modules/sells/services/sale.service.ts` (`updateSale`)

**Situación:** el `total` se recalcula en ramas separadas (una cuando llegan
`items`, otra cuando llega `discount` sin items). Tras INT-01/INT-02 cada rama
repite el patrón `subtotal − discount + deliveryFee` resolviendo los valores desde
el payload o desde el doc existente.

**Costo:** no hay bug hoy (el caso "solo `deliveryFee` sin `total`" es inalcanzable
porque `saleTotalsSchema` exige `total`), pero la lógica es frágil: un cambio futuro
en una rama y no en la otra reintroduce fácilmente un INT-01/INT-02.

**Mejora propuesta:** resolver una sola vez los `{subtotal, discount, deliveryFee}`
finales (payload → doc existente → 0) y computar `total = subtotal − discount +
deliveryFee` en **un único** punto al final de la función, en vez de en cada rama.

**Estado:** abierto (refactor de mantenibilidad, sin cambio de comportamiento).

---

## MEJ-02 (Baja · test/idempotencia) — Falta `clearStorage()` entre tests

**Archivos:** `test/integration/products.int.test.ts`, `test/helpers/firebase-emulator.ts`

**Situación:** la suite de productos sube un archivo real al emulador de Storage
(`deleteProductAction borra el documento y su imagen`). El `beforeEach` solo hace
`clearFirestore()`; no hay limpieza de Storage.

**Costo:** hoy es seguro porque el único archivo lo borra la propia action bajo
prueba. Pero si ese test fallara antes del borrado —o una suite futura subiera un
archivo sin borrarlo— el objeto quedaría entre corridas, violando el criterio
"no deja artefactos ni datos residuales en el emulador"
([03-acceptance-criteria.md](../test/03-acceptance-criteria.md) §H).

**Mejora propuesta:** agregar un helper `clearStorage()` en
`firebase-emulator.ts` (DELETE al endpoint del emulador de Storage, análogo a
`clearFirestore`/`clearAuth`) y llamarlo en el `beforeEach` de las suites que tocan
Storage.

**Estado:** abierto (endurecimiento de aislamiento).

---

## MEJ-03 (Baja · CI) — El gate cuantitativo de cobertura de integración no se enforça

**Archivo:** `vitest.integration.config.ts`

**Situación:** el DoD de Fase 2 pide ≥90% líneas / ≥85% branches en
checkout/sells/auth, pero la cobertura hoy solo corre en unit; en integración no se
mide ni se enforça. Por eso esos tres ítems del DoD quedan sin tildar a propósito
(documentado en [20-integration-guide.md](../test/20-integration-guide.md)).

**Costo:** el cierre cuantitativo de la fase no es verificable por máquina; una
regresión que baje cobertura de integración no rompe CI.

**Mejora propuesta:** activar `coverage` con thresholds por carpeta en
`vitest.integration.config.ts` (o un job de cobertura combinada unit+integración) y
conectarlo al criterio §G. Encaja naturalmente con el cierre de la **Fase 5**.

**Estado:** abierto (planificado para Fase 5).

---

## MEJ-04 (Cosmética · DX de tests) — `makeSession()` con tipado laxo obliga a casts

**Archivos:** `test/helpers/factories.ts`, varias suites (`*.int.test.ts`)

**Situación:** `makeSession()` devuelve `role: string`, incompatible con el union de
`ServerSession` (`'owner' | 'admin' | 'employee' | null`). Las suites lo castean con
`as never` / `as ServerSession` al mockear `getServerSession`.

**Costo:** ruido y casts repetidos; un `as never` puede ocultar un mismatch real a
futuro.

**Mejora propuesta:** tipar `makeSession` para devolver `ServerSession` (importar el
tipo en el factory) y eliminar los casts en las suites.

**Estado:** abierto (cosmético).

---

## MEJ-05 (Baja · escalabilidad, pre-existente) — Lecturas full-collection en sells

**Archivo:** `src/features/dashboard/modules/sells/services/sale.service.ts`
(`getSales`, `calculateSalesStats`)

**Situación (pre-existente, fuera del diff):** `getSales` trae todas las ventas y
filtra `paymentMethod`/`deliveryMethod`/`source`/`customerName` en memoria;
`calculateSalesStats` lee la colección `sells` completa para agregar. Está comentado
como decisión consciente para evitar índices compuestos.

**Costo:** correcto a baja escala, pero degrada (lectura O(n) y memoria) en tiendas
con muchas ventas. La Fase 2 ahora "fija" este comportamiento con tests, así que
conviene tenerlo en backlog.

**Mejora propuesta:** para stats, evaluar agregaciones del lado servidor
(`count()`/`sum()` aggregation queries de Firestore) o un documento de resumen
mantenido incrementalmente; para filtros frecuentes, índices + `where` en la query.
No se aplica sin medir el impacto real.

**Estado:** abierto (backlog de escalabilidad, no introducido por este stack).
