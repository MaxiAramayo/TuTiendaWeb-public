# Validaciones de Autenticación

Este directorio contiene todos los esquemas de validación para los formularios de autenticación utilizando Zod.

## Archivos

### `registerSchema.ts`
Contiene el esquema de validación para el formulario de registro de usuarios.

**Campos validados:**
- `email`: Email válido y requerido
- `password`: Mínimo 6 caracteres, debe contener al menos una letra minúscula, una mayúscula y un número
- `confirmPassword`: Debe coincidir con la contraseña
- `displayName`: Nombre completo (2-50 caracteres, solo letras y espacios)
- `whatsappNumber`: Número de WhatsApp con código de país
- `storeName`: Nombre de la tienda (3-50 caracteres)
- `storeType`: Tipo de negocio (restaurant, kiosco, other)
- `slug`: URL de la tienda (3-30 caracteres, solo letras minúsculas, números y guiones)
- `terms`: Aceptación de términos y condiciones (debe ser true)

### `loginSchema.ts`
Contiene el esquema de validación para el formulario de inicio de sesión.

**Campos validados:**
- `email`: Email válido y requerido
- `password`: Contraseña requerida
- `remember`: Checkbox opcional para recordar sesión

### `resetPasswordSchema.ts`
Contiene el esquema de validación para el formulario de restablecimiento de contraseña.

**Campos validados:**
- `email`: Email válido y requerido

### `googleProfileSchema.ts`
Contiene el esquema de validación para completar el perfil después del registro con Google.

**Campos validados:**
- `storeName`: Nombre de la tienda (3-50 caracteres)
- `siteName`: URL de la tienda (usando slugSchema)
- `whatsappNumber`: Número de WhatsApp con código de país
- `storeType`: Tipo de negocio (restaurant, kiosco, other)
- `description`: Descripción opcional (máximo 500 caracteres)
- `address`: Objeto opcional con campos de dirección

## Esquemas Reutilizables

### `emailSchema`
Validación de email que se reutiliza en múltiples formularios.

### `passwordSchema`
Validación de contraseña con requisitos de seguridad.

### `slugSchema`
Validación para URLs de tienda (slug):
- 3-30 caracteres
- Solo letras minúsculas, números y guiones
- No puede contener guiones dobles
- No puede empezar o terminar con guión

## Uso

```typescript
import { registerSchema, type RegisterFormData } from '@/features/auth/validation';

// En un componente de formulario
const form = useForm<RegisterFormData>({
  resolver: zodResolver(registerSchema),
  defaultValues: {
    // valores por defecto
  }
});
```

## Tipos

Cada esquema exporta su tipo correspondiente:
- `RegisterFormData`
- `LoginFormData`
- `ResetPasswordFormData`
- `GoogleProfileFormData`

Estos tipos se infieren automáticamente de los esquemas de Zod y garantizan la consistencia entre la validación y los tipos de TypeScript.