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
