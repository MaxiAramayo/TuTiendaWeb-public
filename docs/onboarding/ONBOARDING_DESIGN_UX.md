# Onboarding - Diseno y Decisiones UX

## Filosofia de diseno

El onboarding esta disenado como una experiencia mobile-first tipo app nativa. Cada slice ocupa toda la pantalla, con un unico foco de atencion por paso. El usuario nunca ve mas de 2-3 inputs a la vez.

## Principios UX aplicados

### 1. Carga cognitiva minima

Cada slice tiene un maximo de 3 campos. Cuando la informacion original tenia muchos campos (ej: direccion + contacto + descripcion + slug), se dividio en slices separados para que no se sienta pesado.

**Ejemplo:** El antiguo Step 3 tenia WhatsApp + Slug juntos. Ahora WhatsApp esta en Step 3 solo, y Slug + Descripcion estan en Step 4.

### 2. Progresion psicologica

El orden de los slices sigue una logica de "de lo mas facil a lo mas complejo":

```
Welcome (motivacion)
  -> Nombre (lo sabe de memoria)
    -> Direccion (opcional, sin presion)
      -> WhatsApp (dato rapido)
        -> Descripcion + Slug (requiere pensar)
          -> Colores (divertido, visual)
            -> Producto preview (inspiracion)
              -> WhatsApp/QR info (cierre informativo)
                -> Fin (recompensa)
```

Los slices informativos (Welcome, Producto, WhatsApp, QR, Fin) funcionan como "descansos" entre los formularios, reduciendo la fatiga.

### 3. Mobile-first, landscape adaptativo

El diseno base es vertical (portrait). En landscape:
- Los FormSlides mantienen exactamente los mismos campos
- Solo cambia el max-width y padding para aprovechar el ancho
- No se agregan ni quitan elementos
- El boton de "Continuar" siempre esta fijo en la parte inferior

### 4. Feedback inmediato

- Slug: check verde / X roja / spinner mientras valida
- Colores: seleccion visual con borde y check animado
- Errores: aparecen inline debajo del campo, en rojo
- Boton: cambia de "Continuar" a "Crear mi tienda" en el ultimo paso

## Decisiones de diseno

### Por que eliminar el Logo

El upload de logo era opcional y generaba friccion:
- Muchos usuarios nuevos no tienen logo listo
- El upload a Storage agrega complejidad (resize, formato)
- Tenia bugs (se perdia al recargar)
- El logo se puede agregar despues desde Settings

### Por que eliminar Tipografia y Estilo de botones

- Eran opciones demasiado tecnicas para un onboarding
- La mayoria de usuarios no sabe que fuente quiere
- Agrega decision fatigue sin beneficio claro
- Colores es suficiente personalizacion para el primer contacto
- Se puede customizar despues en Settings > Apariencia

### Por que producto read-only en vez de input

- Pedir nombre + precio + descripcion de un producto es demasiado en un onboarding
- Un producto ejemplo contextual (hamburguesa para restaurant, remera para retail) es mas inspirador
- El usuario ve como se vera su catalogo sin esfuerzo
- Reduce la posibilidad de abandonar el onboarding
- Los productos se cargan desde el dashboard, donde hay mas herramientas

### Por que 5 tipos de tienda (no 12)

- Menos opciones = decision mas rapida (Paradox of Choice)
- Los 5 tipos cubren el 90%+ de los negocios target
- Se eliminaron servicios porque la plataforma esta orientada a productos con delivery
- "Otro" captura el edge case

### Por que WhatsApp con prefijo +54 y bandera

- El target principal es Argentina
- Pre-llenar "+54 " reduce errores de formato
- La bandera da contexto visual inmediato
- Si se expande a otros paises, se puede agregar selector de pais

### Por que 2 slices de "compartir" separados

- WhatsApp es el canal principal de comunicacion en LATAM
- El QR es un concepto diferente (fisico vs digital)
- Separados, cada uno tiene espacio para explicarse bien
- No se pide input: son informativos para que el usuario sepa que opciones tiene

## Componentes visuales

### InterstitialSlide

- Icono grande (56x56) con background de color
- Titulo h2 extrabold (30px)
- Descripcion en slate-500 (18px)
- Centrado vertical y horizontal
- Animacion de entrada: scale + fade para icono, slide-up + fade para textos

### FormSlide

- Titulo h2 extrabold (30px) alineado izquierda
- Descripcion debajo en slate-500
- Inputs grandes (h-14, text-lg, rounded-2xl)
- Spacing entre campos: 24px
- Max-width: 384px (max-w-sm)

### ProductPreviewCard

- Card blanca con shadow-lg y rounded-3xl
- Imagen aspect-ratio 4:3 con tags flotantes
- Info: nombre (xl bold), descripcion (sm), precio (2xl extrabold)
- Variantes en pills (si aplica)
- Boton deshabilitado "Agregar al carrito"

### Bottom Button

- Fijo en la parte inferior (sticky footer)
- Alto: 64px (h-16), rounded-[1.25rem]
- Font: xl bold
- Color: slate-900 (default) o indigo-600 (ultimo paso)
- Shadow suave hacia arriba
- Active: scale(0.98) para feedback tactil
- Textos: "Empezar ahora" (step 0), "Continuar" (steps 1-8), "Crear mi tienda" (step 9)

### Progress Bar

- Barra superior (1.5px alto)
- Color: indigo-600 sobre slate-200
- Animada con Framer Motion
- Progreso: `(step / totalSteps) * 100%`

## Accesibilidad

- Inputs con labels explicitos (no placeholder-only)
- Contrast ratios WCAG AA para todos los textos
- Touch targets minimo 44px (botones h-14 = 56px, h-16 = 64px)
- Focus visible con ring-2 ring-indigo-600
- Errores con color + texto (no solo color)
- Select nativo para tipo de tienda (accesible por defecto)

## Animaciones

- Transiciones entre slides: slide horizontal (50px) + fade, 300ms ease-in-out
- InterstitialSlide: icono scale 0.8->1 (100ms delay), textos slide-up (200-300ms delay)
- ProductPreviewCard: slide-up 30px + fade (150ms delay, 400ms duration)
- Progress bar: width transition 300ms
- Gestion con AnimatePresence + motion.div (Framer Motion)

## Colores del tema

6 presets disponibles:

| Nombre | Primary | Secondary | Accent |
|--------|---------|-----------|--------|
| Indigo | #4F46E5 | #EEF2FF | #312E81 |
| Oceano | #2563EB | #EFF6FF | #1E3A8A |
| Bosque | #15803D | #F0FDF4 | #14532D |
| Atardecer | #C2410C | #FFF7ED | #7C2D12 |
| Lavanda | #7C3AED | #F5F3FF | #4C1D95 |
| Carbon | #1F2937 | #F3F4F6 | #030712 |

Default: Indigo. El usuario selecciona clickeando la card del color, que muestra un circulo de color + nombre + check si seleccionado.
