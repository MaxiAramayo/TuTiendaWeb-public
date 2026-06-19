# Lanzamiento de Instagram + Mejoras Visuales — TuTiendaWeb

**Fecha:** 2026-06-18 · **Mercado:** Argentina · **Audiencia:** gastronomía + pymes/retail (mix) · **Voseo argentino**

> Documento de trabajo. Cruza el contexto real del producto (`docs/negocio/contexto-producto.md`), el `marketing-audit.md` (score 42/100, junio 2026) y la `guia-contenido-comercial.md` existente, y los traduce en un plan accionable para arrancar Instagram con buena base visual.

---

## 0. TL;DR — qué hacer primero

1. **No lances Instagram apuntando a una casa rota.** El audit detectó CTAs a 404 (`/precios`, `/demo`), trial "7 días sin tarjeta" no implementado, testimonios ficticios y email Gmail. Cada visita que IG mande hoy a la landing se pierde o pierde confianza. **Arreglar eso es prerrequisito del lanzamiento** (ver §2).
2. **Tu gancho ownable es el dinero, no la tecnología.** "PedidosYa se queda con el 30%. Nosotros, $15.000 fijos." Ese mensaje, aterrizado en pesos, es lo que más convierte y nadie lo puede copiar (ver §3).
3. **Definí una identidad visual de feed consistente** (3 plantillas, paleta fija, tipografía) antes del post 1. La consistencia visual es lo que entrena al algoritmo y al ojo del usuario en 2026.
4. **Reels primero.** Es el formato de mayor alcance; el cierre se hace por DM e Historias.
5. Arrancá con los **12 posts de lanzamiento** (calendario de 4 semanas en §6) reutilizando la guía existente + las piezas nuevas de §7.

---

## 1. Diagnóstico visual actual (app + landing)

Lo bueno: hay un **sistema de diseño definido** (violeta `#7C3AED`, sin gradientes, tinta plana, Plus Jakarta Sans, bordes redondeados, sombras suaves) y un hero con animaciones cuidadas (Framer Motion), badge de prueba gratis, tarjeta flotante "Nuevo pedido", mockups reales del celular. La base estética es sólida y coherente.

Lo que conviene mejorar, en orden de impacto:

| # | Problema visual | Por qué importa | Mejora concreta |
|---|-----------------|-----------------|-----------------|
| 1 | **Headline describe la herramienta, no el resultado** ("Digitalizá tu negocio") | El dueño no se identifica con "digitalizar" | "Tu negocio recibe pedidos por WhatsApp, 24/7, sin atender el teléfono" |
| 2 | **Cero prueba social visible** en el primer scroll | Sin caras/números reales no hay confianza | Trust strip bajo el CTA: "+50 negocios ya usan TuTiendaWeb" + 1 testimonio real con nombre y rubro |
| 3 | **Features en lenguaje de producto** ("Analytics y reportes", "Código QR") | No comunica beneficio | "Sabé qué producto te deja más plata" · "QR listo para imprimir, tus clientes ven el menú sin descargar nada" |
| 4 | **Sin demostración del producto en movimiento** | El "cómo se ve" vende solo | GIF/video corto del catálogo real y del pedido llegando al WhatsApp, reutilizable también en IG |
| 5 | **Catálogo público sin branding de TuTiendaWeb** ("Creado con…") | Cada catálogo compartido es publicidad gratis perdida | Footer "Creado con TuTiendaWeb — Creá tu tienda gratis" en cada `/carta/[url]` |
| 6 | **Comparación de ahorro no es visual** | El número en pesos es el argumento estrella | Bloque/calculadora visual: comisión delivery (–30%) vs. precio fijo ($15.000) |

> Nota sobre alcance del diseño: el **panel del dueño** tiene diseño fijo (sistema TuTiendaWeb). La **tienda pública** la personaliza cada comercio (logo, colores). Las mejoras visuales de marca aplican a landing, IG y materiales de marca — no a la tienda del cliente.

---

## 2. Antes de abrir la cuenta — checklist de credibilidad

Instagram amplifica lo que ya tenés; si la base no cierra, amplifica el problema. Resolvé esto **antes o en paralelo** al primer post:

- [ ] **Arreglar 404 de `/precios` y `/demo`** (o redirect 301 temporal a la home). Son CTAs primarios.
- [ ] **Activar el trial real de 7 días** o cambiar la promesa por lo que sí se puede cumplir hoy.
- [ ] **Eliminar/reemplazar testimonios ficticios** por 2-3 reales (aunque sean de la red del fundador, con nombre y rubro).
- [ ] **Email corporativo** (`hola@tutiendaweb.com.ar`) en footer y bio.
- [ ] **Bio de IG optimizada** (ver §4) con link a la landing (o Linktree con: probar gratis / ver demo / WhatsApp).
- [ ] **WhatsApp Business** configurado con respuesta rápida y catálogo, ya que el cierre va por ahí.
- [ ] **Foto de perfil = logo** sobre fondo blanco o violeta `#7C3AED`, legible en círculo chico.
- [ ] **3-6 Historias destacadas** listas: "Qué es", "Cómo funciona", "Precio", "Demo", "Casos", "Preguntas".
- [ ] **9 primeros posts** preparados antes de abrir (un perfil con grilla armada convierte más que uno vacío).

---

## 3. Posicionamiento y mensajes (la base de todo el contenido)

**Categoría a apropiarse:** "el sistema de pedidos por WhatsApp para gastronomía y pymes argentinas" (no "catálogo digital" genérico).

**Mensaje núcleo:** *Vendé por WhatsApp como siempre, pero ordenado y sin que nadie se quede con tu plata.*

Mensajes de apoyo + prueba:

| Mensaje | A qué dolor le pega | Prueba |
|---------|---------------------|--------|
| **Sin comisiones por venta** | La comisión de PedidosYa/Rappi (hasta 30%) | $200.000/mes en delivery apps = ~$60.000 que recuperás; con TuTiendaWeb pagás $15.000 fijos |
| **Cero fricción para tu cliente** | El cliente no quiere descargar apps | Entra por link/QR, sin app ni registro |
| **Pedidos ordenados, no caos** | Anotar en papel, errores, pedidos perdidos | Llega formateado al WhatsApp con datos, pago y entrega |
| **Simple de verdad** | "No soy técnico" | "Si sabés usar WhatsApp, sabés usar esto" · tienda lista en 15 min |

Diferenciador #1 para repetir siempre: **"PedidosYa se queda con el 30%. Nosotros, $15.000 fijos. Ese 30% es tuyo."**

---

## 4. Identidad visual para Instagram (lo que pediste: mejoras visuales)

El objetivo es una **grilla reconocible de un vistazo**. Definí esto y no lo cambies:

### Paleta (de la marca, fija)
- **Violeta primario `#7C3AED`** — color dominante de marca.
- **Azul `#2563eb`** — para destacar precios/números.
- **Verde WhatsApp `#25D366`** — SOLO para la acción (botón/flechita "pedí acá"). Nunca decorativo.
- **Neutros slate** (grises fríos) y blanco para respiro.
- **Sin gradientes. Tinta plana siempre.**

### Tipografía
- **Plus Jakarta Sans** para todo (Poppins solo como display puntual en piezas de marketing).
- Jerarquía clara: titular grande y grueso, bajada chica. Mucho espacio en blanco.

### Sistema de plantillas (creá 3 en Canva y reutilizá)
1. **Plantilla "Tip/Dato"** — fondo violeta o blanco, titular grande, 1 idea por placa. Para contenido educativo.
2. **Plantilla "Producto/Captura"** — mockup de celular con catálogo real o captura del panel, sobre fondo plano de marca. Para mostrar el producto.
3. **Plantilla "Comparación/Número"** — el número en pesos protagonista (ej: –30% vs $15.000), azul para la cifra. Para el argumento de ahorro.

### Reglas de feed
- **Fotos reales** de comida/comercios argentinos. Nada de stock genérico de oficina.
- Portadas de Reels con **mismo formato** (franja de color + título consistente) → entrena al algoritmo y al ojo.
- Patrón de grilla intencional (ej: alternar placa de marca / foto real / captura) para que el perfil se vea ordenado.
- **Intro de 3 segundos repetida** en los Reels (misma cortina visual) para crear serie reconocible.

### Bio sugerida
```
TuTiendaWeb 🛒
Pedidos por WhatsApp, sin comisiones 🇦🇷
Catálogo + QR para tu comercio o restaurante
Probá gratis 7 días 👇
[link: probar / demo / WhatsApp]
```

---

## 5. Análisis competitivo (Argentina, 2026)

| Factor | TuTiendaWeb | Tiendanube | MercadoShops | WhatsApp Business solo |
|--------|-------------|------------|--------------|------------------------|
| Precio entrada (ARS/mes) | **$15.000 fijo** | desde gratis; plan top ~$24.999 | Gratis | Gratis |
| Comisión por venta | **0%** | 0,7%–2% s/plan (+ Pago Nube) | 6%–17% | 0% (informal) |
| Pedidos por WhatsApp | ✅ Full, ordenado | ⚠️ Parcial | ❌ | ⚠️ Manual/caótico |
| QR de catálogo | ✅ | ⚠️ | ❌ | ❌ |
| Horarios abierto/cerrado | ✅ Único | ❌ | ❌ | ❌ |
| Extras con precio (gastronomía) | ✅ Único | ⚠️ | ❌ | ❌ |
| Sin app a descargar (cliente) | ✅ | ✅ | ✅ | ✅ |
| Dominio propio | ❌ | ✅ | ❌ | ❌ |
| App móvil nativa | ❌ (web ok) | ⚠️ | ✅ | ✅ |
| Marca / prueba social pública | Baja | Muy alta | Alta | — |

**Lectura para IG:** TuTiendaWeb gana en **costo real (0% comisión)**, **features gastronómicas** y **simplicidad WhatsApp-first**. Pierde en marca y prueba social — que es justamente lo que Instagram construye. La trinchera defendible y el ángulo de contenido: **nicho gastronómico argentino + ahorro vs. delivery apps**.

**Huecos de mercado que nadie comunica bien (úsalos como contenido):**
- "Alternativa a PedidosYa sin comisión" (búsqueda y dolor de altísima intención, sin dueño claro).
- "Menú digital con QR para restaurantes" (Tiendanube no lo posiciona).
- "Tu tienda no desaparece a las 24h" (vs. depender solo de Historias de IG).

---

## 6. Estrategia de contenido y calendario (primeras 4 semanas)

### Pilares (regla 80/20: valor/entretenimiento vs. venta directa)
1. **Educativo** — tips para vender más / trabajar menos (atrae y posiciona).
2. **Producto en acción** — Reels mostrando lo fácil que es (convierte).
3. **Prueba social** — capturas de pedidos reales, casos, testimonios (genera confianza).
4. **Venta directa** — oferta, prueba gratis, ahorro vs. comisiones (cierra).

### Formatos por objetivo (Instagram 2026)
- **Reels** = alcance y descubrimiento (formato prioritario; el alcance general cayó ~30% interanual, así que la calidad y los primeros 3 seg importan más que nunca).
- **Carruseles** = educación y guardado (excelente para tips y comparaciones).
- **Historias** = cercanía, encuestas, microdecisiones y empuje a DM.
- **DM** = donde se cierra la venta. Llevá siempre la conversación ahí.

### Cadencia inicial realista
3–4 publicaciones/semana en feed (mínimo 2 Reels) + Historias casi diarias (encuestas, behind the scenes, repost de clientes).

### Calendario semana a semana

| Semana | Pieza | Formato | Pilar | Notas / dependencia |
|--------|-------|---------|-------|---------------------|
| 1 | Presentación del perfil | Carrusel 3 | Producto | Abre el perfil. Requiere bio + destacadas listas |
| 1 | "Armá tu tienda en 2 min" | Reel | Producto | Screen recording real |
| 1 | "PedidosYa se queda con el 30%" | Carrusel/placa | Venta | Plantilla "Comparación/Número" |
| 1 | Encuesta en Historias: "¿Cuánto pagás de comisión?" | Historia | Educativo | Empuja a DM |
| 2 | "3 errores al vender por WhatsApp" | Carrusel | Educativo | Alto guardado |
| 2 | Pedido llegando ordenado al WhatsApp | Reel | Producto | Mostrar el mensaje formateado |
| 2 | Caso/testimonio real (rubro gastronómico) | Carrusel/foto | Prueba social | Requiere 1 cliente real |
| 3 | "Menú con QR en la mesa" (cafetería/resto) | Reel | Producto | Mostrar QR escaneándose |
| 3 | "Tu tienda no desaparece a las 24h" (vs. Historias) | Carrusel | Educativo | Para emprendedor de IG |
| 3 | Calculadora de ahorro (qué ahorrás según facturación) | Carrusel | Venta | Pone el número en pesos |
| 4 | Reel rubro retail (ropa/almacén) cargando productos | Reel | Producto | Mostrar carga masiva Excel |
| 4 | "7 días gratis, sin tarjeta" + CTA fuerte | Reel/placa | Venta | Requiere trial activo (ver §2) |

Dejá ~20% de los slots libres para contenido reactivo (responder dudas frecuentes, repostear clientes).

---

## 7. Ideas de posts listos para usar

> Reemplazá `[corchetes]` con datos reales. Los emojis son parte del copy.

### POST A — Carrusel "El número que no ves" (venta, ahorro)
**📸 Visual:** Plantilla "Comparación/Número". Slide 1: "¿Sabés cuánta plata te llevan las apps de delivery?" Slide 2: "Si facturás $200.000/mes… te quedás con $140.000" (–30% en rojo). Slide 3: "Con TuTiendaWeb pagás $15.000 fijos. El resto es tuyo." (cifra en azul `#2563eb`).
**✍️ Caption:**
> Hagamos la cuenta 🧮
> PedidosYa y Rappi te cobran hasta 30% por pedido.
> Si vendés $200.000 al mes, son ~$60.000 que no ves nunca.
> Con TuTiendaWeb pagás $15.000 fijos. Sin comisiones. Ese 30% vuelve a tu bolsillo. 💸
> Probá gratis 7 días 👉 link en bio.
**#️⃣** #gastronomiaargentina #pymesargentina #delivery #emprendedoresargentina #whatsappbusiness

### POST B — Reel "El pedido llega solo, ordenado" (producto)
**📹 Video (9:16, 20-30s):** pantalla partida — izquierda: cliente arma el pedido en el catálogo; derecha: el mensaje llega formateado al WhatsApp del dueño. Texto en pantalla: "Tu cliente arma el pedido…" → "…y te llega ordenado, con todo." Música alegre.
**✍️ Caption:**
> Se terminó anotar pedidos en papel 📝❌
> Tu cliente elige, suma los extras y te manda el pedido armado: productos, datos, pago y entrega. Todo ordenado en tu WhatsApp.
> Vos solo confirmás y preparás. ✅
> 👉 7 días gratis, link en bio.
**#️⃣** #catalogodigital #menudigital #whatsappbusiness #rotiseria #hamburgueseria

### POST C — Carrusel educativo "3 errores al vender por WhatsApp" (educativo, guardado)
**📸 Visual:** Plantilla "Tip/Dato", 1 error por slide + slide final de marca.
**✍️ Caption:**
> 3 cosas que te están haciendo perder ventas por WhatsApp 👇
> 1️⃣ Contestar "¿qué tenés?" 50 veces por día → poné un catálogo con fotos y precios.
> 2️⃣ Anotar pedidos a mano → que lleguen ordenados solos.
> 3️⃣ Vivir de las Historias que desaparecen → tené un link fijo que vende 24/7.
> Guardá este post 📌 y arreglá el #1 hoy.
**#️⃣** #tipsventas #emprendedores #pymesargentina #negociopropio

### POST D — Reel "Tu tienda en 2 minutos" (producto, demo)
**📹 Video (9:16, 30-40s):** screen recording armando una tienda de cero: crear cuenta → cargar 2 productos con foto → compartir el link. Texto por escena: "Mirá lo fácil 👇" / "Cargás producto, foto y precio" / "Compartís el link" / "Tu cliente ya puede pedir 🎉".
**✍️ Caption:**
> Tu tienda online lista en menos de lo que tardás en hacer un café ☕
> Sin saber nada de tecnología. Si usás WhatsApp, sabés usar esto.
> 👉 7 días gratis, sin tarjeta. Link en bio.
**#️⃣** #catalogodigital #menudigital #emprendedoresargentina #whatsappbusiness

### POST E — Carrusel "Para el que vende por Instagram" (educativo + venta, nicho retail)
**📸 Visual:** Plantilla "Tip/Dato". Slide 1: "Vendés por Instagram pero tus Historias desaparecen a las 24h 😪". Slide 2: "Tu catálogo en TuTiendaWeb queda fijo, con link en tu bio." Slide 3: "Tus clientes piden cuando quieran, vos no perdés ninguno."
**✍️ Caption:**
> Si vendés por Instagram esto es para vos 📲
> Las Historias se van a las 24h y con ellas las ventas que no llegaste a contestar.
> Armá un catálogo fijo, ponelo en tu bio y que te pidan a cualquier hora — directo a tu WhatsApp, sin comisiones.
> 👉 Probalo gratis, link en bio.
**#️⃣** #emprendedoraargentina #tiendaonline #ventaporinstagram #pymes #indumentaria

> La `guia-contenido-comercial.md` del repo ya tiene 12 posts de lanzamiento listos — combinalos con estos 5 para cubrir las 4 semanas sin repetir.

---

## 8. Métricas y seguimiento

**Objetivo del primer trimestre:** construir audiencia + generar inicios de prueba (no obsesionarse con ventas directas el mes 1).

| Métrica | Qué mide | Meta inicial (90 días) |
|---------|----------|------------------------|
| Seguidores | Construcción de audiencia | +500–1.000 |
| Alcance de Reels | Descubrimiento | Identificar 2-3 Reels "ganadores" para repetir formato |
| Guardados/compartidos | Valor del contenido educativo | Crece semana a semana |
| Clics al link de bio | Intención | Trackear con UTM o Linktree |
| Conversaciones por DM | Intención de compra | El indicador que más importa |
| Inicios de prueba desde IG | Conversión | UTM `?utm_source=instagram` en el link |

**Cadencia:** revisar números 1 vez por semana. Duplicar lo que funciona (formato, gancho, horario), cortar lo que no.

---

## 9. Próximos pasos inmediatos

1. **Resolver el checklist de credibilidad (§2)** — bloquea todo lo demás.
2. **Crear las 3 plantillas de Canva (§4)** y la foto de perfil + destacadas.
3. **Grabar 2 screen recordings** (armar tienda / pedido llegando) → base de los primeros Reels.
4. **Conseguir 1-2 casos reales** para los posts de prueba social.
5. **Cargar los 9 primeros posts** y recién ahí abrir/anunciar la cuenta.
6. (Recomendado) Activar el **loop viral**: "Creado con TuTiendaWeb" en cada catálogo público — es el canal de adquisición de mayor ROI y refuerza todo lo de IG.

---

### Fuentes
- Material interno del repo: `docs/marketing/marketing-audit.md`, `docs/negocio/contexto-producto.md`, `docs/marketing/guia-contenido-comercial.md`.
- [Planes y costos de Tiendanube Argentina 2026](https://mktmarketingdigital.com/planes-costos-tienda-nube-argentina-2026/) · [Comisiones Pago Nube](https://ayuda.tiendanube.com/es_ES/pago-nube/cuales-son-las-comisiones-de-pago-nube)
- [Cómo funciona el algoritmo de Instagram en 2026](https://www.optimaweb.es/como-funciona-algoritmo-instagram/) · [Redes sociales 2026: estrategia según datos (IEBS)](https://www.iebschool.com/hub/redes-sociales-2026-estrategia-datos/)
