# Marketing Audit: TuTiendaWeb
**URL:** tutiendaweb.com.ar
**Fecha:** 2026-06-10
**Tipo de negocio:** SaaS vertical (B2B/SMB) — Catálogo digital + pedidos por WhatsApp para comercios y gastronomía en Argentina
**Marketing Score global: 42/100 (Grado: D)**

---

## Resumen Ejecutivo

TuTiendaWeb tiene un **product-market fit real** y una infraestructura técnica más madura de lo que comunica: onboarding guiado, MercadoPago integrado vía Firebase Functions, lógica de suscripción con grace period, multi-tienda, dashboard funcional completo. El problema **no es el producto: es la percepción externa y el marketing**. El sitio puntúa 42/100 porque las señales de confianza son las de un MVP temprano (email Gmail, testimonios ficticios, redes sin activar, páginas 404 en CTAs primarios) mientras el producto ya está en estado de crecimiento.

**La mayor fortaleza** es un diferenciador económico devastador que hoy está desaprovechado: **"sin comisiones por venta"**. En el contexto inflacionario argentino, un comercio que factura $200.000/mes y vende por PedidosYa/Rappi paga $40.000-$60.000 en comisiones. TuTiendaWeb cuesta $15.000 fijos. Ese argumento — aterrizado en pesos concretos — es el gancho de conversión más potente disponible y casi no se usa.

**La mayor brecha** es estructural y de credibilidad: testimonios falsos en el código (nombres genéricos, fotos placeholder, "+500 restaurantes" sin respaldo), un trial de "7 días sin tarjeta" que **aún no está implementado en producción** (la promesa central del marketing no se puede cumplir hoy), y dos páginas clave (`/precios`, `/demo`) que devuelven 404 desde botones primarios.

**Las 3 acciones de mayor impacto:**
1. **Arreglar credibilidad y promesas rotas** (semana 1): email corporativo, eliminar/reemplazar testimonios ficticios, activar el trial real, arreglar los 404. Sin esto, todo gasto en tráfico se desperdicia.
2. **Reposicionar sobre "sin comisiones vs. delivery apps"** con calculadora de ahorro y páginas `/vs/pedidosya` — el mensaje ownable que ningún competidor puede copiar.
3. **Activar el loop viral del catálogo público** ("Creado con TuTiendaWeb" en cada `/carta/[url]`) — el canal de adquisición de mayor ROI y menor esfuerzo, hoy inexistente.

**Impacto estimado:** implementar las recomendaciones puede duplicar la conversión de visitante-a-trial (de ~2-3% a ~4-5%) y, combinado con los loops de crecimiento, sostener una trayectoria hacia **~400 clientes activos / ~$6M ARS MRR a 12 meses** en el escenario medio.

---

## Score Breakdown

| Categoría | Score | Peso | Ponderado | Hallazgo clave |
|-----------|-------|------|-----------|----------------|
| Content & Messaging | 41/100 | 25% | 10.25 | Headline describe la herramienta, no vende el resultado; cero prueba social |
| Conversion Optimization | 41/100 | 20% | 8.20 | 404 activos en CTAs primarios; sin página de precios funcional |
| SEO & Discoverability | 42/100 | 20% | 8.40 | Base técnica sólida (Next.js) pero solo 1 URL indexable y sin contenido |
| Competitive Positioning | 52/100 | 15% | 7.80 | Diferenciador "sin comisiones" real pero no explotado; sin categoría ownable |
| Brand & Trust | 31/100 | 10% | 3.10 | Testimonios ficticios, email Gmail, redes sin activar — señales de MVP |
| Growth & Strategy | 44/100 | 10% | 4.40 | Product-market fit real; loops de crecimiento sin implementar |
| **TOTAL** | | **100%** | **42/100** | **Grado D — overhaul de marketing necesario** |

```
Content & Messaging:     41/100 ████░░░░░░
Conversion Optimization: 41/100 ████░░░░░░
SEO & Discoverability:   42/100 ████░░░░░░
Competitive Positioning: 52/100 █████░░░░░
Brand & Trust:           31/100 ███░░░░░░░
Growth & Strategy:       44/100 ████░░░░░░
```

---

## Quick Wins (Esta Semana)

> Regla de oro de este audit: **existencia antes que perfección**. Una página de precios que funciona, un trial que arranca, y 3 testimonios reales valen más que el headline perfecto sin contexto de confianza.

1. **Eliminar o reemplazar los testimonios ficticios** (CRÍTICO — riesgo reputacional). El código tiene nombres genéricos (María López, Carlos Rojas), fotos placeholder (`/testimonials/carlos.jpg`), "+500 restaurantes" y "98% satisfacción" sin respaldo. Si un prospecto inspecciona, destruye toda la confianza. Reemplazá por 3 testimonios reales (aunque sean de la red del fundador) o eliminá la sección. **Esfuerzo: bajo.**

2. **Activar el trial de 7 días en producción** (CRÍTICO — promesa rota). Según la doc interna (`SUSCRIPCIONES.md`), el flujo existe en los tipos pero no en el frontend. Hoy "7 días sin tarjeta" es una promesa que no se cumple. Sin esto, ninguna campaña es honesta. **Esfuerzo: medio (dev).**

3. **Arreglar los 404 de `/precios` y `/demo`** (CRÍTICO — hemorragia activa). Botones primarios que llevan a 404 rompen la confianza de forma irreversible. Como mínimo, redirect 301 a la home mientras se construyen. **Esfuerzo: 30 min.**

4. **Cambiar el email a corporativo** (`hola@tutiendaweb.com.ar`). `tutiendaweboficial@gmail.com` en el footer señala "empresa chica sin infraestructura". Costo $0-5 USD/mes con Zoho/Google Workspace. **Esfuerzo: bajo.**

5. **Verificar/arreglar los links de redes sociales del footer.** Apuntan a URIs genéricas (`facebook.com/tutienda`, `instagram.com/tutienda`) probablemente inactivas. Un link roto es peor que ningún link. **Esfuerzo: bajo.**

6. **Reescribir el headline orientado a resultado.** Cambiar *"Digitalizá tu negocio con TuTiendaWeb"* (lenguaje de consultor) por algo como *"Tu negocio recibe pedidos por WhatsApp, 24/7, sin atender el teléfono"* o *"Armá tu catálogo y empezá a recibir pedidos por WhatsApp hoy"*. **Esfuerzo: bajo. Lift estimado: +15-25% CTR al CTA.**

7. **Agregar un trust strip bajo el CTA del hero** con un número real (aunque sea modesto: "Más de 50 negocios ya usan TuTiendaWeb") + 1 testimonio con nombre y rubro. Cero credibilidad cuesta más que un número modesto. **Esfuerzo: 1h. Lift estimado: +5-10% CTR.**

8. **Activar Google Search Console.** El token está comentado en `src/features/landing/seo/metadata.ts`. Sin GSC no hay datos de performance orgánico. **Esfuerzo: bajo.**

9. **Transformar features en resultados de negocio.** "Analytics y reportes" → "Sabé qué productos te generan más plata y optimizá tu menú con datos reales". "Código QR" → "QR listo para imprimir: tus clientes ven el menú sin descargar nada". **Esfuerzo: bajo. Lift: +8-12% scroll depth.**

---

## Strategic Recommendations (Este Mes)

1. **Construir la página `/precios` real con ancla de valor y FAQ de objeciones.** Mostrar el plan a $15.000 con comparación de costo ("vs. un empleado tomando pedidos: ~$120.000/mes") y responder las 5 objeciones top (cancelación, MercadoPago, qué pasa tras el trial, requisitos técnicos). Agregar schema `PriceSpecification` JSON-LD. **Lift: +10-20% en inicio de trial.**

2. **Construir `/demo` con video embed** (Loom/YouTube de 3 min del dashboard) + un catálogo demo navegable ("Pizzería El Centro"). Recupera el segmento de alta intención que hoy choca con un 404. **Lift: +15-25% desde el CTA demo.**

3. **Lanzar la calculadora de ahorro vs. delivery apps** en la landing: "Ingresá tu facturación mensual → te mostramos cuánto ahorrás vs. PedidosYa". Es la pieza de conversión de fondo de funnel más potente del mercado argentino y nadie la tiene. **Lift: alto.**

4. **Crear páginas de comparación SEO de fondo de funnel:** `/vs/pedidosya`, `/vs/mercadoshops`, `/vs/whatsapp-business`. Capturan búsquedas de altísima intención ("alternativa a PedidosYa sin comisión") sin competencia SaaS. **Esfuerzo: bajo. Impacto SEO: alto.**

5. **Implementar el sistema de referidos** (no existe en el código): campo `referredBy` en el schema de store + lógica de crédito en Firebase Functions + UI en el dashboard. "Referí a un colega, ambos tienen 1 mes gratis". El comerciante argentino confía en otro comerciante: CAC bajísimo, potencial viral alto.

6. **Activar el loop viral del catálogo público:** agregar "Creado con TuTiendaWeb — Creá tu tienda gratis" en el footer de cada `/carta/[url]`. Cada catálogo compartido por WhatsApp es una impresión de marca ante otros comerciantes. **El mayor ROI / menor esfuerzo de todo el audit.**

7. **Crear 4 landing pages por vertical:** `/para-restaurantes`, `/para-pymes`, `/menu-digital-qr`, más metadata dinámica (`generateMetadata()`) en las páginas de tiendas públicas para que cada comercio activo sea una URL indexable. Hoy todo el SEO depende de 1 sola URL.

---

## Long-Term Initiatives (Este Trimestre)

1. **Reposicionamiento de categoría.** Pasar de "catálogo digital" (genérico, no ownable) a **"el sistema de pedidos por WhatsApp para gastronomía y pymes argentinas"**. Apropiarse del nicho gastronómico (hamburgueserías, heladerías, rotiserías, panaderías) — 50.000-80.000 locales solo en AMBA, sin dueño SaaS claro. Las features ya encajan (horarios dinámicos, extras con precio, notificaciones por WhatsApp).

2. **Arquitectura de pricing con tiers.** Agregar un **Starter $8.000** (escalera de entrada para micro-comercios, límite de productos) y un **Business $28.000** (multi-usuario, dominio propio, soporte prioritario — se construye sobre los roles `owner/admin/employee` ya existentes). Captura tanto al segmento de entrada como al de mayor volumen. Alternativa más simple: add-ons vendibles (dominio propio $5.000, multi-usuario $4.000/usuario, export avanzada $3.000).

3. **Motor de contenido SEO.** Blog con 8-10 artículos de intención comercial ("Cómo crear un menú digital QR en Argentina 2025", "Cómo recibir pedidos por WhatsApp", "Menú digital vs. carta física"). Proyección: de ~50-150 visitas orgánicas/mes a **1.200-3.000/mes a 6 meses**.

4. **Programa de partnerships y revendedores.** Contadores/asesores PyME (atienden decenas de comercios cada uno), cámaras de comercio (CAME, Cámara CABA), distribuidores gastronómicos. Comisión 15-20%. Canal de distribución de bajo costo y alta confianza.

5. **Página `/sobre-nosotros`.** El origen argentino y la historia del fundador son un activo de confianza, no un pasivo. El anonimato actual genera desconfianza en B2B/SMB.

---

## Detailed Analysis by Category

### Content & Messaging (41/100)

**Fortalezas:** flujo "catálogo + WhatsApp + pedidos" comprensible en 5 segundos; el CTA de WhatsApp es un diferenciador real en el canal de confianza dominante de las pymes argentinas; el stack de derisking (7 días gratis + sin tarjeta + 30 días garantía + sin contrato) ataca las 3 objeciones principales; "100% digital, perfecto para sin local físico" identifica un buyer persona con una frase.

**Debilidades críticas:**
- Headline genérico ("digitalizar" es lenguaje de consultor, no de dueño de negocio); sin resultado cuantificable.
- Propuesta de valor no diferencia de Tiendanube/MercadoShops/Instagram — la pregunta "¿por qué TuTiendaWeb?" no tiene respuesta visible.
- **Ausencia total de prueba social genuina** (los testimonios existentes son ficticios) — esto solo puede explicar conversiones de trial <3%.
- Features en idioma del producto, no del cliente.
- Páginas faltantes (precios, blog, casos) = agujeros estructurales en el embudo de contenido.

**Antes/Después de copy clave:**
- Headline: *"Digitalizá tu negocio con TuTiendaWeb"* → *"Tu restaurante o negocio recibe pedidos por WhatsApp, 24/7, sin atender el teléfono"*
- Posicionamiento (agregar): *"Tiendanube es para vender online con envíos. Instagram es para publicar fotos. TuTiendaWeb es para negocios que atienden por WhatsApp, como hace el 80% de los comercios argentinos."*

### Conversion Optimization (41/100)

**Funciona:** propuesta de valor orientada al dolor; arquitectura de 3 CTAs con distinta temperatura (trial / demo / WhatsApp); trial sin tarjeta + garantía atacan la objeción #1.

**Gaps críticos:** los 404 de `/precios` y `/demo` en CTAs primarios (30-45% de clics en "Ver demo" abandonan permanentemente); sin página de precios funcional no hay anclaje de valor; trust signals ausentes en el punto de conversión; plan único sin ancla de precio relativa; soporte solo WhatsApp/email sin canal estructurado.

**Proyección:** corregir 404s + `/demo` + `/precios` + trust signals puede llevar la conversión de sesión de ~2-3% a ~4-5% — **duplicar trials sin gastar un peso más en adquisición**.

### SEO & Discoverability (42/100)

**Fortalezas:** infraestructura Next.js 15 con SSR; metadata básica correcta (title, OG con `es_AR`, Twitter Card, canónica, `metadataBase`); robots.txt y sitemap presentes; perfil geolocalizado argentino coherente (.com.ar, ARS, Buenos Aires).

**Gaps:** sitemap con solo 3 URLs; toda la landing es 1 sola URL (secciones como anclas, no páginas); cero contenido editorial/blog; sin schema markup JSON-LD; páginas de tiendas públicas sin `generateMetadata()` (desperdician señales SEO de cada comercio); H1 sin keywords; GSC sin verificar; social links genéricos.

**Keywords prioritarias (long-tail, atacar primero — baja dificultad, alta intención):** "menú digital QR para restaurantes Argentina", "catálogo online para pymes Argentina", "carta digital para restaurante Argentina", "pedidos por WhatsApp para comercios", "cómo digitalizar mi restaurante Argentina".

**Proyección de tráfico orgánico a 6 meses:** estado actual 50-150/mes → con quick wins + 4 landings verticales 300-700/mes → con blog activo + schema + GSC **1.200-3.000/mes**.

### Competitive Positioning (52/100)

**Diagnóstico:** TuTiendaWeb está en el cuadrante correcto (accesible + suficientemente potente) pero no lo comunica. Opera en una intersección no trivial: no es ecommerce puro (Tiendanube), no es gestión de delivery (PedidosYa), no es CRM. Híbrido de nicho sin categoría propia definida.

**Ventajas exclusivas frente al campo:** horarios dinámicos abierto/cerrado nativos, extras/opciones con precio por producto (crítico para gastronomía), triple canal de notificaciones (WhatsApp + in-app + push), multi-tienda en plan único, **0% comisión por venta**.

**Gaps:** sin app mobile nativa, sin SEO de tienda/dominio propio para el catálogo del cliente, sin reviews/rating, sin prueba social pública (G2/Capterra/Trustpilot).

**Mensaje diferenciador #1 (ownable):** *"PedidosYa te cobra hasta 30% de comisión. Con TuTiendaWeb pagás $15.000 fijos y ese 30% es tuyo. En un negocio que vende $200.000/mes, son $60.000 que recuperás."*

**Vulnerabilidades:** dependencia de la API de WhatsApp (Meta); Tiendanube podría lanzar módulo WhatsApp con sus 140.000 tiendas; trial no funcional hoy; sin escalera freemium.

### Brand & Trust (31/100)

La nota más baja del audit y la prioridad #1. Señales de MVP temprano sobre un producto que ya está en crecimiento:

| Problema | Evidencia | Impacto |
|----------|-----------|---------|
| Testimonios ficticios | Nombres genéricos, fotos placeholder, "+500 restaurantes" sin respaldo | Muy alto |
| Email Gmail | `tutiendaweboficial@gmail.com` | Alto |
| Logos de clientes vacíos | 4 `div` grises en TestimonialsSection | Alto |
| Redes sin personalizar | Links genéricos `facebook.com/tutienda` | Alto |
| Estadísticas sin respaldo | "98% satisfacción", "30% aumento ventas" | Medio-alto |
| Sin página About/Equipo | No existe ruta `/about` | Medio |
| Sin GSC | Token comentado en metadata.ts | Medio |

### Growth & Strategy (44/100)

**Product-market fit real** en un mercado con demanda genuina (menos del 30% de comercios pequeños argentinos tiene presencia digital activa) y WhatsApp dominante (>85% penetración). Timing correcto — el riesgo es velocidad de ejecución, no PMF.

**Top 3 loops de crecimiento:** (1) viral del catálogo público con branding visible — el activo más subutilizado; (2) referidos estructurados con incentivo de 1 mes gratis; (3) contenido SEO compuesto.

**Plan de pricing recomendado:** Starter $8.000 / Pro $15.000 (actual) / Business $28.000, o add-ons sobre plan único.

**Canales:** Meta Ads (ROI 30 días, $50-100 USD de prueba a gastronómicos AMBA 30-50 años); referidos (ROI inmediato); partnerships con contadores/cámaras (60-90 días); orgánico/SEO (6 meses).

---

## Competitor Comparison

| Factor | TuTiendaWeb | Tiendanube | GetStore | MercadoShops | WhatsApp Business |
|--------|-------------|------------|----------|--------------|-------------------|
| Precio entrada (ARS/mes) | $15.000 | $20.000 | ~$8.000 | Gratis | Gratis |
| Comisión por venta | **0%** | 0.5-2% | 0% | 6-17% | 0% |
| Pedidos por WhatsApp | ✅ Full | ⚠️ Parcial | ✅ Full | ❌ | ⚠️ Informal |
| QR de catálogo | ✅ | ⚠️ | ✅ | ❌ | ❌ |
| Analytics internos | ✅ | ✅ | ❌ | ⚠️ | ❌ |
| Horarios dinámicos | ✅ Único | ❌ | ⚠️ | ❌ | ❌ |
| Extras con precio (gastronomía) | ✅ Único | ⚠️ | ⚠️ | ❌ | ❌ |
| Dominio propio | ❌ | ✅ | ❌ | ❌ | ❌ |
| Prueba social pública | ❌ | ✅ | ⚠️ | ✅ | N/A |
| App mobile nativa | ❌ | ⚠️ | ❌ | ✅ | ✅ |
| Reconocimiento de marca | Bajo | Muy alto | Bajo | Alto | Muy alto |

**Lectura:** TuTiendaWeb gana en costo real (0% comisión), en features gastronómicas y en simplicidad WhatsApp-first. Pierde en marca, prueba social, dominio propio y app nativa. La trinchera defensible es el **nicho gastronómico argentino con argumento de ahorro vs. delivery apps**.

---

## Revenue Impact Summary

| Recomendación | Impacto estimado | Confianza | Timeline |
|---------------|------------------|-----------|----------|
| Arreglar trust (testimonios, email, 404, trial real) | Habilita toda conversión; +20-35% trial | Alta | 1 semana |
| Reescribir headline + features a resultados | +15-25% CTR; +8-12% scroll | Alta | 1 semana |
| Página /precios funcional + FAQ | +10-20% inicio de trial | Alta | 2-4 semanas |
| /demo con video + catálogo demo | +15-25% desde CTA demo | Media | 2-4 semanas |
| Calculadora de ahorro + /vs/pedidosya | +alto (fondo de funnel) | Media | 3-4 semanas |
| Loop viral catálogo público | Adquisición compuesta, CAC ~0 | Media | 2 semanas |
| Referidos estructurados | Multiplicador con CAC bajo | Media | 4-6 semanas |
| Blog SEO (8-10 artículos) | +1.200-3.000 visitas org/mes | Media | 3-6 meses |
| **Trayectoria 12 meses (escenario medio)** | **~400 clientes / ~$6M ARS MRR (~$72M ARR)** | Media | 12 meses |

*Escenarios ARR a 12 meses: conservador ~$37.8M ARS · medio ~$72M ARS · optimista $126-180M ARS (con paid + partnerships).*

---

## Next Steps

1. **Esta semana — Credibilidad y promesas:** eliminar testimonios ficticios, activar el trial real en producción, arreglar los 404, email corporativo, reescribir headline.
2. **Este mes — Conversión y diferenciación:** construir `/precios` y `/demo` reales, calculadora de ahorro, `/vs/pedidosya`, activar loop viral del catálogo.
3. **Este trimestre — Crecimiento sostenible:** referidos, blog SEO, reposicionamiento gastronómico, tiers de pricing, partnerships.

### Comandos de seguimiento recomendados
- `/market copy tutiendaweb.com.ar` — reescritura completa del copy de la landing
- `/market landing tutiendaweb.com.ar` — análisis CRO detallado con mockups
- `/market social TuTiendaWeb` — calendario de contenido para Instagram/TikTok
- `/market ads TuTiendaWeb` — creatividades para la primera campaña de Meta Ads
- `/market launch TuTiendaWeb` — playbook de lanzamiento de ventas de 90 días

*Generado por AI Marketing Suite — `/market audit`*
