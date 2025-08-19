# Reglas de Seguridad de Firebase

Este documento explica las reglas de seguridad implementadas para Firestore y Storage en el proyecto TuTienda.

## 📋 Resumen de Permisos

### Estructura Multi-Tenant
El proyecto utiliza una estructura multi-tenant donde cada tienda tiene su propio espacio de datos:
```
stores/{storeId}/
├── products/     # Productos de la tienda
├── categories/   # Categorías de productos
├── tags/         # Etiquetas de productos
├── sells/        # Ventas de la tienda
└── settings/     # Configuraciones de la tienda
```

### Matriz de Permisos

| Recurso | Sin Auth | Usuario Auth | Propietario Tienda |
|---------|----------|--------------|--------------------|
| **Tiendas** | Lectura | Lectura | CRUD completo |
| **Productos** | Lectura | Lectura | CRUD completo |
| **Categorías** | Lectura | Lectura | CRUD completo |
| **Tags** | Lectura | Lectura | CRUD completo |
| **Ventas** | Crear únicamente | ❌ Sin acceso | CRUD completo |
| **Configuraciones** | ❌ Sin acceso | ❌ Sin acceso | CRUD completo |
| **Imágenes** | Lectura | Lectura | CRUD completo |

## 🔒 Reglas de Firestore

### Funciones Auxiliares

```javascript
// Verificar autenticación
function isAuthenticated() {
  return request.auth != null;
}

// Verificar propiedad de tienda
function isStoreOwner(storeId) {
  return isAuthenticated() && 
         request.auth.uid != null &&
         exists(/databases/$(database)/documents/stores/$(storeId)) &&
         get(/databases/$(database)/documents/stores/$(storeId)).data.ownerId == request.auth.uid;
}
```

### Reglas por Colección

#### 1. Tiendas (`/stores/{storeId}`)
- **Lectura pública**: Permitida para mostrar catálogo
- **Escritura**: Solo propietario

#### 2. Productos (`/stores/{storeId}/products/{productId}`)
- **Lectura pública**: Permitida para catálogo sin registro
- **CRUD**: Solo propietario de la tienda
- **Validación**: Nombre, precio y storeId requeridos

#### 3. Categorías (`/stores/{storeId}/categories/{categoryId}`)
- **Lectura pública**: Permitida para filtros
- **CRUD**: Solo propietario de la tienda
- **Validación**: Nombre y storeId requeridos

#### 4. Tags (`/stores/{storeId}/tags/{tagId}`)
- **Lectura pública**: Permitida para filtros
- **CRUD**: Solo propietario de la tienda
- **Validación**: Nombre y storeId requeridos

#### 5. Ventas (`/stores/{storeId}/sells/{sellId}`)
- **Crear**: Permitido sin autenticación (compras públicas)
- **Leer/Actualizar/Eliminar**: Solo propietario de la tienda
- **Validación**: orderNumber, products, total y date requeridos

#### 6. Configuraciones (`/stores/{storeId}/settings/{settingId}`)
- **CRUD**: Solo propietario de la tienda

#### 7. Usuarios (`/users/{userId}`)
- **CRUD**: Solo el propio usuario

## 🖼️ Reglas de Storage

### Estructura de Archivos
```
storage/
├── stores/{storeId}/
│   ├── products/        # Imágenes de productos
│   └── branding/        # Logos y banners
├── users/{userId}/
│   └── avatar/          # Avatar del usuario
└── temp/{userId}/       # Archivos temporales
```

### Reglas por Directorio

#### 1. Imágenes de Tiendas (`/stores/{storeId}/**`)
- **Lectura pública**: Permitida
- **Escritura/Eliminación**: Solo propietario
- **Validación**: Solo imágenes, máximo 5MB

#### 2. Avatares de Usuario (`/users/{userId}/avatar/**`)
- **CRUD**: Solo el propio usuario
- **Validación**: Solo imágenes, máximo 5MB

#### 3. Archivos Temporales (`/temp/{userId}/**`)
- **CRUD**: Solo el propio usuario
- **Nota**: Se eliminan automáticamente después de 24 horas

## 🚀 Implementación

### 1. Aplicar Reglas de Firestore

```bash
# Instalar Firebase CLI si no está instalado
npm install -g firebase-tools

# Inicializar Firebase en el proyecto
firebase init firestore

# Aplicar las reglas
firebase deploy --only firestore:rules
```

### 2. Aplicar Reglas de Storage

```bash
# Inicializar Storage
firebase init storage

# Aplicar las reglas
firebase deploy --only storage
```

### 3. Verificar Implementación

```bash
# Probar las reglas localmente
firebase emulators:start --only firestore,storage

# Ejecutar tests de seguridad
npm run test:security
```

## 🔍 Casos de Uso Validados

### ✅ Permitidos

1. **Usuario no registrado**:
   - Ver catálogo de productos
   - Ver categorías y tags
   - Crear una venta (compra)
   - Ver imágenes de productos

2. **Usuario registrado**:
   - Todo lo anterior
   - Gestionar su perfil
   - Subir avatar

3. **Propietario de tienda**:
   - Todo lo anterior
   - CRUD completo de productos
   - CRUD completo de categorías y tags
   - Ver, editar y eliminar ventas
   - Gestionar configuraciones
   - Subir imágenes de productos
   - Gestionar branding de la tienda

### ❌ Denegados

1. **Usuario no registrado**:
   - Ver ventas de cualquier tienda
   - Modificar productos, categorías o tags
   - Acceder a configuraciones

2. **Usuario registrado (no propietario)**:
   - Ver ventas de otras tiendas
   - Modificar productos de otras tiendas
   - Acceder a configuraciones de otras tiendas

3. **Propietario de tienda**:
   - Acceder a datos de otras tiendas
   - Modificar usuarios que no sean él mismo

## 🛡️ Validaciones de Datos

### Productos
- `name`: String no vacío
- `price`: Número >= 0
- `storeId`: Requerido

### Categorías y Tags
- `name`: String no vacío
- `storeId`: Requerido

### Ventas
- `orderNumber`: Requerido
- `products`: Array no vacío
- `total`: Número > 0
- `date`: Requerido

### Imágenes
- Tipo: Solo imágenes (`image/*`)
- Tamaño: Máximo 5MB

## 🔧 Mantenimiento

### Monitoreo
- Revisar logs de Firebase Console regularmente
- Monitorear intentos de acceso denegado
- Verificar uso de Storage

### Actualizaciones
- Probar cambios en emulador local
- Aplicar en entorno de desarrollo primero
- Documentar cambios en este archivo

### Backup
- Las reglas están versionadas en Git
- Mantener backup de configuración de Firebase
- Documentar cambios importantes

## 📞 Soporte

Para dudas sobre las reglas de seguridad:
1. Revisar logs en Firebase Console
2. Probar en emulador local
3. Consultar documentación oficial de Firebase
4. Revisar este documento

---

**Última actualización**: $(date)
**Versión de reglas**: 1.0.0
**Compatibilidad**: Firebase v9+