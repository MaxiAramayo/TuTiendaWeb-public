# Hallazgos reportados por usuarios

## ✅ RESUELTO (2026-06-24)

Los dos puntos reportados quedaron resueltos:

1. **Links como "Configuración" llevaban a 404** → corregido. La card apuntaba a
   `/dashboard/profile` (inexistente); ahora va a `/dashboard/settings`. Se corrigieron
   además las llamadas `revalidatePath` que apuntaban a esa ruta muerta.

2. **Mejorar la estructura de las configuraciones; horarios debe tener su propio lugar**
   → corregido. Los horarios pasaron de estar embebidos en "Ubicación" a una pestaña/ruta
   propia: `/dashboard/settings/schedule` ("Horarios").

Detalle completo de causa raíz, archivos tocados y verificación en
[fixes-ux-usuarios-2026-06-24.md](./fixes-ux-usuarios-2026-06-24.md) (#2 y #4).
