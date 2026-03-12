# Onboarding - Funcionalidad

## Objetivo

El onboarding guia al usuario nuevo a traves de la configuracion completa de su tienda en 10 pasos (0-9). Se activa inmediatamente despues del registro (email + password + nombre) y reemplaza el antiguo paso 2 del registro que pedia datos de tienda.

## Flujo general

```
/sign-up (email, password, nombre)
    |
    v
/onboarding (10 pasos: 0-9)
    |
    v
/{slug} (tienda publica) o /dashboard
```

## Tabla de Slices

| Step | Nombre | Tipo | Campos | Validacion | Firestore Path |
|------|--------|------|--------|------------|----------------|
| 0 | Welcome | Interstitial | N/A | N/A | N/A |
| 1 | Nombre y Tipo | Form | `name` (min 2, max 100), `storeType` (enum 5 valores) | Zod required | `basicInfo.name`, `basicInfo.type` |
| 2 | Direccion | Form | `street` (max 200, opcional), `city` (max 100, opcional), `zipCode` (max 20, opcional) | Todos opcionales | `address.street`, `address.city`, `address.zipCode` |
| 3 | Contacto | Form | `whatsapp` (min 10, max 25, prefijo +54) | Zod required | `contactInfo.whatsapp`, `contactInfo.phone` |
| 4 | Descripcion y Slug | Form | `description` (min 10, max 300), `slug` (min 3, max 50, regex) | Zod + DB check | `basicInfo.description`, `basicInfo.slug` |
| 5 | Colores | Form | `primaryColor`, `secondaryColor`, `accentColor` (hex) | Regex hex, opcionales | `theme.primaryColor`, etc |
| 6 | Producto Preview | Read-only | N/A (card contextual) | N/A | N/A |
| 7 | WhatsApp Share | Interstitial | N/A (informativo) | N/A | N/A |
| 8 | QR Info | Interstitial | N/A (informativo) | N/A | N/A |
| 9 | Fin | Interstitial + Submit | N/A | Valida schema completo | `metadata.onboardingCompleted = true` |

## Tipos de tienda (5 opciones)

| Valor | Label | Producto Template |
|-------|-------|-------------------|
| `restaurant` | Restaurante | Hamburguesa Clasica |
| `clothing` | Ropa y Accesorios | Remera Premium Unisex |
| `retail` | Tienda General | Remera Premium Unisex |
| `beauty` | Belleza y Cuidado | Remera Premium Unisex |
| `other` | Otro | Remera Premium Unisex |

Nota: Los tipos `services`, `digital` y similares fueron removidos porque el onboarding esta orientado a negocios que venden productos con delivery.

## Validacion del Slug

### Flujo

1. Al escribir el nombre de la tienda (Step 1), se auto-genera un slug: `"Mi Tienda" -> "mi-tienda"`
2. El slug se muestra en Step 4 como editable
3. Mientras el usuario edita el slug, se aplica debounce (600ms)
4. Se ejecuta `checkSlugAvailabilityAction(slug)` que consulta Firestore
5. UI muestra: check verde (disponible), X roja (tomado), loader (verificando)
6. Si el slug esta tomado y el usuario intenta avanzar, se bloquea con toast de error

### Formato del slug

- Solo minusculas, numeros y guiones: `/^[a-z0-9-]+$/`
- Minimo 3 caracteres, maximo 50
- Se genera automaticamente desde el nombre, no se generan alternativas

## Producto Preview (Step 6)

La card de producto es read-only y se selecciona segun el `storeType`:

- `restaurant` -> Hamburguesa Clasica ($4.500, imagen Unsplash)
- Todos los demas -> Remera Premium Unisex ($12.500, imagen Unsplash)

La card muestra: imagen, nombre, descripcion, precio, categoria, tags, variantes (si retail), y boton deshabilitado "Agregar al carrito".

No se guarda ningun producto en la DB durante el onboarding.

## WhatsApp y QR (Steps 7-8)

Ambos son slices informativos (interstitial) que explican al usuario:

- Step 7: Que puede compartir el link de su catalogo por WhatsApp y redes sociales
- Step 8: Que su tienda tiene un QR personalizado que puede descargar e imprimir

No hay interaccion ni input en estos steps.

## Datos que se guardan al finalizar

Al presionar "Crear mi tienda" en Step 9, se ejecuta `completeNewOnboardingAction` que:

1. Verifica autenticacion (`getServerSession`)
2. Valida datos con `onboardingCompleteSchema` (Zod)
3. Crea la tienda en Firestore (`createStore()`) si no existe
4. Setea custom claims (`storeId`, `role: 'owner'`)
5. Actualiza todos los campos del store:
   - `basicInfo`: name, description, slug, type
   - `contactInfo`: whatsapp, phone
   - `address`: street, city, zipCode
   - `theme`: primaryColor, secondaryColor, accentColor
   - `metadata`: onboardingCompleted=true, onboardingStep='complete'
6. Revalida `/dashboard`
7. Redirige a `/{slug}`

## Cambios respecto a v1

| Aspecto | v1 (anterior) | v2 (actual) |
|---------|---------------|-------------|
| Total slices | 10 | 10 (0-9) |
| Logo | Step 6 (upload) | Eliminado |
| Tipografia/Botones | Step separado | Eliminado |
| Producto | Input (crear) | Card read-only contextual |
| Direccion | No existia | Step 2 (street, city, zipCode) |
| WhatsApp share | No existia | Step 7 (informativo) |
| QR info | No existia | Step 8 (informativo) |
| Tipos de tienda | 12 opciones | 5 opciones (sin servicios) |
| Slug validation | Basica | Real-time con DB check |
| Registro paso 2 | storeName, type, slug, address, phone | Eliminado (movido a onboarding) |

## Server Actions

| Action | Parametros | Retorno | Uso |
|--------|-----------|---------|-----|
| `completeNewOnboardingAction` | `OnboardingCompleteInput` | `{ storeId, done }` | Submit final del wizard v2 |
| `checkSlugAvailabilityAction` | `slug: string` | `{ isAvailable }` | Validacion real-time del slug |
| `completeFullOnboardingAction` | Legacy nested input | `{ storeId, done }` | Backward compat (v1) |
| `getOnboardingStateAction` | N/A | Estado del onboarding | Pagina server (page.tsx) |
