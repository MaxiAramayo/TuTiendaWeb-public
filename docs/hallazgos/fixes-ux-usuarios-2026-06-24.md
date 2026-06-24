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

## 5. ✅ CI — e2e `04-settings` inestable (WhatsApp de contacto)

**Síntoma:** el job `emulators`/`e2e` de GitHub Actions fallaba intermitente en
`e2e/04-settings.spec.ts › edita el WhatsApp de contacto y persiste tras recargar`
(p. ej. "1 failed, 8 passed"), incluso con `retries: 1`.

**Causa raíz (no era un bug de la app):** tras un guardado exitoso, react-hook-form
**rebasa** el form y `isDirty` vuelve a `false` con el nuevo número como baseline. El
spec asertaba el **toast efímero** ("información de contacto guardada") dentro del
`expect.toPass`. Cuando ese assert flaqueaba (el toast ya se había desvanecido), los
reintentos reescribían el **mismo** número → al ser igual al baseline, RHF no volvía a
marcar `isDirty` → el botón nunca se re-habilitaba → deadlock hasta el timeout de 25 s.
Se confirmó reproduciendo en local contra emuladores: 4/5 fallos con el spec viejo.

**Cambios (`e2e/04-settings.spec.ts`, solo el test):**
- Ya no se asiste sobre el toast (señal efímera).
- Cada intento detecta primero si el número **ya quedó guardado** (objetivo cumplido) y
  retorna; rompe el deadlock de "no puedo re-ensuciar el mismo valor".
- La señal de guardado pasa a ser estable: el botón **se deshabilita** (guardado +
  rebaseline de RHF).

**Verificación:** `--repeat-each=5` contra emuladores → **5/5 pasan** (~2 s c/u, sin
agotar el retry de 25 s). No se modificó el hook compartido `useProfile` (se evaluó pero
se descartó para no arriesgar regresiones en todas las settings; el flake era del test).
El hallazgo de UX de fondo queda registrado en E2E-09.

---

## Documentación actualizada

- `docs/hallazgos/testing-fase4-2026-06-22.md` — E2E-06 ✅ RESUELTO; E2E-09 ✅ RESUELTO (en el test).
- `docs/hallazgos/hallazgos-por-usuarios.md` — sus dos puntos quedan resueltos (ver #2 y #4).
