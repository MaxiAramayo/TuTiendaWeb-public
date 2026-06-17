# 60 · Auditoría de seguridad Firebase

> **Estado:** pendiente — se completa en la **Fase 3** con la skill
> `firebase-security-rules-auditor` y los resultados de los tests de reglas.

Este documento recopilará los hallazgos de la auditoría de seguridad sobre
`firestore.rules`, `storage.rules` y `firestore.indexes.json`.

## Estructura prevista del informe

### 1. Resumen ejecutivo
Estado general de robustez de las reglas y cantidad de hallazgos por severidad.

### 2. Hallazgos
Por cada hallazgo:

| Campo | Contenido |
|-------|-----------|
| ID | `SEC-NN` |
| Severidad | Crítica / Alta / Media / Baja |
| Recurso | colección o ruta afectada |
| Descripción | qué permite indebidamente o qué valida de más/menos |
| Evidencia | test que lo demuestra (`*.rules.test.ts`) |
| Recomendación | cambio propuesto (no se aplica sin aprobación) |

### 3. Cobertura de la matriz allow/deny
Checklist de la matriz de [30-rules-audit-guide](./30-rules-audit-guide.md) con
su estado (verde/rojo).

### 4. Índices
Gaps detectados entre `firestore.indexes.json` y las queries reales (Fase 2).

### 5. Modelo de datos / claims
Observaciones sobre custom claims (`storeId`, `role`) y consistencia
`ownerId`/`userId`/`metadata.ownerId`.

---

## Hallazgos de validación (Fase 1)

| ID | Severidad | Archivo | Descripción | Recomendación |
|----|-----------|---------|-------------|---------------|
| `VAL-01` | Baja | `auth/schemas/login.schema.ts`, `register.schema.ts` | El email encadena `.email()` **antes** de `.trim()`, por lo que un email con espacios alrededor se **rechaza** en vez de recortarse (el `.trim()` no afecta la validación). | Reordenar a `.trim().toLowerCase().email()` para que el trim sea efectivo antes de validar. No se aplica sin aprobación; documentado en los tests como comportamiento actual. |

## Hallazgos de integración (Fase 2)

| ID | Severidad | Archivo | Descripción | Recomendación |
|----|-----------|---------|-------------|---------------|
| `INT-01` | Media | `store/services/checkout.service.ts` (`buildTrustedSale`), `dashboard/modules/sells/services/sale.service.ts` (`createSale`), `dashboard/modules/sells/schemas/sell.schema.ts` (`saleTotalsSchema`) | El costo de envío **no quedaba persistido** en la venta. `buildTrustedSale` armaba `saleData.totals.total = subtotal + deliveryFee`, pero `createSale` lo **recalculaba** como `total = subtotal - discount`, descartando el envío; además `saleTotalsSchema` no tenía campo `deliveryFee`. En pedidos `delivery`, la venta guardada quedaba con `total = subtotal` y `calculateSalesStats` **subcontaba** los envíos. | **✅ RESUELTO (PR2, 2026-06-17).** Decisión: el envío integra el total. Se agregó `deliveryFee` a `saleTotalsSchema` (`default(0)`), `buildTrustedSale` lo incluye en `saleData.totals`, `createSale`/`updateSale` calculan `total = subtotal − discount + deliveryFee` y lo persisten, y `mapDocToSale` lo mapea (default 0 para ventas previas). Regresión: `checkout.int.test.ts` (delivery) + `sells.int.test.ts`. Detalle en [docs/hallazgos/testing-fase2-2026-06-17.md](../hallazgos/testing-fase2-2026-06-17.md). |
| `INT-02` | Baja | `dashboard/modules/sells/services/sale.service.ts` (`updateSale`) | Al actualizar una venta **cambiando `items` pero sin pasar `totals`**, el descuento se tomaba como `data.totals?.discount ?? 0`: un descuento ya guardado se **reseteaba a 0** en el recálculo del total (el envío sí se preservaba tras INT-01; el descuento no). | **✅ RESUELTO (PR2, 2026-06-17).** `updateSale` ahora hace fallback del descuento (y del envío) al valor ya persistido cuando no viene en el payload: `discount = data.totals?.discount ?? existingTotals?.discount ?? 0`. Regresión en `sells.int.test.ts` → "preserva el descuento existente al reemplazar items sin enviar totals (INT-02)". Detalle en [docs/hallazgos/testing-fase2-2026-06-17.md](../hallazgos/testing-fase2-2026-06-17.md). |

## Áreas de atención ya identificadas (pre-auditoría)

De la exploración inicial, a confirmar/validar con tests en Fase 3:

- `isStoreOwner` soporta **3 campos** de ownership (`ownerId`, `userId`,
  `metadata.ownerId`) para migración gradual. Verificar que ninguno habilite
  accesos cruzados entre tiendas.
- `sells.create` es **público** (sin auth) por diseño (checkout). Confirmar que
  `isValidSellData()` impide inyección de ventas malformadas o con `storeId`
  ajeno, y que `total`/`items` se validan.
- `getServerSession` verifica el token con `verifyIdToken(token, false)` (sin
  chequear revocación) — documentar el trade-off (tolerancia ~1h) como decisión
  consciente.
- Storage: límite de 5MB y `contentType image/*` — confirmar con tests de archivo
  grande y de no-imagen.
