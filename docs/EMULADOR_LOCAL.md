# Emulador local de Firebase

Permite probar la app (Firestore + Auth + Storage) **100% local**, sin tocar la base
productiva. Ideal para validar el flujo de categorías/subcategorías, incluido el borrado
bloqueante que escribe en Firestore de verdad.

## Requisitos

- **Java 21 o superior** (firebase-tools v15+ ya no soporta Java < 21). Verificá con
  `java -version`. Instalación rápida en Windows: `winget install Microsoft.OpenJDK.21`
  (deja el JDK 21 primero en el PATH del sistema, así una terminal nueva ya usa Java 21).
- `firebase-tools` (se usa vía `npx`, no hace falta instalarlo global).

> Nota: `firebase-tools` detecta la versión usando el `java` del **PATH**, no `JAVA_HOME`.
> Si en una terminal nueva `java -version` sigue mostrando una versión vieja, asegurate de
> que el bin del JDK 21 esté **antes** que los de Oracle/Java 8 en el PATH del sistema.

## Puesta en marcha

1. **Cargar las variables de entorno del emulador.** Copiá el contenido de
   [`.env.emulator`](../.env.emulator) dentro de tu `.env.local` (o reemplazá temporalmente
   tu `.env.local` por esas líneas).

2. **Levantar los emuladores** (terminal 1):
   ```bash
   npm run emulators
   ```
   - UI del emulador: http://127.0.0.1:4000
   - Firestore: 8080 · Auth: 9099 · Storage: 9199
   - Los datos se exportan a `.emulator-data/` al cerrar y se reimportan al abrir.

3. **Sembrar datos de ejemplo** (terminal 2, con los emuladores ya corriendo):
   ```bash
   npm run seed:emulator
   ```
   Crea: usuario owner, tienda demo, categorías con subcategorías, tags y productos.

   - **Login dashboard:** `demo@tutiendaweb.test` / `123456`
   - Tienda demo slug: `tienda-demo`

4. **Levantar la app** (terminal 3):
   ```bash
   npm run dev
   ```
   Mientras `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`, el cliente y el Admin SDK apuntan a
   los emuladores.

## Cómo funciona el wiring

- **Cliente** ([src/lib/firebase/client.ts](../src/lib/firebase/client.ts)): si
  `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`, conecta auth/firestore/storage a los emuladores.
- **Admin SDK** ([src/lib/firebase/admin.ts](../src/lib/firebase/admin.ts)): si está
  `FIRESTORE_EMULATOR_HOST`, inicializa con un projectId demo **sin credenciales reales**.

## Limitaciones conocidas

- **Storage:** la subida de imágenes funciona contra el emulador, pero la URL pública que
  arma la app (`https://storage.googleapis.com/...`) no resuelve al emulador, así que las
  imágenes subidas en modo emulador pueden no previsualizarse. Para probar
  categorías/subcategorías no es necesario subir imágenes.
- Para volver a producción: quitá/poné en blanco las variables del emulador en `.env.local`.
