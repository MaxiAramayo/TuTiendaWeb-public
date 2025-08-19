# Módulo de Autenticación

## Descripción General

El módulo de autenticación maneja todo el flujo de registro, inicio de sesión y gestión de usuarios en la aplicación TuTienda. Está construido sobre Firebase Authentication y proporciona una interfaz unificada para diferentes métodos de autenticación.

## Estructura del Módulo

```
src/features/auth/
├── components/           # Componentes de UI
│   ├── AuthLayout.tsx   # Layout común para páginas de auth
│   ├── GoogleButton.tsx # Botón de autenticación con Google
│   ├── LoginForm.tsx    # Formulario de inicio de sesión
│   ├── RegisterForm.tsx # Formulario de registro
│   ├── MultiStepRegister.tsx # Registro multi-paso
│   ├── UserRegistrationStep.tsx # Primer paso del registro
│   └── StoreSetupStep.tsx # Segundo paso del registro
├── hooks/               # Hooks personalizados
│   └── useAuth.ts      # Hook principal de autenticación
├── services/           # Servicios de datos
│   └── authService.ts  # Servicio de Firebase Auth
├── utils/              # Utilidades
│   └── errorHandling.ts # Manejo centralizado de errores
├── constants/          # Constantes
│   └── authErrors.ts   # Códigos y mensajes de error
└── auth.types.ts       # Tipos TypeScript
```

## Características Principales

### 1. Múltiples Métodos de Autenticación
- **Email/Contraseña**: Registro e inicio de sesión tradicional
- **Google OAuth**: Autenticación con cuenta de Google
- **Recuperación de contraseña**: Envío de emails de reset

### 2. Registro Multi-Paso
- **Paso 1**: Información del usuario (email, nombre, términos)
- **Paso 2**: Configuración de la tienda (nombre, tipo, WhatsApp)
- **Integración Google**: Los usuarios de Google pueden unirse en cualquier paso

### 3. Manejo Inteligente de Usuarios
- **Usuarios nuevos**: Flujo completo de registro
- **Usuarios existentes**: Redirección directa al dashboard
- **Perfiles incompletos**: Detección y redirección a completar configuración
- **Prevención de duplicados**: Verificación en Firestore antes de crear usuarios

### 4. Gestión de Estados
- **Loading states**: Indicadores de carga durante operaciones
- **Error handling**: Manejo centralizado y localizado de errores
- **Toast notifications**: Feedback inmediato al usuario
- **Redirecciones automáticas**: Navegación inteligente post-autenticación

## Flujos de Usuario

### Registro con Email
1. Usuario completa formulario de registro
2. Se valida disponibilidad del slug de tienda
3. Se crea cuenta en Firebase Auth
4. Se crea documento de usuario en Firestore
5. Se crea tienda asociada
6. Redirección al dashboard

### Registro con Google
1. Usuario hace clic en "Continuar con Google"
2. Popup de Google OAuth
3. Si es usuario nuevo:
   - Se crea documento básico en Firestore
   - Se procede al paso 2 del registro (configuración de tienda)
4. Si es usuario existente:
   - Se verifica si tiene tienda configurada
   - Si no tiene tienda: va a completar perfil
   - Si tiene tienda: va al dashboard

### Inicio de Sesión
1. Usuario ingresa credenciales
2. Validación con Firebase Auth
3. Carga de datos del usuario desde Firestore
4. Sincronización de estados
5. Redirección al dashboard

## Integración con Firebase

### Authentication
- Configuración en `src/lib/firebase/client.ts`
- Métodos soportados: Email/Password, Google OAuth
- Manejo de tokens y sesiones automático

### Firestore
- Colección `users`: Datos de usuario y referencias a tiendas
- Colección `stores`: Información de tiendas asociadas
- Sincronización automática entre Auth y Firestore

## Seguridad

### Validaciones
- **Client-side**: Validación de formularios con react-hook-form
- **Server-side**: Reglas de Firestore Security Rules
- **Sanitización**: Limpieza de datos antes de almacenar

### Manejo de Errores
- **Códigos específicos**: Mapeo de errores de Firebase a mensajes localizados
- **Logging**: Registro de errores para debugging
- **Fallbacks**: Mensajes genéricos para errores no mapeados

## Configuración

### Variables de Entorno
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... otras variables de Firebase
```

### Dependencias
- `firebase`: SDK de Firebase
- `react-hook-form`: Manejo de formularios
- `sonner`: Notificaciones toast
- `zustand`: Gestión de estado global

## Testing

### Casos de Prueba Recomendados
1. **Registro exitoso** con email y Google
2. **Inicio de sesión** con credenciales válidas e inválidas
3. **Recuperación de contraseña** con emails válidos e inválidos
4. **Manejo de errores** de red y Firebase
5. **Flujos de redirección** según estado del usuario
6. **Prevención de duplicados** en registro con Google

## Troubleshooting

### Problemas Comunes

#### Error: "Firebase API key not valid"
- Verificar variables de entorno
- Confirmar configuración en Firebase Console

#### Error: "Popup closed by user"
- Usuario canceló el flujo de Google OAuth
- Manejar gracefully sin mostrar error crítico

#### Usuarios duplicados
- Verificar que `getAdditionalUserInfo` funcione correctamente
- Confirmar verificación en Firestore antes de crear documentos

#### Toast duplicados
- Verificar que solo un componente muestre notificaciones
- Usar parámetro `showToast: false` en servicios cuando sea necesario

## Próximas Mejoras

1. **Autenticación de dos factores (2FA)**
2. **Inicio de sesión con redes sociales adicionales**
3. **Verificación de email obligatoria**
4. **Límites de intentos de inicio de sesión**
5. **Auditoría de sesiones y actividad**

## Enlaces Relacionados

- [Documentación de Firebase Auth](https://firebase.google.com/docs/auth)
- [React Hook Form](https://react-hook-form.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Sonner](https://sonner.emilkowal.ski/)