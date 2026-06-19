# 60 · Auditoría de seguridad Firebase

> **Estado:** ✅ completada en la **Fase 3** (2026-06-19). Tests de reglas verdes
> (`test/rules/*.rules.test.ts`, 81 casos) + auditoría con la skill
> `firebase-security-rules-auditor`.

Auditoría de seguridad sobre `firestore.rules`, `storage.rules` y
`firestore.indexes.json`. La evidencia de cada regla son los tests de la Fase 3
([test/rules/firestore.rules.test.ts](../../test/rules/firestore.rules.test.ts),
[test/rules/storage.rules.test.ts](../../test/rules/storage.rules.test.ts)).

---

## 1. Resumen ejecutivo

**Puntaje skill: 3/5 (Moderado).** Base sólida, sin fugas de datos ni escalación
de privilegios:

- Ownership **estricto** por owner; la autoridad se toma del documento almacenado
  (`get()` del recurso existente), **no** de `request.resource.data` provisto por
  el cliente.
- Catch-all `deny` correcto en Firestore y Storage.
- Lectura pública acotada al catálogo (`stores`, `products`, `categories`, `tags`)
  y a las imágenes públicas; el resto (ventas, settings, notificaciones, usuarios)
  es privado.
- `create` y `update` re-validan con la misma función en `products`/`categories`/`tags`
  (no hay "update bypass" de validación).

El punto débil es la **única escritura pública** (`sells.create`, sin auth): se
endureció en este PR (SEC-01) agregando topes de tamaño/tipo. El resto de los
hallazgos son de severidad media/baja y quedan **documentados** (sin cambiar reglas)
según la política del proyecto.

| Severidad | Cantidad | Acción |
|-----------|:---:|--------|
| Crítica | 0 | — |
| Alta / Major | 1 (SEC-01) | ✅ corregida en este PR |
| Media / Moderate | 2 (SEC-02, SEC-04) | documentada |
| Baja / Minor | 2 (SEC-03, SEC-05) | documentada |

---

## 2. Hallazgos

| ID | Severidad | Recurso | Descripción | Evidencia | Recomendación |
|----|-----------|---------|-------------|-----------|---------------|
| **SEC-01** | Alta (Major) | `firestore.rules` → `isValidSellData()` / `sells.create` | `sells.create` es la única escritura **pública (sin auth)**. La validación exigía keys, `storeId` del path, `total>=0` y `customer.name` no vacío, pero **no acotaba tamaños**: `items` podía ser un array enorme y `customer.name` un string ilimitado. Un atacante anónimo que golpee Firestore directamente (salteándose la app) podía crear documentos de venta gigantes/masivos → *resource exhaustion*/costos y contaminación del dashboard del comercio. | `test/rules/firestore.rules.test.ts` → "rechaza … array de items excesivo (SEC-01)", "customer.name desmesuradamente largo (SEC-01)", "permite 100 items (borde válido)". | **✅ RESUELTO en este PR.** Se agregó `items.size() <= 100`, `customer.name.size() <= 200` y `storeId is string` a `isValidSellData()`. La ruta legítima usa Admin SDK (bypasea reglas), así que no afecta el checkout real. Ver [hallazgos](../hallazgos/testing-fase3-2026-06-19.md#sec-01). |
| **SEC-02** | Media | `firestore.rules` → `products`/`sells` update | El `update` gatea por `isStoreOwner` pero **no re-verifica** que `data.storeId == storeId` (el path). Un owner puede setear un `storeId` ajeno dentro de su propio documento. Alcance limitado a su propia tienda (no hay leak cross-store), pero corrompe integridad referencial. | (no se fuerza un caso de éxito malicioso; documentado) | Exigir `request.resource.data.storeId == storeId` en `create`/`update` de `products` (hoy solo lo hace `sells.create`). No bloqueante. |
| **SEC-03** | Baja | `firestore.rules` → `isStoreOwner` | Accede **directo** a `storeData.metadata.ownerId`, mientras que `storage.rules` usa el patrón seguro `.get('metadata', {}).get('ownerId', '')`. Los tests confirman que **funciona igual** (el `\|\|` de las reglas absorbe el error de campo ausente y reconoce al owner por `metadata.ownerId` aunque falten los campos raíz), así que **no es un bug funcional**, pero es inconsistente y frágil. | `test/rules/firestore.rules.test.ts` → "reconoce al owner por metadata.ownerId", "…por userId (legacy)". | Alinear `firestore.rules` al patrón `.get(...)` de `storage.rules` por robustez. No bloqueante. |
| **SEC-04** | Media | `firestore.rules` (modelo) | `isStoreOwner` solo reconoce al **owner**; los roles `admin`/`employee` (documentados en CLAUDE.md) **no** tienen acceso vía reglas. El multi-usuario queda forzado a workarounds server-side (Admin SDK). | (gap de diseño; no hay test) | Al habilitar roles, modelar *membership* por tienda en las reglas (p. ej. `/stores/{id}/members/{uid}`). Decisión actual documentada como consciente. |
| **SEC-05** | Baja | `firestore.rules` → `users/{uid}` | `allow read, write` permite escribir **campos arbitrarios sin validación ni tope** en el doc propio (self data corruption / abuso de storage). **No hay escalación**: los permisos usan custom claims de Auth, no campos del doc. | `test/rules/firestore.rules.test.ts` → casos `users/{userId}` (acceso propio ✓, ajeno/anónimo ✗). | Validar/acotar campos del documento de usuario si se vuelve sensible. No bloqueante. |

> Las "áreas de atención pre-auditoría" listadas históricamente quedan **cerradas**:
> el soporte de 3 campos de ownership no habilita acceso cruzado (test de
> no-cross-store ✓); `sells.create` valida estructura, `storeId` y ahora tamaños
> (SEC-01); el tope de 5 MB y `image/*` de Storage está verificado con tests de
> archivo grande y no-imagen.

---

## 3. Cobertura de la matriz allow/deny

Matriz de [30-rules-audit-guide](./30-rules-audit-guide.md) — **toda verde** (cada
`allow` con su espejo `deny`).

### Firestore

| Recurso | Permitido ✓ | Denegado ✓ |
|---------|:---:|:---:|
| `stores/{id}` read (público) | ✅ | — |
| `stores/{id}` write (owner) | ✅ | ✅ no-owner / anónimo |
| `products`/`categories`/`tags` read (público) | ✅ | — |
| `products`/`categories`/`tags` create/update (owner+válida) | ✅ | ✅ no-owner / data inválida |
| `products`/`categories`/`tags` delete (owner) | ✅ | ✅ no-owner |
| `products` price (req./numérico/≥0/0 borde) | ✅ | ✅ falta/negativo/no-num |
| `sells` create (anónimo + válida + storeId) | ✅ | ✅ items vacío/total<0/storeId ajeno/falta key/name vacío/**tamaños** |
| `sells` read/update/delete (owner) | ✅ | ✅ anónimo / no-owner |
| `settings` read/write (owner) | ✅ | ✅ anónimo / no-owner |
| `notifications` read/update (owner) | ✅ | — |
| `notifications` create/delete (nadie) | — | ✅ owner |
| `users/{uid}` read/write (propio) | ✅ | ✅ otro uid / anónimo |
| catch-all | — | ✅ todo |
| Ownership por `ownerId`/`userId`/`metadata.ownerId` | ✅ | ✅ no cross-store |

### Storage

| Ruta | Permitido ✓ | Denegado ✓ |
|------|:---:|:---:|
| `stores/{id}/**` read (público) | ✅ | — |
| `stores/{id}/**` write (owner+imagen) | ✅ | ✅ no-owner / >5MB / no-imagen |
| `stores/{id}/**` delete (owner) | ✅ | ✅ no-owner |
| `users/{uid}/avatar/**` (propio+imagen) | ✅ | ✅ otro uid / no-imagen / anónimo |
| `temp/{uid}/**` (propio+imagen) | ✅ | ✅ otro uid |
| catch-all | — | ✅ todo |

---

## 4. Índices (`firestore.indexes.json` vs queries reales)

**No se detectaron índices faltantes** para las queries de este repo:

- `getSales` ([sale.service.ts:110](../../src/features/dashboard/modules/sells/services/sale.service.ts#L110))
  ordena por `metadata.createdAt` y filtra por rango **sobre el mismo campo** →
  no requiere índice compuesto. Los filtros por `paymentMethod`/`source` se hacen
  **in-memory** (comentario explícito en `sale.service.ts:131`).
- Queries de `store.service`/`public-store.service` son `==` de un solo campo o dos
  `==` (resueltos por índices de campo único, sin compuesto) y `slug ==` (único).
- `getCategoryUsage` usa `count()` sobre `==` simples.

**Observación (no bloqueante):** hay índices compuestos en `sells`
(`payment.method`+`metadata.createdAt`, `delivery.method`+`metadata.createdAt`,
`source`+`metadata.createdAt`) que **ya no usa** la app (los filtros se movieron a
memoria). Son sobre-aprovisionamiento; pueden depurarse a futuro. El índice de
`stores` (`subscription.active`+`subscription.endDate`) sirve al repo de Cloud
Functions (suscripciones), fuera del alcance de este repo.

> **Caveat metodológico:** el emulador de Firestore **no enforce** índices
> compuestos, así que los tests de integración verdes **no** prueban completitud de
> índices. Esta sección es análisis estático de las queries, no resultado de tests.

---

## 5. Modelo de datos / claims

- **Ownership (3 campos):** `ownerId` (raíz, legacy), `userId` (raíz, legacy) y
  `metadata.ownerId` (canónico). Verificado que cualquiera de los tres reconoce al
  owner y que **no** habilita acceso cruzado entre tiendas (test de no-cross-store).
  Recomendación: ver SEC-03 (alinear el acceso seguro) y consolidar a `metadata.ownerId`
  cuando termine la migración.
- **Custom claims (`storeId`, `role`):** los permisos del dashboard se resuelven
  server-side con `getServerSession()` + reglas por owner. `role` `admin`/`employee`
  aún sin reglas (SEC-04).
- **`getServerSession`** verifica el token con `verifyIdToken(token, false)` (sin
  chequeo de revocación): trade-off consciente (tolerancia ~1 h hasta refresco de
  claims). Documentado como decisión, no es hallazgo de reglas.

---

## Apéndice · Hallazgos históricos (Fases 1–2)

### Validación (Fase 1)

| ID | Severidad | Archivo | Descripción | Recomendación |
|----|-----------|---------|-------------|---------------|
| `VAL-01` | Baja | `auth/schemas/login.schema.ts`, `register.schema.ts` | El email encadena `.email()` **antes** de `.trim()`, por lo que un email con espacios alrededor se **rechaza** en vez de recortarse. | Reordenar a `.trim().toLowerCase().email()`. Documentado; no se aplica sin aprobación. |

### Integración (Fase 2)

| ID | Severidad | Archivo | Descripción | Estado |
|----|-----------|---------|-------------|--------|
| `INT-01` | Media | `checkout.service.ts`, `sale.service.ts`, `sell.schema.ts` | El costo de envío no quedaba persistido en la venta (`createSale` recalculaba `total = subtotal − discount` descartando el envío). | **✅ RESUELTO (PR2).** El envío integra el total; `deliveryFee` agregado al schema y a los recálculos. Detalle en [testing-fase2-2026-06-17.md](../hallazgos/testing-fase2-2026-06-17.md). |
| `INT-02` | Baja | `sale.service.ts` (`updateSale`) | Al editar items sin enviar `totals`, el descuento se reseteaba a 0. | **✅ RESUELTO (PR2).** Fallback del descuento/envío al valor persistido. |
