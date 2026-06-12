# TuTiendaWeb — Documento Maestro de Contexto del Producto
**Para qué sirve este archivo:** es el "cerebro" del negocio en un solo documento. Subilo a cualquier IA (ChatGPT, Claude, Gemini, generadores de imágenes, etc.) para que entienda exactamente qué es TuTiendaWeb, hasta dónde llega, cómo se usa y cómo explicarlo. Sirve para crear imágenes, mockups, campañas, guiones, textos y material de venta con contexto completo y fiel al producto real.

**Última actualización:** 2026-06-12
**Idioma del producto y comunicación:** español argentino (voseo).

---

## 0. Cómo usar este documento con una IA

Pegá este archivo completo al inicio de tu conversación con la IA y luego pedí lo que necesites. Ejemplos de prompts:
- "Con este contexto, generá 5 ideas de imágenes para promocionar la función de pedidos por WhatsApp."
- "Diseñá un mockup de cómo se ve el catálogo público de un restaurante usando este producto."
- "Escribí un guion de Reel mostrando el paso a paso de crear una tienda."
- "Creá una campaña para heladerías usando los diferenciadores reales del producto."

> ⚠️ Regla de fidelidad: **no inventes funciones que no están en este documento.** Si algo no figura acá, no es parte del producto (o todavía no lo es). La sección 11 aclara qué NO hace.

---

## 1. Qué es TuTiendaWeb (en una frase y en un párrafo)

**En una frase:**
> TuTiendaWeb es una plataforma que le permite a cualquier comercio armar su catálogo digital y recibir pedidos ordenados por WhatsApp, sin pagar comisiones por venta.

**En un párrafo:**
> TuTiendaWeb es un sistema (software como servicio / SaaS) pensado para comercios y negocios gastronómicos de Argentina. El dueño carga sus productos con fotos y precios, personaliza su tienda con su marca, y obtiene un **link único** y un **código QR** para compartir su catálogo. Sus clientes entran desde el celular —sin descargar ninguna app ni registrarse—, arman el pedido y lo envían directo al **WhatsApp** del negocio, ya ordenado y completo. Además, el dueño gestiona sus ventas, ve reportes y cobra con MercadoPago, todo desde un panel simple. Se paga por **suscripción mensual fija**, sin comisión por cada venta.

---

## 2. El problema que resuelve

El comercio argentino promedio (restaurante, hamburguesería, rotisería, heladería, panadería, kiosco, emprendedor que vende por Instagram) vende por WhatsApp pero de forma desordenada:

- Contesta "¿qué tenés?" y "¿cuánto sale?" decenas de veces por día.
- Anota pedidos en papel: se mezclan, se pierden, se equivoca.
- No tiene un catálogo con fotos y precios para mostrar.
- Si usa apps de delivery (PedidosYa, Rappi), le cobran **hasta 30% de comisión** por pedido.
- Lo que publica en historias de Instagram desaparece a las 24 horas.
- No sabe qué producto le deja más ganancia ni cuáles son sus mejores días.

**TuTiendaWeb ordena todo eso:** un catálogo profesional + pedidos que llegan limpios al WhatsApp + gestión de ventas + reportes, sin comisiones.

---

## 3. Para quién es (público objetivo / buyer persona)

### Tipos de negocio soportados (los que el producto contempla oficialmente):
| Tipo | Ejemplos |
|------|----------|
| **Restaurante / Gastronomía** | Hamburgueserías, rotiserías, pizzerías, heladerías, panaderías, pastelerías, cafeterías, food trucks |
| **Ropa y Accesorios** | Indumentaria, calzado, accesorios |
| **Tienda General (retail)** | Almacenes, kioscos, dietéticas, productos varios |
| **Belleza y Cuidado** | Productos de cosmética, cuidado personal |
| **Otro** | Cualquier negocio que venda productos con entrega |

> Nota importante: el producto está orientado a **negocios que venden productos físicos con entrega o retiro**. NO está pensado para servicios con reserva de turnos (peluquería, consultoría, etc.). El nicho más fuerte y mejor servido es **gastronomía**.

### Perfil del cliente ideal (a quién le hablamos):
- Dueño/a de un comercio chico o mediano en Argentina.
- Entre 25 y 55 años.
- Ya vende por WhatsApp y/o Instagram.
- No es técnico: no quiere aprender software complicado.
- Le duele la comisión de las apps de delivery o el desorden de los pedidos.
- Puede o no tener local físico (también sirve para quien vende desde su casa).

---

## 4. Cómo funciona (el flujo completo en 2 lados)

### Lado del DUEÑO (panel de gestión / dashboard):
1. Se registra (email/contraseña o con Google).
2. Pasa por un **onboarding guiado** que arma su tienda paso a paso.
3. Carga sus productos con foto, precio y descripción (uno por uno o importando una planilla Excel con todos de una vez).
4. Personaliza su tienda con su logo, colores y marca.
5. Configura métodos de pago, entrega, horarios y notificaciones.
6. Obtiene su **link único** y su **código QR**.
7. Comparte el link por WhatsApp, Instagram, o imprime el QR.
8. Recibe los pedidos, los gestiona, registra ventas y ve reportes.

### Lado del CLIENTE FINAL (catálogo público):
1. Entra al link o escanea el QR (desde el celular, sin descargar nada).
2. Ve el catálogo con fotos, precios y categorías.
3. Agrega productos al carrito (con sus extras/opciones).
4. Completa sus datos (nombre, contacto, dirección si es delivery).
5. Elige método de pago y entrega.
6. Envía el pedido → le llega **armado y ordenado al WhatsApp del negocio**.
7. Ve una confirmación con el resumen.

```
DUEÑO arma catálogo → comparte link/QR → CLIENTE pide desde el celu →
pedido llega ordenado al WhatsApp del DUEÑO → DUEÑO confirma y prepara
```

---

## 5. Funcionalidades completas (qué tiene el software, hoy)

> Esta es la lista real de capacidades. Usala como inventario fiel para imágenes y campañas.

### 🔐 Cuenta y acceso
- Registro con email y contraseña, o con cuenta de Google.
- Inicio y cierre de sesión seguro.
- Recuperación de contraseña.
- Acceso protegido al panel (solo el dueño autenticado).

### 🚀 Onboarding guiado (configuración inicial en pasos)
- Asistente paso a paso que arma la tienda apenas te registrás.
- Pide nombre y tipo de negocio, dirección (opcional), WhatsApp, descripción, slug (la dirección web de tu tienda) y colores.
- Valida en vivo que el nombre de tu tienda (slug) esté disponible.
- Muestra un producto de ejemplo según el rubro elegido para que veas cómo queda.
- Termina dejando la tienda lista para empezar.

### 🛍️ Gestión de productos
- Crear, editar y eliminar productos.
- Cada producto: nombre, descripción, descripción corta, precio, **precio de costo** (para tu control interno de ganancia), categoría, etiquetas (tags), imágenes.
- **Importación masiva desde Excel (.xlsx):** cargá hasta 300 productos de una sola vez con una planilla. El sistema crea automáticamente las categorías, subcategorías y tags que no existan. Incluye vista previa de filas válidas e inválidas antes de confirmar.
- **Variantes / extras con precio** (ej: "extra queso +$1.000", "pan de la casa +$1.000"): el cliente los suma a su pedido y se calcula solo.
- Organización por **categorías** (ej: Entradas, Principales, Postres) y **etiquetas**.
- Estado de producto (activo/inactivo) y soporte de promociones.
- Listado filtrable y ordenable en el panel.

### 🌐 Catálogo público (la tienda online del cliente)
- Página web pública con un **link único** (ej: tutiendaweb.com.ar/tu-negocio).
- Vista optimizada para celular.
- Productos con fotos, precios, descripciones y categorías.
- Carrito de compras.
- Muestra si la tienda está **abierta o cerrada** según el horario configurado.

### 🛒 Pedidos por WhatsApp
- El cliente arma el pedido y lo envía: llega **formateado y ordenado** al WhatsApp del negocio.
- Generación de **ID automático** para cada pedido.
- El dueño puede confirmar o cancelar pedidos.
- El mensaje de WhatsApp se arma solo con el detalle del pedido, datos del cliente, método de pago y entrega.

### 🧾 Gestión de ventas (registro interno)
- Crear ventas manualmente (además de las que entran por el catálogo).
- Asociar productos, cantidades, datos del cliente, método de pago y entrega.
- **Cálculo automático** de subtotal, descuentos y total.
- **Estados de venta:** pendiente, confirmada, enviada, entregada, cancelada.
- **Métodos de pago:** efectivo, tarjeta, transferencia, MercadoPago, etc.
- **Métodos de entrega:** retiro o delivery/envío.
- Historial completo de ventas, filtrable por fecha, cliente, total y estado.
- **Exportar ventas a PDF o Excel.**

### 📲 Código QR
- Generación automática de un **QR** que lleva a tu catálogo.
- Listo para imprimir (ideal para mesa, mostrador, vidriera, packaging).
- Exportable en PDF.

### 🎨 Personalización y marca (branding)
- Logo y banner propios.
- Colores personalizados (primario, secundario, acento).
- Tipografía y estilo visual.
- La tienda se ve como **tu marca**, no como una plantilla genérica.

### ⚙️ Configuración de la tienda
- Información básica: nombre, descripción, tipo, slug.
- Datos de contacto: WhatsApp, sitio web.
- Dirección física + enlace a Google Maps.
- **Horario semanal** (apertura, cierre y descanso por cada día). La tienda muestra "abierto/cerrado" automáticamente.
- Enlaces a redes sociales (Instagram, Facebook).
- **Métodos de pago y entrega** configurables (con instrucciones y precio de envío).
- Moneda (ARS), idioma (español) y zona horaria (Argentina).
- Tiempo de preparación de pedidos.

### 🔔 Notificaciones (triple canal)
- Notificación de pedidos por **WhatsApp**.
- Notificaciones **dentro de la app** (in-app).
- Notificaciones **push** (web/móvil).

### 📊 Reportes y métricas
- Reportes de ventas por rango de fechas.
- Exportación de reportes a Excel.
- Métricas/KPIs del negocio: ganancias, ticket promedio, ventas por período, productos más vendidos, mejores días.

### 💳 Suscripción y pagos
- Modelo de suscripción mensual.
- Prueba gratuita para empezar.
- Integración con **MercadoPago** para el cobro de la suscripción.
- Manejo de período de gracia y estados de suscripción (activa / gracia / suspendida).
- El cliente del comercio también puede pagar sus pedidos con MercadoPago desde el catálogo.

### 📚 Guías de uso integradas
- Sección de guías dentro del panel (guía de usuario y guía de WhatsApp Business) para ayudar al dueño a sacarle provecho.

---

## 6. Estructura del panel (las secciones del dashboard)

Para mockups e imágenes del producto, estas son las secciones reales del panel del dueño:

| Sección | Qué se hace ahí |
|---------|-----------------|
| **Inicio / Dashboard** | Vista general, métricas clave |
| **Productos** | Crear, editar, ver y listar productos |
| **Ventas** | Crear ventas, ver historial, editar, exportar |
| **QR** | Generar y descargar el código QR de la tienda |
| **Configuración → General** | Nombre, descripción, contacto, datos básicos |
| **Configuración → Apariencia** | Logo, colores, branding |
| **Configuración → Ubicación** | Dirección, mapa, horarios |
| **Configuración → Checkout** | Métodos de pago y entrega |
| **Suscripción** | Estado del plan, pago, facturación |
| **Guías** | Tutoriales de uso |

---

## 7. Pasos para empezar a usarlo (para tutoriales e imágenes "cómo funciona")

### Para el DUEÑO (primera vez):
1. **Registrate** con tu email o con Google.
2. **Completá el onboarding:** nombre del negocio, tipo, WhatsApp, descripción, colores. Elegís la dirección web de tu tienda (slug).
3. **Cargá tus productos:** foto, nombre, precio, descripción. Agrupalos en categorías. Si tenés muchos productos, usá la importación masiva por Excel para cargarlos todos de una vez.
4. **Agregá extras** si tu producto los tiene (ej: tamaños, agregados).
5. **Personalizá tu tienda:** subí tu logo y elegí tus colores.
6. **Configurá horarios, pagos y entrega.**
7. **Conseguí tu link y tu QR.**
8. **Compartilo:** bio de Instagram, estado de WhatsApp, QR impreso en la mesa.
9. **Empezá a recibir pedidos** y gestionalos desde el panel.

### Para el CLIENTE FINAL (cómo pide):
1. Toca el link o escanea el QR.
2. Mira el catálogo y elige productos.
3. Agrega extras y cantidades.
4. Completa sus datos y elige pago/entrega.
5. Envía el pedido → llega al WhatsApp del negocio.

---

## 8. Diferenciadores clave (por qué elegirlo) — usar SIEMPRE en campañas

1. **Sin comisiones por venta.** Pagás un precio fijo mensual, no un % de cada pedido. (Vs. PedidosYa/Rappi que cobran hasta 30%.) → Es el argumento más fuerte.
2. **El cliente no descarga nada ni se registra.** Entra por un link y pide. Cero fricción.
3. **Pedidos ordenados al WhatsApp**, el canal donde ya trabaja el comercio argentino.
4. **Pensado para gastronomía argentina:** horarios abierto/cerrado, extras con precio, notificaciones múltiples.
5. **Simple de verdad:** "si sabés usar WhatsApp, sabés usar esto."
6. **Tu marca, no una plantilla:** logo, colores y estilo propios.
7. **Hecho en Argentina**, en pesos, con MercadoPago, soporte local.

---

## 9. Mensajes y frases de venta (banco para copys e imágenes)

- "Tus clientes te piden por WhatsApp, vos te quedás con todo."
- "Sin comisiones. Sin contrato. Sin complicaciones."
- "Tu negocio recibe pedidos por WhatsApp, sin atender el teléfono todo el día."
- "PedidosYa se queda con el 30%. Nosotros, $15.000 fijos."
- "Si sabés usar WhatsApp, sabés usar TuTiendaWeb."
- "Tu catálogo online listo en 15 minutos."
- "El pedido llega armado. Vos solo confirmás y preparás."
- "Tu marca, tu catálogo, tus clientes. Sin intermediarios."
- "Dejá de anotar pedidos en papel."
- "Un QR en la mesa y tu menú completo, sin imprimir cartas nunca más."

---

## 10. Casos de uso por rubro (para campañas segmentadas)

| Rubro | Dolor principal | Cómo lo resuelve | Ángulo de campaña |
|-------|-----------------|------------------|-------------------|
| **Hamburguesería / Rotisería** | Pedidos del finde caóticos, comisión de apps | Catálogo con extras, pedidos ordenados al WhatsApp, sin comisión | "Recuperá lo que te llevan las apps de delivery" |
| **Heladería** | Muchos gustos/tamaños, atención telefónica saturada | Variantes y extras, horario abierto/cerrado | "Tus clientes arman su pedido solos" |
| **Panadería / Pastelería** | Encargos por WhatsApp desordenados | Catálogo + pedidos por adelantado ordenados | "Tomá encargos sin perder ninguno" |
| **Cafetería / Restaurante con salón** | Cartas físicas que se desactualizan | QR en la mesa, menú siempre actualizado | "Cambiá un precio y se actualiza al toque" |
| **Emprendedor sin local (Instagram)** | Vende por historias que desaparecen | Catálogo permanente con link en la bio | "Tu tienda no desaparece a las 24 horas" |
| **Almacén / Kiosco / Dietética** | Lista de productos a mano, pedidos por teléfono | Catálogo digital + pedidos por WhatsApp | "Tu lista de precios siempre a mano" |

---

## 11. Límites del producto (qué NO hace — para no prometer de más)

> Importante para campañas honestas y para que las IAs no inventen.

- **No es una app que se descarga** (ni para el dueño ni para el cliente): funciona en el navegador / web.
- **No tiene logística ni reparto propio** (no manda cadetes): el delivery lo maneja el comercio.
- **No es un marketplace** (no lista tu tienda junto a otras como Mercado Libre o PedidosYa): es **tu** tienda independiente.
- **No es para servicios con turnos** (peluquerías, consultorios): está orientado a productos con entrega/retiro.
- **No tiene dominio propio del cliente todavía** (la tienda vive en una dirección dentro de tutiendaweb.com.ar).
- **No tiene app móvil nativa** (es web, funciona perfecto en el celular igual).
- **El checkout final se confirma por WhatsApp** (es parte de la propuesta, no un checkout 100% automático tipo e-commerce con envíos).

---

## 12. Guía para crear IMÁGENES y contenido visual

### Estilo visual de marca ("Mercado Cálido")
- **Sensación:** tienda viva, cálida, apetecible, confiable. NO frío/corporativo.
- **Paleta:**
  - Primario marca: Tomate/Coral `#E8552D`
  - Acción (botones): Verde WhatsApp `#25D366`
  - Acento: Mostaza/Miel `#F2A41C`
  - Fondo: Crema `#FFF8F0`
  - Texto: Carbón `#1A1714`
- **Tipografía:** sans moderna con personalidad (Poppins, Sora) para títulos; legible (Inter, DM Sans) para cuerpo.
- **Bordes redondeados, sombras suaves cálidas.**
- **Fotos reales** de comida/productos/comercios argentinos. Nada de stock genérico de oficinas.
- **El verde solo para los botones de acción** (que el ojo sepa dónde tocar).

### Qué mostrar en las imágenes (ideas fieles al producto):
- Un **celular con el catálogo abierto** (productos con fotos y precios).
- El **mensaje de WhatsApp** llegando con un pedido armado.
- Un **QR impreso** en una mesa o mostrador, alguien escaneándolo.
- El **panel del dueño** (productos, ventas, reportes).
- **Antes/después:** papelitos desordenados → pedido ordenado en el WhatsApp.
- Comparación visual: **comisión de delivery (-30%) vs. precio fijo ($15.000)**.
- El **dueño real** de un comercio sonriendo, preparando un pedido.

### Qué NO mostrar (para no confundir):
- Cadetes/repartidores propios de la plataforma (no existe ese servicio).
- Pantallas de "app para descargar" en una store (es web).
- Un marketplace con muchas tiendas (es tienda independiente).

---

## 13. Datos comerciales de referencia

- **Precio:** $15.000 ARS/mes (plan único, todo incluido).
- **Prueba gratis:** 7 días, sin tarjeta de crédito.
- **Garantía:** 30 días de devolución.
- **Sin contrato / sin permanencia:** se cancela cuando se quiere.
- **Sin comisión por venta.**
- **Cobro:** MercadoPago.
- **Web:** tutiendaweb.com.ar
- **Mercado:** Argentina.

> Nota: estos valores comerciales pueden cambiar; verificá los vigentes antes de publicar.

---

## 14. Glosario (para que la IA y el equipo hablen igual)

- **Catálogo público:** la tienda online del comercio, accesible por link/QR.
- **Slug:** la parte personalizada de la dirección web de la tienda (ej: `mi-negocio`).
- **Dashboard / Panel:** la zona privada donde el dueño gestiona todo.
- **Onboarding:** el asistente inicial que configura la tienda paso a paso.
- **Variantes / Extras:** opciones con precio que se suman a un producto (tamaños, agregados).
- **Estados de venta:** pendiente, confirmada, enviada, entregada, cancelada.
- **Período de gracia:** tiempo extra tras vencer la suscripción antes de suspender la cuenta.
- **Owner (dueño):** rol con acceso completo a su tienda.

---

## 15. Resumen de una línea para reutilizar

> **TuTiendaWeb: tu catálogo digital + pedidos por WhatsApp, sin comisiones. Hecho en Argentina para comercios y gastronomía. Probalo gratis 7 días.**

*Documento de contexto generado para alimentar IAs y producir material de marketing fiel al producto real.*
