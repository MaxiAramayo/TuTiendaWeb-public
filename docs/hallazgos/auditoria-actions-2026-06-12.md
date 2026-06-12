# Hallazgos — Auditoría de Server Actions (2026-06-12)

Revisión de los 8 archivos de Server Actions y sus servicios. El foco fue la **creación
de tienda** y la **suscripción** (a pedido), más una pasada general por el patrón
AUTH → VALIDATE → MUTATE → REVALIDATE y el uso de `ActionResponse`.

> Estado: estos son **hallazgos abiertos** para decidir/corregir. Ninguno está corregido
> en este commit (salvo que se indique lo contrario más abajo en futuras actualizaciones).

---

## ✅ Lo que está correcto

- **Creación de tienda + suscripción:** `createStore`
  (`features/store/services/store.service.ts`) inicializa el trial con Timestamps reales
  (`active:true, plan:'trial', paymentStatus:'trial', endDate: now+7d,
  billing:{provider:'none', autoRenew:false}`). Coincide 1:1 con
  [../arquitectura/suscripciones.md](../arquitectura/suscripciones.md).
- Los flujos `completeRegistrationAction` (auth.actions) y `completeNewOnboardingAction`
  (onboarding.actions) encadenan bien `createStore → setUserClaims → revokeUserTokens`.
- `updateSettings` escribe la suscripción en `subscription.*` (dot-notation, target
  correcto en la raíz del documento).
- Todas las actions siguen AUTH → VALIDATE → MUTATE → REVALIDATE y devuelven
  `ActionResponse` (salvo la excepción del hallazgo H-3).

---

## Hallazgos

### H-1 (Media) — `createPublicSaleAction` no valida con Zod

**Archivo:** `src/features/dashboard/modules/sells/actions/sale.actions.ts`
(y su llamador `src/features/store/actions/checkout.actions.ts`).

La venta pública del catálogo se crea sin validar el payload con `createSaleSchema`. El
`createSaleAction` autenticado **sí** valida; el público pasa los items del carrito
directo a `createSale`. `checkout.actions` valida el formulario (`checkoutFormSchema`)
pero **no** los items (se arman desde el carrito del cliente con `cartToSaleItems`).

> Va contra la regla del proyecto: "Ventas públicas creadas desde el catálogo: siempre
> validar y sanitizar datos en el servidor" (CLAUDE.md).

**Riesgo:** un cliente puede enviar items/precios/totales manipulados que se persisten sin
validar.

**Fix sugerido:** correr `createSaleSchema.safeParse(data)` dentro de
`createPublicSaleAction` antes de `createSale`, devolviendo errores si falla; idealmente
recalcular precios/subtotales en el servidor a partir de los productos reales en vez de
confiar en los del carrito.

---

### H-2 (Baja) — `updateSubscriptionAction` permite `provider: 'stripe'` y escritura manual

**Archivo:** `src/features/dashboard/modules/store-settings/actions/profile.actions.ts`.

- El tipo del input acepta `billing.provider: 'mercadopago' | 'stripe'`. **Stripe no
  existe** en el modelo (solo `mercadopago` / `none`).
- Permite escribir la suscripción a mano desde el dashboard, cuando el ciclo de vida real
  lo gestionan las Cloud Functions (`Funciones-google-tutiendaweb`). Escribe al path
  correcto (`subscription.*`), pero puede entrar en conflicto con la fuente de verdad.

**Fix sugerido:** quitar `'stripe'`; restringir esta action a lo estrictamente necesario
(o eliminarla si el flujo real es 100% por Functions).

---

### H-3 (Baja) — `createTagAction` rompe el patrón estándar

**Archivo:** `src/features/products/actions/tag.actions.ts`.

Lanza `throw new Error(...)` en vez de devolver `ActionResponse`, y define su propio schema
inline en vez de usar `tag.schema.ts`. Inconsistente con el resto de las actions.

**Fix sugerido:** devolver `ActionResponse`, importar el schema de `schemas/tag.schema.ts`.

---

### H-4 (Baja) — `ActionResponse` redeclarado localmente

**Archivos:** `product.actions.ts`, `profile.actions.ts`, `checkout.actions.ts`,
`sells/.../sale.actions.ts` (via `sell.schema.ts`).

Cada uno redeclara el tipo `ActionResponse` en vez de importarlo de
`features/auth/auth.types.ts`. Deuda técnica ya conocida (mencionada en `AGENTS.md`).

**Fix sugerido:** importar el tipo canónico desde `auth.types.ts` y borrar las copias.

---

### H-5 (Info) — Comentario incorrecto en `deleteSale`

**Archivo:** `src/features/dashboard/modules/sells/services/sale.service.ts`.

El JSDoc dice "Elimina una venta (soft delete)" pero ejecuta un `.delete()` (hard delete).
Solo el comentario está mal; el comportamiento (borrado definitivo) es consistente con el
de productos.

**Fix sugerido:** corregir el comentario (o implementar soft-delete si se quiere
conservar historial de ventas borradas).

---

## Tabla resumen

| ID | Severidad | Área | Estado |
|----|-----------|------|--------|
| H-1 | Media | Ventas públicas sin validar (catálogo) | Abierto |
| H-2 | Baja | `updateSubscriptionAction` (stripe / escritura manual) | Abierto |
| H-3 | Baja | `createTagAction` rompe patrón | Abierto |
| H-4 | Baja | `ActionResponse` duplicado | Abierto |
| H-5 | Info | Comentario `deleteSale` | Abierto |
