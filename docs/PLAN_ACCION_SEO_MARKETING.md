# 🚀 Plan de Acción Integral: TuTiendaWeb (Semana 1)

Este documento detalla el análisis estratégico y la hoja de ruta para posicionar **TuTiendaWeb** en el mercado argentino, optimizar su SEO y activar un flujo constante de clientes.

---

## 📊 1. Diagnóstico Actual

### Fortalezas
- **Stack Moderno:** Next.js 14 permite una velocidad de carga excelente (factor clave para Google).
- **Enfoque Regional:** Metadatos ya configurados para Argentina (`es_AR`).
- **Valor Agregado:** El modelo "sin comisiones" es el mayor atractivo frente a PedidosYa o Rappi.

### Debilidades (Puntos de Fricción)
- **Falta de Autoridad:** Poca prueba social (testimonios/logos de clientes).
- **Keywords de "Dolor" ausentes:** El contenido actual es muy técnico ("Catálogo Digital") y poco orientado al problema del comerciante ("Cómo dejar de perder tiempo en WhatsApp").
- **Visibilidad Técnica:** Falta de datos estructurados (Schema Markup) para que Google lo clasifique como Software.

---

## 🗓️ 2. Hoja de Ruta: Semana de Lanzamiento y Crecimiento

### Día 1: Cimientos Técnicos y SEO "Invisible"
*   **Tarea:** Implementar `JSON-LD SoftwareApplication` para que Google muestre la web como una app profesional.
*   **Acción:** Editar el archivo de metadatos para incluir el esquema de producto.
*   **SEO:** Expandir keywords en `metadata.ts` incluyendo términos de "dolor" como: *"vender por whatsapp sin comisiones"*, *"organizar pedidos para restaurantes"*.

### Día 2: Eliminación de Miedos (FAQ y Confianza)
*   **Tarea:** Añadir sección de **Preguntas Frecuentes (FAQ)** en la Landing Page.
*   **Contenido:** Responder dudas sobre pagos (Mercado Pago), dispositivos y permanencia.
*   **Confianza:** Agregar una cinta de "Garantía de Satisfacción" o "Prueba 7 días sin tarjeta".

### Día 3: La Gran Comparativa (Gancho de Venta)
*   **Tarea:** Crear una sección o bloque comparativo: **TuTiendaWeb vs. Apps de Delivery**.
*   **Mensaje:** Resaltar el ahorro del 20-30% en comisiones. En Argentina, con la inflación actual, este es el argumento #1.

### Día 4: Activación de Canal "Cazador" (Outreach)
*   **Tarea:** Configurar mensajes de prospección para Instagram y WhatsApp.
*   **Acción:** Identificar 20 locales en Instagram que vendan por MD y enviarles el script de "Invitación a la Digitalización" (ver sección 3).

### Día 5: Google Search Console y Analytics
*   **Tarea:** Verificar la propiedad en GSC y enviar el `sitemap.xml`.
*   **Acción:** Monitorear por qué términos están llegando (si es que hay alguno) y ajustar títulos.

### Día 6: Estrategia de Referidos y Alianzas
*   **Tarea:** Crear el programa "Colegas".
*   **Mensaje:** *"Referí a un amigo y ambos tienen 1 mes gratis"*. El comerciante argentino confía más en otro comerciante que en un anuncio.

### Día 7: Revisión y Escalado de Ads
*   **Tarea:** Análisis de métricas de la semana.
*   **Acción:** Si hubo clics en la demo, pero no registros, ajustar el formulario de Sign-up.

---

## ✍️ 3. Scripts de Captación (Marketing)

### Mensaje para Instagram (Frío)
> *"Hola [Nombre del Local]! Vi que tienen productos increíbles pero que gestionan todo por chat. Les armé una demo de cómo se vería su tienda en **TuTiendaWeb** para que el cliente haga el pedido solo y a ustedes les llegue listo para entregar. ¿Les gustaría probarlo 7 días sin compromiso? Chau comisiones de apps!"*

### Mensaje para Explicar el Modelo (Cierre)
> *"Es simple: No es una app que tenés que descargar, es un link que ponés en tu Bio de Instagram o enviás por WhatsApp. El cliente entra, elige lo que quiere, y te manda el pedido cerrado a tu chat. Vos controlás el stock y el dinero, sin que nosotros te saquemos un porcentaje."*

---

## 🛠️ 4. Recomendación Técnica Inmediata: Schema Markup

Añadir este bloque de código en el componente principal de la landing (o en el head) para mejorar el SEO:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "TuTiendaWeb",
  "operatingSystem": "Web",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "15000",
    "priceCurrency": "ARS"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "12"
  }
}
```

---

## 📈 5. KPIs (Qué medir esta semana)
1. **CTR en la Demo:** ¿Cuánta gente hace clic en "Ver Demo"? (Mide interés).
2. **Tasa de Registro:** % de personas que pasan de la Home al Sign-up.
3. **Costo de Adquisición (CAC):** Si hacés Ads, cuánto te cuesta cada tienda nueva.

---
*Plan generado para TuTiendaWeb - Junio 2026*
