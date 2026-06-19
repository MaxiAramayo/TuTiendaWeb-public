# Hallazgos — Fase 3 de testing (auditoría de reglas) (2026-06-19)

Detectados al escribir la suite de reglas (`test/rules/*.rules.test.ts`, 81 casos)
y al auditar `firestore.rules`/`storage.rules` con la skill
`firebase-security-rules-auditor`.

Política aplicada (instrucción del usuario): los hallazgos de seguridad
**crítico/alto** se corrigen en este PR (documentados como "hallazgo corregido");
los medios/bajos se documentan sin tocar las reglas.

> Tabla resumen y matriz allow/deny completa en
> [docs/test/60-firebase-security-audit.md](../test/60-firebase-security-audit.md).

---

## SEC-01 (Alta) — ✅ RESUELTO — `sells.create` público sin topes de tamaño

**Archivo:** `firestore.rules` (`isValidSellData()`)

**Problema:**
- `sells.create` es la **única escritura pública (sin autenticación)** del modelo
  (el checkout del catálogo crea ventas anónimas).
- `isValidSellData()` validaba las keys requeridas, que `storeId` coincidiera con el
  path, `totals.total >= 0` y `customer.name` no vacío, pero **no acotaba tamaños**:
  - `items` podía ser un array arbitrariamente grande.
  - `customer.name` podía ser un string ilimitado.
- Un atacante anónimo que escriba directo a Firestore (salteándose la app) podía
  crear documentos de venta **gigantes o masivos** en `stores/{id}/sells` →
  *resource exhaustion* / costos de almacenamiento y **contaminación del dashboard**
  del comercio (KPIs, listados).

**Por qué es seguro corregirlo:** la ruta legítima de checkout crea ventas desde el
Server Action `createPublicSaleAction` usando el **Admin SDK**, que **bypasea las
reglas**. No existe un flujo legítimo que escriba `sells` directamente desde el
cliente, así que endurecer la regla **no afecta** el checkout real.

**Corrección aplicada (este PR):**
```
// isValidSellData(): además de keys + storeId + total + name no vacío:
request.resource.data.storeId is string &&
request.resource.data.items.size() <= 100 &&
request.resource.data.customer.name.size() <= 200
```

**Regresión:** `test/rules/firestore.rules.test.ts`:
- "rechaza crear una venta con un array de items excesivo (SEC-01)"
- "rechaza crear una venta con customer.name desmesuradamente largo (SEC-01)"
- "permite 100 items (borde superior válido, SEC-01)"

---

## SEC-02 (Media) — 📄 documentado — `update` no fija `storeId` al path

**Archivo:** `firestore.rules` (`products`/`sells` `update`)

**Problema:** el `update` de `products` (y `sells`) gatea por `isStoreOwner` pero
no re-verifica que `request.resource.data.storeId == storeId` (el del path). Un
owner puede setear un `storeId` ajeno dentro de un documento de **su propia**
tienda. No hay fuga cross-store (solo escribe en su path), pero corrompe la
integridad referencial del campo.

**Impacto:** bajo/medio, acotado a la propia tienda del owner.

**Recomendación (no aplicada):** agregar `request.resource.data.storeId == storeId`
a `create`/`update` de `products` (hoy solo lo hace `sells.create`).

---

## SEC-03 (Baja) — 📄 documentado — `isStoreOwner` inconsistente entre Firestore y Storage

**Archivos:** `firestore.rules` (línea ~25) vs `storage.rules` (línea ~30)

**Problema:** `firestore.rules` accede **directo** a `storeData.metadata.ownerId`,
mientras que `storage.rules` usa el patrón seguro
`.get('metadata', {}).get('ownerId', '')`.

**Confirmado por test que NO es un bug funcional:** el test
"reconoce al owner por metadata.ownerId (canónico actual)" siembra un store con
**solo** `metadata.ownerId` (sin `ownerId`/`userId` raíz) y el owner **igual accede**.
El operador `||` de las reglas absorbe el error de acceso a un campo raíz ausente y
evalúa el tercer término. Es decir: la disponibilidad está OK; el riesgo es solo de
**robustez/estilo** (fragilidad ante futuros cambios).

**Recomendación (no aplicada):** alinear `firestore.rules` al patrón `.get(...)` de
`storage.rules`.

---

## SEC-04 (Media) — 📄 documentado — roles `admin`/`employee` no soportados por reglas

**Archivo:** `firestore.rules` (modelo de permisos)

**Problema:** `isStoreOwner` solo reconoce al **owner**. Los roles `admin`/`employee`
(documentados en CLAUDE.md como existentes pero "sin reglas específicas") no pueden
acceder a los datos de la tienda vía reglas; el multi-usuario queda forzado a
operar server-side con Admin SDK.

**Recomendación (no aplicada):** al habilitar roles, modelar *membership* por tienda
(p. ej. subcolección `/stores/{id}/members/{uid}`) y chequearla en las reglas.
Decisión actual = consciente.

---

## SEC-05 (Baja) — 📄 documentado — `users/{uid}` sin validación de campos

**Archivo:** `firestore.rules` (`users/{userId}`)

**Problema:** `allow read, write` permite escribir campos arbitrarios sin validación
ni tope de tamaño en el documento propio (self data corruption / abuso de storage).
**No hay escalación de privilegios**: los permisos usan custom claims de Auth, no
campos del documento de usuario.

**Recomendación (no aplicada):** validar/acotar campos si el documento de usuario se
vuelve sensible.

---

## Índices — sin gaps; sobre-aprovisionamiento menor

No se detectaron índices **faltantes** para las queries de este repo (single-field,
rango+orden sobre el mismo campo, o filtros in-memory). Los índices compuestos de
`sells` por `payment.method`/`delivery.method`/`source` ya **no se usan** (los
filtros se movieron a memoria en `sale.service.ts:131`) → candidatos a depuración
futura. Detalle en [60-firebase-security-audit.md](../test/60-firebase-security-audit.md#4-índices-firestoreindexesjson-vs-queries-reales).

> **Caveat:** el emulador no enforce índices compuestos; esta revisión es estática.

---

## Nota de tooling (no es un hallazgo de producto)

- El entorno requería **Java** (JDK 21, igual que CI) para los emuladores de
  Firestore/Storage. Las dependencias de dev (`vitest`, etc.) deben estar instaladas
  (`npm install`) antes de correr `test:rules`.
- Los tests de reglas viven en `test/rules/**/*.rules.test.ts` y comparten el runner
  de integración (`vitest.integration.config.ts`). Se corren con `npm run test:rules`
  (emulador arriba) o `npm run test:emu` (integración + reglas).
