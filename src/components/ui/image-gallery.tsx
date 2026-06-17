"use client";

import React, { useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageWithLoader } from "@/features/store/components/ui/ImageWithLoader";
import { ImageLightbox } from "@/components/ui/image-lightbox";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  /** Aspect ratio class, e.g. "aspect-square" or "aspect-video". Defaults to "aspect-square" */
  aspectRatio?: string;
  className?: string;
  /** Fallback icon or node shown when no images */
  fallback?: React.ReactNode;
  /** Extra overlay shown on top of the image (e.g. "Agotado" badge) */
  overlay?: React.ReactNode;
  /** Cómo ajustar la imagen al contenedor. "contain" muestra la imagen completa (sin recorte). Default "cover". */
  objectFit?: "cover" | "contain";
  /** Si es true, al hacer click en la imagen se abre un visor ampliado (lightbox). Default false. */
  zoomable?: boolean;
}

const DURATION = 280; // ms

export function ImageGallery({
  images,
  alt,
  aspectRatio = "aspect-square",
  className,
  fallback,
  overlay,
  objectFit = "cover",
  zoomable = false,
}: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  // direction: 1 = next (‹ slides left), -1 = prev (› slides right)
  const [direction, setDirection] = useState<1 | -1>(1);
  const [animating, setAnimating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Proporción natural (ancho/alto) de la imagen actual, para decidir si es
  // vertical (lleva relleno borroso a los costados) o no (rellena el ancho).
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Callback estable: si fuera inline cambiaría de identidad en cada render,
  // recreando el ref de <img> y re-disparando la detección (loop de renders).
  const handleNaturalSize = useCallback((img: HTMLImageElement) => {
    setNaturalAspect(img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : null);
  }, []);

  const navigate = useCallback(
    (dir: 1 | -1, targetIndex?: number) => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCurrent(
          targetIndex !== undefined
            ? targetIndex
            : (c) => (c + dir + images.length) % images.length
        );
        setAnimating(false);
      }, DURATION);
    },
    [animating, images.length]
  );

  const prev = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); navigate(-1); },
    [navigate]
  );

  const next = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); navigate(1); },
    [navigate]
  );

  const goTo = useCallback(
    (i: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (i === current || animating) return;
      navigate(i > current ? 1 : -1, i);
    },
    [current, animating, navigate]
  );

  const hasMultiple = images.length > 1;

  React.useEffect(() => { setCurrent(0); }, [images]);
  // Reiniciar la proporción al cambiar de imagen, dependiendo de la URL actual
  // (estable) y no de la identidad del array `images`, que puede recrearse en
  // cada render del padre y provocaría re-detección/loops.
  const currentSrc = images[current];
  React.useEffect(() => { setNaturalAspect(null); }, [currentSrc]);

  if (!images || images.length === 0) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center", aspectRatio, className)}>
        {fallback ?? <ImageIcon className="w-10 h-10 text-gray-300" />}
      </div>
    );
  }

  const enterIndex = (current + direction + images.length) % images.length;

  // Controles compartidos (flechas, puntos, contador). Reciben los handlers
  // porque el modo "contain" navega de inmediato y el modo "cover" anima.
  const buildControls = (
    onPrev: (e: React.MouseEvent) => void,
    onNext: (e: React.MouseEvent) => void,
    onDot: (i: number, e: React.MouseEvent) => void,
    dotTheme: "light" | "dark" = "light"
  ) => (
    <>
      {hasMultiple && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-all duration-200 backdrop-blur-sm"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-all duration-200 backdrop-blur-sm"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {hasMultiple && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {images.map((_, i) => {
            const active = i === current;
            const base = dotTheme === "dark" ? "bg-gray-800" : "bg-white";
            const inactive = dotTheme === "dark" ? "bg-gray-400 hover:bg-gray-600" : "bg-white/60 hover:bg-white/90";
            return (
              <button
                key={i}
                onClick={(e) => onDot(i, e)}
                className={cn(
                  "rounded-full transition-all duration-200",
                  active ? `w-4 h-1.5 ${base} shadow` : `w-1.5 h-1.5 ${inactive}`
                )}
                aria-label={`Ir a imagen ${i + 1}`}
              />
            );
          })}
        </div>
      )}

      {hasMultiple && (
        <div className="absolute top-2 right-2 z-30 bg-black/40 text-white text-xs font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
          {current + 1}/{images.length}
        </div>
      )}
    </>
  );

  const overlayNode = overlay && (
    <div className="absolute inset-0 z-20 pointer-events-none">{overlay}</div>
  );

  const lightboxNode = zoomable && lightboxOpen && (
    <ImageLightbox
      images={images}
      initialIndex={current}
      alt={alt}
      onClose={() => setLightboxOpen(false)}
    />
  );

  // ── Modo "contain": estilo Apple. Imagen redondeada con sombra que flota
  // sobre un fondo de vidrio esmerilado (la misma imagen muy difuminada).
  // La altura se adapta a la foto (sin forzar cuadrado) hasta un máximo.
  if (objectFit === "contain") {
    const showPrev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent((c) => (c - 1 + images.length) % images.length); };
    const showNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrent((c) => (c + 1) % images.length); };
    const showAt = (i: number, e: React.MouseEvent) => { e.stopPropagation(); setCurrent(i); };

    // Solo las imágenes verticales (más altas que anchas) dejan franjas a los
    // costados: a esas les ponemos el relleno borroso. Las cuadradas u
    // horizontales rellenan el ancho con object-cover, sin blur.
    const isPortrait = naturalAspect !== null && naturalAspect < 0.95;

    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl select-none bg-white aspect-[4/3]",
          zoomable && "cursor-zoom-in",
          className
        )}
        onClick={zoomable ? () => setLightboxOpen(true) : undefined}
      >
        {/* Relleno borroso a los costados (solo imágenes verticales). La máscara
            hace que se difumine de forma constante hacia los bordes, llegando al
            borde pero casi invisible (muy liviano) en los extremos. */}
        {isPortrait && images[current] && (
          <div
            aria-hidden
            className="absolute inset-0 scale-110 bg-cover bg-center blur-xl opacity-70 [mask-image:linear-gradient(to_right,transparent_0%,#000_42%,#000_58%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_42%,#000_58%,transparent_100%)]"
            style={{ backgroundImage: `url("${images[current]}")` }}
          />
        )}

        {/* Imagen principal. Vertical → object-contain (completa, con blur a los
            costados). Cuadrada/horizontal → object-cover (rellena el ancho). */}
        <div className="absolute inset-0">
          <ImageWithLoader
            key={`contain-${images[current]}`}
            src={images[current]}
            alt={`${alt} ${current + 1}`}
            fill
            sizes="(max-width: 768px) 90vw, 400px"
            className={isPortrait ? "object-contain" : "object-cover"}
            containerClassName="w-full h-full"
            loaderSize="md"
            useSkeletonBg={false}
            onLoaded={handleNaturalSize}
          />
        </div>

        {overlayNode}
        {buildControls(showPrev, showNext, showAt, isPortrait ? "dark" : "light")}
        {lightboxNode}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl select-none",
        zoomable && "cursor-zoom-in",
        aspectRatio,
        className
      )}
      onClick={zoomable ? () => setLightboxOpen(true) : undefined}
    >

      {/* Static (idle) image */}
      {!animating && (
        <div className="absolute inset-0">
          <ImageWithLoader
            key={`idle-${images[current]}`}
            src={images[current]}
            alt={`${alt} ${current + 1}`}
            fill
            className="object-cover"
            containerClassName="w-full h-full"
            loaderSize="md"
            useSkeletonBg
          />
        </div>
      )}

      {/* Exit image */}
      {animating && (
        <div
          className="absolute inset-0"
          style={{ animation: `ig-out-${direction === 1 ? "l" : "r"} ${DURATION}ms ease-in-out forwards` }}
        >
          <ImageWithLoader
            key={`exit-${images[current]}`}
            src={images[current]}
            alt={`${alt} ${current + 1}`}
            fill
            className="object-cover"
            containerClassName="w-full h-full"
            loaderSize="md"
            useSkeletonBg
          />
        </div>
      )}

      {/* Enter image */}
      {animating && (
        <div
          className="absolute inset-0"
          style={{ animation: `ig-in-${direction === 1 ? "l" : "r"} ${DURATION}ms ease-in-out forwards` }}
        >
          <ImageWithLoader
            key={`enter-${images[enterIndex]}`}
            src={images[enterIndex]}
            alt={`${alt} ${enterIndex + 1}`}
            fill
            className="object-cover"
            containerClassName="w-full h-full"
            loaderSize="md"
            useSkeletonBg
          />
        </div>
      )}

      {/* Keyframe definitions */}
      <style>{`
        @keyframes ig-out-l {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(-28%); opacity: 0; }
        }
        @keyframes ig-in-l {
          from { transform: translateX(28%);  opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes ig-out-r {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(28%);  opacity: 0; }
        }
        @keyframes ig-in-r {
          from { transform: translateX(-28%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {overlayNode}
      {buildControls(prev, next, goTo)}
      {lightboxNode}
    </div>
  );
}
