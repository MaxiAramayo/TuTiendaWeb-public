# TuTiendaWeb

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Storage-orange?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

> Plataforma SaaS para digitalizar restaurantes y comercios argentinos. Catálogo digital con QR, gestión de ventas y pedidos por WhatsApp.

---

## ✨ Aplicacion en produccion

🔗 **[tutiendaweb.com.ar](https://tutiendaweb.com.ar)**

Ver demo de tienda pública: [tutiendaweb.com.ar/grambristo-restaurant](https://tutiendaweb.com.ar/grambristo-restaurant)

---

## 🚀 Features

### Para el comerciante (dashboard)
- 📦 **Gestión de productos** — creación, edición, imágenes, categorías y tags
- 📊 **Ventas y reportes** — listado de ventas con filtros por fecha, método de pago y entrega; exportación a Excel/PDF
- ⚙️ **Configuración de tienda** — logo, banner, información de contacto, métodos de pago y entrega
- 📱 **QR shareable** — código QR listo para imprimir y compartir

### Para el cliente (catálogo público)
- 🛍️ **Catálogo digital** — navegación por categorías y tags, búsqueda de productos
- 🛒 **Carrito de compras** — sin necesidad de registrarse
- 💬 **Pedido por WhatsApp** — mensaje pre-armado con el detalle del pedido
- 📍 **Sin fricción** — acceso directo por URL o QR, sin descargar ninguna app

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, TypeScript |
| Estilos | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion |
| Backend / BDD | Firebase Firestore (Admin SDK en servidor) |
| Auth | Firebase Authentication + custom claims |
| Storage | Firebase Storage |
| Formularios | React Hook Form + Zod |
| Estado UI | Zustand |
| Deploy | Vercel |
| Pagos | MercadoPago (suscripciones) |

---

## 📁 Estructura del proyecto

```
src/
├── app/                        # Rutas (App Router)
│   ├── (dashboard)/            # Panel privado del comerciante
│   ├── (auth)/                 # Login / registro
│   ├── [storeSlug]/            # Catálogo público de cada tienda
│   └── page.tsx                # Landing page
├── features/                   # Dominios de negocio
│   ├── auth/                   # Autenticación
│   ├── dashboard/              # Módulos del panel (products, sells, etc.)
│   ├── landing/                # Secciones y SEO de la landing
│   ├── payments/               # MercadoPago
│   ├── products/               # Lógica compartida de productos
│   └── store/                  # Catálogo público (checkout, carrito)
├── components/                 # UI compartida (shadcn/ui + custom)
├── lib/                        # Firebase config, helpers, auth server
└── stores/                     # Zustand (estado de UI global)
```

---

## ⚙️ Variables de entorno

Copiá `env.example` a `.env.local` y completá los valores:

```bash
cp env.example .env.local
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key pública de Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain del proyecto |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID de Firebase |
| `FIREBASE_PROJECT_ID` | ID del proyecto (Admin SDK) |
| `FIREBASE_CLIENT_EMAIL` | Email de la service account |
| `FIREBASE_PRIVATE_KEY` | Private key de la service account (`\n` como saltos de línea) |
| `NEXT_PUBLIC_APP_URL` | URL base de la app (`https://tutiendaweb.com.ar`) |

> Las credenciales de MercadoPago (`MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`)
> no viven en esta app: la integración de suscripciones corre en el repo de Cloud Functions
> `Funciones-google-tutiendaweb`. Ver [`docs/arquitectura/suscripciones.md`](docs/arquitectura/suscripciones.md).


---

## 🏃 Cómo correr el proyecto

### Requisitos
- Node.js 18+
- npm 9+
- Proyecto Firebase configurado (Firestore, Auth, Storage habilitados)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/MaxiAramayo/TuTiendaWeb-public.git
cd TuTiendaWeb-public

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# 4. Correr en desarrollo
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el browser.

### Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción (requiere build previo) |
| `npm run lint` | Linting con ESLint |

### Deploy a Firebase (reglas)

```bash
firebase deploy --only firestore:rules,storage --project tutiendaweb-dev
```

---

## 🔐 Seguridad y reglas Firebase

### Modelo de permisos

| Recurso | Lectura pública | Escritura pública | Solo owner |
|---|---|---|---|
| Tienda (`/stores/{id}`) | ✅ | ❌ | ✅ write |
| Productos | ✅ | ❌ | ✅ create/update/delete |
| Categorías y Tags | ✅ | ❌ | ✅ write |
| Ventas | ❌ | ✅ create (validado) | ✅ read/update/delete |
| Configuraciones | ❌ | ❌ | ✅ read/write |
| Storage imágenes | ✅ | ❌ | ✅ write (image/*, ≤5MB) |

### Autenticación
- Firebase Auth con Google y email/contraseña
- Custom claims: `storeId` y `role` por tienda
- Sesión verificada en servidor con Admin SDK (`getServerSession()`)
- Rutas del dashboard protegidas a nivel de middleware y Server Components

---

## 🏗 Arquitectura

El proyecto sigue un patrón **server-first** con Next.js App Router:

1. **Server Components** — lectura inicial de datos en el servidor
2. **Server Actions** — todas las mutaciones (patrón AUTH → VALIDATE → MUTATE → REVALIDATE)
3. **Zod** — fuente única de verdad para tipos y validación
4. **Zustand** — solo estado de UI (sidebar, modals, filtros)

---

## 📚 Documentación

La documentación técnica y funcional vive en [`docs/`](docs/README.md): arquitectura,
módulos, modelos de datos, suscripciones, onboarding y guías.

---

## 📄 Licencia

Este repositorio es de código abierto con fines educativos.
El uso comercial del código requiere autorización del autor.

---

Desarrollado con ❤️ por **Maxi Aramayo** 🇦🇷
