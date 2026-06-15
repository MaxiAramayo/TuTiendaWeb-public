# 50 · Cobertura y CI (Fase 5)

## Cobertura

- Provider: `v8` (`@vitest/coverage-v8`).
- Reportes: `text`, `text-summary`, `html` (`coverage/index.html`), `lcov`.
- Solo se mide `src/**`. Se excluyen tests, tipos, `src/app/**` (rutas/layouts,
  cubiertas por E2E), `loading.tsx`.

```bash
npm run test:cov     # corre unit + cobertura + valida thresholds
```

### Thresholds (gates)

Definidos en `vitest.config.ts`. Si no se cumplen, el comando **falla** (rojo en CI).

| Ámbito | lines/statements | functions | branches |
|--------|:---:|:---:|:---:|
| Global | 80% | 80% | 70% |
| `src/features/store/services/**` | 90% | 90% | 85% |
| `src/features/dashboard/modules/sells/**` | 90% | 90% | 85% |
| `src/features/**/schemas/**` | 95% | 90% | 90% |

> Los porcentajes de la lógica crítica (checkout, sells, schemas) son más
> exigentes a propósito: ahí un bug cuesta dinero o filtra datos.

## CI (GitHub Actions)

El workflow `.github/workflows/ci.yml` corre 3 jobs en cada PR y push a `main`:

| Job | Qué corre | Notas |
|-----|-----------|-------|
| `unit` | `lint` + `typecheck` + `test:cov` | rápido, sin emuladores. Gate de cobertura. |
| `emulators` | `firebase emulators:exec "test:int && test:rules"` | usa `npx firebase-tools@latest`; proyecto `demo-tutiendaweb`. |
| `e2e` | `playwright install --with-deps chromium` + `test:e2e` | sube `playwright-report` como artifact. Solo aquí se descargan browsers. |

El job `unit` es bloqueante en todos los PRs. `emulators` y `e2e` requieren Java
(provisto por el runner) y son algo más lentos.

### Esquema del workflow

```yaml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm run typecheck
      - run: npm run test:cov

  emulators:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - run: npm ci
      - run: npx -y firebase-tools@latest emulators:exec --project demo-tutiendaweb "npm run test:int && npm run test:rules"

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx -y firebase-tools@latest emulators:exec --project demo-tutiendaweb "npm run seed:emulator && npm run test:e2e"
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with: { name: playwright-report, path: playwright-report }
```

> El `ci.yml` actual solo corre lint + tsc. La Fase 5 lo reemplaza por el
> esquema de arriba. Hasta entonces conviven sin romper nada.

## Definición de "verde"

Un PR de tests está listo cuando los 3 jobs pasan y se cumplen los
[criterios de aceptación](./03-acceptance-criteria.md).
