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
| `INT-01` | Media | `store/services/checkout.service.ts` (`buildTrustedSale`), `dashboard/modules/sells/services/sale.service.ts` (`createSale`), `dashboard/modules/sells/schemas/sell.schema.ts` (`saleTotalsSchema`) | El costo de envío **no queda persistido** en la venta. `buildTrustedSale` arma `saleData.totals.total = subtotal + deliveryFee`, pero `createSale` lo **recalcula** como `total = subtotal - discount`, descartando el envío; además `saleTotalsSchema` no tiene campo `deliveryFee`. En pedidos `delivery`, la venta guardada queda con `total = subtotal` (sin envío). El mensaje de WhatsApp que ve el comercio sí muestra el total con envío (usa `built.total`), pero `calculateSalesStats` (totales del dashboard) **subcuenta** el monto de los envíos. No lo detectan los tests de Fase 2: el caso de persistencia del checkout usa `retiro` (envío = 0). | Definir si el envío debe integrar el total de la venta. Si sí: agregar `deliveryFee` a `saleTotalsSchema`, respetarlo en `createSale` (no recalcular el total ignorándolo) y guardar el monto de envío en la venta; acompañar con un test de regresión de checkout con `delivery`. Si no: documentar que el "total de venta" es solo de productos y que el envío se reporta aparte. No se aplica sin aprobación. |

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
