
## 👥 Módulo: Autenticación

---

### ✅ CU-AUTH-01 – Registrar Cuenta

| Ítem                       | Descripción                                                                                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU-AUTH-01                                                                                                                                                                                                                          |
| 👤 **Actor**               | Dueño de Tienda                                                                                                                                                                                                                     |
| 📋 **Descripción**         | Permite al dueño de tienda registrarse en el sistema creando una cuenta con email y contraseña.                                                                                                                                     |
| 📌 **Precondición**        | El usuario no debe tener una cuenta existente con ese email.                                                                                                                                                                        |
| 🎯 **Postcondición**       | La cuenta se crea correctamente y se redirige al inicio de sesión.                                                                                                                                                                  |
| 📑 **Flujo principal**     | 1. El usuario accede al formulario de registro. 2. Completa nombre, email y contraseña.3. Acepta términos (si aplica).4. Presiona "Registrarse".5. El sistema valida los campos.6. Se crea la cuenta.7. Se redirige al login.       |
| ⚠️ **Flujos alternativos** | - 5a: Si el email ya está registrado → se muestra error y se impide continuar.- 5b: Si hay campos vacíos o inválidos → se resaltan con mensajes de validación.- 6a: Si falla el registro por error técnico → se informa al usuario. |

---

### ✅ CU-AUTH-02 – Iniciar Sesión

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-AUTH-02|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite autenticarse en el sistema mediante email/contraseña o cuenta de Google.|
|📌 **Precondición**|El usuario debe estar registrado.|
|🎯 **Postcondición**|El usuario accede al panel de gestión con sesión activa.|
|📑 **Flujo principal**|1. El usuario accede al formulario de login.2. Ingresa email y contraseña, o selecciona login con Google.3. El sistema valida los datos.4. Si son correctos, establece sesión.5. Redirige al panel principal.|
|⚠️ **Flujos alternativos**|- 3a: Credenciales inválidas → mostrar mensaje de error.- 3b: Problemas con autenticación Google → notificar.- 2a: Campos vacíos → desactivar botón y mostrar error.|

---

### ✅ CU-AUTH-03 – Cerrar Sesión

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-AUTH-03|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite cerrar la sesión actual y salir del sistema.|
|📌 **Precondición**|El usuario debe tener sesión activa.|
|🎯 **Postcondición**|La sesión finaliza y se redirige al login.|
|📑 **Flujo principal**|1. El usuario hace clic en el botón “Cerrar sesión”.2. El sistema elimina el token de autenticación.3. Se redirige al inicio de sesión.|
|⚠️ **Flujos alternativos**|- 2a: Si ocurre un error al cerrar sesión, se notifica y se puede forzar recarga.|

---

### ✅ CU-AUTH-04 – Controlar Acceso por Autenticación

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-AUTH-04|
|👤 **Actor**|Sistema (automático)|
|📋 **Descripción**|El sistema restringe el acceso a secciones internas si el usuario no está autenticado.|
|📌 **Precondición**|El usuario intenta acceder a una ruta protegida.|
|🎯 **Postcondición**|Si no hay sesión, se redirige al login.|
|📑 **Flujo principal**|1. El usuario accede a una sección protegida.2. El sistema verifica autenticación.3. Si hay sesión, permite continuar.4. Si no, redirige al login.|
|⚠️ **Flujos alternativos**|- 2a: Si el token expiró, se muestra mensaje y se solicita reautenticación.|

---

## 🛍️ Módulo: Gestión de Productos

---

### ✅ CU-PROD-01 – Registrar Producto

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-PROD-01|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite añadir un nuevo producto al sistema para su publicación en la tienda.|
|📌 **Precondición**|El usuario debe estar en el panel autenticado.|
|🎯 **Postcondición**|El producto queda guardado en la base de datos y visible en el listado.|
|📑 **Flujo principal**|1. Accede a “Productos” y hace clic en “Agregar”.2. Completa campos: nombre, precio, stock, categoría, imagen.3. Presiona “Guardar”.4. El sistema valida los datos.5. Si todo está correcto, guarda y muestra confirmación.|
|⚠️ **Flujos alternativos**|- 2a: Imagen no válida → se muestra error.- 4a: Campos vacíos o con formato incorrecto → se bloquea envío.- 5a: Si hay error de red/backend → se ofrece reintentar.|

---

### ✅ CU-PROD-02 – Editar Producto

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-PROD-02|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite modificar la información de productos existentes.|
|📌 **Precondición**|El producto debe estar previamente registrado.|
|🎯 **Postcondición**|El producto se actualiza y refleja en la vista pública y privada.|
|📑 **Flujo principal**|1. Selecciona producto a editar.2. Modifica campos.3. Presiona “Guardar cambios”.4. El sistema valida y actualiza.|
|⚠️ **Flujos alternativos**|- 2a: Cambios inválidos → se muestra error.- 4a: Fallo al guardar → se notifica y se da opción de reintentar.|

---

### ✅ CU-PROD-03 – Eliminar Producto

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-PROD-03|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite eliminar un producto del catálogo.|
|📌 **Precondición**|El producto debe estar registrado.|
|🎯 **Postcondición**|El producto queda eliminado o marcado como inactivo.|
|📑 **Flujo principal**|1. Desde el listado, selecciona producto.2. Presiona “Eliminar”.3. Confirma acción.4. El sistema elimina el producto.|
|⚠️ **Flujos alternativos**|- 4a: Error al eliminar → mensaje y reintento.- 3a: Cancela la operación → no se ejecuta.|

---

### ✅ CU-PROD-04 – Listar Productos en Panel

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-PROD-04|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Muestra todos los productos disponibles en una tabla filtrable y ordenable.|
|📌 **Precondición**|Debe haber productos registrados.|
|🎯 **Postcondición**|Se presenta la lista completa para gestionar.|
|📑 **Flujo principal**|1. Entra a sección “Productos”.2. El sistema carga listado.3. Puede filtrar por nombre, categoría o stock.4. Ordenar columnas.|
|⚠️ **Flujos alternativos**|- 2a: No hay productos → mensaje de lista vacía.|

---

### ✅ CU-PROD-05 – Ver Catálogo Público

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-PROD-05|
|👤 **Actor**|Cliente / Visitante|
|📋 **Descripción**|Permite navegar los productos publicados desde la tienda online.|
|📌 **Precondición**|El catálogo debe estar habilitado públicamente.|
|🎯 **Postcondición**|Se visualizan los productos con su información.|
|📑 **Flujo principal**|1. El visitante accede al link de la tienda.2. El sistema carga los productos disponibles.3. Puede ver detalles, precios, imágenes.|
|⚠️ **Flujos alternativos**|- 2a: No hay conexión → mensaje de error.- 2b: Catálogo deshabilitado → pantalla de tienda cerrada.|


---
### ➕ CU-PROD-06 – Añadir opciones/extras con valor al producto

| Ítem              | Descripción                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| 🆔 **Código**      | CU-PROD-07                                                                  |
| 👤 **Actor**       | Dueño de Tienda                                                             |
| 📋 **Descripción** | Permite agregar opciones o extras configurables a los productos (e.g. extra queso).|
| 📌 **Precondición**| El producto debe estar creado.                                              |
| 🎯 **Postcondición**| Las opciones se muestran en el catálogo y se suman al precio total.        |
| 📑 **Flujo principal** | 1. Accede a "Opciones" del producto.<br>2. Agrega opción con nombre y precio.<br>3. Guarda cambios.<br>4. Se aplican en pedidos. |
| ⚠️ **Flujos alternativos** | 2a: Opción sin nombre o precio inválido → mostrar error. |

---

## 🧾 Módulo: Gestión de Ventas

---

### ✅ CU-SALE-01 – Crear Venta

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-SALE-01|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite registrar una venta asociando productos, cantidades, cliente, método de pago y estado.|
|📌 **Precondición**|Deben existir productos en el sistema.|
|🎯 **Postcondición**|La venta queda registrada con su resumen de datos.|
|📑 **Flujo principal**|1. Accede al módulo de ventas.2. Hace clic en “Nueva venta”.3. Selecciona productos y cantidades.4. Agrega datos del cliente (opcional).5. Selecciona método de pago y entrega.6. Se calcula automáticamente el total.7. Presiona “Guardar”.|
|⚠️ **Flujos alternativos**|- 3a: No hay stock suficiente → mostrar advertencia.- 4a: Cliente sin datos válidos → mostrar error.- 7a: Fallo en guardar → notificar.|

---

### ✅ CU-SALE-02 – Editar Venta

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-SALE-02|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite modificar información de una venta registrada.|
|📌 **Precondición**|La venta debe estar previamente guardada.|
|🎯 **Postcondición**|Se actualizan los datos de la venta.|
|📑 **Flujo principal**|1. Desde el historial, selecciona venta.2. Presiona “Editar”.3. Cambia datos necesarios.4. Presiona “Guardar cambios”.|
|⚠️ **Flujos alternativos**|- 3a: Cambio inválido (ej. productos eliminados) → advertencia.- 4a: Fallo técnico → mensaje de error.|

---

### ✅ CU-SALE-03 – Calcular Totales Automáticamente

| Ítem                       | Descripción                                                                                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU-SALE-03                                                                                                                                     |
| 👤 **Actor**               | Sistema (automático)                                                                                                                           |
| 📋 **Descripción**         | Calcula subtotal, descuentos, impuestos (si aplica) y total de la venta.                                                                       |
| 📌 **Precondición**        | Deben estar definidos productos y cantidades.                                                                                                  |
| 🎯 **Postcondición**       | Se muestra el total actualizado en tiempo real.                                                                                                |
| 📑 **Flujo principal**     | 1. El usuario selecciona productos.2. El sistema calcula:    - Subtotal    - Descuento (si aplica)    - Impuesto (si aplica)    - Total final. |
| ⚠️ **Flujos alternativos** | - 2a: Inconsistencia en precios → mostrar alerta.                                                                                              |

---

### ✅ CU-SALE-04 – Exportar Venta

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-SALE-04|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite exportar la información de una venta a PDF o Excel.|
|📌 **Precondición**|La venta debe estar registrada.|
|🎯 **Postcondición**|Se descarga un archivo con los detalles.|
|📑 **Flujo principal**|1. Selecciona una venta.2. Presiona “Exportar”.3. Elige formato (PDF o Excel).4. El archivo se genera y descarga.|
|⚠️ **Flujos alternativos**|- 4a: Fallo al generar archivo → mensaje de error.|

---

### ✅ CU-SALE-05 – Filtrar Ventas

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-SALE-05|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite visualizar ventas por fecha, cliente, total, estado.|
|📌 **Precondición**|Debe haber ventas registradas.|
|🎯 **Postcondición**|Se muestran solo las coincidencias filtradas.|
|📑 **Flujo principal**|1. Ingresa a historial de ventas.2. Aplica filtros por campos.3. El sistema actualiza la vista.|
|⚠️ **Flujos alternativos**|- 2a: Filtro sin coincidencias → mostrar mensaje vacío.|

---

### ✅ CU-SALE-06 – Registrar Datos del Cliente

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-SALE-06|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite ingresar datos del cliente durante la venta.|
|📌 **Precondición**|El formulario de venta debe estar activo.|
|🎯 **Postcondición**|Los datos se asocian correctamente a la venta.|
|📑 **Flujo principal**|1. En formulario, completa nombre, teléfono, dirección, notas.2. Presiona “Guardar”.3. Se valida y asocia a la venta.|
|⚠️ **Flujos alternativos**|- 2a: Campo inválido → se marca el error.|

---

### ✅ CU-SALE-07 – Definir Estado de Venta

| Ítem                       | Descripción                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU-SALE-07                                                                                                    |
| 👤 **Actor**               | Dueño de Tienda                                                                                               |
| 📋 **Descripción**         | Permite establecer el estado actual de la venta.                                                              |
| 📌 **Precondición**        | La venta debe existir.                                                                                        |
| 🎯 **Postcondición**       | Se actualiza su estado a: pendiente, confirmada, enviada, entregada, cancelada.                               |
| 📑 **Flujo principal**     | 1. Selecciona una venta.2. Elige el nuevo estado desde un selector.3. El sistema guarda y actualiza la vista. |
| ⚠️ **Flujos alternativos** | - 3a: Error al guardar → se muestra advertencia.                                                              |

---

### ✅ CU-SALE-08 – Definir Método de Pago

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-SALE-08|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite seleccionar el método de pago de una venta.|
|📌 **Precondición**|Debe estar creando o editando una venta.|
|🎯 **Postcondición**|El pago queda registrado como efectivo, tarjeta, transferencia, etc.|
|📑 **Flujo principal**|1. En el formulario, selecciona método.2. El sistema guarda y lo asocia.|
|⚠️ **Flujos alternativos**|- 2a: Método no válido → advertencia.|

---

### ✅ CU-SALE-09 – Definir Método de Entrega

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-SALE-09|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite indicar si la venta es para envío o retiro.|
|📌 **Precondición**|El formulario de venta debe estar activo.|
|🎯 **Postcondición**|Se guarda el método de entrega.|
|📑 **Flujo principal**|1. Selecciona “envío” o “retiro”.2. El sistema guarda la selección.|
|⚠️ **Flujos alternativos**|- 1a: Opción no reconocida → error.|

---

### ✅ CU-SALE-10 – Ver Historial de Ventas

| Ítem                       | Descripción                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU-SALE-10                                                                                                |
| 👤 **Actor**               | Dueño de Tienda                                                                                           |
| 📋 **Descripción**         | Muestra todas las ventas pasadas en forma de historial.                                                   |
| 📌 **Precondición**        | Deben existir ventas en la base.                                                                          |
| 🎯 **Postcondición**       | Se muestran las ventas con opción a exportar, editar o eliminar.                                          |
| 📑 **Flujo principal**     | 1. Accede a historial desde el menú.2. El sistema carga las ventas.3. Se pueden aplicar filtros o buscar. |
| ⚠️ **Flujos alternativos** | - 2a: Lista vacía → mensaje informativo.                                                                  |

---

## 🛒 Módulo: Pedidos 

---

### ✅ CU-ORDER-01 – Generar Link de Tienda

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-ORDER-01|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite generar un link único de tienda para compartir el catálogo y recibir pedidos.|
|📌 **Precondición**|Debe haber productos publicados y tienda activa.|
|🎯 **Postcondición**|Se obtiene un link que puede ser compartido por WhatsApp u otro medio.|
|📑 **Flujo principal**|1. Accede al panel de personalización o pedidos.2. Elige “Compartir tienda”.3. El sistema genera el link.4. Lo copia al portapapeles o permite compartir.|
|⚠️ **Flujos alternativos**|- 3a: Error al generar el link → se muestra mensaje y opción de reintentar.|

---

### ✅ CU-ORDER-02 – Crear Pedido desde Catálogo Público

| Ítem                       | Descripción                                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🆔 **Código**              | CU-ORDER-02                                                                                                                                                                                                                                |
| 👤 **Actor**               | Cliente (externo)                                                                                                                                                                                                                          |
| 📋 **Descripción**         | Permite al cliente seleccionar productos, completar sus datos y enviar un pedido desde el catálogo.                                                                                                                                        |
| 📌 **Precondición**        | El link de la tienda debe estar activo y con productos disponibles.                                                                                                                                                                        |
| 🎯 **Postcondición**       | Se envía el pedido al administrador y se confirma visualmente.                                                                                                                                                                             |
| 📑 **Flujo principal**     | 1. El cliente accede al catálogo desde el link.2. Agrega productos al carrito.3. Completa sus datos.4. Presiona “Enviar pedido”.5. El sistema valida y guarda.6. Se muestra confirmación del envio, resumen y opcion para mandar whatsapp. |
| ⚠️ **Flujos alternativos** | - 3a: Datos incompletos → se muestra error.- 5a: Fallo al guardar pedido → se notifica.                                                                                                                                                    |

---

### ✅ CU-ORDER-03 – Generar ID Automático de Pedido

| Ítem                       | Descripción                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU-ORDER-03                                                                                                      |
| 👤 **Actor**               | Sistema (automático)                                                                                             |
| 📋 **Descripción**         | El sistema asigna un ID único a cada nuevo pedido generado por clientes.                                         |
| 📌 **Precondición**        | Pedido válido enviado por formulario público.                                                                    |
| 🎯 **Postcondición**       | El pedido queda identificado internamente por su código único.                                                   |
| 📑 **Flujo principal**     | 1. Se recibe nuevo pedido desde la web.2. El sistema genera un ID único.3. Se asocia al pedido para seguimiento. |
| ⚠️ **Flujos alternativos** | -                                                                                                                |

---

### ✅ CU-ORDER-04 – Confirmar o Cancelar Pedido

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-ORDER-04|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite gestionar pedidos recibidos, confirmándolos o cancelándolos.|
|📌 **Precondición**|Debe haber pedidos pendientes en el sistema.|
|🎯 **Postcondición**|El pedido cambia su estado a confirmado o cancelado.|
|📑 **Flujo principal**|1. Accede a la lista de pedidos.2. Selecciona uno pendiente.3. Presiona “Confirmar” o “Cancelar”.4. El sistema actualiza el estado.5. Se notifica al cliente (vía WhatsApp o pantalla).|
|⚠️ **Flujos alternativos**|- 3a: Ya fue confirmado/cancelado → advertencia.- 4a: Error al guardar cambios → mensaje.|

---
## 🎨 Módulo: Personalización de Tienda

---
### ✅ CU‑STORE‑02 – Actualizar Información Básica

| Ítem                       | Descripción                                                                                                                                                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU‑STORE‑02                                                                                                                                                                                                    |
| 👤 **Actor**               | Dueño de Tienda                                                                                                                                                                                                |
| 📋 **Descripción**         | Editar nombre, descripción, slug, tipo y categoría de la tienda.                                                                                                                                               |
| 📌 **Precondición**        | Debe existir un perfil de tienda y el usuario estar autenticado.                                                                                                                                               |
| 🎯 **Postcondición**       | `basicInfo` actualizado en Firestore.                                                                                                                                                                          |
| 📑 **Flujo principal**     | 1. Abre “Perfil → Básico”.  <br>2. Modifica: `name`, `description`, `slug`, `type`, `category`.  <br>3. Clic en **Guardar**.  <br>4. Sistema valida unicidad de `slug` y longitudes.  <br>5. Persiste cambios. |
| ⚠️ **Flujos alternativos** | 3a. `slug` ya existe → mensaje “Slug no disponible”.  <br>3b. `name` fuera de rango → “El nombre debe tener 3–50 caracteres”.                                                                                  |

---

### ✅ CU‑STORE‑03 – Actualizar Información de Contacto

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU‑STORE‑03|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Modificar número de WhatsApp y sitio web de la tienda.|
|📌 **Precondición**|Perfil existente; usuario autenticado.|
|🎯 **Postcondición**|`contactInfo.whatsapp` y `contactInfo.website` actualizados.|
|📑 **Flujo principal**|1. Abre “Perfil → Contacto”.2. Edita: `whatsapp`, `website`.3. Clic en **Guardar**.4. Valida regex de teléfono y URL.5. Persiste cambios.|
|⚠️ **Flujos alternativos**|3a. Formato inválido → subraya campo y muestra tooltip de error.|

---

### ✅ CU‑STORE‑04 – Actualizar Dirección Física

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU‑STORE‑04|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Actualizar calle, ciudad, provincia, país, zip code y enlace a Google Maps.|
|📌 **Precondición**|Perfil existente; usuario autenticado.|
|🎯 **Postcondición**|`address` y `mapsLink` actualizados.|
|📑 **Flujo principal**|1. En “Perfil → Dirección”.2. Completa: `street`, `city`, `province`, `country`, `zipCode` y opcional `mapsLink`.3. Guardar.4. Valida campos no vacíos.5. Persiste.|
|⚠️ **Flujos alternativos**|3a. Zip inválido → mensaje de error.|

---

### ✅ CU‑STORE‑05 – Configurar Horario Semanal

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU‑STORE‑05|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Definir apertura, cierre y descanso para cada día de la semana.|
|📌 **Precondición**|Perfil existente; usuario autenticado.|
|🎯 **Postcondición**|`schedule` actualizado con siete objetos `DailySchedule`.|
|📑 **Flujo principal**|1. Accede a “Perfil → Horarios”.2. Para cada día: marca `closed` o completa `open`/`close` y opcional `break`.3. Guardar.4. Valida `open < close`.5. Persiste.|
|⚠️ **Flujos alternativos**|2a. `open ≥ close` → “Hora de apertura debe ser anterior a cierre”.|

---

### ✅ CU‑STORE‑06 – Actualizar Enlaces Sociales

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU‑STORE‑06|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Agregar/editar URLs de Instagram y Facebook.|
|📌 **Precondición**|Perfil existente; usuario autenticado.|
|🎯 **Postcondición**|`socialLinks.instagram` y `socialLinks.facebook` actualizados.|
|📑 **Flujo principal**|1. “Perfil → Redes Sociales”.2. Completa `instagram` y `facebook`.3. Guardar y validar dominios.4. Persiste.|
|⚠️ **Flujos alternativos**|2a. URL no pertenece a facebook.com/instagram.com → error.|

---

### ✅ CU‑STORE‑07 – Configurar Tema / Branding

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU‑STORE‑07|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Personalizar logo, banner, colores y estilo visual de la tienda.|
|📌 **Precondición**|Perfil existente; usuario autenticado; Storage habilitado.|
|🎯 **Postcondición**|`theme` actualizado con URLs e identificadores de color/fuente.|
|📑 **Flujo principal**|1. “Perfil → Tema”.2. Subir `logo`/`banner` a Storage → obtener URL.3. Elegir `primaryColor`, `secondaryColor`, `accentColor`, `fontFamily`, `style`.4. Guardar y persistir.|
|⚠️ **Flujos alternativos**|2a. Imagen supera límite de 1 MB → “Archivo muy grande”.|

---

### ✅ CU‑STORE‑08 – Configurar Métodos de Pago y Entrega

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU‑STORE‑08|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Habilitar y configurar métodos de pago (efectivo, transferencia, mercado pago) y entrega (retiro, delivery).|
|📌 **Precondición**|Perfil existente; usuario autenticado.|
|🎯 **Postcondición**|`settings.paymentMethods[]` y `settings.deliveryMethods[]` actualizados.|
|📑 **Flujo principal**|1. “Perfil → Métodos”.2. En **Pagos** añade/edita cada método (• `id`, `name`, `enabled`, `instructions?`) – ejemplos: `efectivo`, `transferencia`, `mercadopago`.3. En **Entrega** añade/edita (• `id`, `name`, `enabled`, `price?`, `instructions?`) – ejemplos: `retiro`, `delivery`.4. Validar que al menos uno de cada categoría esté activo.5. Guardar y persistir.|
|⚠️ **Flujos alternativos**|3a. No hay método activo → advertencia “Debe haber al menos un método de pago y uno de entrega”.|

---

### ✅ CU‑STORE‑09a – Configurar Notificaciones por WhatsApp

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU‑STORE‑09a|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Activar/desactivar recepción de pedidos vía WhatsApp.|
|📌 **Precondición**|Perfil existente; usuario autenticado.|
|🎯 **Postcondición**|`settings.notifications.receiveOrdersOnWhatsApp` actualizado.|
|📑 **Flujo principal**|1. “Perfil → Notificaciones”.2. Marcar/desmarcar **“Pedidos por WhatsApp”**.3. Guardar.4. Persiste.|
|⚠️ **Flujos alternativos**|—|

---

### ✅ CU‑STORE‑09b – Configurar Notificaciones In‑App

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU‑STORE‑09b|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Activar/desactivar notificaciones dentro de la aplicación.|
|📌 **Precondición**|Perfil existente; usuario autenticado.|
|🎯 **Postcondición**|`settings.notifications.receiveOrdersInApp` actualizado.|
|📑 **Flujo principal**|1. “Perfil → Notificaciones”.2. Marcar/desmarcar **“Pedidos In‑App”**.3. Guardar.4. Persiste.|
|⚠️ **Flujos alternativos**|—|

---

### ✅ CU‑STORE‑09c – Configurar Push Notifications

| Ítem                       | Descripción                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU‑STORE‑09c                                                                        |
| 👤 **Actor**               | Dueño de Tienda                                                                     |
| 📋 **Descripción**         | Activar/desactivar notificaciones push (web/mobile).                                |
| 📌 **Precondición**        | Perfil existente; usuario autenticado; configuración FCM habilitada.                |
| 🎯 **Postcondición**       | `settings.notifications.pushNotifications` actualizado.                             |
| 📑 **Flujo principal**     | 1. “Perfil → Notificaciones”.2. Marcar/desmarcar **“Push”**.3. Guardar.4. Persiste. |
| ⚠️ **Flujos alternativos** | —                                                                                   |
|                            |                                                                                     |

---


### ✅ CU‑STORE‑10 – Gestionar Suscripción

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU‑STORE‑10|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Ver y controlar estado de trial, plan activo, periodo de gracia y datos de facturación.|
|📌 **Precondición**|Perfil existente; usuario autenticado.|
|🎯 **Postcondición**|Campos `subscription` actualizados y backend gestiona fechas según plan y pagos.|
|📑 **Flujo principal**|1. “Perfil → Suscripción”.2. Muestra: `active`, `startDate`, `graceUntil`, `trialUsed`.3. Botón **“Pagar Ahora”** abre modal MercadoPago/Stripe.4. Al confirmar pago, backend guarda `billing` y marca `active=true`, recalcula `graceUntil` según plan.5. Persiste.|
|⚠️ **Flujos alternativos**|3a. En período de gracia (hoy ≤ `graceUntil`) → mostrar alerta “Estás en gracia hasta X”.4a. Pago rechazado → “Error en el pago, intenta nuevamente”.|

---

### 💳 CU‑STORE‑11 – Activar y gestionar prueba gratuita (auto) + método de pago opcional

| Ítem                       | Descripción                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 🆔 **Código**              | CU‑STORE‑10                                                                                                                                                                                                                                                              |
| 👤 **Actor**               | Dueño de tienda                                                                                                                                                                                                                                                          |
| 📋 **Descripción**         | Al crear una tienda, el sistema inicia automáticamente una prueba gratuita de 30 días. El dueño puede (opcionalmente) registrar un método de pago para renovaciones automáticas.                                                                                         |
| 📌 **Precondición**        | El usuario creó la tienda (CU‑TIENDA‑06) y no tiene otra prueba usada en esa tienda (`trialUsed = false`).                                                                                                                                                               |
| 🎯 **Postcondición**       | Se setean:• `subscriptionActive = true`• `trialUsed = true`• `subscriptionStart = now()`• `subscriptionEnd = now() + 30 días`• (Opcional) `billing.provider = "MP"` y `billing.token` si cargó pago.                                                                     |
| 📑 **Flujo principal**     | 1. Tras crear la tienda, el sistema crea automáticamente los campos de trial.2. Se muestra una pantalla “Bienvenido – Prueba activa hasta DD/MM/AAAA”.3. Botón **“Configurar método de pago”** (opcional).4. Si el usuario lo completa, se guardan los datos de billing. |
| ⚠️ **Flujos alternativos** | 3‑a: Rechazo de token/MP → mostrar error y permitir reintentar más tarde.                                                                                                                                                                                                |

---

### ⏳ CU‑STORE‑12 – Verificar suscripción y aplicar período de gracia

| Ítem                       | Descripción                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU‑STORE‑11                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 👤 **Actor**               | Sistema (middleware)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 📋 **Descripción**         | En cada acceso a recursos de la tienda, el sistema evalúa el estado de suscripción: **activa**, **gracia (7 días)** o **suspendida**.                                                                                                                                                                                                                                                                                                                       |
| 📌 **Precondición**        | La tienda tiene `subscriptionEnd` registrado.                                                                                                                                                                                                                                                                                                                                                                                                               |
| 🎯 **Postcondición**       | • Si está activa → acceso normal.• Si expiró pero está dentro de 7 días → acceso limitado + avisos (gracia).• Si excede la gracia → `subscriptionActive = false`, bloqueo total de funciones críticas.                                                                                                                                                                                                                                                      |
| 📑 **Flujo principal**     | 1. Middleware obtiene `now()` y `subscriptionEnd`.2. Calcula `daysLate = now() - subscriptionEnd`.3. **Condiciones**:  a) `now() ≤ subscriptionEnd` → **Activa**: permitir todo.  b) `0 < daysLate ≤ 7` → **Gracia**: permitir panel, pero bloquear nuevas ventas/pedidos y mostrar banner “Suscripción vencida, tienes 7 días para regularizar”.  c) `daysLate > 7` → **Suspendida**: bloquear operaciones de negocio y mostrar vista “Tienda suspendida”. |
| ⚠️ **Flujos alternativos** | –                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

### 🔁 CU‑STORE‑13 – Renovar o pagar anticipadamente la suscripción

| Ítem                       | Descripción                                                                                                                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU‑STORE‑12                                                                                                                                                                                                                                                                                   |
| 👤 **Actor**               | Dueño de tienda                                                                                                                                                                                                                                                                               |
| 📋 **Descripción**         | El dueño puede pagar antes del vencimiento o durante el período de gracia para extender la suscripción (mensual/anual).                                                                                                                                                                       |
| 📌 **Precondición**        | La tienda existe y el usuario es `owner`.                                                                                                                                                                                                                                                     |
| 🎯 **Postcondición**       | Se actualizan:• `subscriptionActive = true`• `subscriptionStart = now()` (o fin del período vigente si se quiere apilar)• `subscriptionEnd = start + período`                                                                                                                                 |
| 📑 **Flujo principal**     | 1. En “Suscripción” pulsa **Renovar / Pagar ahora**.2. Elige plan (mensual/anual).3. Confirma o ingresa método de pago (si no tenía).4. Pasarela cobra el importe.5. Cloud Function actualiza fechas y marca `subscriptionActive = true`.6. Se muestra “Suscripción activa hasta DD/MM/AAAA”. |
| ⚠️ **Flujos alternativos** | 4‑a: Pago rechazado → mostrar error; mantener estado previo (activa/gracia/suspendida).                                                                                                                                                                                                       |

---

### 💳 CU‑STORE‑14 – Administrar método de pago (agregar / cambiar / quitar)

| Ítem                       | Descripción                                                                                                                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🆔 **Código**              | CU‑STORE‑13                                                                                                                                                                                               |
| 👤 **Actor**               | Dueño de tienda                                                                                                                                                                                           |
| 📋 **Descripción**         | Permite gestionar el método de pago usado para próximas renovaciones automáticas (Mercado Pago u otros).                                                                                                  |
| 📌 **Precondición**        | La tienda existe; el usuario es `owner`.                                                                                                                                                                  |
| 🎯 **Postcondición**       | Se actualiza el objeto `billing` en la tienda (`provider`, `token`, `last4`, etc.).                                                                                                                       |
| 📑 **Flujo principal**     | 1. En “Suscripción” → “Método de pago”.2. El usuario agrega o reemplaza el método (checkout MP).3. El sistema valida y guarda el token seguro (en backend).4. Muestra “Método actualizado correctamente”. |
| ⚠️ **Flujos alternativos** | 2‑a: El usuario decide no guardar método → se mantiene vacío (renovará manualmente).3‑a: Error con MP → mostrar error y no guardar.                                                                       |
|                            |                                                                                                                                                                                                           |

---


## 📊 Módulo: Reportes

---

### 📊 CU-REPORT-01 – Generar Reporte por Fechas

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-REPORT-01|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite generar reportes de ventas en un rango de fechas específico.|
|📌 **Precondición**|Deben existir ventas registradas.|
|🎯 **Postcondición**|Se muestra el resumen filtrado de ventas.|
|📑 **Flujo principal**|1. Accede a la sección de reportes.2. Define fecha desde y hasta.3. Presiona “Generar”.4. El sistema carga el resumen.|
|⚠️ **Flujos alternativos**|- 2a: Rango sin resultados → se informa al usuario.|

---

### 📊 CU-REPORT-02 – Exportar Reporte

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-REPORT-02|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Permite exportar el reporte generado a Excel para uso externo.|
|📌 **Precondición**|Debe haber un reporte generado.|
|🎯 **Postcondición**|Se descarga el archivo en formato `.xlsx`.|
|📑 **Flujo principal**|1. Desde el resumen generado, presiona “Exportar”.2. El sistema convierte los datos a Excel.3. Se descarga el archivo.|
|⚠️ **Flujos alternativos**|- 2a: Fallo al exportar → se muestra error.|

---

### 📊 CU-REPORT-03 – Ver Métricas del Negocio

|Ítem|Descripción|
|---|---|
|🆔 **Código**|CU-REPORT-03|
|👤 **Actor**|Dueño de Tienda|
|📋 **Descripción**|Muestra KPIs clave como ganancias, tickets promedio, ventas por hora.|
|📌 **Precondición**|Deben existir ventas y datos suficientes.|
|🎯 **Postcondición**|Se visualiza el dashboard con estadísticas actualizadas.|
|📑 **Flujo principal**|1. Accede al panel de inicio o estadísticas.2. El sistema procesa los datos.3. Se muestran métricas clave.|
|⚠️ **Flujos alternativos**|- 2a: No hay datos → se muestra mensaje "sin estadísticas disponibles".|

---

