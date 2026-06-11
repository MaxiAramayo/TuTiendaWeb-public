# Landing Page TuTiendaWeb — Guía Completa de Reescritura
**Objetivo:** convertir visitantes en trials. Estructura, copy listo para usar, estilo visual y lógica de captación.
**Fecha:** 2026-06-10

---

## Parte 0 — Cómo captar al cliente (la estrategia detrás del copy)

Antes del copy, entendé a quién le hablás y con qué gatillo. Todo en esta landing está construido sobre 3 principios:

### 1. Hablale al dolor, no a la feature
Tu cliente (dueño de hamburguesería, rotisería, heladería, almacén, emprendedor que vende por Instagram) **no busca "digitalizar su negocio"**. Busca resolver dolores concretos:
- "Pierdo pedidos porque no doy abasto contestando WhatsApp."
- "PedidosYa me come el 30% y no me queda nada."
- "Anoto los pedidos en papel y se me mezclan."
- "No sé qué producto me deja más plata."

El copy gana cuando nombra **el dolor** en las primeras palabras y posiciona el producto como el alivio.

### 2. El gancho económico es tu arma #1
En contexto inflacionario, "sin comisiones" no es una feature técnica: **es plata en el bolsillo**. Aterrizalo siempre en pesos concretos:
> "PedidosYa te cobra hasta 30%. Con TuTiendaWeb pagás $15.000 fijos y ese 30% es tuyo."

Este mensaje ningún competidor lo puede copiar igual. Es el centro de gravedad de toda la landing.

### 3. Eliminá el miedo antes de pedir la acción
El comerciante argentino desconfía del software ("¿me van a cobrar sin avisar?", "¿es difícil?", "¿y si no funciona?"). Cada CTA tiene que ir rodeado de des-riesgo visible: **sin tarjeta · sin contrato · 7 días gratis · garantía 30 días · si sabés usar WhatsApp, sabés usar esto.**

### El recorrido mental ideal del visitante
```
"Esto es para mí"  →  "Entiendo qué hace en 5 seg"  →  "Ahorro plata real"
   (Hero)              (Cómo funciona)                   (Calculadora/Sin comisión)
        →  "Otros como yo lo usan"  →  "No tengo nada que perder"  →  EMPIEZO
              (Testimonios reales)        (Garantías + FAQ)            (CTA)
```

---

## Parte 1 — Dirección de estilo visual

> Objetivo de estilo: que se sienta **una tienda viva, cálida y apetecible** (no un SaaS frío y corporativo), pero con la prolijidad que da confianza para pagar una suscripción. Mezcla de "mercado de barrio moderno" + "app confiable".

### Concepto: "Mercado Cálido"
Inspiración visual: cartelería de food trucks modernos, packaging de marcas gastronómicas jóvenes, apps de delivery pero más humanas. Colores cálidos que dan hambre y energía, mucho aire, fotos reales de productos y comercios, y el verde de WhatsApp reservado **solo** para los botones de acción (para que el ojo siempre sepa dónde tocar).

### Paleta de color (hex listos para el dev / Tailwind config)

| Rol | Color | Hex | Uso |
|-----|-------|-----|-----|
| **Primario (marca)** | Tomate / Coral | `#E8552D` | Titulares destacados, badges, acentos, íconos |
| **Primario oscuro** | Ladrillo | `#B23E1E` | Hover de botones primarios, texto sobre claro |
| **Acción (CTA)** | Verde WhatsApp | `#25D366` | SOLO botones de acción principal ("Empezá gratis", "Pedir por WhatsApp") |
| **Acción hover** | Verde oscuro | `#1EBE57` | Hover de los CTA |
| **Acento cálido** | Mostaza / Miel | `#F2A41C` | Destacar números, estrellas de rating, etiquetas "más elegido" |
| **Fondo base** | Crema | `#FFF8F0` | Fondo general de la página (no blanco puro: más cálido) |
| **Superficie** | Blanco | `#FFFFFF` | Tarjetas, cards de features, testimonios |
| **Texto principal** | Carbón | `#1A1714` | Títulos y cuerpo (no negro puro) |
| **Texto secundario** | Gris cálido | `#6B6259` | Subtítulos, descripciones |
| **Borde sutil** | Arena | `#EDE3D6` | Bordes de tarjetas, divisores |

> Regla de oro de color: **el verde solo se usa para "esto es lo que tenés que tocar"**. Si el verde aparece en todos lados, pierde poder. El coral es la personalidad de la marca; el verde es el botón.

### Tipografía
- **Títulos:** una sans con personalidad y peso — `Poppins`, `Sora` o `Clash Display` (semibold/bold). Da el tono "marca joven y confiable".
- **Cuerpo:** `Inter` o `DM Sans` (regular/medium). Legibilidad total en mobile.
- **Jerarquía:** títulos grandes y con aire (mobile H1 ~32-40px, desktop ~56-64px). Nada apretado.

### Componentes y "look & feel"
- **Bordes redondeados generosos** (`border-radius` 16-24px en cards y botones) → sensación amigable, no corporativa.
- **Sombras suaves y cálidas** (no grises duras): `box-shadow: 0 8px 24px rgba(232,85,45,0.10)`.
- **Botones grandes, gordos, con verde sólido** y texto en blanco, peso semibold. Ícono de WhatsApp en los CTA de acción.
- **Fotos reales** de comida/productos y de comercios argentinos. Nada de stock genérico de oficinas. Si no hay fotos propias todavía, usar mockups del catálogo real del producto en un celular.
- **Mockup del producto en un celular** en el hero (el catálogo real abierto en un teléfono) → muestra el producto en uso al instante.
- **Microinteracciones:** botones que crecen levemente al hover, badges que aparecen con fade, contador animado en los números ("+50 negocios").
- **Emojis con moderación** en títulos de sección o bullets (🍔 🛵 📲) — refuerzan el tono "tienda" cálido sin saturar.

### Mobile-first (NO negociable)
El 80%+ de tu tráfico va a ser desde el celular (vienen de Instagram/WhatsApp). Diseñá primero para mobile: botón CTA fijo abajo (sticky) siempre visible, secciones apiladas, fotos a ancho completo, texto grande.

---

## Parte 2 — Estructura sección por sección (con copy listo para usar)

> Cada bloque incluye: qué va, el copy exacto, y la nota de diseño. El copy está en voseo argentino, listo para pegar.

---

### 🟧 Sección 1 — HERO (lo primero que ven)

**Copy:**

> **Título (H1):**
> Tu negocio recibe pedidos por WhatsApp, sin atender el teléfono todo el día
>
> **Subtítulo:**
> Armá tu catálogo digital en 15 minutos, compartilo con un link o QR, y recibí los pedidos ordenados y listos para preparar. Sin comisiones. Sin contrato. Sin complicaciones.
>
> **Botón primario (verde):** 🟢 Empezá gratis — 7 días sin tarjeta
> **Botón secundario (borde coral):** Ver demo en vivo →
>
> **Línea de confianza (debajo de los botones, chiquita):**
> ⭐ Sin tarjeta de crédito · Sin contrato · Garantía de 30 días

**Diseño:** fondo crema, título grande en carbón con la palabra "WhatsApp" en coral. A la derecha (o abajo en mobile), un celular mostrando el catálogo real con productos y precios. Trust strip de íconos abajo.

---

### 🟩 Sección 2 — TRUST STRIP (barra de confianza)

Apenas debajo del hero, una franja delgada que da prueba social inmediata.

**Copy:**
> Más de [50] negocios en Argentina ya venden con TuTiendaWeb   ·   ⭐ 4.8/5   ·   +[2.500] pedidos procesados este mes

**Diseño:** franja de ancho completo, fondo blanco, números en mostaza/coral con peso bold. (Usar números reales aunque sean modestos. Si todavía no tenés volumen, poné solo "Hecho en Argentina para comercios argentinos" hasta tener datos.)

---

### 🟧 Sección 3 — EL PROBLEMA (que se identifiquen)

Antes de la solución, nombrá el dolor para que el visitante diga "ese soy yo".

**Copy:**
> **¿Te pasa esto?**
>
> 😵 Contestás "¿qué tenés para hoy?" 40 veces por día por WhatsApp.
> 🧾 Anotás los pedidos en papel y a veces se te mezclan o se pierden.
> 💸 Vendés por PedidosYa o Rappi y te llevan hasta el 30% de comisión.
> 📷 Tenés todo en historias de Instagram que desaparecen a las 24 horas.
>
> **Hay una forma más simple de venderle a tus clientes.**

**Diseño:** 4 tarjetas con ícono/emoji grande, fondo blanco, en grilla 2x2 (mobile: apiladas). Cierre en coral grande que da paso a la solución.

---

### 🟩 Sección 4 — CÓMO FUNCIONA (3-4 pasos)

**Copy:**
> **Tu tienda online lista en 4 pasos**
>
> **1. Armá tu catálogo** 📲
> Cargá tus productos con foto, descripción y precio. Tan fácil como subir una historia.
>
> **2. Compartí tu link o QR** 🔗
> Ponelo en tu bio de Instagram, en tu estado de WhatsApp o imprimí el QR para la mesa o el mostrador.
>
> **3. Tu cliente pide solo** 🛒
> Mira el catálogo, elige y arma el pedido. Sin descargar apps, sin registrarse.
>
> **4. Te llega listo por WhatsApp** ✅
> El pedido te llega ordenado y completo. Vos solo confirmás y preparás.

**Diseño:** línea de tiempo horizontal con números grandes en círculos coral, conectados por una línea punteada. En mobile, vertical. Cada paso con un mini-screenshot del producto real.

---

### 🟧 Sección 5 — EL GANCHO ECONÓMICO + CALCULADORA (la estrella)

Esta es la sección de mayor conversión. El argumento de ahorro vs. delivery apps.

**Copy:**
> **Dejá de regalarle tu ganancia a las apps de delivery**
>
> PedidosYa y Rappi te cobran hasta **30% de comisión** por cada pedido. Con TuTiendaWeb pagás **$15.000 fijos por mes** — vendas lo que vendas. Ese 30% vuelve a tu bolsillo.
>
> **[ Calculadora interactiva ]**
> ¿Cuánto vendés por mes?  → [ slider o input ]
> *Con delivery apps pagarías:* **$XX.XXX en comisiones**
> *Con TuTiendaWeb pagás:* **$15.000 fijos**
> 💰 **Ahorrás $XX.XXX por mes**
>
> **Botón (verde):** 🟢 Quiero ahorrar — Empezá gratis

**Diseño:** fondo coral suave o mostaza para que destaque del resto. Calculadora con un slider grande de "facturación mensual" y el resultado del ahorro en números enormes en verde. Es la pieza más interactiva y la que más comparte la gente.

---

### 🟩 Sección 6 — FEATURES COMO RESULTADOS (no como specs)

Traducí cada feature a un beneficio de negocio.

**Copy:**
> **Todo lo que necesitás para vender más y trabajar menos**
>
> 🍔 **Catálogo que da hambre**
> Tus productos con fotos grandes, descripciones y precios siempre actualizados. Tu catálogo parece tuyo, no genérico.
>
> 📲 **Pedidos directo a tu WhatsApp**
> El pedido llega armado y completo. Se acabó el "¿me repetís qué era?".
>
> 🏷️ **QR para tu mesa o mostrador**
> Listo para imprimir. Tus clientes escanean y ven el menú sin descargar nada.
>
> 📊 **Sabé qué te deja más plata**
> Reportes de tus productos más vendidos y tus mejores días. Tomá decisiones con datos, no a ojo.
>
> 🕐 **Abierto y cerrado automático**
> Cuando cerrás el local, tu tienda lo sabe. No tenés que acordarte de nada.
>
> 🎨 **Con la identidad de tu negocio**
> Tus colores, tu logo, tu estilo. No parece una plantilla: parece tu marca.

**Diseño:** grilla de 6 tarjetas blancas con ícono coral grande arriba, título en carbón, descripción en gris. Hover con sombra cálida.

---

### 🟧 Sección 7 — PRUEBA SOCIAL (testimonios REALES)

> ⚠️ CRÍTICO: usá testimonios reales con nombre y rubro. Eliminá los ficticios que hay hoy en el código. Conseguí 3 de tus primeros clientes por WhatsApp esta semana.

**Copy (formato — reemplazar con reales):**
> **Negocios reales, resultados reales**
>
> *"Antes anotaba los pedidos en papel y se me perdían. Ahora me llegan ordenados al WhatsApp y no pierdo ninguno. En el primer mes vendí 30% más."*
> — **Laura M.**, Heladería Dulce Momento, Córdoba
>
> *"Me cansé de pagarle la comisión a las apps. Con esto me quedo con todo y mis clientes piden igual de fácil."*
> — **Diego R.**, Hamburguesería El Garage, Buenos Aires
>
> *"Lo configuré en una tarde sin saber nada de tecnología. Si sabés usar WhatsApp, lo armás."*
> — **Sofía P.**, Pastelería Casera, Rosario

**Diseño:** tarjetas con foto real del dueño o de su local, nombre, rubro y ciudad. Estrellas en mostaza. Si conseguís video-testimonios, mejor todavía (un video de 30 seg del dueño hablando convierte muchísimo).

---

### 🟩 Sección 8 — POSICIONAMIENTO vs. ALTERNATIVAS

Respondé la pregunta silenciosa: "¿por qué esto y no Instagram / Tiendanube / PedidosYa?"

**Copy:**
> **¿Por qué TuTiendaWeb y no otra cosa?**
>
> | | Instagram | PedidosYa | Tiendanube | **TuTiendaWeb** |
> |---|---|---|---|---|
> | Pedidos ordenados a tu WhatsApp | ❌ | ⚠️ | ⚠️ | ✅ |
> | Sin comisión por venta | ✅ | ❌ (hasta 30%) | ⚠️ | ✅ |
> | Tus clientes no descargan nada | ✅ | ❌ | ✅ | ✅ |
> | Pensado para gastronomía argentina | ❌ | ⚠️ | ❌ | ✅ |
> | Precio fijo y barato | ✅ | ❌ | ❌ | ✅ ($15.000) |
>
> **TuTiendaWeb es para negocios que atienden por WhatsApp, como hace el 80% de los comercios argentinos.** Sin carrito complicado, sin logística, sin comisiones. Solo tu catálogo y tus clientes hablándote directo.

**Diseño:** tabla comparativa con tu columna destacada en coral. Checks verdes, cruces rojas.

---

### 🟧 Sección 9 — PRECIO (claro y sin sorpresas)

**Copy:**
> **Un precio. Todo incluido. Sin sorpresas.**
>
> **Plan Completo — $15.000/mes**
> ✅ Catálogo digital ilimitado
> ✅ Pedidos por WhatsApp
> ✅ QR para imprimir
> ✅ Reportes de ventas
> ✅ Cobros con MercadoPago
> ✅ Soporte por WhatsApp
> ✅ Sin contrato — cancelás cuando quieras
>
> 💡 *Comparalo: un empleado para tomar pedidos te cuesta ~$120.000/mes. TuTiendaWeb, $15.000.*
>
> **Botón (verde):** 🟢 Empezá gratis 7 días — sin tarjeta
> ⭐ Garantía de 30 días: si no te sirve, te devolvemos la plata.

**Diseño:** una sola tarjeta grande y centrada, borde coral, fondo blanco. El precio enorme. Lista de checks en verde. CTA gordo. La garantía como sello/badge.

---

### 🟩 Sección 10 — FAQ (matá las objeciones)

**Copy:**
> **Preguntas frecuentes**
>
> **¿Necesito saber de tecnología?**
> No. Si sabés usar WhatsApp, sabés usar TuTiendaWeb. Está hecho para dueños de negocio, no para técnicos.
>
> **¿Cuánto tarda en estar listo?**
> 15 a 30 minutos para tener tu catálogo activo y compartible.
>
> **¿Y si no tengo local físico?**
> Perfecto para vos. Muchos clientes venden solo por WhatsApp desde su casa.
>
> **¿Puedo cancelar cuando quiera?**
> Sí. Sin contrato, sin permanencia, sin multas. Y tenés 30 días de garantía de devolución.
>
> **¿Aceptan MercadoPago?**
> Sí, podés cobrarles a tus clientes con MercadoPago directo desde tu catálogo.
>
> **¿Qué pasa cuando termina la prueba gratis?**
> Te avisamos antes. Si te gustó, elegís seguir. Si no, no se te cobra nada.

**Diseño:** acordeón (cada pregunta se despliega al tocar). Fondo crema, preguntas en carbón semibold.

---

### 🟧 Sección 11 — CTA FINAL (cierre fuerte)

**Copy:**
> **Empezá hoy. En 15 minutos tu tienda está lista.**
> Sin tarjeta. Sin contrato. Con 7 días gratis y garantía de 30 días.
>
> **Botón (verde grande):** 🟢 Crear mi tienda gratis
> **Link secundario:** ¿Dudas? Escribinos por WhatsApp →

**Diseño:** banda de ancho completo en coral, texto blanco, botón verde enorme centrado. Cierre emocional + des-riesgo.

---

### Footer
- Logo + "Hecho en Argentina 🇦🇷 para comercios argentinos"
- Links: Cómo funciona · Precios · Preguntas frecuentes · Términos · Sobre nosotros
- **Email corporativo:** hola@tutiendaweb.com.ar *(cambiar el Gmail actual)*
- Redes reales: Instagram · Facebook *(verificá que los links funcionen)*
- WhatsApp de contacto

---

## Parte 3 — Checklist de implementación (orden de prioridad)

**Esta semana (lo que más convierte):**
1. [ ] Hero nuevo con título orientado a resultado + mockup del celular
2. [ ] Eliminar/reemplazar testimonios ficticios por reales
3. [ ] Email corporativo y links de redes reales
4. [ ] Trust strip con números reales
5. [ ] Sección de precio clara con FAQ

**Próximas 2 semanas:**
6. [ ] Calculadora de ahorro vs. delivery apps (la estrella)
7. [ ] Sección "el problema" + tabla comparativa
8. [ ] Features traducidas a resultados
9. [ ] Aplicar paleta "Mercado Cálido" completa
10. [ ] CTA sticky en mobile

**Mes 1:**
11. [ ] Video-testimonios reales
12. [ ] Demo navegable (catálogo de ejemplo)
13. [ ] Branding "Creado con TuTiendaWeb" en catálogos públicos (loop viral)

---

## Resumen de la lógica de captación

| Sección | Qué logra | Emoción |
|---------|-----------|---------|
| Hero | "Esto es para mí" | Reconocimiento |
| El problema | "Ese soy yo" | Identificación |
| Cómo funciona | "Es fácil" | Alivio |
| Calculadora | "Ahorro plata real" | Deseo / urgencia |
| Features | "Resuelve todo" | Confianza |
| Testimonios | "Otros como yo confían" | Validación social |
| vs. Alternativas | "Es mejor que lo que uso" | Decisión |
| Precio + FAQ | "No tengo nada que perder" | Seguridad |
| CTA final | "Empiezo ahora" | Acción |

*Generado por AI Marketing Suite — `/market copy` + `/market landing`*
