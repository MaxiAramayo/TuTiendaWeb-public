# Onboarding - Arquitectura

## Cambios en el flujo de autenticacion

### Antes (v1)

```
/sign-up
  Step 1: Email, Password, DisplayName -> Firebase Auth + /users/{userId}
  Step 2: StoreName, StoreType, Slug, Phone -> /stores/{storeId} + custom claims
  -> Redirect /onboarding (10 pasos visuales)
```

### Despues (v2)

```
/sign-up
  Step 1: Email, Password, DisplayName -> Firebase Auth + /users/{userId}
  -> Redirect /onboarding (10 pasos: 0-9)
  -> Step 9 (submit): /stores/{storeId} + custom claims
```

**Cambio clave:** La tienda se crea al finalizar el onboarding, no en el registro. El usuario llega a `/onboarding` sin store.

## Estructura de archivos

```
src/
  features/
    auth/
      schemas/
        onboarding.schema.ts          # Schema Zod (flat, 10 campos)
      actions/
        onboarding.actions.ts          # completeNewOnboardingAction + legacy
        auth.actions.ts                # checkSlugAvailabilityAction (sin cambios)
      components/
        OnboardingWizard.tsx           # Componente principal (574 -> 560 lineas)
        MultiStepRegister.tsx          # Simplificado (104 -> 90 lineas, sin Step 2)
        StoreSetupStep.tsx             # ORPHAN (ya no se importa, legacy)
        UserRegistrationStep.tsx       # Sin cambios
      hooks/
        use-slug-validation.ts         # Sin cambios (usado por StoreSetupStep legacy)
    onboarding/
      data/
        store-types.ts                 # 5 tipos de tienda centralizados
        product-templates.ts           # 2 templates (restaurant + retail)
  app/
    onboarding/
      page.tsx                         # Server Component (pasa defaults al wizard)
    sign-up/
      page.tsx                         # Sin cambios (usa MultiStepRegister)
docs/
  onboarding/
    ONBOARDING_FUNCTIONALITY.md
    ONBOARDING_DESIGN_UX.md
    ONBOARDING_ARCHITECTURE.md         # Este archivo
```

## Schema (onboarding.schema.ts)

### Schema principal (v2 - flat)

```typescript
onboardingCompleteSchema = z.object({
  name: string,           // Step 1
  storeType: enum,        // Step 1
  street: string?,        // Step 2
  city: string?,          // Step 2
  zipCode: string?,       // Step 2
  whatsapp: string,       // Step 3
  description: string,    // Step 4
  slug: string,           // Step 4
  primaryColor: string?,  // Step 5
  secondaryColor: string?,// Step 5
  accentColor: string?,   // Step 5
});
```

### Step field mapping

```typescript
ONBOARDING_STEP_FIELDS: Record<number, string[]> = {
  0: [],                            // welcome
  1: ['name', 'storeType'],         // store name & type
  2: [],                            // address (all optional)
  3: ['whatsapp'],                  // contact
  4: ['description', 'slug'],       // description & slug
  5: [],                            // colors (optional)
  6: [],                            // product preview (read-only)
  7: [],                            // whatsapp share (read-only)
  8: [],                            // QR info (read-only)
  9: [],                            // finish / submit
};
```

Se usa una estructura flat (no nested como v1 con `basicInfo.name`) para simplificar la integracion con React Hook Form y evitar el pattern `register('basicInfo.name')` que causaba problemas de tipado.

### Legacy schemas

Se mantienen `onboardingBasicInfoSchema`, `onboardingDesignSchema`, `onboardingProductSchema` para backward compatibility con stores existentes que usaron el onboarding v1.

## Server Actions

### completeNewOnboardingAction (NUEVO - v2)

```
Input: OnboardingCompleteInput (flat schema)
Flow:
  1. getServerSession() -> verify auth
  2. onboardingCompleteSchema.safeParse(input) -> validate
  3. getCurrentStore(userId, storeId) -> check if store exists
  4. If no store:
     a. createStore({ storeName, storeType, slug, phone, address, ownerId })
     b. setUserClaims(userId, { storeId, role: 'owner' })
     c. revokeUserTokens(userId)
  5. Update store document with all fields:
     - basicInfo.name, description, slug, type
     - contactInfo.whatsapp, phone
     - address.street, city, zipCode
     - theme.primaryColor, secondaryColor, accentColor
     - metadata.onboardingCompleted = true
     - metadata.onboardingStep = 'complete'
  6. revalidatePath('/dashboard')
  7. Return { storeId, done: true }
```

### checkSlugAvailabilityAction (existente, sin cambios)

```
Input: slug: string
Flow:
  1. Validate format (regex, length)
  2. Query Firestore: stores where basicInfo.slug == slug
  3. Return { isAvailable: querySnapshot.empty }
```

### completeFullOnboardingAction (LEGACY - v1)

Se mantiene para backward compat. Acepta `any` como input con la estructura nested `{ basicInfo, design, product }`.

## Firestore writes

### Al crear tienda (createStore)

```
/stores/{storeId}
  basicInfo: { name, slug, description: '', type }
  contactInfo: { whatsapp, email: '', phone }
  address: { street, city: '', state: '', zipCode: '' }
  theme: { primaryColor: '#7C3AED', secondaryColor: '#F3F4F6', ... }
  settings: { paymentMethods: [...], deliveryMethods: [...], currency: 'ARS' }
  subscription: { active: true, plan: 'free' }
  metadata: { ownerId, active: true, onboardingCompleted: false, onboardingStep: 'welcome' }
```

### Al completar onboarding (update)

```
/stores/{storeId}
  basicInfo.name: data.name
  basicInfo.description: data.description
  basicInfo.slug: data.slug
  basicInfo.type: data.storeType
  contactInfo.whatsapp: data.whatsapp
  contactInfo.phone: data.whatsapp
  address.street: data.street
  address.city: data.city
  address.zipCode: data.zipCode
  theme.primaryColor: data.primaryColor
  theme.secondaryColor: data.secondaryColor
  theme.accentColor: data.accentColor
  metadata.onboardingStep: 'complete'
  metadata.onboardingCompleted: true
  metadata.updatedAt: serverTimestamp()
```

## Producto templates

```
src/features/onboarding/data/product-templates.ts

Dos templates:
  restaurant: Hamburguesa Clasica
    - imageUrl: Unsplash (photo-1568901346375-23c9450c58cd)
    - price: 4500
    - tags: ['Popular', 'Recomendado']

  retail: Remera Premium Unisex
    - imageUrl: Unsplash (photo-1521572163474-6864f9cf17ab)
    - price: 12500
    - variants: [Color: Negro, Talle: M]
    - tags: ['Nuevo', 'Destacado']

Seleccion: getProductTemplateKey(storeType)
  restaurant -> 'restaurant'
  todo lo demas -> 'retail'
```

Las imagenes son URLs externas (Unsplash) y no se almacenan en Firebase Storage. Esto reduce complejidad y latencia.

## Slug validation (client-side)

```typescript
// OnboardingWizard.tsx
const checkSlug = useCallback(async (value) => {
  setSlugStatus('checking');
  const result = await checkSlugAvailabilityAction(value);
  setSlugStatus(result.data.isAvailable ? 'available' : 'taken');
}, []);

// Debounce: 600ms
// Auto-generate from name: createSlug(name) on Step 1
// Blocks navigation on Step 4 if slug is 'taken'
```

No se usa el hook `useSlugValidation` del modulo auth porque este genera sugerencias alternativas, lo cual no queremos (requisito: no generar nuevos, solo decirle al usuario que lo modifique).

## Revalidation paths

| Accion | Paths revalidados |
|--------|-------------------|
| `completeNewOnboardingAction` | `/dashboard` |
| `saveOnboardingBasicInfoAction` (legacy) | `/dashboard`, `/dashboard/settings/general` |
| `saveOnboardingDesignAction` (legacy) | `/dashboard/settings/appearance` |
| `createOnboardingProductAction` (legacy) | `/dashboard`, `/dashboard/products` |

## Error handling

| Error | Manejo |
|-------|--------|
| No autenticado | Redirect a `/sign-in` (server) o error toast (client) |
| Zod validation fails | Errores inline por campo |
| Slug taken | X roja + texto "Esta URL ya esta en uso" + bloqueo de navegacion |
| Firestore write fail | Toast generico "No se pudo completar el onboarding" |
| Network error | Toast generico "Ocurrio un error inesperado" |

## Consideraciones de performance

- Imagenes de producto usan `loading="eager"` porque estan en un slide visible
- Framer Motion usa `mode="wait"` para evitar renders simultaneos de slides
- Slug check usa debounce 600ms para no saturar Firestore
- El schema Zod se valida por-step (solo campos del step actual) para evitar bloqueos innecesarios
- La tienda se crea en un solo write (createStore + update) en vez de multiples writes por step
