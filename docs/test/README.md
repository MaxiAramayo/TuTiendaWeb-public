# Estrategia de Testing — TuTiendaWeb

> Documentación oficial de la suite de tests automatizados. Define **qué** se
> prueba, **cómo** se prueba, y **cuándo un test se considera correcto**.

TuTiendaWeb es un SaaS de comercios (Next.js 15 App Router + Firebase) con
lógica sensible de dinero (recálculo de precios server-side, ventas, import
masivo), 15 schemas Zod de validación, y reglas de seguridad Firestore/Storage
que separan datos públicos de privados. Esta suite es la red de seguridad que
protege esas piezas.

## Pirámide de testing

```
            ╱╲          E2E (Playwright)            ← pocos, flujos críticos
           ╱  ╲         Fase 4
          ╱────╲        Reglas (rules-unit-testing) ← seguridad Firestore/Storage
         ╱      ╲       Fase 3
        ╱────────╲      Integración (emuladores)    ← services + Server Actions
       ╱          ╲     Fase 2
      ╱────────────╲    Unit (Vitest)               ← base: schemas Zod + lógica pura
     ╱______________╲   Fase 1
```

La mayor parte de la cobertura vive en la base (unit). Cada capa hacia arriba
es más cara y más lenta, por eso se reserva para lo que solo se puede verificar
ahí (datos reales, reglas, UI completa).

## Las 4 capas

| Capa | Herramienta | Qué prueba | Necesita emulador | Dónde viven |
|------|-------------|------------|:---:|-------------|
| **Unit** | Vitest + Testing Library | Schemas Zod, funciones puras, componentes/forms | No | `src/**/*.test.ts(x)` |
| **Integración** | Vitest + Admin SDK | Services y Server Actions contra Firestore/Auth/Storage | Sí | `test/integration/**/*.int.test.ts` |
| **Reglas** | `@firebase/rules-unit-testing` | `firestore.rules` y `storage.rules` (allow/deny) | Sí | `test/rules/**/*.rules.test.ts` |
| **E2E** | Playwright | Flujos de UI completos en el navegador | Sí | `e2e/**/*.spec.ts` |

## Comandos rápidos

```bash
npm run test          # Unit + DOM (rápido, sin emuladores) — corre en cada commit
npm run test:watch    # Unit en modo watch (desarrollo)
npm run test:cov      # Unit con cobertura + gates (lo que valida CI)

# Requieren emuladores (Java 11+). Una terminal con `npm run emulators` y luego:
npm run test:int      # Integración
npm run test:rules    # Reglas de seguridad
npm run test:emu      # Integración + reglas, levantando el emulador automáticamente

npm run test:e2e      # E2E (requiere app + emuladores + seed)
npm run test:e2e:ui   # E2E modo interactivo
```

## Índice de la documentación

1. [01 · Guía de setup](./01-setup-guide.md) — instalación, requisitos, cómo correr cada capa.
2. [02 · Convenciones](./02-conventions.md) — naming, AAA, ubicación, datos de prueba.
3. [03 · Criterios de aceptación](./03-acceptance-criteria.md) — **qué hace correcto a un test** (Definition of Done).
4. [10 · Guía Unit](./10-unit-guide.md) — schemas Zod, funciones puras, componentes.
5. [20 · Guía Integración](./20-integration-guide.md) — emuladores, seed, aislamiento, sesiones.
6. [30 · Guía Reglas](./30-rules-audit-guide.md) — matriz allow/deny, auditoría con skills.
7. [40 · Guía E2E](./40-e2e-guide.md) — flujos, fixtures, selectores.
8. [50 · Cobertura y CI](./50-coverage-and-ci.md) — thresholds, jobs de GitHub Actions.
9. [60 · Auditoría de seguridad Firebase](./60-firebase-security-audit.md) — hallazgos de la auditoría.
10. [matrices/](./matrices/) — matrices de casos de prueba por feature.

## Roadmap por fases

- **Fase 0** — Setup de tooling y documentación. ✅
- **Fase 1** — Unit: schemas Zod (validaciones + mensajes), lógica pura y componentes. ✅ **386 tests verdes** (`npm run test`).
  - **Schemas (15/15)** con su matriz en [`matrices/`](./matrices/): `login`, `register`, `product`, `category`, `checkout`, `store-setup`, `onboarding`, `product-import`, `store`, `sell`, `profile`, `reset-password`, `user-profile`, `complete-registration`, `tag`. Gate de cobertura `**/schemas/**` (≥95% líneas / ≥90% branches) **cumplido**.
  - **Funciones puras:** `format.utils`, `firestore-serializer`, `cleanForFirestore`, `sell.utils`, `product.utils`, `whatsapp.utils`. *(helpers privados de `category.service` quedan para Fase 2: el módulo importa `firebase-admin`.)*
  - **Componentes (Testing Library):** `LoginForm`, `CheckoutForm` (incluye chequeo H-1: el checkout envía items sin precios), `ProductForm`. Se agregó polyfill global de `ResizeObserver`/`matchMedia` en `vitest.setup.ts`.
  - **Diferido a E2E (Fase 4):** `MultiStepRegister` y `OnboardingWizard` (wizards multi-paso, mejor cubiertos end-to-end). Los gates de cobertura `store/services/**` y `sells/**` se cumplen en Fase 2 (integración) y el gate global (≥80%) en Fase 5.
- **Fase 2** — Integración con emuladores. ✅ **Funcionalmente completa** (6 áreas, suites verdes). Criterio de salida en [`20-integration-guide.md`](./20-integration-guide.md#criterio-de-aceptación-de-la-fase-2-completa-definition-of-done).
  - **Checkout (H-1)** ✅ PR1 — price-tampering + infra de emuladores + CI.
  - **Sells** ✅ PR2 — `sale.service`/`sale.actions` (totales, filtros, stats) + **fix INT-01/INT-02** (el envío integra el total persistido; el descuento no se resetea al editar items). `test/integration/sells.int.test.ts`.
  - **Products + Import** ✅ PR3 — CRUD, limpieza real de imágenes en Storage emulado, `bulkCreateProducts` (dedupe, topes, batches). `test/integration/products.int.test.ts`.
  - **Categories/Tags** ✅ PR4 — jerarquía 2 niveles, reorder, uso/borrado, slug. `test/integration/categories.int.test.ts`.
  - **Store-settings** ✅ PR5 — slug único case-insensitive, validación por sección. `test/integration/store-settings.int.test.ts`.
  - **Auth/claims** ✅ PR6 — `setUserClaims`/`getUserClaims`, `getServerSession` (claims/fallback). `test/integration/auth.int.test.ts`.
  - **Pendiente (no bloqueante):** gate cuantitativo de cobertura de integración (se enforcea en Fase 5).
- **Fase 3** — Auditoría de reglas Firestore/Storage. ✅ **81 tests verdes** (`npm run test:rules`).
  - **Reglas Firestore** ✅ `test/rules/firestore.rules.test.ts` — matriz allow/deny completa (stores, products/categories/tags, sells, settings, notifications, users, catch-all) + ownership por los 3 campos legacy sin acceso cruzado.
  - **Reglas Storage** ✅ `test/rules/storage.rules.test.ts` — `stores/**` (público read; owner+imagen<5MB write/delete), `users/{uid}/avatar`, `temp/{uid}`, catch-all.
  - **Auditoría** (skill `firebase-security-rules-auditor`): puntaje 3/5, informe en [`60-firebase-security-audit.md`](./60-firebase-security-audit.md). **SEC-01** (escritura pública `sells.create` sin topes de tamaño) **corregido** en este PR; SEC-02..05 documentados. Hallazgos en [`hallazgos/testing-fase3-2026-06-19.md`](../hallazgos/testing-fase3-2026-06-19.md).
  - **Índices:** sin gaps; sobre-aprovisionamiento menor en `sells` (filtros movidos a memoria). CI corre integración + reglas en el job `emulators`.
- **Fase 4** — E2E de los 6 flujos críticos con Playwright. ✅ **Suite en `e2e/*.spec.ts`** (`npm run test:e2e`).
  - **Auth** ✅ `e2e/01-auth.spec.ts` — login válido/ inválido (mensajes) + registro → onboarding (wizard 10 pasos) → dashboard.
  - **Catálogo → carrito → checkout → WhatsApp** ✅ `e2e/02-catalog-checkout.spec.ts` (camino crítico de dinero) — el **total del ticket es el recalculado server-side** y el link `wa.me` se genera (espejo E2E del price-tampering de Fase 2). Incluye checkout vacío.
  - **Alta de producto** ✅ `e2e/03-products.spec.ts` — crea un producto y lo verifica en el listado del dashboard y en el catálogo público.
  - **Settings** ✅ `e2e/04-settings.spec.ts` — edita el WhatsApp de contacto y verifica persistencia tras recargar.
  - **Import por Excel** ✅ `e2e/05-import.spec.ts` — fixture válido (import completo) e inválido (preview marca filas con errores). Fixtures en `e2e/fixtures/` (generados por `npm run make:e2e-fixtures`).
  - **Sesión:** los specs autenticados loguean al owner por UI en un `beforeEach` (`e2e/helpers/auth.ts`). Se evaluó reusar `storageState`, pero Chromium no entrega de forma fiable la cookie httpOnly de sesión en la primera navegación de un contexto creado desde storageState (hallazgo E2E-07).
  - **Selectores:** se agregaron `data-testid`/`aria-label` mínimos en el carrito (ver E2E-01). CI: nuevo job `e2e` (emuladores → seed → Playwright, sube `playwright-report/`). Hallazgos no bloqueantes en [`hallazgos/testing-fase4-2026-06-22.md`](../hallazgos/testing-fase4-2026-06-22.md).
- **Fase 5** — Gates de cobertura en CI y cierre de documentación. ✅
  - **Gate honesto y verde:** `vitest.config.ts` mide solo schemas + utils puros
    (los componentes tienen tests pero su `.tsx` queda fuera del gate por su
    render parcial en jsdom); las capas cubiertas por integración/reglas/E2E
    también quedan fuera del `include` (el provider
    v8 del run unit no las observa → contarían 0% falso). Thresholds calibrados
    al valor real (**ratchet**, no aspiracional): global 54/54/63/43, schemas
    95/95/90/90. `npm run test:cov` → **450 tests verdes**.
  - **Lógica de negocio crítica cubierta:** unit nuevos de `schedule.utils`
    (abierto/cerrado por horario, breaks, cruce de medianoche — con
    `vi.useFakeTimers`) y `product-filter.utils` (búsqueda/filtros/orden del
    catálogo); cierre de gaps en `format.utils`.
  - **Gate enforced en CI:** el job `build-test` de `.github/workflows/ci.yml`
    ahora corre `npm run test:cov` (bloqueante). Verificado que **falla** si la
    cobertura cae bajo el umbral.
  - **Pendiente (no bloqueante):** cobertura combinada cross-runner (services/
    sells/UI quedan fuera del % unit) y utils sin test (`theme`, `profile`, `qr`,
    `errorHandling`). Hallazgos en
    [`hallazgos/testing-fase5-2026-06-23.md`](../hallazgos/testing-fase5-2026-06-23.md).

Cada fase es un entregable independiente y mergeable por separado.
