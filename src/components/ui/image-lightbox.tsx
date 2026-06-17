"use client";

import React, { useCallback, useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: string[];
  /** Índice inicial a mostrar */
  initialIndex?: number;
  alt: string;
  /** Callback para cerrar el visor */
  onClose: () => void;
}

/**
 * Visor de imagen ampliada (lightbox) en pantalla completa.
 *
 * Implementado como un Dialog de Radix anidado: al ser una capa modal por
 * encima del drawer/diálogo que contiene la galería, Radix gestiona la pila de
 * capas y hace que SOLO esta capa responda al click afuera y a la tecla Escape.
 * Así, cerrar el visor no cierra el drawer.
 *
 * La imagen usa un `<img>` plano para un dimensionamiento consistente: siempre
 * lo más grande que entre en el viewport respetando su proporción real.
 *
 * @module components/ui/image-lightbox
 */
export function ImageLightbox({ images, initialIndex = 0, alt, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const hasMultiple = images.length > 1;

  const goPrev = useCallback(() => {
    setZoomed(false);
    setLoaded(false);
    setCurrent((c) => (c - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setZoomed(false);
    setLoaded(false);
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

  // Navegación con flechas del teclado (el Escape lo maneja Radix, cerrando
  // únicamente esta capa).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasMultiple) {
        e.stopImmediatePropagation();
        goPrev();
      } else if (e.key === "ArrowRight" && hasMultiple) {
        e.stopImmediatePropagation();
        goNext();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [goPrev, goNext, hasMultiple]);

  if (!images || images.length === 0) return null;

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onClick={() => onClose()}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 focus:outline-none sm:p-10 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <DialogPrimitive.Title className="sr-only">Visor de imagen</DialogPrimitive.Title>

          {/* Botón cerrar */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-4 right-4 z-20 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Contador */}
          {hasMultiple && (
            <div className="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white">
              {current + 1}/{images.length}
            </div>
          )}

          {/* Imagen */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={images[current]}
            src={images[current]}
            alt={`${alt} ${current + 1}`}
            onLoad={() => setLoaded(true)}
            onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
            className={cn(
              "max-h-[88vh] max-w-[94vw] select-none object-contain transition-all duration-300",
              loaded ? "opacity-100" : "opacity-0",
              zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
            )}
            draggable={false}
          />

          {/* Navegación */}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:left-4"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 sm:right-4"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
