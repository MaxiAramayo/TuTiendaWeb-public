# Modelo de datos, roles e integraciones — TuTiendaWeb

Doc autoritativa por tema en [`docs/arquitectura/`](../../../../docs/arquitectura/). Este archivo es el resumen operativo para escribir codigo.

## Contenido
- [Colecciones Firestore](#colecciones-firestore)
- [Estructura Sale](#estructura-sale)
- [ActionResponse](#actionresponse)
- [Roles, ownership y sesion](#roles-ownership-y-sesion)
- [Reglas Firestore](#reglas-firestore)
- [Integraciones: WhatsApp y MercadoPago](#integraciones-whatsapp-y-mercadopago)
- [Storage](#storage)
- [Variables de entorno](#variables-de-entorno)

---

## Colecciones Firestore

```
/users/{userId}
  uid, email, displayName, photoURL?, phone?,
  role, storeIds[], currentStoreId?, createdAt, updatedAt

/stores/{storeId}
  basicInfo:    { name, description, slug, type }
  contactInfo:  { whatsapp, website, email }        // whatsapp = numero del comercio
  address:      { street, city, province, country, zipCode }
  socialLinks:  { instagram, facebook, twitter, tiktok }
  theme:        { logoUrl, bannerUrl, primaryColor, secondaryColor, accentColor, fontFamily, style, buttonStyle }
  schedule:     { monday..sunday: { closed, periods: [{ open, close, nextDay }] } }
  settings:     { currency, language, paymentMethods[], deliveryMethods[] }
  subscription: { active, plan, paymentStatus, startDate, endDate, billing:{ provider, autoRenew } }
  metadata:     { ownerId, createdAt, updatedAt, version, status }   // ownerId = canonico para permisos

/stores/{storeId}/products/{productId}
  name, price, categoryId, tags[], variants[], status, imageUrls[], storeId, createdAt, updatedAt

/stores/{storeId}/categories/{categoryId}
  name, slug, parentId, order?, storeId, isActive, createdAt, updatedAt
  # order: orden manual entre hermanas (mismo parentId); reorderCategories() lo persiste en batch
  #        y define el orden por defecto del catalogo publico (getStoreCategoryOrder)

/stores/{storeId}/tags/{tagId}
  name, storeId, createdAt, updatedAt

/stores/{storeId}/sells/{sellId}     // ver estructura Sale abajo
```

`subscription` arranca como trial: `{ active:true, plan:'trial', paymentStatus:'trial', endDate: now+7d, billing:{ provider:'none', autoRenew:false } }` (lo inicializa `createStore`). El ciclo real (trial → `pro`) lo gestionan las Cloud Functions del repo separado, no esta app.

## Estructura Sale

Estructura **anidada** (la plana `OptimizedSell` es obsoleta — ver `docs/arquitectura/sells.md`). Modulo en `src/features/dashboard/modules/sells/`.

```typescript
interface Sale {
  id: string;
  orderNumber: string;
  storeId: string;
  source: 'local' | 'web' | 'whatsapp';
  customer: { name: string; phone?: string; email?: string };
  items: SaleItem[];   // SaleItem: { productName, quantity, unitPrice, subtotal, extras? }
  delivery: { method: 'retiro' | 'delivery'; address?: string; notes?: string };
  payment: { method: 'efectivo' | 'transferencia' | 'mercadopago'; total: number };
  totals: { subtotal: number; discount: number; total: number };
  notes?: string;
  metadata: { createdAt: Date; updatedAt: Date; createdBy?: string };
}
```

Mapeo de nombres viejos → nuevos: `customerName`→`customer.name`, `products`→`items`, `date`→`metadata.createdAt`, `total`→`totals.total`, `paymentMethod`→`payment.method`; en items: `name`→`productName`, `cantidad`→`quantity`, `price`→`unitPrice`.

## ActionResponse

Definicion canonica en `src/features/auth/auth.types.ts:144`. **Importar siempre desde ahi**, nunca redeclarar (hay copias locales en varios actions: deuda tecnica conocida, no replicar).

```typescript
export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };
```

En el cliente, discriminar por `result.success` antes de acceder a `result.data` o `result.errors`.

## Roles, ownership y sesion

- Rol real: **`owner`** (custom claim, asignado en `completeRegistrationAction()`). `admin`/`employee` estan definidos como concepto pero **no tienen reglas propias** todavia — no asumir que filtran nada.
- `getServerSession()` (`src/lib/auth/server-session.ts`) lee la cookie httpOnly `session`, verifica el ID token con Admin SDK y retorna `{ userId, email, displayName, storeId?, role? }`. Usarlo en toda Server Action y Server Component con permisos.
- Patron auth: Client SDK hace login en el browser; `syncTokenAction` setea la cookie `session` (httpOnly, 7d). No hay middleware de Next.js. Detalle en `docs/arquitectura/auth.md`.

## Reglas Firestore

- `stores`, `products`, `categories`, `tags`: **lectura publica** (catalogo), escritura solo owner.
- `sells`: `create` publico (pedidos desde catalogo), `read`/`update`/`delete` solo owner.
- `users`: solo el propio usuario.
- Owner se valida con `isStoreOwner(storeId)`: compara `request.auth.uid` con `metadata.ownerId` del store (o `ownerId` raiz en docs legacy).

No romper la lectura publica del catalogo sin revisar el front del catalogo publico.

## Integraciones: WhatsApp y MercadoPago

**WhatsApp (checkout principal del catalogo):**
- `processCheckoutAction()` (`src/features/store/actions/checkout.actions.ts`) recalcula precios/envio en el servidor via `buildTrustedSale()` (`checkout.service.ts`), arma el mensaje con `formatWhatsAppMessageFromSale()` y devuelve `whatsappMessage` + `whatsappNumber`.
- El cliente abre `https://wa.me/{numero}?text={mensaje}`. El numero esta en `contactInfo.whatsapp`.
- **Nunca confiar en los precios/totales del carrito del cliente** — recalcular siempre en el servidor.

**MercadoPago (suscripcion, ACTIVA en produccion):**
- La logica de cobro (PreApproval, webhook firmado, scheduler) vive en el repo separado `Funciones-google-tutiendaweb` (region `southamerica-east1`), **no aca**.
- Esta app invoca la suscripcion con `httpsCallable("createSubscription")` (Firebase Client). No hay SDK de MercadoPago instalado en este repo.
- MercadoPago tambien aparece como metodo de pago configurable en `settings.paymentMethods`, pero el checkout del catalogo se confirma por WhatsApp (no hay checkout 100% automatico aca).
- Doc completa: `docs/arquitectura/suscripciones.md`.

## Storage

- Archivos bajo `/stores/{storeId}/...` (logos, banners, productos).
- Imagenes publicas en lectura; escritura solo owner. Limite **5 MB**, `contentType` `image/*`.
- `serverActions.bodySizeLimit: '5mb'` en `next.config.js` para subida via Server Actions.

## Variables de entorno

Archivo `.env.local` (no commitear; derivar de `env.example`). Para correr contra el emulador, usar `.env.emulator` (ver references/testing-and-review.md).

```
# Cliente (NEXT_PUBLIC_*, expuestas al browser — sin secretos)
NEXT_PUBLIC_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID / STORAGE_BUCKET / MESSAGING_SENDER_ID / APP_ID

# Servidor (Admin SDK, NO en env.example)
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY     # con saltos \n; en Vercel definir como variable directa
```

No agregar variables sin actualizar `env.example`.
