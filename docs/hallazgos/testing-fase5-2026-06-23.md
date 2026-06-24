# Hallazgos — Fase 5 de testing (gates de cobertura + cierre) (2026-06-23)

Detectados al cerrar la suite de tests: enforcar el gate de cobertura en CI,
calibrarlo a un valor honesto y agregar cobertura unit a la lógica de negocio
crítica que faltaba (`schedule.utils`, `product-filter.utils`, gaps de
`format.utils`).

Política aplicada (igual que fases anteriores): se corrige en este PR solo lo
**imprescindible** (config de cobertura + paso de CI + tests). El resto se
documenta acá como mejora **no bloqueante**.

Severidades: **Alta** (rompe un flujo / falso verde de seguridad), **Media**
(deuda real de cobertura/observabilidad), **Baja** (cosmético / DX).

> Guía y criterios de la fase en
> [docs/test/50-coverage-and-ci.md](../test/50-coverage-and-ci.md) y
> [docs/test/03-acceptance-criteria.md](../test/03-acceptance-criteria.md).

---

## F5-01 (Media) — 📄 documentado — No hay cobertura combinada cross-runner

**Archivos:**
- `vitest.config.ts` (gate unit, provider `v8`)
- `vitest.integration.config.ts` (integración + reglas)
- `playwright.config.ts` (E2E)

**Problema:** la cobertura se mide **solo** sobre el run unit. Las capas que se
ejercitan en otros runners —`store/services/**` y `dashboard/modules/sells/**`
(integración, Fase 2), las reglas (Fase 3) y la UI completa (E2E, Fase 4)— el
provider `v8` del proceso unit **no las instrumenta**. Por eso quedaron **fuera
del `coverage.include`**: si entraran, contarían como 0% pese a estar cubiertas,
volviendo el gate inalcanzable (era exactamente el estado roto previo a esta
fase: `store/services` 0%, global 6%).

**Por qué importa:** el % de cobertura reportado **subestima** la cobertura real
del producto. La lógica sensible de dinero (checkout/sells) está testeada, pero
no figura en el número del gate unit. Los criterios de aceptación G (≥90% en
services/sells) se cumplen **vía integración/E2E**, no por este gate.

**Recomendación (no aplicada):** instrumentar y **fusionar** la cobertura de los
3 runners (v8/istanbul merge: correr integración y E2E con cobertura, exportar
`lcov`/`json` y mergear) para reportar un % global real que incluya services,
sells y UI. Recién entonces tiene sentido un gate global tipo ≥80% y gates
≥90% sobre `store/services/**` y `sells/**` medidos de verdad.

---

## F5-02 (Baja) — 📄 documentado — Utils de lógica pura sin tests unit

**Archivos:**
- `src/features/store/utils/theme.utils.ts` (~420 líneas, 0% cubierto)
- `src/features/dashboard/modules/store-settings/utils/profile.utils.ts` (~542 líneas, 0%)
- `src/features/dashboard/modules/qr/utils/qr-utils.ts` (~97 líneas, 0%)
- `src/features/auth/utils/errorHandling.ts` (~178 líneas, 0%)
- `src/features/store/utils/store-placeholders.ts` (~33% parcial)
- `src/features/dashboard/modules/sells/utils/sell.utils.ts` (~55% parcial)

**Problema:** son funciones puras (transformaciones, theming, mapeo de errores,
generación de QR) sin cobertura unit, pese a ser fácilmente testeables. Quedaron
fuera del scope crítico de esta fase (la prioridad fue la lógica que decide si el
cliente puede comprar y cómo ve el catálogo).

**Por qué importa:** arrastran el % global hacia abajo (hoy ~56% líneas) y son
deuda de cobertura. No bloquean: el gate funciona como ratchet sobre ese piso y
los sube a medida que se cubran.

**Recomendación (no aplicada):** agregar tests unit priorizando `errorHandling`
(mapeo de errores visible al usuario) y `profile.utils` (transformaciones de
settings). A medida que suban, elevar los thresholds globales de `vitest.config.ts`.

---

## F5-03 (Baja) — 📄 documentado — Salida de `Intl` dependiente del runtime (ICU)

**Archivos:**
- `src/shared/utils/format.utils.ts` (`formatDate` con `short: true`)
- `src/shared/utils/format.utils.test.ts`

**Problema:** `formatDate(d, { short: true })` usa `toLocaleDateString('es-AR',
{ day: '2-digit', month: '2-digit' })`, pero el relleno a 2 dígitos del **mes**
no se respeta en todos los runtimes (este Node devolvió `10/3`, no `10/03`). El
test tuvo que afirmar **estructura** (`/^\d{1,2}\/\d{1,2}$/`) en vez del string
literal.

**Por qué importa:** la UI puede mostrar `10/3` en un entorno y `10/03` en otro
para la misma fecha. No es bloqueante (ambos son legibles), pero es inconsistente.

**Recomendación (no aplicada):** si se quiere formato estable `dd/mm`, formatear
manualmente con `padStart(2, '0')` en lugar de depender de las opciones de `Intl`.

---

## Resumen

| Código | Severidad | Estado | Tema |
|--------|-----------|--------|------|
| F5-01 | Media | 📄 Documentado | Sin cobertura combinada cross-runner |
| F5-02 | Baja | 📄 Documentado | Utils puros sin tests unit |
| F5-03 | Baja | 📄 Documentado | `Intl` no rellena a 2 dígitos según runtime |

Ninguno es bloqueante para el cierre de la Fase 5. El gate de cobertura quedó
**enforced en CI y verde** (450 tests, exit 1 si baja del piso). El hallazgo más
valioso es **F5-01**: hasta que exista merge cross-runner, el % global subestima
la cobertura real del producto (la lógica de dinero está cubierta por integración
y E2E, no por el gate unit).
