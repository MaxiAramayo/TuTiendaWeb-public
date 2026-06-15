# 10 · Guía Unit (Fase 1)

Base de la pirámide: schemas Zod, funciones puras y componentes/forms.

## 10.1 Schemas Zod — el corazón de la validación

Hay **15 schemas** con validaciones complejas. Para cada uno se prueba con
`.safeParse()`: aceptación del input válido, rechazo con el **mensaje exacto**
por cada regla, transformaciones y bordes.

### Helper de mensajes

```ts
import type { SafeParseReturnType } from 'zod';

export function issueFor(
  result: SafeParseReturnType<unknown, unknown>,
  path: string,
): string | undefined {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path.join('.') === path)?.message;
}
```

### Patrón por schema

```ts
describe('registerSchema', () => {
  const valid = { email: 'a@b.com', password: 'Abcdef12', confirmPassword: 'Abcdef12', displayName: 'Juan' };

  it('acepta un registro válido y normaliza el email', () => {
    const r = registerSchema.safeParse({ ...valid, email: '  A@B.COM ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('a@b.com');
  });

  it('rechaza password sin mayúscula', () => {
    const r = registerSchema.safeParse({ ...valid, password: 'abcdef12', confirmPassword: 'abcdef12' });
    expect(issueFor(r, 'password')).toBe('La contraseña debe tener al menos una mayúscula');
  });

  it('rechaza cuando las contraseñas no coinciden', () => {
    const r = registerSchema.safeParse({ ...valid, confirmPassword: 'Otra1234' });
    expect(issueFor(r, 'confirmPassword')).toBe('Las contraseñas no coinciden');
  });
});
```

> Los textos de los mensajes deben leerse del schema real antes de escribir el
> test (no inventarlos). Si el schema no tiene mensaje custom, se afirma el
> mensaje por defecto de Zod que corresponda.

### Schemas a cubrir (con foco)

| Schema | Archivo | Foco crítico |
|--------|---------|--------------|
| login | `auth/schemas/login.schema.ts` | email RFC, password min 6, trim/lowercase |
| register | `auth/schemas/register.schema.ts` | regex OWASP (mayúscula+número), refine confirmPassword |
| store-setup | `auth/schemas/store-setup.schema.ts` | enum errorMap (12 tipos), slug regex, E.164 |
| onboarding | `auth/schemas/onboarding.schema.ts` | validación por paso (`ONBOARDING_STEP_FIELDS`), hex colors |
| product | `products/schemas/product.schema.ts` | coerce price positivo, preprocess subcategoría vacía |
| category | `products/schemas/category.schema.ts` | refine nombre con letra/número, slug |
| product-import | `products/schemas/product-import.schema.ts` | **transform de `extras` "Nombre:Precio;…"**, split tags, `activo`→bool, límite 300 |
| checkout | `store/schemas/checkout.schema.ts` | `publicCheckoutItemSchema` **sin precios**, refine dirección si delivery, mensajes ES |
| store | `store/schemas/store.schema.ts` | whatsapp +54, IG/FB URL, scheduleSchema (doble refine open<close), hex/time |
| sell | `dashboard/.../sells/schemas/sell.schema.ts` | saleItem, totals, refine createSale |
| profile | `dashboard/.../store-settings/schemas/profile.schema.ts` | imageUpload (File + MIME + 5MB), whatsapp flexible, slug |

Cada schema lleva su **matriz** en [`matrices/`](./matrices/).

## 10.2 Funciones puras

Determinísticas, sin I/O. Candidatas (ver plan Fase 1B):

- `shared/utils/format.utils.ts` — `formatPrice`, `formatNumber`, `formatDate`,
  `formatTime`, `generateSlug`, `formatWhatsAppNumber`. *(ya implementado: `format.utils.test.ts`)*
- `shared/utils/firestore-serializer.ts` — `serializeFirestoreData` (timestamps anidados).
- `lib/utils/firestore.ts` — `cleanForFirestore` (preserva null/''/0/false, quita undefined).
- `dashboard/.../sells/utils/sell.utils.ts` — `calculateItemSubtotal`,
  `filterByDateRange`, `sortSales`, `generateSalesCSV` (escaping), etc.
- `products/utils/product.utils.ts` — labels/colors de estado, imagen principal.
- `products/services/category.service.ts` (helpers) — `slugify`, `normalizeName`,
  `sameScope`, `byOrderThenName`.
- `store/utils/whatsapp.utils.ts` — `formatWhatsAppMessageFromSale` (con/sin
  delivery, variantes, notas).

## 10.3 Componentes y formularios

Con Testing Library + `user-event`. Foco: **validación visible** y estados
`disabled`/`pending`, no estilos.

```tsx
it('muestra error si el precio es inválido', async () => {
  const user = userEvent.setup();
  render(<ProductForm {...props} />);
  await user.type(screen.getByLabelText(/precio/i), '-5');
  await user.click(screen.getByRole('button', { name: /guardar/i }));
  expect(await screen.findByText('El precio debe ser positivo')).toBeInTheDocument();
});
```

Componentes prioritarios: `LoginForm`, `RegisterForm`/`MultiStepRegister`,
`OnboardingWizard`, `product-form`, `CheckoutForm`, y secciones de settings con
validación (`BasicInfoSection`, `ContactInfoSection`, `ScheduleSection`).

> Server Actions invocadas desde el form se mockean en el test de componente
> (`vi.mock` del módulo de actions). La lógica real de la action se prueba en
> integración (Fase 2), no acá.
