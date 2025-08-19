# ProfileStore - Refactorización por Secciones

## Descripción General

El `profileStore` ha sido completamente refactorizado para permitir actualizaciones por secciones específicas en lugar de actualizar todo el perfil completo. Esta mejora proporciona:

- **Mejor rendimiento**: Solo se actualizan los campos necesarios
- **Mejor experiencia de usuario**: Estados de carga independientes por sección
- **Mejor organización del código**: Separación clara de responsabilidades
- **Mejor debugging**: Errores específicos por sección

## Estructura de Secciones

El perfil está dividido en las siguientes secciones:

### 1. **basic** - Información Básica
- `name`: Nombre de la tienda
- `descripcion`: Descripción de la tienda
- `siteName`: Nombre del sitio web

### 2. **contact** - Información de Contacto
- `whatsapp`: Número de WhatsApp
- `instagram`: Usuario de Instagram
- `facebook`: Página de Facebook
- `website`: Sitio web

### 3. **address** - Dirección
- `street`: Calle
- `city`: Ciudad
- `province`: Provincia
- `country`: País
- `zipCode`: Código postal

### 4. **schedule** - Horarios
- `openinghours`: Horarios de apertura (texto)
- `schedule`: Horarios detallados por día

### 5. **paymentDelivery** - Pagos y Entregas
- `paymentMethods`: Métodos de pago disponibles
- `deliveryMethods`: Métodos de entrega disponibles

### 6. **theme** - Tema y Colores
- `primaryColor`: Color primario
- `secondaryColor`: Color secundario

### 7. **settings** - Configuración General
- `currency`: Moneda
- `language`: Idioma
- `timezone`: Zona horaria
- `storeType`: Tipo de tienda
- `category`: Categoría

### 8. **notifications** - Notificaciones
- `receiveOrdersOnWhatsApp`: Recibir pedidos por WhatsApp
- `receiveOrdersInApp`: Recibir pedidos en la app
- `pushNotifications`: Notificaciones push

## API del Store

### Métodos de Actualización por Sección

```typescript
// Actualizar información básica
const success = await updateBasicInfo(userId, {
  name: 'Mi Tienda',
  descripcion: 'Descripción actualizada'
});

// Actualizar contacto
const success = await updateContactInfo(userId, {
  whatsapp: '+1234567890',
  instagram: '@mitienda'
});

// Actualizar dirección
const success = await updateAddress(userId, {
  street: 'Calle Principal 123',
  city: 'Ciudad'
});

// Actualizar horarios
const success = await updateSchedule(userId, {
  openinghours: '9:00 - 18:00'
});

// Actualizar pagos y entregas
const success = await updatePaymentDelivery(userId, {
  paymentMethods: [...],
  deliveryMethods: [...]
});

// Actualizar tema
const success = await updateTheme(userId, {
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981'
});

// Actualizar configuración
const success = await updateSettings(userId, {
  currency: 'ARS',
  language: 'es'
});

// Actualizar notificaciones
const success = await updateNotifications(userId, {
  receiveOrdersOnWhatsApp: true,
  pushNotifications: false
});
```

### Métodos de Utilidad

```typescript
// Obtener estado de una sección
const basicState = getSectionState('basic');
console.log({
  isSaving: basicState.isSaving,
  isDirty: basicState.isDirty,
  lastSaved: basicState.lastSaved,
  error: basicState.error
});

// Obtener configuración de una sección
const config = getSectionConfig('basic');
console.log({
  name: config.name,
  fields: config.fields
});

// Marcar sección como modificada
markSectionDirty('basic');

// Marcar sección como limpia
markSectionClean('basic');

// Validar datos de una sección
const isValid = validateSectionData('basic', {
  name: 'Test Store'
});
```

### Método Legacy

```typescript
// Método legacy (mantiene compatibilidad)
const success = await updateProfile(userId, fullProfileData);
```

## Estados por Sección

Cada sección mantiene su propio estado independiente:

```typescript
interface SectionState {
  isSaving: boolean;     // Si está guardando
  isDirty: boolean;      // Si tiene cambios sin guardar
  lastSaved: Date | null; // Última vez que se guardó
  error: string | null;   // Error específico de la sección
}
```

## Tipos de Datos

### Interfaces por Sección

```typescript
interface BasicInfoData {
  name?: string;
  descripcion?: string;
  siteName?: string;
}

interface ContactData {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}

interface AddressData {
  street?: string;
  city?: string;
  province?: string;
  country?: string;
  zipCode?: string;
}

// ... otras interfaces
```

## Ejemplos de Uso

### Componente Básico

```typescript
import { useProfileStore } from './api/profileStore';

function BasicInfoForm() {
  const { updateBasicInfo, getSectionState } = useProfileStore();
  const basicState = getSectionState('basic');
  
  const handleSubmit = async (data) => {
    const success = await updateBasicInfo('user123', data);
    if (success) {
      console.log('Información básica actualizada');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {basicState.isSaving && <p>Guardando...</p>}
      {basicState.error && <p>Error: {basicState.error}</p>}
      {/* campos del formulario */}
    </form>
  );
}
```

### Hook Personalizado

```typescript
function useProfileSection(sectionId: string) {
  const {
    getSectionState,
    markSectionDirty,
    markSectionClean
  } = useProfileStore();
  
  const state = getSectionState(sectionId);
  
  return {
    ...state,
    markDirty: () => markSectionDirty(sectionId),
    markClean: () => markSectionClean(sectionId),
    canSave: !state.isSaving && state.isDirty
  };
}
```

## Migración desde la Versión Anterior

### Antes (Versión Legacy)
```typescript
// Actualizar todo el perfil
const success = await updateProfile(userId, {
  name: 'Mi Tienda',
  whatsapp: '+1234567890',
  primaryColor: '#3B82F6',
  // ... todos los campos
});
```

### Después (Versión Refactorizada)
```typescript
// Actualizar solo información básica
const success1 = await updateBasicInfo(userId, {
  name: 'Mi Tienda'
});

// Actualizar solo contacto
const success2 = await updateContactInfo(userId, {
  whatsapp: '+1234567890'
});

// Actualizar solo tema
const success3 = await updateTheme(userId, {
  primaryColor: '#3B82F6'
});
```

## Beneficios de la Refactorización

1. **Rendimiento Mejorado**: Solo se actualizan los campos necesarios en Firestore
2. **UX Mejorada**: Estados de carga independientes por sección
3. **Debugging Simplificado**: Errores específicos por sección
4. **Código Más Mantenible**: Separación clara de responsabilidades
5. **Flexibilidad**: Fácil agregar nuevas secciones
6. **Compatibilidad**: Mantiene el método legacy para compatibilidad

## Archivos Relacionados

- `profileStore.ts`: Store principal refactorizado
- `profileStore.usage.example.ts`: Ejemplos de uso completos
- `PaymentDeliverySection.tsx`: Componente que usa el store refactorizado

## Configuración de Secciones

La configuración de secciones está centralizada en `PROFILE_SECTIONS`:

```typescript
const PROFILE_SECTIONS = {
  basic: {
    name: 'Información Básica',
    fields: ['name', 'descripcion', 'siteName']
  },
  contact: {
    name: 'Información de Contacto',
    fields: ['whatsapp', 'instagram', 'facebook', 'website']
  },
  // ... otras secciones
};
```

Esta configuración permite:
- Validación automática de campos
- Generación de tipos TypeScript
- Fácil mantenimiento y extensión