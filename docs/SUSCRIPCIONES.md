# Sistema de Suscripciones con MercadoPago

## Descripción General

Este sistema implementa un plan único de suscripción de **$5000 ARS mensuales** que proporciona acceso completo a todas las funciones de la tienda online.

## Plan Disponible

### Plan Premium Completo
- **Precio**: $5000 ARS/mes
- **ID**: `premium-complete`
- **Tipo**: `premium`
- **Frecuencia**: Mensual

### Características Incluidas
- ✅ Productos ilimitados
- ✅ Órdenes ilimitadas
- ✅ Analytics completos y reportes avanzados
- ✅ Dominio personalizado incluido
- ✅ Integración completa con WhatsApp Business
- ✅ QR Menu personalizable
- ✅ Soporte prioritario 24/7
- ✅ API completa para integraciones
- ✅ Múltiples métodos de pago
- ✅ Gestión de inventario avanzada
- ✅ Marketing y promociones
- ✅ Backup automático de datos

## Integración con MercadoPago

### Configuración Requerida

1. **Variables de Entorno**:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token-here
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-your-public-key-here
   MERCADOPAGO_BASE_URL=https://api.mercadopago.com
   MERCADOPAGO_WEBHOOK_URL=https://your-domain.com/api/webhooks/mercadopago
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Credenciales de MercadoPago**:
   - Accede a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/)
   - Crea una aplicación
   - Obtén tu Access Token y Public Key
   - Configura las variables de entorno

### Flujo de Suscripción

1. **Creación del Plan**:
   - Se crea automáticamente un plan en MercadoPago usando `/preapproval_plan`
   - Configuración: mensual, $5000 ARS, 12 repeticiones

2. **Creación de Suscripción**:
   - Se usa el endpoint `/preapproval` con plan asociado
   - Requiere: `card_token_id` y status `authorized`
   - Genera un `init_point` para el checkout

3. **Procesamiento de Pagos**:
   - Primer pago se acredita en 1 hora
   - Reintentos automáticos (máximo 4 intentos)
   - Cancelación automática después de 3 cuotas rechazadas

## APIs Disponibles

### GET `/api/subscription/plans`
Obtiene el plan de suscripción disponible.

**Respuesta**:
```json
{
  "plans": [
    {
      "id": "premium-complete",
      "name": "Plan Premium Completo",
      "price": 5000,
      "currency": "ARS",
      "billingFrequency": "monthly",
      "features": [...]
    }
  ]
}
```

### POST `/api/subscription/create`
Crea una nueva suscripción.

**Request**:
```json
{
  "userId": "user-123",
  "planId": "premium-complete",
  "userEmail": "user@example.com",
  "cardTokenId": "card-token-from-mercadopago",
  "autoRenew": true
}
```

**Respuesta**:
```json
{
  "subscription": {
    "id": "mp-subscription-id",
    "userId": "user-123",
    "planId": "premium-complete",
    "status": "pending",
    "paymentUrl": "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=..."
  },
  "paymentUrl": "https://checkout-url",
  "message": "Suscripción creada exitosamente. Completa el pago para activarla."
}
```

### GET `/api/subscription/current?userId=user-123`
Obtiene la suscripción actual del usuario.

## Estructura de Archivos

```
src/
├── app/api/subscription/
│   ├── plans/route.ts          # API para obtener planes
│   ├── create/route.ts         # API para crear suscripciones
│   └── current/route.ts        # API para obtener suscripción actual
├── features/dashboard/modules/subscription/
│   ├── types/subscription.types.ts     # Tipos TypeScript
│   ├── services/mercadopago.service.ts # Servicio de MercadoPago
│   ├── utils/subscription.utils.ts     # Utilidades
│   └── validations/subscription.validations.ts # Validaciones
```

## Consideraciones de Seguridad

1. **Variables de Entorno**:
   - Nunca commitear credenciales reales
   - Usar variables TEST en desarrollo
   - Usar variables PROD en producción

2. **Validaciones**:
   - Validar todos los parámetros de entrada
   - Verificar la configuración de MercadoPago
   - Manejar errores apropiadamente

3. **Webhooks**:
   - Implementar validación de firma
   - Procesar notificaciones de estado
   - Actualizar base de datos según eventos

## Estados de Suscripción

- `pending`: Suscripción creada, esperando primer pago
- `active`: Suscripción activa y funcionando
- `cancelled`: Suscripción cancelada por el usuario
- `expired`: Suscripción expirada por falta de pago
- `paused`: Suscripción pausada temporalmente

## Próximos Pasos

1. **Implementar Webhooks**: Para recibir notificaciones de MercadoPago
2. **Base de Datos**: Persistir suscripciones en Firebase/PostgreSQL
3. **Dashboard**: Interfaz para gestionar suscripciones
4. **Notificaciones**: Emails y notificaciones push
5. **Reportes**: Analytics de suscripciones y revenue

## Documentación Oficial

- [MercadoPago Suscripciones](https://www.mercadopago.com.ar/developers/es/docs/subscriptions/overview)
- [Suscripciones con Plan Asociado](https://www.mercadopago.com.ar/developers/es/docs/subscriptions/integration-configuration/subscription-associated-plan)
- [API Reference](https://www.mercadopago.com.ar/developers/es/reference/subscriptions/_preapproval/post)