# ✅ Requerimientos del Sistema

Este documento describe los requerimientos funcionales y no funcionales del sistema **TuTiendaWeb**, en el contexto del desarrollo como solución integral para la gestión de tiendas físicas y virtuales.

---

## 🧩 1. Requerimientos Funcionales (RF)

Los requerimientos funcionales definen lo que el sistema **debe hacer** desde la perspectiva del usuario y del negocio.

---

### 🛍️ Gestión de Productos

| Código | Requerimiento                                                                                   |
| ------ | ----------------------------------------------------------------------------------------------- |
| RF01   | El sistema debe permitir al dueño de la tienda registrar un nuevo producto.                     |
| RF02   | El sistema debe permitir editar los datos de un producto existente.                             |
| RF03   | El sistema debe permitir eliminar un producto.                                                  |
| RF04   | El sistema debe listar todos los productos disponibles en una tabla filtrable y ordenable.      |
| RF05   | El sistema debe permitir visualizar el catálogo de productos públicamente (modo tienda online). |
| RF32   | El sistema debe permitir importar productos de forma masiva desde un archivo Excel (.xlsx), con un límite de 300 productos por tienda. El sistema debe validar cada fila, crear automáticamente las categorías/subcategorías/tags inexistentes, informar las filas inválidas antes de confirmar, y aplicar el límite tanto por archivo como por total de productos en la tienda. |

---

### 🧾 Gestión de Ventas

| Código | Requerimiento                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| RF06   | El sistema debe permitir crear una venta, asociando uno o más productos, cantidades, método de pago y estado. |
| RF07   | El sistema debe permitir editar ventas existentes.                                                            |
| RF08   | El sistema debe calcular automáticamente subtotal, descuentos, impuestos(si aplica) y total final.            |
| RF09   | El sistema debe permitir exportar ventas en formato PDF y/o Excel.                                            |
| RF10   | El sistema debe permitir visualizar y filtrar ventas por fecha, cliente, estado o total.                      |
| RF11   | El sistema debe permitir registrar información del cliente (nombre, teléfono, dirección, notas).              |
| RF12   | El sistema debe permitir definir estados de venta: pendiente, confirmada, enviada, entregada, cancelada.      |
| RF13   | El sistema debe permitir seleccionar métodos de pago: efectivo, transferencia, tarjeta, etc.                  |
| RF14   | El sistema debe permitir seleccionar métodos de entrega: retiro, envió.                                       |
| RF15   | El sistema debe mostrar historial de ventas.                                                                  |

---

### 🛒 Pedidos y Tienda Online

| Código | Requerimiento                                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| RF16   | El sistema debe generar un link de la Tienda para ser compartido vía WhatsApp u otro canal.                                |
| RF17   | El cliente debe poder seleccionar productos y completar sus datos personales desde el catálogo público y enviar su pedido. |
| RF18   | El sistema debe generar automáticamente un ID de pedido.                                                                   |
| RF19   | El dueño de tienda debe poder confirmar o cancelar pedidos entrantes(mediante whatsapp y  desde la app).                   |
| RF20   | El sistema debe permitir al dueño de la tienda personalizar los datos de la tienda, imágenes, y próximamente colores.      |

## Tienda Online
## 🧩 Requerimientos Funcionales (RF)

1. **RF‑STORE‑2 – Actualizar Información Básica**
    
2. **RF‑STORE‑3 – Actualizar Información de Contacto**
    
3. **RF‑STORE‑4 – Actualizar Dirección Física**
    
4. **RF‑STORE‑5 – Configurar Horario Semanal**
    
5. **RF‑STORE‑6 – Actualizar Enlaces Sociales**
    
6. **RF‑STORE‑7 – Configurar Tema / Branding**
    
7. **RF‑STORE‑8 – Configurar Métodos de Pago y Entrega**
    
8. **RF‑STORE‑9 – Configurar Notificaciones**
    
    - 9a. Por WhatsApp
        
    - 9b. In‑App
        
    - 9c. Push
        
    - 9d. Prueba de notificaciones
        
9. **RF‑STORE‑10 – Gestionar Suscripción**
### 👥 Gestión de Usuarios y Autenticación

| Código | Requerimiento                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------- |
| RF21   | El sistema debe permitir iniciar sesión email y contraseña o por cuenta de google.                 |
| RF22   | El sistema debe restringir el acceso a funcionalidades según autenticación (como la de dashboard). |
| RF23   | El sistema debe permitir al usuario nuevo registrarse.                                             |
|        |                                                                                                    |

---

### 📊 Reportes y Exportaciones

| Código | Requerimiento                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| RF24   | El sistema debe generar reportes de ventas por rango de fechas.                                                   |
| RF25   | El sistema debe permitir exportar reportes en Excel.                                                              |
| RF26   | El sistema debe mostrar métricas simples: ventas totales, ganancias, promedio por ticket, hora de mas movimiento. |

###  Requerimientos Funcionales – Nuevos o Modificados

|Código|Requerimiento|
|---|---|
|RF27|El sistema debe permitir configurar múltiples tiendas por usuario.|
|RF28|El sistema debe permitir configurar los métodos de entrega, pago y canal de recepción del pedido.|
|RF29|El sistema debe permitir asociar disponibilidad horaria y días por producto.|
|RF30|El sistema debe permitir añadir opciones personalizadas (extras) a los productos con valor opcional.|
|RF31|El sistema debe permitir calcular dinámicamente el estado abierto/cerrado de la tienda.|

---

## ⚙️ 2. Requerimientos No Funcionales (RNF)

Los requerimientos no funcionales definen cómo debe comportarse el sistema en términos de calidad, rendimiento, disponibilidad, etc.

---

### 🔐 Seguridad

| Código | Requerimiento                                                                             |
| ------ | ----------------------------------------------------------------------------------------- |
| RNF01  | El sistema debe proteger las rutas y componentes sensibles mediante autenticación.        |
| RNF02  | El sistema debe almacenar los datos de usuario y venta de forma segura (usando Firebase). |
| RNF03  | El sistema debe restringir acciones críticas a usuarios autenticados.                     |

---

### 📈 Rendimiento y Escalabilidad

| Código | Requerimiento |
|--------|----------------|
| RNF04 | El sistema debe estar optimizado para funcionar en dispositivos móviles y de escritorio. |
| RNF05 | El sistema debe poder escalar horizontalmente sin rediseño, gracias al uso de Firebase. |

---

### 🌐 Disponibilidad y Hosting

| Código | Requerimiento                                                                  |
| ------ | ------------------------------------------------------------------------------ |
| RNF06  | El sistema debe estar disponible 24/7, alojado en Firebase Hosting o Vercel.   |
| RNF07  | Las operaciones de lectura y escritura deben responder en menos de 2 segundos. |

---

### 🛠️ Mantenibilidad

| Código | Requerimiento |
|--------|----------------|
| RNF08 | El sistema debe estar modularizado por feature para facilitar mantenimiento. |
| RNF09 | El sistema debe estar documentado con comentarios, tipos TypeScript y validaciones Zod. |
| RNF10 | El sistema debe permitir despliegue automático en producción mediante Vercel o Firebase CI/CD. |

---

### 🌍 Internacionalización (Opcional / Futuro)

| Código | Requerimiento |
|--------|----------------|
| RNF11 | El sistema debería permitir soporte multilenguaje (español / inglés). |

---



## 🔚 Notas Finales

- Cada RF y RNF podrá estar vinculado a uno o varios Casos de Uso, Diagramas y Features en la documentación técnica.
- Esta lista puede ampliarse a medida que el sistema evolucione.

