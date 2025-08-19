# Arquitectura de TuTiendaWeb

## Decisiones Arquitectónicas

### Resolución de Bucle Infinito en ProfileForm (Enero 2025)

**Problema identificado:**
Error de "Maximum update depth exceeded" en React causado por bucles infinitos en los componentes de perfil, específicamente relacionado con `@radix-ui/react-compose-refs`.

**Causa raíz:**
1. El hook `useProfile` tenía dependencias circulares en sus `useEffect`
2. El componente `ContactInfoSection` actualizaba constantemente el estado local `whatsappFormatted`
3. Las funciones `useCallback` incluían dependencias que cambiaban en cada render

**Soluciones implementadas:**

#### 1. Optimización del hook useProfile
- **Archivo:** `src/features/dashboard/modules/store-settings/hooks/useProfile.ts`
- **Cambios:**
  - Condicional en `useEffect` para actualizar `formState` solo cuando `isDirty` o `errors` cambien realmente
  - Optimización del guardado manual removiendo dependencias innecesarias
  - Agregado de try-catch para manejo de errores en guardado

#### 2. Optimización del ContactInfoSection
- **Archivo:** `src/features/dashboard/modules/store-settings/components/sections/ContactInfoSection.tsx`
- **Cambios:**
  - Agregado `useEffect` para manejar el formateo de WhatsApp de forma controlada
  - Simplificación de `handleWhatsAppChange` para evitar actualizaciones de estado local
  - Optimización del Select de código de país para usar `updateField` directamente
  - Reducción de dependencias en `useCallback` para evitar re-renders innecesarios

**Resultado:**
- Eliminación completa del error de bucle infinito
- Mejora en el rendimiento de los componentes de perfil
- Mantenimiento de toda la funcionalidad existente
- Validaciones de TypeScript y ESLint pasando correctamente
- Tests unitarios funcionando sin errores

**Lecciones aprendidas:**
1. Siempre verificar dependencias de `useCallback` y `useEffect`
2. Evitar actualizaciones de estado local innecesarias
3. Usar condicionales en `useEffect` para prevenir actualizaciones circulares
4. Preferir actualizaciones directas del estado global sobre estado local cuando sea posible

---

## Estructura del Proyecto

### Features
El proyecto sigue una arquitectura feature-based donde cada dominio tiene su propia carpeta con:
- `api/` - Lógica de datos y stores (Zustand)
- `components/` - Componentes React específicos del feature
- `hooks/` - Hooks personalizados del feature
- `types/` - Tipos TypeScript del feature
- `utils/` - Utilidades específicas del feature

### Shared
Recursos compartidos entre features:
- `hooks/` - Hooks reutilizables
- `services/` - Servicios globales
- `types/` - Tipos globales

### Convenciones
- Uso de TypeScript estricto
- Validación con Zod
- Estado global con Zustand
- UI con Tailwind CSS y Radix UI
- Testing con Vitest y Playwright