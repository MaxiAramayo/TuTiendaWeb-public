# Fixes UX — hallazgos reportados por usuarios (2026-06-24)

Correcciones de cuatro problemas reportados por usuarios reales (catálogo público y
dashboard) más un fix de CI (e2e inestable), y el cierre de hallazgos abiertos
relacionados. Cada fix es el cambio mínimo seguro; se incluyó verificación y se
actualizó la documentación afectada.

Validación global: `npx tsc --noEmit` ✅ · `npm run lint` ✅ · `npm run test` ✅ (453 tests)
· e2e `04-settings` 5/5 contra emuladores.

---

## 1. ✅ Carrito — un nombre de producto largo rompía el layout y ocultaba las acciones

**Síntoma:** con un nombre largo, la fila del producto se desbordaba horizontalmente
y el precio/total quedaban cortados fuera del panel del carrito; las acciones no se veían.

**Causa raíz:** `Cart.tsx` envolvía la lista en el `ScrollArea` de Radix
(`src/components/ui/scroll-area.tsx`). El viewport de Radix mete a los hijos en un
contenedor con `display:table; min-width:100%`, que hace **shrink-to-fit al contenido**:
el nombre largo expandía la fila más allá del 100%, por lo que `truncate` + `min-w-0`
del título nunca se activaban y empujaban el precio fuera del borde.

**Cambios:**
- `src/features/store/components/cart/Cart.tsx`: se reemplazó `<ScrollArea h-80>` por un
  `<div className="max-h-80 overflow-y-auto rounded-md">` (overflow nativo, ancho fijo al
  contenedor). Se eliminó el scroll anidado redundante (el path mobile de `CartDrawer`
  ya tiene su propio `overflow-y-auto`) y los imports muertos `ScrollArea` y `CartFooter`.
- `src/features/store/components/cart/CartItem.tsx`: endurecimiento defensivo de la fila
  inferior — `gap-2 min-w-0` en el contenedor, `flex-shrink-0` en el stepper y
  `flex-shrink-0 whitespace-nowrap` en el precio. El título ya tenía `truncate min-w-0`.

**Verificación:** agregar un producto con nombre muy largo y abrir el carrito en mobile
(≤767px) y desktop → el nombre trunca con `…` y stepper + precio + total quedan visibles.

---

## 2. ✅ Dashboard "Configuración" → 404

**Síntoma:** la card "Configuración" / "Personalizar tienda" del home del dashboard
llevaba a un 404.

**Causa raíz:** apuntaba a `/dashboard/profile`, ruta inexistente. Las settings viven en
`/dashboard/settings/*` (con redirect `/dashboard/settings` → `/dashboard/settings/general`).
Además, 12 `revalidatePath('/dashboard/profile')` revalidaban una ruta inexistente, por lo
que las páginas reales de settings no se revalidaban tras guardar.

**Cambios (`/dashboard/profile` → `/dashboard/settings`):**
- `src/features/dashboard/modules/overview/components/DashboardWelcome.tsx` (card Configuración).
- `src/features/dashboard/modules/overview/components/DashboardOverview.tsx` (card; título "Perfil" → "Configuración").
- `src/features/dashboard/components/ModernTopBar.tsx`: se eliminó la key stale
  `"/dashboard/profile"` del mapa de títulos (ya existía la correcta `"/dashboard/settings"`).
- `src/features/dashboard/modules/store-settings/actions/profile.actions.ts`: las 12 llamadas
  `revalidatePath('/dashboard/profile')` → `revalidatePath('/dashboard/settings', 'layout')`
  (revalida todas las sub-rutas de settings).

**Verificación:** tocar la card "Configuración" abre `/dashboard/settings/general` sin 404;
guardar una sección refleja el cambio al recargar.

---

## 3. ✅ WhatsApp — a veces abría la página de descarga en vez de la app (Android/Brave; iOS)

**Síntoma:** en Android (Samsung) con Brave, el primer tap en "Confirmar Pedido" no abría
WhatsApp; redirigía al instalador. Un segundo tap (reenviar) sí lo abría.

**Causa raíz:** `CheckoutForm` abría una pestaña en blanco síncrona (`window.open("", "_blank")`)
y, **después del `await processCheckoutAction`**, le seteaba `location.href`. Tras el await se
pierde la *user-activation* de esa pestaña, por lo que `wa.me` no dispara el intent de la app
y cae al interstitial de descarga. (Documentado como E2E-06.)

**Cambios (enfoque híbrido):**
- `src/features/store/components/checkout/CheckoutForm.tsx`: en éxito se llama **primero** a
  `onOrderComplete(...)` para renderizar el ticket de confirmación, y luego se intenta el
  auto-open *best-effort* en la pestaña pre-abierta. Se eliminó el segundo `window.open`
  post-await (el que el bloqueador de popups frena). La URL sigue siendo `https://wa.me/...`.
- `src/features/store/components/checkout/OrderTicket.tsx`: el CTA primario es un `<a href>`
  nativo, renombrado a **"Abrir WhatsApp"**, con copy de ayuda actualizado ("Si WhatsApp no
  se abrió automáticamente, tocá el botón para abrirlo").

**Por qué resuelve el bug:** el botón nativo del ticket abre WhatsApp sobre un gesto real del
usuario → confiable en Android e iOS, sin depender del bloqueador de popups. El auto-open
queda como mejor-esfuerzo.

**Verificación:** completar un pedido en mobile (Android Brave/Samsung e iOS Safari). Tras
"Confirmar Pedido" aparece el ticket con "Abrir WhatsApp"; al tocarlo abre la app con el
mensaje. El pedido se persiste igual.

---

## 4. ✅ Horarios — ahora tienen su propia pestaña bajo Configuración

**Síntoma / pedido:** los horarios estaban embebidos dentro de la pestaña "Ubicación";
el hallazgo de usuarios pedía que tuvieran su propio lugar.

**Cambios:**
- Nueva ruta `src/app/dashboard/settings/schedule/page.tsx` (title "Horarios").
- Nuevo `src/features/dashboard/modules/store-settings/components/ScheduleSettingsClient.tsx`
  (espejo de `LocationSettingsClient`, renderiza solo `ScheduleSection`).
- `LocationSettingsClient.tsx`: se quitó `ScheduleSection` (y el separador) — queda solo `AddressSection`.
- `ModernSidebar.tsx`: nuevo subItem "Horarios" → `/dashboard/settings/schedule` (icono `Clock`).
- Metadata/títulos: `location/page.tsx` → "Ubicación"; `ModernTopBar` ya mapeaba
  `/dashboard/settings/schedule` → "Horarios" y se ajustó `/dashboard/settings/location` → "Ubicación".

**Verificación:** en el sidebar de Configuración aparece "Horarios" como pestaña propia que
abre `/dashboard/settings/schedule`; "Ubicación" ya no muestra horarios; guardar horarios persiste.

---

## 5. ✅ CI e2e + bug real de pérdida de datos en settings (E2E-09)

Se cerró en dos iteraciones. La segunda corrigió tanto el CI como un **bug real de
pérdida de datos** (no solo flakiness de test).

### 5a. `02-catalog-checkout` — locator del link de WhatsApp
El spec buscaba el link por `/reenviar por whatsapp/i`; en la ronda 1 renombré el botón a
**"Abrir WhatsApp"** → no lo encontraba. Fix: locator → `/abrir whatsapp/i` (spec +
`docs/test/40-e2e-guide.md`). Verificado 4/4.

### 5b. `04-settings` — el WhatsApp guardaba el valor VIEJO (bug de app)
**Causa raíz (bug real, hallazgo E2E-09):** hay varias instancias de `useProfile`
compartiendo el store de Zustand. Un `setProfile` async (re-fetch) dispara `reset(form)`
que **pisa la edición en curso** del usuario: en la ventana entre que el botón se habilita
y el click se procesa, el form se revierte al valor sembrado e `isDirty` vuelve a `false`.
`handleSectionSave` entonces lee el valor viejo y lo guarda — el toast dice "guardado
correctamente" pero persiste el número anterior. Confirmado en CI:
`Expected "1133224455" / Received "100000000"` (el sembrado).

**Fix de app (`useProfile.ts`):** se resetea el form **solo si los datos del perfil
cambiaron de verdad** (comparación por contenido vía `JSON.stringify(profileToFormData)`
contra `lastSyncedFormDataRef`). Un refresh async con los mismos datos ya no pisa la
edición; tras un guardado real (datos distintos) el reset sí ocurre y limpia `isDirty`.
Aplica a los 3 puntos de reset (mount, `loadProfile`, efecto store-sync).

**Fix de test (`04-settings.spec.ts`):** esperar la **completitud** del guardado vía el
toast (aparece tras `getProfileAction`) antes de recargar — antes recargaba sobre el
`isSectionSaving` y abortaba el request (`ECONNRESET`, no persistía). Se mantiene el atajo
"ya guardado" para romper el deadlock de rebaseline.

**Verificación:** loop de 6 corridas con **seed fresco antes de cada una** (fuerza
persistir desde cero) → **6/6 pasan**; `02`+`04` con `--repeat-each=4` → 11/12 antes del
fix de app, **12/12** después.

### 5c. ↩️ Regresión ronda 1: `removeChild of null` en `/dashboard/settings/general`
**Causa:** en la ronda 1 cambié `revalidatePath('/dashboard/profile')` (no-op de años) →
`revalidatePath('/dashboard/settings', 'layout')`. Eso refrescaba **todo el subtree del
layout de settings** en cada guardado, re-renderizando `/general` mientras el toast y el
`setProfile`→`reset` estaban en transición → "Cannot read properties of null (reading
'removeChild')". Las settings son client-driven (`useProfile` ya refetchea), así que ese
revalidate no aportaba nada.

**Fix (`profile.actions.ts`):** las 12 llamadas revalidan ahora `/${session.storeId}`
(catálogo público, consumidor real) en vez de la ruta de settings que el usuario edita.
No se pudo reproducir el crash en Playwright headless (depende del timing real de Chrome),
pero se eliminó la causa más probable.

**Endurecimiento defensivo (auditoría DOM del proyecto):**
- `sells/utils/sell.utils.ts` (descarga CSV): `removeChild` con guard `if (link.parentNode)`.
- `BasicInfoSection` / `ContactInfoSection`: los `motion.div` condicionales con animación de
  altura/entrada se envolvieron en `<AnimatePresence>` con `key` + `exit` para que
  framer-motion controle el unmount (clase típica de `removeChild`).
- Resto de focos auditados (DOM directo en `ThemeProvider`; `AnimatePresence` sin `key` en
  `CartItem`/`CartFloatingButton`/`Navbar`/`ProfileHealth`): bajo riesgo, sin cambios.

### 5d. ↩️ Regresión ronda 1: carrito desbordado en tablet/desktop (≥768px)
**Causa:** a ≥768px el carrito usa `Dialog` (`grid`, items con `min-width:auto`); el nombre
largo expandía el item más allá del modal, y la ronda 1 había quitado el `overflow-hidden`
del `ScrollArea`. **Fix (`Cart.tsx`):** `w-full min-w-0 overflow-hidden` en el contenedor.
Verificado con screenshot a 768px y nombre largo: trunca y queda dentro del modal.

---

## Documentación actualizada

- `docs/hallazgos/testing-fase4-2026-06-22.md` — E2E-06 ✅ RESUELTO; E2E-09 ✅ RESUELTO
  (fix de app en `useProfile` + spec endurecido).
- `docs/hallazgos/hallazgos-por-usuarios.md` — sus dos puntos quedan resueltos (ver #2 y #4).
