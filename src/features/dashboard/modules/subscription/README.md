# Módulo de Suscripciones

Este módulo maneja toda la funcionalidad relacionada con suscripciones en la aplicación, incluyendo la integración con MercadoPago para procesar pagos recurrentes.

## 📁 Estructura del Módulo

```
subscription/
├── api/                           # Funciones de API para suscripciones
│   └── subscription.api.ts       # API principal de suscripciones
├── components/                    # Componentes React
│   ├── PlanCard.tsx              # Tarjeta de plan de suscripción
│   ├── SubscriptionStatusCard.tsx # Estado actual de suscripción
│   └── SubscriptionModule.tsx     # Componente principal
├── hooks/                         # Custom hooks
│   └── useSubscription.ts         # Hook principal de suscripciones
├── services/                      # Servicios externos
│   └── mercadopago.service.ts     # Integración con MercadoPago
├── types/                         # Definiciones de tipos TypeScript
│   └── subscription.types.ts     # Tipos de suscripciones
├── utils/                         # Utilidades y helpers
│   └── subscription.utils.ts     # Funciones utilitarias
├── validations/                   # Esquemas de validación
│   └── subscription.validations.ts # Validaciones con Zod
└── README.md                      # Este archivo
```

## 🚀 Características

### ✅ Funcionalidades Implementadas

- **Plan Único Premium**: Plan completo de $5000 ARS/mes con acceso total
- **Integración MercadoPago**: Procesamiento de pagos recurrentes con preapproval
- **Estados de Suscripción**: Active, Pending, Cancelled, Expired, Paused
- **Gestión Completa**: Crear, cancelar, pausar y reanudar suscripciones
- **UI Responsiva**: Componentes optimizados para móvil y desktop
- **Validaciones**: Esquemas Zod para validación de datos
- **TypeScript**: Tipado completo en toda la aplicación
- **API Endpoints**: Rutas completas para gestión de suscripciones
- **Hook Personalizado**: useSubscription para manejo de estado
- **Utilidades**: Funciones helper para formateo y validaciones

### 🔄 Flujo de Suscripción

1. **Selección de Plan**: Usuario selecciona el Plan Premium Completo
2. **Creación de Plan**: Se crea automáticamente el plan en MercadoPago
3. **Redirección a Pago**: Usuario es redirigido a MercadoPago para completar el pago
4. **Procesamiento**: MercadoPago procesa el pago y crea la suscripción recurrente
5. **Activación**: Suscripción se activa y usuario obtiene acceso completo
6. **Gestión**: Usuario puede pausar, reanudar o cancelar desde el dashboard

## 🛠️ Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your_access_token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your_public_key
MERCADOPAGO_BASE_URL=https://api.mercadopago.com
MERCADOPAGO_WEBHOOK_URL=https://your-domain.com/api/webhooks/mercadopago

# Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Dependencias

Este módulo utiliza las siguientes dependencias (ya incluidas en el proyecto):

- `zod` - Validación de esquemas
- `lucide-react` - Iconos
- `@/components/ui/*` - Componentes UI base

## 📖 Uso

### Importar el Módulo Completo

```tsx
import { SubscriptionModule } from '@features/dashboard/modules/subscription';

function SubscriptionPage() {
  return (
    <div>
      <SubscriptionModule userId="user-123" />
    </div>
  );
}
```

### Usar Componentes Individuales

```tsx
import { 
  PlanCard, 
  SubscriptionStatusCard, 
  useSubscription 
} from '@features/dashboard/modules/subscription';

function CustomSubscriptionView() {
  const { currentSubscription, availablePlans } = useSubscription('user-123');
  
  return (
    <div>
      <SubscriptionStatusCard subscription={currentSubscription} />
      {availablePlans.map(plan => (
        <PlanCard 
          key={plan.id} 
          plan={plan} 
          onSelect={(planId) => console.log('Selected:', planId)}
        />
      ))}
    </div>
  );
}
```

### Usar Hook de Suscripciones

```tsx
import { useSubscription } from '@features/dashboard/modules/subscription';

function MyComponent() {
  const {
    currentSubscription,
    availablePlans,
    isLoading,
    createSubscription,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription
  } = useSubscription('user-123');

  const handleSelectPlan = async (planId: string) => {
    try {
      const result = await createSubscription({
        planId,
        billingFrequency: 'monthly'
      });
      
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };

  return (
    // Tu componente aquí
  );
}
```

## 🎨 Componentes

### PlanCard

Tarjeta que muestra los detalles de un plan de suscripción.

**Props:**
- `plan: SubscriptionPlan` - Datos del plan
- `isCurrentPlan?: boolean` - Si es el plan actual del usuario
- `isPopular?: boolean` - Si debe mostrarse como "popular"
- `disabled?: boolean` - Si está deshabilitado
- `isLoading?: boolean` - Si está en proceso de carga
- `onSelect: (planId: string) => void` - Callback al seleccionar (requerido)

### SubscriptionStatusCard

Muestra el estado actual de la suscripción del usuario.

**Props:**
- `subscription: Subscription | null` - Datos de la suscripción
- `onCancel?: (subscriptionId: string) => void` - Callback para cancelar
- `onPause?: (subscriptionId: string) => void` - Callback para pausar
- `onResume?: (subscriptionId: string) => void` - Callback para reanudar
- `onUpgrade?: () => void` - Callback para actualizar
- `isLoading?: boolean` - Si está en proceso de carga

### SubscriptionModule

Componente principal que integra toda la funcionalidad.

**Props:**
- `userId: string` - ID del usuario (requerido)

## 🔧 API

### Endpoints Implementados

- `GET /api/subscription/current?userId={userId}` - Obtener suscripción actual del usuario
- `GET /api/subscription/plans` - Obtener el plan premium disponible
- `POST /api/subscription/create` - Crear nueva suscripción con MercadoPago

### Estructura de Datos

#### POST /api/subscription/create

**Request Body:**
```json
{
  "userId": "string",
  "planId": "premium-complete",
  "userEmail": "string",
  "cardTokenId": "string",
  "autoRenew": true
}
```

**Response:**
```json
{
  "subscription": {
    "id": "string",
    "userId": "string",
    "planId": "premium-complete",
    "status": "pending",
    "paymentUrl": "https://mercadopago.com/..."
  },
  "paymentUrl": "https://mercadopago.com/...",
  "message": "Suscripción creada exitosamente"
}
```

## 🧪 Testing

Para probar el módulo:

```bash
# Ejecutar tests unitarios
npm run test subscription

# Ejecutar tests con cobertura
npm run test:coverage subscription

# Ejecutar tests e2e
npm run test:e2e subscription
```

## 🔒 Seguridad

- **Validación de Datos**: Todos los inputs son validados con Zod
- **Sanitización**: Los datos se sanitizan antes del procesamiento
- **Webhooks Seguros**: Verificación de firma de MercadoPago
- **Variables de Entorno**: Credenciales sensibles en variables de entorno

## 📝 Notas de Desarrollo

### Plan Único Implementado

El módulo actualmente implementa un único plan premium:

**Plan Premium Completo** ($5000 ARS/mes)
- Productos ilimitados (9999)
- Órdenes ilimitadas (9999)
- Analytics completos y reportes avanzados
- Dominio personalizado incluido
- Integración completa con WhatsApp Business
- QR Menu personalizable
- Soporte prioritario 24/7
- API completa para integraciones
- Múltiples métodos de pago
- Gestión de inventario avanzada
- Marketing y promociones
- Backup automático de datos

### Servicios Implementados

#### MercadoPagoService
- `createSubscriptionPlan()` - Crea planes en MercadoPago
- `createSubscription()` - Crea suscripciones con preapproval
- `getSubscriptionStatus()` - Obtiene estado de suscripción
- `cancelSubscription()` - Cancela suscripción
- `pauseSubscription()` - Pausa suscripción
- `resumeSubscription()` - Reanuda suscripción

#### SubscriptionAPI
- `getCurrentSubscription()` - Obtiene suscripción actual
- `getAvailablePlans()` - Obtiene planes disponibles
- `createSubscription()` - Crea nueva suscripción
- `cancelSubscription()` - Cancela suscripción
- `upgradeSubscription()` - Actualiza suscripción
- `pauseSubscription()` - Pausa suscripción
- `resumeSubscription()` - Reanuda suscripción

### Tipos TypeScript

El módulo incluye tipos completos para:

- `SubscriptionStatus` - Estados de suscripción
- `PlanType` - Tipos de planes (basic, premium, enterprise)
- `BillingFrequency` - Frecuencia de facturación (monthly, yearly)
- `SubscriptionPlan` - Estructura completa de un plan
- `Subscription` - Estructura completa de una suscripción
- `CreateSubscriptionData` - Datos para crear suscripción
- `MercadoPagoSubscriptionResponse` - Respuesta de MercadoPago
- `SubscriptionStats` - Estadísticas de suscripciones
- `SubscriptionComponentProps` - Props para componentes
- `SubscriptionState` - Estado del hook
- `SubscriptionActions` - Acciones del hook

### Validaciones Zod

Esquemas de validación implementados:

- `createSubscriptionSchema` - Validación para crear suscripción
- `updateSubscriptionSchema` - Validación para actualizar suscripción
- `subscriptionStatusSchema` - Validación de estado
- `subscriptionPlanSchema` - Validación de plan
- `mercadoPagoWebhookSchema` - Validación de webhook
- `subscriptionQuerySchema` - Validación de consultas

### Utilidades

Funciones helper disponibles:

- `formatSubscriptionPrice()` - Formateo de precios
- `getSubscriptionStatusColor()` - Colores por estado
- `getSubscriptionStatusText()` - Texto por estado
- `getDaysUntilExpiry()` - Días hasta expiración
- `isSubscriptionExpiringSoon()` - Verificar si expira pronto
- `canUpgradeToPlan()` - Verificar si puede actualizar
- `calculateYearlyDiscount()` - Calcular descuento anual
- `getPlanById()` - Obtener plan por ID
- `hasFeatureAccess()` - Verificar acceso a características
- `hasReachedProductLimit()` - Verificar límite de productos
- `hasReachedOrderLimit()` - Verificar límite de órdenes

## 🤝 Contribución

Para contribuir al módulo:

1. Sigue las convenciones de código del proyecto
2. Agrega tests para nuevas funcionalidades
3. Actualiza la documentación
4. Asegúrate de que todos los tests pasen

## 📞 Soporte

Para soporte técnico o preguntas sobre el módulo, contacta al equipo de desarrollo.