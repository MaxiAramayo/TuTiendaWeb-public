# 03 · Criterios de aceptación (Definition of Done)

Un test —o un PR de tests— se considera **correcto** solo si cumple **todos**
los criterios de abajo. Esta es la vara con la que se revisan los PRs de testing.

## A. Determinismo

- [ ] Pasa de forma estable (sin flakiness). Corrido 3 veces seguidas, siempre verde.
- [ ] Sin `sleep`/timeouts arbitrarios. Esperas por **estado**, no por tiempo.
- [ ] Tiempo congelado (`vi.useFakeTimers`) si el código usa fechas/relojes.
- [ ] Aleatoriedad mockeada (`nanoid`, `Math.random`) cuando afecta el resultado.

## B. Aislamiento

- [ ] No depende del orden de ejecución ni de otro test.
- [ ] Integración/reglas limpian su propio estado (`clearFirestore`/`clearAuth`
      o `rulesEnv.clearFirestore()` en `beforeEach`/`afterEach`).
- [ ] **Nunca** toca Firebase de producción: solo proyecto `demo-*` (garantizado
      por el guardarraíl de `integration-setup.ts`).

## C. Forma

- [ ] Patrón **AAA** explícito y **un comportamiento por `it`**.
- [ ] Nombre del `it` describe el comportamiento esperado en español.
- [ ] Usa factories en vez de literales gigantes.

## D. Cobertura del contrato (no de la implementación)

Para **cada** validación / regla de negocio, el set de tests incluye:

- [ ] **Caso válido** (happy path) que pasa.
- [ ] **Un caso inválido por cada regla** (cada `min`, `max`, `regex`, `refine`,
      enum, requerido…). No alcanza un único inválido genérico.
- [ ] **Bordes**: vacío, `min-1` / `min`, `max` / `max+1`, `null`/`undefined`,
      unicode/acentos, espacios, 0, negativos.

## E. Mensajes verificados literalmente

- [ ] Los `message` de Zod se afirman con el texto exacto esperado.
- [ ] Los errores visibles en UI se afirman con su texto (`getByText`,
      `findByText`), no con un booleano.

> Requisito explícito del proyecto: "probar todas las validaciones en inputs y
> mensajes". Un test que solo verifica `result.success === false` **no** cumple.

## F. Seguridad afirmada

- [ ] **Checkout (H-1):** existe un test que prueba que los precios enviados por
      el cliente **se ignoran** y el total se recalcula desde Firestore
      (price-tampering).
- [ ] **Reglas:** cada caso `allow` tiene su espejo `deny` (p. ej. "owner puede
      escribir" ↔ "no-owner es rechazado").
- [ ] Operaciones públicas (venta sin auth) validan estructura y `storeId`.

## G. Cobertura cuantitativa (gates de CI)

El gate del run **unit** (`npm run test:cov`) mide solo schemas y utils puros
(los componentes con test quedan fuera del gate). Ver alcance y motivo del recorte en
[50-coverage-and-ci](./50-coverage-and-ci.md#qué-se-mide-y-qué-no).

| Ámbito | lines/statements | functions | branches |
|--------|:---:|:---:|:---:|
| Global (scope unit-testeable) | ≥ 54% | ≥ 63% | ≥ 43% |
| `**/schemas/**` | ≥ 95% | ≥ 90% | ≥ 90% |

> Los umbrales globales están calibrados al valor real (ratchet) y suben a medida
> que se cubren más utils. La lógica de **dinero/datos** se exige al ≥90% pero
> **vía integración (Fase 2) y E2E (Fase 4)**, no en el gate unit: `checkout`/
> `store`/`sells` services no los ejecuta el run unit (hallazgo F5-01).

- [ ] El run de cobertura cumple los thresholds de su scope.
- [ ] Las líneas sin cubrir en lógica crítica están **justificadas** en el PR.

## H. Integración con CI

- [ ] Verde en los 3 jobs: `build-test` (incluye gate de cobertura), `emulators`, `e2e`.
- [ ] Archivo ubicado y nombrado según [02-conventions](./02-conventions.md).
- [ ] No deja artefactos ni datos residuales en el emulador.

---

## Checklist de revisión rápida (para PRs)

```
[ ] AAA + un comportamiento por it
[ ] Caso válido + inválido por regla + bordes
[ ] Mensajes afirmados literalmente
[ ] Determinista (timers/IDs mockeados)
[ ] Aislado (limpia estado, solo demo-*)
[ ] Seguridad: deny espejo / price-tampering donde aplique
[ ] Cumple thresholds de cobertura
[ ] Verde en CI
```
