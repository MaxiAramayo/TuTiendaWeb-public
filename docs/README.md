# 📊 Análisis y Contexto General del Sistema

## 🧠 Título del Proyecto
**TuTiendaWeb – Plataforma Integral para la Gestión de Tiendas Físicas y Digitales**

---

## 🎯 Objetivo General del Proyecto

Desarrollar un sistema modular, escalable y eficiente que permita a pequeños y medianos comerciantes gestionar sus operaciones comerciales diarias, incluyendo ventas, productos, clientes, y reportes, tanto para locales físicos como para tiendas online, desde una única plataforma centralizada y moderna.

---

## 🎯 Objetivos Específicos

- Brindar una interfaz intuitiva para la carga, edición y consulta de ventas y productos.
- Facilitar el seguimiento de pedidos y estado de entregas en tiempo real.
- Permitir la creación de reportes financieros automáticos (PDF/Excel) con exportación.
- Centralizar el catálogo de productos, con soporte para imágenes y variantes.
- Permitir a los clientes realizar pedidos mediante canales digitales (ej: WhatsApp).
- Integrar herramientas de marketing (códigos QR, promociones, canales de origen).
- Generar un entorno administrativo seguro, multiusuario y con historial de cambios.
- Soportar expansión futura a múltiples tiendas bajo una sola cuenta (multitenant).

---

## 📝 Descripción del Problema

Muchos comerciantes operan con registros manuales, sin herramientas digitales para administrar sus negocios, lo cual implica:

- Dificultad para llevar control de ventas y clientes.
- Falta de trazabilidad y errores en operaciones.
- Ausencia de métricas o reportes contables.
- Pérdida de oportunidades en ventas online.
- Inseguridad o informalidad frente a los clientes.

---

## 💡 Solución Propuesta

**TuTiendaWeb**, una plataforma web bajo el modelo de Software como Servicio (SaaS), diseñada para que múltiples restaurantes, especialmente pequeños y medianos, puedan digitalizar y optimizar su gestión de pedidos integrándose con WhatsApp como canal de recepción eficiente. Cada restaurante que se suscribe al servicio puede configurar su propia tienda virtual independiente dentro de la plataforma, gestionando su catálogo, clientes y ventas de forma autónoma.

**TuTiendaWeb** aborda los problemas planteados al:

●     **Centralizar la información:** Todos los pedidos y datos de ventas generados a través del catálogo se almacenan automáticamente en una base de datos estructurada. Esto no solo facilita la gestión operativa diaria, sino que también crea un repositorio único de información crucial para el análisis del negocio y la toma de decisiones informadas.

●     **Optimizar la recepción de pedidos:** Si bien WhatsApp se mantiene como un canal de comunicación familiar para el cliente, la plataforma estructura la toma del pedido a través de un catálogo digital, reduciendo errores de transcripción y agilizando la confirmación.

●     **Ofrecer escalabilidad y autonomía:** Al ser una solución SaaS, la plataforma permite a los restaurantes acceder a una herramienta robusta sin necesidad de grandes inversiones iniciales en infraestructura o desarrollos a medida. Reduce la dependencia de herramientas genéricas no especializadas para la gestión integral, proveyendo funcionalidades específicas para el rubro.

●     **Proporcionar herramientas de análisis:** La plataforma incluye funcionalidades para la generación de reportes básicos de ventas y la identificación de tendencias de consumo, permitiendo a los administradores basar sus estrategias en datos reales.

Con esta implementación, se busca ofrecer un servicio accesible y eficiente que mejore sustancialmente la gestión de los pedidos y la relación con el cliente para numerosos negocios, sin intermediarios costosos.

---

## 👤 Actores y Usuarios Finales

| Actor / Usuario                  | Descripción                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------- |
| 🧑‍💼 Administrador de la Tienda | Encargado de toda la gestión del sistema: productos, ventas, reportes, usuarios. |
| 🧾 Cliente final                 | Usuario que accede al catálogo y realiza un pedido desde el canal digital.       |
| 👨‍🔧 Técnico / Soporte          | Personal con acceso a la configuración, errores, respaldo o logs.                |

---

## 👥 Stakeholders

| Stakeholder         | Rol / Interés                                                               |
|---------------------|------------------------------------------------------------------------------|
| Comerciantes        | Usan el sistema para mejorar su gestión y digitalizar procesos.             |
| Clientes            | Realizan pedidos, esperan fluidez y confiabilidad.                          |
| Desarrollador       | Mantiene y evoluciona el sistema; requiere código modular y documentación.  |
| Soporte técnico     | Administra configuración, errores, y soporte del sistema.                   |
| Analista funcional  | Documenta, testea y valida el cumplimiento de objetivos y reglas de negocio.|

---

## 📦 Alcance del Sistema

### ✅ Funcionalidades incluidas

- Registro, edición y consulta de productos.
- Formulario de ventas con validación y cálculo automático.
- Generación de reportes financieros (PDF / Excel).
- Catálogo online con posibilidad de compartir por WhatsApp.
- Menú QR.
- Estado de pedidos: pendiente, confirmado, entregado, cancelado.
- Creación de usuarios y autenticación.
- Selección de métodos de pago y entrega.
- Interfaz adaptable (responsive).
- Carga masiva de productos (CSV, Excel).
- Notificaciones push y dashboard de métricas.
### 🔜 Funcionalidades futuras (visión)

- Soporte multitienda bajo una misma cuenta.
- Integración con pasarelas de pago (MercadoPago, Stripe).
- Mas personalización de la tienda
### 🚫 Fuera de alcance actual

- Facturación electrónica oficial.
- Integraciones contables o bancarias.
- Gestión de usuarios con roles personalizados.
- Gestión de Stock.
- Logística y Seguimiento de Envíos.

---

## 🛠️ Tecnologías Utilizadas

| Categoría         | Tecnologías                                                               |
|-------------------|---------------------------------------------------------------------------|
| Frontend          | Next.js 14, React 18, TypeScript, TailwindCSS                             |
| UI & Animaciones  | Radix UI, ShadCN, Framer Motion                                           |
| Estado Global     | Zustand                                                                   |
| Validaciones      | Zod, React Hook Form                                                      |
| Backend BaaS      | Firebase (Firestore, Functions, Auth, Storage)                            |
| Documentos        | @react-pdf/renderer, html2canvas, jsPDF, ExcelJS                          |
| Otros             | Cloudinary, QRCode, Lucide Icons, Axios                                   |

---

## 🎯 Motivación Personal

Este sistema fue desarrollado para **resolver un problema real y actual** del sector comercial independiente: la falta de herramientas digitales integradas para ventas. Además, representa una oportunidad para aplicar conocimientos técnicos y de análisis, sentando bases reales para futuros productos SaaS.

---

## 📈 Visión a Futuro

TuTiendaWeb evolucionará a un sistema SaaS multitienda, con capacidades avanzadas como:

- Administración de múltiples tiendas en paralelo.
- Gestión de roles, permisos y auditorías.
- Aplicación móvil conectada con backend Firebase.
- Integración con herramientas de facturación y pagos.
- Automatización de reportes y dashboards en tiempo real.

---