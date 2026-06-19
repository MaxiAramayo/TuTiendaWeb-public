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
- **Fase 4** — E2E de los 6 flujos críticos.
- **Fase 5** — Gates de cobertura en CI y cierre de documentación.

Cada fase es un entregable independiente y mergeable por separado.
