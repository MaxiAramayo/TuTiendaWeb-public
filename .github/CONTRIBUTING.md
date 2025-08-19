# Cómo contribuir

## Flujo
1. Hacé un fork y creá una branch: `feat/<breve-descripcion>` o `fix/<breve-descripcion>`.
2. Instalá dependencias: `npm install` (o `pnpm i` si usás pnpm).
3. Lint/Tipos/Tests: `npm run lint` · `npm run typecheck` · `npm test`
4. Si hay e2e: `npx playwright test`
5. Abrí un Pull Request a `main` explicando **qué**, **por qué** y **cómo probar**.

## Estilo de commit (sugerido)
Conventional Commits: `feat: …`, `fix: …`, `docs: …`, etc.

## Revisión
- Al menos 1 aprobación (o código owner) y CI en verde.
