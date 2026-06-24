# 50 · Cobertura y CI (Fase 5)

## Cobertura

- Provider: `v8` (`@vitest/coverage-v8`).
- Reportes: `text`, `text-summary`, `html` (`coverage/index.html`), `lcov`.

```bash
npm run test:cov     # corre unit + cobertura + valida thresholds
```

### Qué se mide (y qué no)

El gate mide **solo schemas Zod y lógica pura (`utils`)**: lo que el run unit
ejecuta de forma determinista y sin renderizar. Eso es lo que entra al
`coverage.include` de `vitest.config.ts`:

- `src/features/**/schemas/**`
- `src/features/**/utils/**`
- `src/shared/utils/**`, `src/lib/utils/**`, `src/lib/utils.ts`

> Los **componentes** (`LoginForm`, `CheckoutForm`, `product-form`) tienen tests
> unit, pero su `.tsx` **no entra al gate**: en jsdom renderizan parcialmente, así
> que medir su cobertura agregaría ruido y un % engañoso. Su comportamiento se
> verifica con las aserciones del test, no con un umbral de cobertura.

**No se miden en este gate** (y por eso quedan fuera del `include`):

| Capa | Por qué fuera | Dónde se cubre |
|------|---------------|----------------|
| `**/services/**` (checkout, store, sells) | Tocan Firestore/Admin SDK; el run unit no las ejecuta | Integración (Fase 2) |
| `firestore.rules` / `storage.rules` | No es código `src/` | Reglas (Fase 3) |
| `components/**`, `hooks/**`, `store/**` (Zustand), `app/**` | UI/estado: se ejercitan en el navegador | E2E (Fase 4) |

> **Por qué este recorte:** el provider `v8` solo ve lo que ejecuta el proceso
> de Vitest unit. Integración, reglas y E2E corren en **otros runners** (otra
> config / Playwright) que v8 no instrumenta. Si esas capas entraran al
> `include`, contarían como **0%** aunque estén cubiertas por las otras fases —
> un falso negativo que volvería el gate inalcanzable. Medir cobertura
> **combinada** cross-runner (merge v8/istanbul de los 3 runners) es la mejora
> registrada en el hallazgo **F5-01**.

### Thresholds (gates)

Definidos en `vitest.config.ts`. Si no se cumplen, el comando **falla** (rojo en CI).

| Ámbito | lines | statements | functions | branches |
|--------|:---:|:---:|:---:|:---:|
| Global (scope unit-testeable) | 54% | 54% | 63% | 43% |
| `src/features/**/schemas/**` | 95% | 95% | 90% | 90% |

Los números globales están **calibrados al valor real medido** (no son
aspiracionales) y funcionan como **ratchet**: previenen que la cobertura baje del
piso actual y obligan a testear —o excluir justificadamente— el código nuevo. A
medida que se cubran los utils pendientes (`theme`, `profile`, `qr`,
`errorHandling` — hallazgo **F5-02**) estos umbrales se suben.

> El gate de **schemas** sí es exigente (95%): son la fuente única de validación
> (Zod), donde un agujero deja pasar datos inválidos.

## CI (GitHub Actions)

El workflow `.github/workflows/ci.yml` corre 3 jobs en cada PR y push a `main`:

| Job | Qué corre | Notas |
|-----|-----------|-------|
| `build-test` | `lint` + `typecheck` + **`test:cov`** | rápido, sin emuladores. **Gate de cobertura (Fase 5).** |
| `emulators` | `emulators:exec --only auth,firestore,storage "test:int && test:rules"` | `npx firebase-tools@latest`; proyecto `demo-tutiendaweb`; Java 21. |
| `e2e` | `cp .env.emulator .env.local` + `playwright install chromium` + seed + `test:e2e` | sube `playwright-report` como artifact. Solo aquí se descargan browsers. |

El job `build-test` es bloqueante en todos los PRs. `emulators` y `e2e` requieren
Java (provisto por el runner) y son algo más lentos.

El detalle exacto de los 3 jobs vive en
[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (fuente de verdad —
esta doc no lo duplica para evitar drift). El paso clave de la Fase 5 es la línea
`- run: npm run test:cov` agregada al job `build-test`.

## Definición de "verde"

Un PR de tests está listo cuando los 3 jobs pasan y se cumplen los
[criterios de aceptación](./03-acceptance-criteria.md).
