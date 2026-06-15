# ✅ Requerimientos del Sistema

Este documento describe los requerimientos funcionales y no funcionales del sistema **TuTiendaWeb**, en el contexto del desarrollo como solución integral para la gestión de tiendas físicas y virtuales.

> **Actualizado:** 2026-06-15. Numeración correlativa: `RF##` (funcionales), `RF-STORE-##` (configuración de la tienda) y `RNF##` (no funcionales).

---

## 🧩 1. Requerimientos Funcionales (RF)

Los requerimientos funcionales definen lo que el sistema **debe hacer** desde la perspectiva del usuario y del negocio.

---

### 🛍️ Gestión de Productos

| Código | Requerimiento |
| ------ | ------------- |
| RF01 | El sistema debe permitir al dueño de la tienda registrar un nuevo producto. |
| RF02 | El sistema debe permitir editar los datos de un producto existente. |
| RF03 | El sistema debe permitir eliminar un producto. |
| RF04 | El sistema debe listar todos los productos disponibles en una tabla filtrable y ordenable. |
| RF05 | El sistema debe permitir visualizar el catálogo de productos públicamente (modo tienda online). |
| RF06 | El sistema debe permitir añadir opciones/extras con valor opcional a un producto (ej: "extra queso +$1.000"), que se suman al precio del pedido. |
| RF07 | El sistema debe permitir organizar los productos en categorías y subcategorías (jerarquía de 2 niveles: categoría principal → subcategoría). |
| RF08 | El sistema debe permitir al dueño definir manualmente el orden de las categorías y subcategorías, que determina cómo aparecen en la tienda pública. |
| RF09 | El sistema debe permitir importar productos de forma masiva desde un archivo Excel (.xlsx), con un límite de 300 productos por tienda. Debe validar cada fila, crear automáticamente las categorías/subcategorías/tags inexistentes, informar las filas inválidas antes de confirmar, y aplicar el límite tanto por archivo como por total de productos en la tienda. |

---

### 🧾 Gestión de Ventas

| Código | Requerimiento |
| ------ | ------------- |
| RF10 | El sistema debe permitir crear una venta asociando uno o más productos, cantidades, cliente, método de pago y entrega. La venta se cierra y se almacena (no tiene flujo de estados); registra su origen: local, web o WhatsApp. |
| RF11 | El sistema debe permitir editar ventas existentes. |
| RF12 | El sistema debe calcular automáticamente subtotal, descuentos y total final. |
| RF13 | El sistema debe permitir exportar ventas en formato PDF y/o Excel. |
| RF14 | El sistema debe permitir visualizar y filtrar ventas por fecha, cliente, total, método de pago, método de entrega y origen. |
| RF15 | El sistema debe permitir registrar información del cliente (nombre, teléfono, dirección, notas). |
| RF16 | El sistema debe permitir seleccionar el método de pago: efectivo, transferencia o MercadoPago. |
| RF17 | El sistema debe permitir seleccionar el método de entrega: retiro o delivery/envío. |
| RF18 | El sistema debe mostrar el historial de ventas. |

---

### 🛒 Pedidos y Tienda Online

| Código | Requerimiento |
| ------ | ------------- |
| RF19 | El sistema debe generar un link único de la tienda para compartir el catálogo vía WhatsApp u otro canal, y un código QR exportable. |
| RF20 | El cliente debe poder seleccionar productos, agregar extras y completar sus datos desde el catálogo público para enviar su pedido. |
| RF21 | El sistema debe generar automáticamente un ID para cada pedido. |
| RF22 | El sistema debe recibir y almacenar el pedido entrante como una venta (origen web/WhatsApp); la confirmación con el cliente se realiza por la conversación de WhatsApp. |
| RF23 | El sistema debe permitir al dueño personalizar los datos, imágenes y colores de su tienda pública. |

---

### ⚙️ Configuración de la Tienda

> El diseño del **panel/app es fijo**; lo configurable por cada comercio es **su tienda pública** y los ajustes operativos.

| Código | Requerimiento |
| ------ | ------------- |
| RF-STORE-01 | Actualizar información básica (nombre, descripción, slug, tipo y categoría). |
| RF-STORE-02 | Actualizar información de contacto (WhatsApp, sitio web). |
| RF-STORE-03 | Actualizar dirección física y enlace a Google Maps. |
| RF-STORE-04 | Configurar el horario semanal (apertura, cierre y descanso por día). |
| RF-STORE-05 | Actualizar enlaces a redes sociales (Instagram, Facebook). |
| RF-STORE-06 | Configurar el tema/branding de la tienda pública (logo, banner, colores, estilo). |
| RF-STORE-07 | Configurar métodos de pago y de entrega (con instrucciones y precio de envío). |
| RF-STORE-08 | Configurar notificaciones: WhatsApp, in-app, push y prueba de notificaciones. |
| RF-STORE-09 | Gestionar la suscripción (trial, plan activo, período de gracia y facturación). |
| RF-STORE-10 | Calcular dinámicamente el estado abierto/cerrado de la tienda según el horario. |

---

### 👥 Gestión de Usuarios y Autenticación

| Código | Requerimiento |
| ------ | ------------- |
| RF24 | El sistema debe permitir iniciar sesión con email y contraseña o con cuenta de Google. |
| RF25 | El sistema debe restringir el acceso a las funcionalidades según autenticación (p. ej. el dashboard). |
| RF26 | El sistema debe permitir que un usuario nuevo se registre. |

---

### 📊 Reportes y Exportaciones

| Código | Requerimiento |
| ------ | ------------- |
| RF27 | El sistema debe generar reportes de ventas por rango de fechas. |
| RF28 | El sistema debe permitir exportar reportes en Excel. |
| RF29 | El sistema debe mostrar métricas: ventas totales, ganancias, ticket promedio y mejores días/horarios. |

---

### 🔭 Visión a futuro

| Código | Requerimiento |
| ------ | ------------- |
| RF30 | El sistema debería permitir gestionar múltiples tiendas bajo una misma cuenta (multitienda). |

---

## ⚙️ 2. Requerimientos No Funcionales (RNF)

Los requerimientos no funcionales definen cómo debe comportarse el sistema en términos de calidad, rendimiento, disponibilidad, etc.

---

### 🔐 Seguridad

| Código | Requerimiento |
| ------ | ------------- |
| RNF01 | El sistema debe proteger las rutas y componentes sensibles mediante autenticación. |
| RNF02 | El sistema debe almacenar los datos de usuario y venta de forma segura (usando Firebase). |
| RNF03 | El sistema debe restringir las acciones críticas a usuarios autenticados. |

---

### 📈 Rendimiento y Escalabilidad

| Código | Requerimiento |
| ------ | ------------- |
| RNF04 | El sistema debe estar optimizado para funcionar en dispositivos móviles y de escritorio. |
| RNF05 | El sistema debe poder escalar horizontalmente sin rediseño, gracias al uso de Firebase. |

---

### 🌐 Disponibilidad y Hosting

| Código | Requerimiento |
| ------ | ------------- |
| RNF06 | El sistema debe estar disponible 24/7, alojado en Vercel (y/o Firebase Hosting). |
| RNF07 | Las operaciones de lectura y escritura deben responder en menos de 2 segundos. |

---

### 🛠️ Mantenibilidad

| Código | Requerimiento |
| ------ | ------------- |
| RNF08 | El sistema debe estar modularizado por feature para facilitar el mantenimiento. |
| RNF09 | El sistema debe estar documentado con comentarios, tipos TypeScript y validaciones Zod. |
| RNF10 | El sistema debe permitir despliegue automático en producción mediante CI/CD (Vercel). |

---

### 🌍 Internacionalización (Opcional / Futuro)

| Código | Requerimiento |
| ------ | ------------- |
| RNF11 | El sistema debería permitir soporte multilenguaje (español / inglés). |

---

## 🔚 Notas Finales

- Cada RF y RNF podrá estar vinculado a uno o varios Casos de Uso, diagramas y features en la documentación técnica.
- Esta lista puede ampliarse a medida que el sistema evolucione.
