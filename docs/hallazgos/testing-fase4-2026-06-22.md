# Hallazgos — Fase 4 de testing (E2E con Playwright) (2026-06-22)

Detectados al escribir la suite E2E (`e2e/*.spec.ts`, 6 flujos críticos) y al
recorrer los flujos reales en el navegador contra `next dev` + emuladores con
datos sembrados (`npm run seed:emulator`).

Política aplicada (igual que fases anteriores): se corrige en este PR solo lo
**imprescindible y no invasivo** para poder testear de forma estable (los
`data-testid`/`aria-label` mínimos que la guía E2E ya autoriza). El resto se
documenta acá como mejora **no bloqueante**.

Severidades: **Alta** (rompe un flujo / a11y grave), **Media** (fricción real de
testing o UX), **Baja** (cosmético / DX).

> Guía y criterios de la fase en
> [docs/test/40-e2e-guide.md](../test/40-e2e-guide.md).

---

## E2E-01 (Baja) — ✅ RESUELTO — Botón "agregar al carrito" sin nombre accesible

**Archivos:**
- `src/features/store/modules/products/components/ProductCard.tsx`
- `src/features/store/components/cart/CartFloatingButton.tsx`

**Problema:** el botón de "añadir al carrito" de cada `ProductCard` era un
`<Button variant="ghost">` con solo un ícono y `title="Añadir al carrito"`, sin
nombre accesible estable ni forma de distinguir a qué producto pertenece. El
botón flotante del carrito tampoco exponía un rol/nombre estable. Esto bloqueaba
un selector E2E robusto y degrada la accesibilidad (lectores de pantalla).

**Por qué importa:** es el primer paso del **camino crítico de negocio**
(catálogo → carrito → checkout). Sin un selector estable, el test del flujo de
dinero queda atado a clases CSS frágiles.

**Corrección aplicada (este PR), mínima y no invasiva:**
- `ProductCard`: `data-testid="product-card"` + `data-product-name` en la card y
  `data-testid="add-to-cart"` + `aria-label="Añadir {nombre} al carrito"` en el botón.
- `CartFloatingButton`: `data-testid="cart-button"` + `aria-label="Ver carrito"`.

**Regresión:** cubierto por `e2e/02-catalog-checkout.spec.ts`.

---

## E2E-02 (Baja) — 📄 documentado — Precio del catálogo sin formato de miles

**Archivo:** `src/features/store/modules/products/components/ProductCard.tsx` (~L99)

**Problema:** la card del catálogo renderiza el precio como `${product.price}`
(p. ej. `$8500`), mientras que el carrito, el checkout y el ticket usan
`formatPrice()` (es-AR → `$ 8.500`). Inconsistencia de formato dentro del mismo
flujo de compra.

**Por qué importa:** UX/consistencia. El cliente ve `$8500` en el catálogo y
`$ 8.500` en el carrito para el mismo producto. No es bloqueante, pero confunde.

**Recomendación (no aplicada):** usar `formatPrice(product.price)` también en
`ProductCard` para unificar el formato monetario del catálogo público.

---

## E2E-03 (Media) — ✅ RESUELTO — Settings: varios "Guardar cambios" sin selector estable

**Archivos:**
- `src/features/dashboard/modules/store-settings/components/sections/BasicInfoSection.tsx`
- `.../sections/ContactInfoSection.tsx`
- `.../sections/SocialLinksSection.tsx`

**Problema:** la página de configuración general renderiza un botón
"Guardar cambios" por sección (Básica, Contacto, Redes) sin un nombre/testid que
los distinga. El spec de settings debe seleccionar por índice
(`getByRole('button', { name: /guardar cambios/i }).nth(1)`), lo que es frágil
si se agrega/quita una sección.

**Por qué importa:** acopla el test al orden de render. Un reordenamiento de
secciones rompería el spec silenciosamente (guardaría la sección equivocada).

**Corrección aplicada:** se agregó `data-testid="save-contact"` al botón de
guardado de la sección Contacto (el que usa el spec 04). **Completado (2026-06-24):**
se agregaron `data-testid="save-basic"` (`BasicInfoSection`) y `data-testid="save-social"`
(`SocialLinksSection`), eliminando la dependencia del índice de render para futuros specs.

---

## E2E-04 (Media) — ✅ RESUELTO — Wizard de onboarding sin anclas de testing

**Archivo:** `src/features/auth/components/OnboardingWizard.tsx`

**Problema:** el onboarding es un wizard animado de 10 pasos (`AnimatePresence`)
cuyo único CTA cambia de texto por paso ("Empezar ahora" / "Continuar" /
"Entendido, continuar" / "Crear mi tienda") y cuyos pasos solo se distinguen por
el `<h2>`. No hay `data-testid` de paso ni del CTA. El spec de
registro→onboarding→dashboard debe navegar por texto de heading + texto de
botón, lo que lo vuelve el flujo **más frágil** de la suite (sensible a cambios
de copy y a las animaciones).

**Por qué importa:** es un flujo crítico de activación. Cualquier ajuste de copy
en los pasos rompe el E2E sin que cambie el comportamiento.

**Corrección aplicada:** se agregó `data-testid="onboarding-next"` al CTA inferior
del wizard; el spec navega por ese testid en vez del texto del botón (las
aserciones de heading por paso se mantienen para verificar el estado).

---

## E2E-05 (Baja) — ✅ RESUELTO (parcial) — Formulario de producto: labels sin `htmlFor`/`id`

**Archivo:** `src/features/products/forms/product-form.tsx`

**Problema:** los campos del alta de producto usan `<label>` sin `htmlFor` e
`<input>` sin `id`, así que `getByLabel()` no funciona. El spec recurre a
`getByPlaceholder(/^Ej:/)` para el nombre, `getByPlaceholder('0.00').first()`
para el precio (hay dos inputs `0.00`: precio y costo) y `selectOption` por texto
para la categoría.

**Por qué importa:** accesibilidad (labels no asociadas) y fragilidad del
selector de precio (depende del orden). No bloqueante.

**Corrección aplicada (parcial):** se agregó `data-testid="product-price"` al input
de precio (el spec lo usaba por `placeholder('0.00').first()`, frágil al orden).
Pendiente (no bloqueante): asociar cada `label` con su input vía `htmlFor`/`id`
(mejora a11y y habilita `getByLabel` en todo el formulario).

---

## E2E-06 (Baja) — 📄 documentado — Checkout abre WhatsApp con `window.open` (popup)

**Archivo:** `src/features/store/components/checkout/CheckoutForm.tsx` (~L254, L276)

**Problema:** al confirmar el pedido, `CheckoutForm` abre una pestaña en blanco
de forma síncrona (`window.open("", "_blank")`) y luego le setea
`location.href = wa.me/...`. El ejemplo de la guía E2E asumía un `<a href=wa.me>`
directo en el submit. La aserción robusta del link `wa.me` se hace sobre el
**ticket de confirmación** (`OrderTicket`), que sí expone un `<a>` nativo
("Reenviar por WhatsApp"); el spec, además, bloquea la navegación real a `wa.me`
(`context.route(/wa\.me/, abort)`) para ser CI-offline-safe.

**Por qué importa:** el popup hacia un dominio externo complica el test y, en
navegadores con bloqueo de popups, podría no abrirse. No bloqueante (el pedido se
crea igual y el ticket ofrece el reenvío), pero conviene documentarlo.

**Recomendación (no aplicada):** evaluar mostrar el link `wa.me` como `<a>` en el
propio submit (además del popup) para no depender del bloqueador de popups; ya se
hace en `OrderTicket`. Se actualizó el ejemplo de `40-e2e-guide.md` para reflejar
el flujo real.

---

## E2E-07 (Media) — 📄 documentado — La cookie de sesión no se reutiliza vía `storageState`

**Archivos:**
- `src/features/auth/actions/auth.actions.ts` (`setSessionCookie`, `sameSite: 'strict'`)
- `src/lib/auth/server-session.ts`

**Problema:** se intentó loguear una vez en `global-setup` y reusar la sesión con
`storageState` en los specs autenticados. Pero el dashboard redirigía a `/sign-in`:
Chromium **no entrega** la cookie `session` (httpOnly, `SameSite=Strict`) en la
primera navegación `page.goto` de un contexto creado desde storageState. Relajar
el artefacto a `Lax` no alcanzó. El login **en vivo** (misma página, navegación
same-site) sí entrega la cookie.

**Por qué importa:** obliga a loguear por UI en cada spec autenticado (más lento)
en vez de reusar una sesión. No es un bug de la app, pero conviene tenerlo en
cuenta y, a futuro, evaluar si la sesión podría sembrarse server-side para tests.

**Decisión aplicada:** los specs 03/04/05 loguean por UI en `beforeEach`
(`loginAsOwner`). Se eliminó `global-setup.ts`.

---

## E2E-08 (Media) — ✅ RESUELTO — Reglas de contraseña distintas cliente vs servidor

> **Estado (2026-06-24):** corregido. Se extrajo `passwordSchema` como fuente única
> en `register.schema.ts` y `UserRegistrationStep.tsx` ahora lo reutiliza, de modo
> que cliente y servidor exigen lo mismo (≥8 + mayúscula + número). Se agregó además
> el texto de requisitos en el UI. Regresión: `register.schema.test.ts` → bloque
> "passwordSchema (contrato compartido cliente/servidor)".

**Archivos:**
- `src/features/auth/components/UserRegistrationStep.tsx` (schema cliente: `password.min(6)`)
- `src/features/auth/schemas/register.schema.ts` (`registerBaseSchema`: `min(8)` + mayúscula + número)

**Problema:** el formulario de registro acepta en el cliente una contraseña de 6
caracteres sin requisitos de complejidad, pero `registerAction` valida con
`registerServerSchema` (≥8, una mayúscula, un número). Una contraseña como
`123456` pasa la validación visible y **falla silenciosamente** en el servidor:
el registro no avanza y solo aparece un toast de error.

**Por qué importa:** UX confusa (el usuario cumplió lo que el form pedía y aun así
falla) y fue la causa de que el flujo E2E de registro fallara hasta usar una
contraseña fuerte.

**Recomendación (no aplicada):** unificar el schema de contraseña del
`UserRegistrationStep` con `registerBaseSchema` (mismo mínimo y reglas), idealmente
reutilizando el schema Zod en ambos lados.

---

## E2E-09 (Baja) — 📄 documentado — Settings: resets async reponen el form a "no-dirty"

**Archivos:**
- `src/features/dashboard/modules/store-settings/hooks/useProfile.ts` (`reset(formData)`)
- `.../sections/ContactInfoSection.tsx` (`disabled={isSectionSaving || !formState.isDirty}`)

**Problema:** la carga del perfil es async y dispara `reset(formData)`. Si se edita
un campo antes de que termine de cargar (o durante un re-fetch), el `reset` repone
los valores y `isDirty` vuelve a `false`, deshabilitando "Guardar cambios". El spec
E2E lo sortea esperando a que el input tenga el valor sembrado y reintentando
editar+guardar (`expect.toPass`).

**Por qué importa:** fricción real (un usuario que edita rápido podría ver el botón
deshabilitarse) y fragilidad de testing. No bloqueante.

**Recomendación (no aplicada):** evitar `reset` posteriores al primer load, o
preservar el estado dirty del usuario ante refrescos del perfil.

---

## E2E-10 (Baja) — ✅ RESUELTO (en el test) — El modal de bienvenida se solapa con el catálogo/carrito

**Archivo:** `src/features/store/components/WelcomeModal.tsx`

**Problema:** el `WelcomeModal` es un `Dialog` modal que aparece a los ~550 ms de
abrir el catálogo (una vez por navegador/tienda). Su overlay/contenido se solapa
con los controles del catálogo y del carrito; en el E2E de checkout interceptaba
el click en "Proceder al checkout" (obligaba a un `force: true`).

**Por qué importa:** es un comportamiento real (un visitante que abre el carrito
muy rápido puede toparse con el modal encima). En testing, generaba un workaround.

**Corrección aplicada (en el test):** el spec de checkout suprime el modal vía
`localStorage` (`ttw-welcome:{storeId}='1'`, el mismo flag de "ya visto" que usa
el componente), reproduciendo el caso de visitante recurrente. Se eliminó el
`force: true`. Mejora de producto pendiente (no bloqueante): marcar los elementos
decorativos del modal con `pointer-events-none` y revisar el z-index.

---

## Resumen

| Código | Severidad | Estado | Tema |
|--------|-----------|--------|------|
| E2E-01 | Baja | ✅ Resuelto | Nombre accesible/testid en carrito |
| E2E-02 | Baja | 📄 Documentado | Precio del catálogo sin `formatPrice` |
| E2E-03 | Media | ✅ Resuelto | Testid de guardado en settings (las 3 secciones) |
| E2E-04 | Media | ✅ Resuelto | Testid de navegación en onboarding |
| E2E-05 | Baja | ✅ Resuelto (parcial) | Testid de precio en form de producto |
| E2E-06 | Baja | 📄 Documentado | Checkout abre WhatsApp por popup |
| E2E-07 | Media | 📄 Documentado | Sesión no reutilizable vía storageState |
| E2E-08 | Media | ✅ Resuelto | Reglas de contraseña cliente ≠ servidor |
| E2E-09 | Baja | 📄 Documentado | Settings: reset async borra el dirty |
| E2E-10 | Baja | ✅ Resuelto (en test) | Modal de bienvenida se solapa con el carrito |

Ninguno es bloqueante para el merge de la Fase 4. Se corrigieron E2E-01/03/04/05/10
(testids/ajustes mínimos no invasivos, condición de robustez de la suite); el resto
queda como mejora priorizable. **E2E-08** (contraseña cliente≠servidor) es el más
valioso de los pendientes por impacto en UX real.
