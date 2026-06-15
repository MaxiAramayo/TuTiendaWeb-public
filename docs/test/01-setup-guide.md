# 01 · Guía de setup

Cómo dejar el entorno listo y cómo correr cada capa de tests.

## Requisitos

| Requisito | Para qué | Notas |
|-----------|----------|-------|
| Node 20+ (CI usa 22) | runner Vitest/Playwright | — |
| Java 11+ | emuladores de Firebase | requerido por Firestore/Auth/Storage emulados |
| `firebase-tools` | levantar emuladores | se usa vía `npx firebase-tools@latest`, no hace falta instalarlo global |
| Browsers de Playwright | E2E | `npx playwright install chromium` (solo la primera vez / en el job de CI) |

## Dependencias de testing instaladas (devDependencies)

- `vitest`, `@vitest/coverage-v8` — runner y cobertura (capas unit/integración).
- `@vitejs/plugin-react`, `jsdom` — entorno DOM para componentes.
- `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` — tests de componentes/forms.
- `@firebase/rules-unit-testing` — tests de reglas.
- `@playwright/test` — E2E.

> La resolución de los alias de TypeScript (`@/`, `@features/`, `@shared/`) la
> hace Vite de forma nativa (`resolve.tsconfigPaths: true` en `vitest.config.ts`).

## Archivos de configuración

| Archivo | Rol |
|---------|-----|
| `vitest.config.ts` | Tests unit/dom (rápidos, sin emulador). Define los projects `unit` (node) y `dom` (jsdom), y los gates de cobertura. |
| `vitest.integration.config.ts` | Tests de integración y reglas. environment node, sin paralelismo entre archivos. |
| `vitest.setup.ts` | Setup global unit/dom: matchers jest-dom, `cleanup()`, mocks de `next/cache`, `next/navigation`, `server-only`. |
| `test/helpers/integration-setup.ts` | Fija `*_EMULATOR_HOST` antes de cargar firebase-admin + guardarraíl anti-producción. |
| `test/helpers/firebase-emulator.ts` | Clientes Admin SDK y `rules-unit-testing`, helpers `clearFirestore`/`clearAuth`. |
| `test/helpers/factories.ts` | Factories de datos válidos por defecto (store, product, category, sale, session). |
| `playwright.config.ts` | E2E: webServer (`next dev`), baseURL, proyecto chromium. |

## Correr cada capa

### Unit (no requiere nada externo)

```bash
npm run test          # todo unit + dom
npm run test:unit     # solo project node
npm run test:dom      # solo componentes
npm run test:watch    # modo watch
npm run test:cov      # con cobertura + gates
```

### Integración y reglas (requieren emuladores)

Opción A — el emulador se gestiona solo (recomendado para CI y one-shot):

```bash
npm run test:emu      # firebase emulators:exec "vitest run -c vitest.integration.config.ts"
```

Opción B — emulador levantado a mano (recomendado en desarrollo, más rápido al iterar):

```bash
# Terminal 1
npm run emulators
# Terminal 2
npm run test:int      # integración
npm run test:rules    # reglas
```

### E2E

```bash
# Terminal 1: emuladores
npm run emulators
# Terminal 2: sembrar datos demo
npm run seed:emulator
# Terminal 3: correr E2E (Playwright levanta `next dev` solo)
npm run test:e2e
```

## Proyecto y datos

- **Proyecto de emulador:** `demo-tutiendaweb` (prefijo `demo-` → el Admin SDK
  no pide credenciales y nunca toca producción).
- **Puertos:** Auth `9099`, Firestore `8080`, Storage `9199`, UI `4000`
  (definidos en `firebase.json`).
- **Seed:** `scripts/seed-emulator.ts` crea owner + tienda demo + categorías,
  subcategorías, tags y productos. Es idempotente (IDs fijos).

## Troubleshooting

- **"Could not reach Cloud Firestore backend"** en tests de integración → el
  emulador no está corriendo o el puerto no coincide. Verificá `npm run emulators`.
- **Tests de integración tocan producción** → imposible por diseño: el
  guardarraíl en `integration-setup.ts` aborta si el proyecto no empieza con `demo-`.
- **Playwright no encuentra browser** → `npx playwright install chromium`.
- **Java no instalado** → instalar JDK 11+; los emuladores lo requieren.
